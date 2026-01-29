/**
 * Public Chat Page
 * Dynamic route for students to chat with a specific bot
 */

import { supabaseAdmin } from '@/lib/supabase';
import { Bot } from '@/lib/types';
import { notFound } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

export default async function BotChatPage({
  params,
}: {
  params: { botId: string };
}) {
  const { botId } = params;
  const supabase = supabaseAdmin;

  // Fetch bot data using Service Role Key
  const { data: bot, error } = await supabase
    .from('bots')
    .select('id, name, assistant_id, course_map, system_prompt')
    .eq('id', botId)
    .single();

  if (error || !bot) {
    console.error('❌ Bot not found:', { botId, error });
    notFound();
  }

  const botData = bot as Bot;

  // Debug: Log fetched bot data
  console.log('🤖 Bot loaded for public chat:', {
    id: botData.id,
    name: botData.name,
    hasCourseMap: !!botData.course_map,
    courseMapLength: botData.course_map?.length || 0,
    courseMapData: botData.course_map,
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">{botData.name}</h1>
            <p className="text-xs text-muted-foreground">
              AI Course Assistant
            </p>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          botId={botId}
          assistantId={botData.assistant_id}
          courseMap={botData.course_map}
        />
      </main>
    </div>
  );
}

