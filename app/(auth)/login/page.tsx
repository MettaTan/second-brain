/**
 * Login Page
 * Email/Password authentication for sellers
 */

'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Account created! You can now log in.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface mb-4">
            <span className="text-4xl">🧠</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Second Brain</h1>
          <p className="text-muted-foreground">
            Sign in to manage your AI bots
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-lg border border-border p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>

              <button
                type="button"
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full bg-surface border border-border text-foreground py-2.5 rounded-lg hover:bg-background disabled:opacity-50 transition-colors font-medium"
              >
                Create Account
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            Protected by Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
}
