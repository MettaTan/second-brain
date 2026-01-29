/**
 * Sidebar Component
 * Displays thread history and navigation
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus, MessageSquare, X, Menu } from 'lucide-react';
import { Thread } from '@/lib/types';
import { getOrCreateSessionId } from '@/lib/session';

interface SidebarProps {
  currentThreadId: string | null;
  onThreadSelect: (threadId: string | null) => void;
  onRefresh: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

export default function Sidebar({
  currentThreadId,
  onThreadSelect,
  onRefresh,
  isMobileOpen,
  onMobileToggle,
}: SidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const id = getOrCreateSessionId();
    setSessionId(id);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    loadThreads();
  }, [sessionId]);

  const loadThreads = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/history', {
        headers: {
          'x-session-id': sessionId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    onThreadSelect(null);
    onRefresh();
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const handleThreadClick = (threadId: string) => {
    onThreadSelect(threadId);
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-surface border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                Second Brain
              </h1>
              <button
                onClick={onMobileToggle}
                className="lg:hidden p-2 hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new chat to begin
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadClick(thread.id)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg
                      transition-colors group
                      ${
                        currentThreadId === thread.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-background text-foreground'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {thread.title || 'Untitled conversation'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {thread.created_at ? formatDate(thread.created_at) : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="space-y-2">
              <button
                onClick={loadThreads}
                className="text-xs text-primary hover:underline"
              >
                Refresh History
              </button>
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground transition-colors">
                  Debug Info
                </summary>
                <p className="mt-2 font-mono text-[10px] break-all">
                  Session: {sessionId}
                </p>
              </details>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
