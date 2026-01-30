/**
 * Admin API: Duplicate a Bot
 * POST /api/admin/bots/[id]/duplicate
 * Creates a copy of the bot with a new OpenAI assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOpenAIClient } from '@/lib/openai';
import { revalidatePath } from 'next/cache';

export async function POST(
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

    // Fetch the source bot with all fields
    const { data: sourceBot, error: botError } = await supabaseAdmin
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (botError || !sourceBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (sourceBot.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the source assistant to copy its configuration
    const openai = getOpenAIClient();
    let sourceAssistant;
    try {
      sourceAssistant = await openai.beta.assistants.retrieve(
        sourceBot.assistant_id
      );
    } catch {
      return NextResponse.json(
        { error: 'Failed to retrieve source assistant configuration' },
        { status: 500 }
      );
    }

    // Create a new assistant with the same configuration
    const newAssistant = await openai.beta.assistants.create({
      name: `${sourceBot.name} (Copy)`,
      instructions: sourceAssistant.instructions || undefined,
      model: sourceAssistant.model,
      tools: sourceAssistant.tools,
      tool_resources: sourceAssistant.tool_resources || undefined,
    });

    // Create the new bot record
    const { data: newBot, error: insertError } = await supabaseAdmin
      .from('bots')
      .insert({
        owner_id: user.id,
        name: `${sourceBot.name} (Copy)`,
        assistant_id: newAssistant.id,
        system_prompt: sourceBot.system_prompt,
        course_map: sourceBot.course_map,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up the assistant if DB insert fails
      try {
        await openai.beta.assistants.delete(newAssistant.id);
      } catch {
        // Best effort cleanup
      }
      return NextResponse.json(
        { error: 'Failed to save duplicated bot' },
        { status: 500 }
      );
    }

    revalidatePath('/dashboard');

    return NextResponse.json({ success: true, bot: newBot });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
