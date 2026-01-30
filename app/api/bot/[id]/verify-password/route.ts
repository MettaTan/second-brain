/**
 * Password Verification API Route
 * POST: Check if provided password matches the bot's password
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const { data: bot, error } = await supabaseAdmin
      .from('bots')
      .select('password')
      .eq('id', botId)
      .single();

    if (error || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    const valid = bot.password === password;
    return NextResponse.json({ valid });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
