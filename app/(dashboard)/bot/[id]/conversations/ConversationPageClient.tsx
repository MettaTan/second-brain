/**
 * Client wrapper for the Conversation Viewer page
 * Manages selected thread state for the split-pane layout
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import ConversationList from '@/components/admin/ConversationList';
import ConversationViewer from '@/components/admin/ConversationViewer';

interface ConversationPageClientProps {
  botId: string;
  botName: string;
}

export default function ConversationPageClient({
  botId,
  botName,
}: ConversationPageClientProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{botName}</h1>
          <p className="text-sm text-muted-foreground">Conversation history</p>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex border border-border rounded-lg overflow-hidden bg-surface">
        {/* Left: Thread List */}
        <div className="w-80 flex-shrink-0 border-r border-border overflow-hidden">
          <ConversationList
            botId={botId}
            selectedThreadId={selectedThreadId || undefined}
            onSelectThread={setSelectedThreadId}
          />
        </div>

        {/* Right: Transcript */}
        <div className="flex-1 overflow-hidden">
          {selectedThreadId ? (
            <ConversationViewer
              botId={botId}
              threadId={selectedThreadId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Select a conversation to view the transcript
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
