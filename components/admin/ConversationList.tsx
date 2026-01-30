/**
 * ConversationList Component
 * Paginated list of threads with message count and preview
 */

'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConversationSummary } from '@/lib/types';

interface ConversationListProps {
  botId: string;
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ConversationList({
  botId,
  selectedThreadId,
  onSelectThread,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchConversations = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/bots/${botId}/conversations?page=${page}&limit=20`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setConversations(data.conversations);
      setPagination(data.pagination);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(1);
  }, [botId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    if (diffHours < 168)
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Students haven&apos;t chatted with this bot yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {conversations.map((convo) => (
          <button
            key={convo.threadId}
            onClick={() => onSelectThread(convo.threadId)}
            className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
              selectedThreadId === convo.threadId
                ? 'bg-primary/10 border-l-2 border-l-primary'
                : 'hover:bg-background'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate max-w-[70%]">
                {convo.firstMessage || 'No message'}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDate(convo.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>{convo.messageCount} messages</span>
              <span className="opacity-50">·</span>
              <span className="truncate font-mono">
                {convo.sessionId.substring(0, 8)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <button
            onClick={() => fetchConversations(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1 hover:bg-background rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchConversations(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-1 hover:bg-background rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
