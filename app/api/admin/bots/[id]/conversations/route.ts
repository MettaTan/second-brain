/**
 * Admin API: List Conversations for a Bot
 * GET /api/admin/bots/[id]/conversations?page=1&limit=20
 * Returns paginated thread list with message counts and previews
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

    // Parse pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Fetch threads for this bot
    const { data: threads, error: threadsError, count } = await supabaseAdmin
      .from('threads')
      .select('id, session_id, title, created_at', { count: 'exact' })
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (threadsError) {
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // For each thread, get message count and first user message
    const conversations = await Promise.all(
      (threads || []).map(async (thread) => {
        // Get message count
        const { count: messageCount } = await supabaseAdmin
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', thread.id);

        // Get first user message as preview
        const { data: firstMsg } = await supabaseAdmin
          .from('messages')
          .select('content, created_at')
          .eq('thread_id', thread.id)
          .eq('role', 'user')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        // Get last message timestamp
        const { data: lastMsg } = await supabaseAdmin
          .from('messages')
          .select('created_at')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          threadId: thread.id,
          sessionId: thread.session_id,
          title: thread.title || 'Untitled conversation',
          messageCount: messageCount || 0,
          firstMessage: firstMsg?.content
            ? firstMsg.content.substring(0, 120) + (firstMsg.content.length > 120 ? '...' : '')
            : '',
          lastMessageAt: lastMsg?.created_at || thread.created_at,
          createdAt: thread.created_at,
        };
      })
    );

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
