/**
 * Home Page
 * Redirects to login or shows landing page
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface mb-6">
          <span className="text-5xl">🧠</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Second Brain</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Create AI-powered course assistants for your students
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="bg-surface border border-border px-8 py-3 rounded-lg hover:bg-background transition-colors font-medium"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
