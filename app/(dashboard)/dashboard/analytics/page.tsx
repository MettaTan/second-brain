/**
 * Analytics Overview Page
 * Shows stats cards for all bots owned by the current user
 */

import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import BotStatsCard from '@/components/admin/BotStatsCard';
import { BotStats } from '@/lib/types';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all bots for this user
  const { data: bots } = await supabaseAdmin
    .from('bots')
    .select('id, name, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch stats for each bot
  const botsWithStats: { id: string; name: string; stats: BotStats }[] =
    await Promise.all(
      (bots || []).map(async (bot) => {
        // Fetch threads
        const { data: threads, count: totalThreads } = await supabaseAdmin
          .from('threads')
          .select('id, session_id, created_at', { count: 'exact' })
          .eq('bot_id', bot.id);

        const threadIds = (threads || []).map((t) => t.id);

        // Message count
        let totalMessages = 0;
        if (threadIds.length > 0) {
          const { count } = await supabaseAdmin
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('thread_id', threadIds);
          totalMessages = count || 0;
        }

        // Unique students
        const uniqueStudents = new Set(
          (threads || []).map((t) => t.session_id)
        ).size;

        // Last active
        const sorted = (threads || []).sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
        const lastActiveAt = sorted.length > 0 ? sorted[0].created_at : null;

        return {
          id: bot.id,
          name: bot.name,
          stats: {
            botId: bot.id,
            totalMessages,
            uniqueStudents,
            totalThreads: totalThreads || 0,
            lastActiveAt: lastActiveAt || null,
          },
        };
      })
    );

  // Aggregate totals
  const totals = botsWithStats.reduce(
    (acc, b) => ({
      messages: acc.messages + b.stats.totalMessages,
      students: acc.students + b.stats.uniqueStudents,
      conversations: acc.conversations + b.stats.totalThreads,
    }),
    { messages: 0, students: 0, conversations: 0 }
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Performance across all your bots
            </p>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{totals.messages}</p>
          <p className="text-sm text-muted-foreground">Total Messages</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{totals.students}</p>
          <p className="text-sm text-muted-foreground">Total Students</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{totals.conversations}</p>
          <p className="text-sm text-muted-foreground">Total Conversations</p>
        </div>
      </div>

      {/* Per-Bot Stats */}
      {botsWithStats.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No bots yet</h2>
          <p className="text-muted-foreground mb-4">
            Create a bot to start seeing analytics.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Create Your First Bot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {botsWithStats.map((bot) => (
            <BotStatsCard
              key={bot.id}
              botId={bot.id}
              botName={bot.name}
              stats={bot.stats}
            />
          ))}
        </div>
      )}
    </div>
  );
}
