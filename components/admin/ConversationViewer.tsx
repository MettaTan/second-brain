/**
 * ConversationViewer Component
 * Read-only transcript viewer for a specific thread
 */

'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import { Message } from '@/lib/types';

interface ThreadInfo {
  id: string;
  sessionId: string;
  title: string;
  createdAt: string;
}

interface ConversationViewerProps {
  botId: string;
  threadId: string;
}

export default function ConversationViewer({
  botId,
  threadId,
}: ConversationViewerProps) {
  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/bots/${botId}/conversations/${threadId}`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch');
        }
        const data = await res.json();
        setThread(data.thread);
        setMessages(data.messages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [botId, threadId]);

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      {thread && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold truncate">{thread.title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>
              Started {formatTimestamp(thread.createdAt)}
            </span>
            <span className="opacity-50">·</span>
            <span>{messages.length} messages</span>
            <span className="opacity-50">·</span>
            <span className="font-mono">
              Session {thread.sessionId.substring(0, 8)}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === 'user' ? '' : 'bg-background rounded-lg p-4 -mx-2'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-primary/10'
                  : 'bg-green-500/10'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-green-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {msg.role === 'user' ? 'Student' : 'Assistant'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(msg.created_at)}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
