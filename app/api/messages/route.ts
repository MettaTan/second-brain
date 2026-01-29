/**
 * Messages API Route
 * Fetches messages for a specific thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isValidSessionId } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');
    const threadId = req.nextUrl.searchParams.get('threadId');
    const studentId = req.nextUrl.searchParams.get('studentId'); // Guest ID for chat privacy

    if (!sessionId || !isValidSessionId(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid or missing session ID' },
        { status: 401 }
      );
    }

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Verify the thread belongs to this session
    const { data: thread, error: threadError } = await supabaseAdmin
      .from('threads')
      .select('id, bot_id')
      .eq('id', threadId)
      .eq('session_id', sessionId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch messages for this thread, filtered by bot_id (via thread) and student_id (if provided)
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('thread_id', threadId);
    
    // Add student_id filter if provided (for chat privacy)
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data: messages, error: messagesError } = await query
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: messages || [],
    });
  } catch (error: any) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
