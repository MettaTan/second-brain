/**
 * Admin API: Get Full Conversation Transcript
 * GET /api/admin/bots/[id]/conversations/[threadId]
 * Returns all messages in a thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  try {
    const { id: botId, threadId } = params;
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

    // Verify thread belongs to this bot
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select('id, bot_id, session_id, title, created_at')
      .eq('id', threadId)
      .eq('bot_id', botId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch all messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, thread_id, role, content, student_id, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thread: {
        id: thread.id,
        sessionId: thread.session_id,
        title: thread.title || 'Untitled conversation',
        createdAt: thread.created_at,
      },
      messages: messages || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
