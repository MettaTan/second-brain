/**
 * Bot Management API Route
 * Handles DELETE and PATCH operations for bot management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * DELETE Handler - Delete a bot
 * Security: Verifies user owns the bot before deletion
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify bot exists and user owns it
    const { data: bot, error: botError } = await supabaseAdmin
      .from('bots')
      .select('id, owner_id')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    if (bot.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this bot' },
        { status: 403 }
      );
    }

    // Delete related records first (in order to avoid foreign key constraint violations)
    console.log('🗑️  Deleting related records for bot:', botId);

    // 1. Delete student progress records
    const { error: progressError } = await supabaseAdmin
      .from('student_progress')
      .delete()
      .eq('bot_id', botId);

    if (progressError) {
      console.error('Failed to delete student progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to delete related student progress' },
        { status: 500 }
      );
    }
    console.log('   ✅ Deleted student progress records');

    // 2. Delete threads (this will cascade to messages via ON DELETE CASCADE)
    const { error: threadsError } = await supabaseAdmin
      .from('threads')
      .delete()
      .eq('bot_id', botId);

    if (threadsError) {
      console.error('Failed to delete threads:', threadsError);
      return NextResponse.json(
        { error: 'Failed to delete related threads' },
        { status: 500 }
      );
    }
    console.log('   ✅ Deleted threads (messages cascaded automatically)');

    // 3. Finally, delete the bot itself
    const { error: deleteError } = await supabaseAdmin
      .from('bots')
      .delete()
      .eq('id', botId);

    if (deleteError) {
      console.error('Failed to delete bot:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete bot' },
        { status: 500 }
      );
    }

    console.log('✅ Bot deleted successfully:', botId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete bot error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH Handler - Update bot fields (name, course_map)
 * Security: Verifies user owns the bot before updating
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify bot exists and user owns it
    const { data: bot, error: botError } = await supabaseAdmin
      .from('bots')
      .select('id, owner_id')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    if (bot.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this bot' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { name, course_map } = body;

    // Build update object (only include fields that are provided)
    const updates: any = {};
    if (name !== undefined) {
      updates.name = name;
    }
    if (course_map !== undefined) {
      updates.course_map = course_map;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update the bot
    const { data: updatedBot, error: updateError } = await supabaseAdmin
      .from('bots')
      .update(updates)
      .eq('id', botId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update bot:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bot' },
        { status: 500 }
      );
    }

    console.log('✅ Bot updated:', botId, updates);
    return NextResponse.json({ success: true, bot: updatedBot });
  } catch (error: any) {
    console.error('Update bot error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

