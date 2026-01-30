/**
 * Conversation Viewer Page
 * Split-pane view: thread list (left) + transcript (right)
 */

import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import ConversationPageClient from './ConversationPageClient';

export default async function ConversationsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const botId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify ownership
  const { data: bot, error } = await supabaseAdmin
    .from('bots')
    .select('id, name, owner_id')
    .eq('id', botId)
    .single();

  if (error || !bot || bot.owner_id !== user.id) {
    redirect('/dashboard');
  }

  return <ConversationPageClient botId={bot.id} botName={bot.name} />;
}
