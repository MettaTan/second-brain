/**
 * Admin API: Bot Statistics
 * GET /api/admin/bots/[id]/stats
 * Returns aggregate metrics for a bot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;
    const supabase = await createClient();

    // Verify authenticated user owns this bot
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bot, error: botError } = await supabaseAdmin
      .from('bots')
      .select('id, owner_id')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all threads for this bot
    const { data: threads, count: totalThreads } = await supabaseAdmin
      .from('threads')
      .select('id, session_id, created_at', { count: 'exact' })
      .eq('bot_id', botId);

    const threadIds = (threads || []).map((t) => t.id);

    // Total messages across all threads
    let totalMessages = 0;
    if (threadIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('thread_id', threadIds);
      totalMessages = count || 0;
    }

    // Unique students (distinct session_id)
    const uniqueStudents = new Set(
      (threads || []).map((t) => t.session_id)
    ).size;

    // Last active (most recent thread)
    const lastActiveAt =
      threads && threads.length > 0
        ? threads.sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
          )[0].created_at
        : null;

    return NextResponse.json({
      botId,
      totalMessages,
      uniqueStudents,
      totalThreads: totalThreads || 0,
      lastActiveAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
