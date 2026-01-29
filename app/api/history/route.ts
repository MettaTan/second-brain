/**
 * History API Route (Multi-Tenant)
 * Fetches student's threads for a specific bot
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isValidSessionId } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');
    const botId = req.nextUrl.searchParams.get('botId');

    if (!sessionId || !isValidSessionId(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid or missing session ID' },
        { status: 401 }
      );
    }

    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    // Fetch threads for this session and bot
    const { data: threads, error: threadsError } = await supabaseAdmin
      .from('threads')
      .select('*')
      .eq('session_id', sessionId)
      .eq('bot_id', botId)
      .order('created_at', { ascending: false });

    if (threadsError) {
      console.error('Failed to fetch threads:', threadsError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      threads: threads || [],
    });
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
