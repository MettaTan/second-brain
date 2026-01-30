/**
 * Bot Edit Page
 * Allows editing the curriculum of an existing bot
 */

import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';
import { Bot, CourseSection } from '@/lib/types';
import BotEditClient from '@/components/dashboard/BotEditClient';

export default async function BotEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const botId = params.id;

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch bot data
  const { data: bot, error } = await supabaseAdmin
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single();

  if (error || !bot) {
    console.error('Bot not found:', error);
    notFound();
  }

  // Verify ownership
  if (bot.owner_id !== user.id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to edit this bot.
          </p>
        </div>
      </div>
    );
  }

  const botData = bot as Bot;

  // Convert course_map to CourseSection[] format
  // Handle both flat and hierarchical structures
  let initialCurriculum: CourseSection[] = [];
  
  if (botData.course_map && Array.isArray(botData.course_map)) {
    if (botData.course_map.length > 0 && 'items' in botData.course_map[0]) {
      // Already hierarchical
      initialCurriculum = botData.course_map as CourseSection[];
    } else {
      // Flat structure - convert to hierarchical
      initialCurriculum = [
        {
          id: 'section_1',
          title: 'Course Content',
          items: (botData.course_map as any[]).map((module, index) => ({
            id: module.id || `item_${index}`,
            title: module.title || 'Untitled',
            type: 'file' as const,
            file_id: module.file_id || undefined,
          })),
        },
      ];
    }
  }

  return (
    <BotEditClient
      botId={botData.id}
      botName={botData.name}
      initialCurriculum={initialCurriculum}
      initialPassword={botData.password || ''}
    />
  );
}


