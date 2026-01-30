/**
 * BotStatsCard Component
 * Displays aggregate metrics for a single bot
 */

'use client';

import Link from 'next/link';
import { MessageSquare, Users, MessagesSquare, Clock } from 'lucide-react';
import { BotStats } from '@/lib/types';

interface BotStatsCardProps {
  botId: string;
  botName: string;
  stats: BotStats;
}

export default function BotStatsCard({ botId, botName, stats }: BotStatsCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No activity';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold truncate">{botName}</h3>
        <Link
          href={`/bot/${botId}/conversations`}
          className="text-sm text-primary hover:underline flex-shrink-0 ml-2"
        >
          View chats
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-semibold">{stats.totalMessages}</p>
            <p className="text-xs text-muted-foreground">Messages</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-xl font-semibold">{stats.uniqueStudents}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <MessagesSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-semibold">{stats.totalThreads}</p>
            <p className="text-xs text-muted-foreground">Conversations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium">{formatDate(stats.lastActiveAt)}</p>
            <p className="text-xs text-muted-foreground">Last active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
