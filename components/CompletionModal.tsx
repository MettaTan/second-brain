/**
 * CompletionModal Component
 * Celebration modal shown when all course items are completed
 */

'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface CompletionModalProps {
  botName: string;
  onClose: () => void;
}

// Simple confetti particle
function ConfettiParticle({ delay, left }: { delay: number; left: number }) {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;

  return (
    <div
      className="absolute rounded-sm animate-confetti pointer-events-none"
      style={{
        left: `${left}%`,
        top: '-10px',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        animationDelay: `${delay}ms`,
        animationDuration: `${2000 + Math.random() * 1500}ms`,
      }}
    />
  );
}

export default function CompletionModal({ botName, onClose }: CompletionModalProps) {
  const [particles, setParticles] = useState<{ id: number; delay: number; left: number }[]>([]);

  useEffect(() => {
    // Generate confetti particles
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      delay: Math.random() * 800,
      left: Math.random() * 100,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <ConfettiParticle key={p.id} delay={p.delay} left={p.left} />
        ))}
      </div>

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-background rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Course Complete!</h2>
        <p className="text-muted-foreground mb-6">
          You completed <span className="text-foreground font-semibold">{botName}</span>!
          Great work on finishing every module.
        </p>

        <button
          onClick={onClose}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
}
