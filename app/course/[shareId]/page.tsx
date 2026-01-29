/**
 * Public Student View Page
 * Clean, shareable course page for students
 * 
 * IMPORTANT: Database Setup
 * - This page uses `supabaseAdmin` (Service Role Key) which bypasses RLS
 * - If you switch to using the anon key, ensure the `bots` table has a public SELECT policy:
 *   CREATE POLICY "Allow public read access to bots" ON bots
 *     FOR SELECT USING (true);
 */

import { supabaseAdmin } from '@/lib/supabase';
import { Bot } from '@/lib/types';
import { notFound } from 'next/navigation';
import StudentCourseClient from '@/components/StudentCourseClient';

export default async function StudentCoursePage({
  params,
}: {
  params: { shareId: string };
}) {
  const { shareId } = params;
  const supabase = supabaseAdmin;

  // Debug: Log the shareId being fetched
  console.log('🔍 Fetching bot for Share ID:', shareId);

  // For MVP: Use bot ID as shareId (can add dedicated share_id column later)
  // Lookup bot by ID
  // NOTE: Ensure the `bots` table has a public SELECT policy for RLS
  // If using Service Role Key (supabaseAdmin), RLS is bypassed
  const { data: bot, error } = await supabase
    .from('bots')
    .select('id, name, assistant_id, course_map')
    .eq('id', shareId)
    .single();

  // Debug: Log query results
  console.log('📊 Supabase Query Result:', {
    shareId,
    hasBot: !!bot,
    botId: bot?.id,
    botName: bot?.name,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    } : null,
  });

  // Handle error or null data with proper UI
  if (error || !bot) {
    console.error('❌ Bot not found or error occurred:', {
      shareId,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      } : 'No error object',
      bot: bot ? 'Bot exists' : 'Bot is null',
    });

    // Return error UI instead of notFound() to avoid infinite loading
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Unable to load course content. Please check the link or contact the course creator.
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-4 p-3 bg-surface border border-border rounded-lg text-left">
              <p className="text-xs font-mono text-muted-foreground">
                <strong>Error:</strong> {error.message}
              </p>
              {error.code && (
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  <strong>Code:</strong> {error.code}
                </p>
              )}
              {error.hint && (
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  <strong>Hint:</strong> {error.hint}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const botData = bot as Bot;

  console.log('✅ Student view loaded successfully:', {
    id: botData.id,
    name: botData.name,
    hasCourseMap: !!botData.course_map,
    courseMapLength: botData.course_map?.length || 0,
  });

  return (
    <StudentCourseClient
      botId={botData.id}
      assistantId={botData.assistant_id}
      botName={botData.name}
      courseMap={botData.course_map || []}
    />
  );
}

