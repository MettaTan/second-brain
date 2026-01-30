/**
 * PasswordGate Component
 * Blocks access to a bot until the correct password is entered
 * Stores unlock state in sessionStorage (expires on browser close)
 */

'use client';

import { useState, FormEvent } from 'react';
import { Lock, Loader2 } from 'lucide-react';

interface PasswordGateProps {
  botId: string;
  botName: string;
  children: React.ReactNode;
}

export default function PasswordGate({
  botId,
  botName,
  children,
}: PasswordGateProps) {
  const storageKey = `unlocked_${botId}`;

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(storageKey) === 'true';
    }
    return false;
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (isUnlocked) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setChecking(true);
    setError('');

    try {
      const res = await fetch(`/api/bot/${botId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        sessionStorage.setItem(storageKey, 'true');
        setIsUnlocked(true);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-4">
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-1">{botName}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This course is password protected.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              disabled={checking}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-center"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={checking || !password.trim()}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Unlock Course'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
