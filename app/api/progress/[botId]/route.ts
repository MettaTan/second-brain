/**
 * Progress API Route
 * GET: Fetch saved progress for a student
 * POST: Save progress (bulk replace)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isValidSessionId } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params;
    const studentId = req.nextUrl.searchParams.get('studentId');

    if (!studentId || !isValidSessionId(studentId)) {
      return NextResponse.json(
        { error: 'Valid studentId is required' },
        { status: 400 }
      );
    }

    const { data: progress, error } = await supabaseAdmin
      .from('student_progress')
      .select('completed_module_ids')
      .eq('bot_id', botId)
      .eq('session_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      completedIds: progress?.completed_module_ids || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const { botId } = params;
    const body = await req.json();
    const { studentId, completedIds } = body;

    if (!studentId || !isValidSessionId(studentId)) {
      return NextResponse.json(
        { error: 'Valid studentId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(completedIds)) {
      return NextResponse.json(
        { error: 'completedIds must be an array' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('student_progress')
      .upsert(
        {
          bot_id: botId,
          session_id: studentId,
          completed_module_ids: completedIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'bot_id,session_id' }
      );

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
