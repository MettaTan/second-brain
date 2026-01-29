/**
 * Student Progress Server Actions
 * Handles module completion tracking for anonymous students
 */

'use server';

import { supabaseAdmin } from '@/lib/supabase';

export async function toggleModuleCompletion(
  botId: string,
  sessionId: string,
  moduleId: string,
  isComplete: boolean
) {
  try {
    console.log('🎯 Toggle module completion:', { botId, sessionId, moduleId, isComplete });

    // Fetch existing progress
    const { data: existingProgress, error: fetchError } = await supabaseAdmin
      .from('student_progress')
      .select('*')
      .eq('bot_id', botId)
      .eq('session_id', sessionId)
      .single();

    let completedModuleIds: string[] = [];

    if (existingProgress) {
      completedModuleIds = existingProgress.completed_module_ids || [];
    }

    // Add or remove the module ID
    if (isComplete) {
      // Add if not already present
      if (!completedModuleIds.includes(moduleId)) {
        completedModuleIds.push(moduleId);
      }
    } else {
      // Remove if present
      completedModuleIds = completedModuleIds.filter(id => id !== moduleId);
    }

    console.log('   Updated completed modules:', completedModuleIds);

    // Upsert the progress
    const { error: upsertError } = await supabaseAdmin
      .from('student_progress')
      .upsert({
        bot_id: botId,
        session_id: sessionId,
        completed_module_ids: completedModuleIds,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'bot_id,session_id'
      });

    if (upsertError) {
      console.error('   ❌ Failed to upsert progress:', upsertError);
      return { error: upsertError.message };
    }

    console.log('   ✅ Progress saved successfully');
    return { success: true, completedModuleIds };

  } catch (error: any) {
    console.error('❌ Toggle module error:', error);
    return { error: error.message || 'Failed to update progress' };
  }
}

export async function getStudentProgress(botId: string, sessionId: string) {
  try {
    console.log('📊 Fetching student progress:', { botId, sessionId });

    const { data: progress, error } = await supabaseAdmin
      .from('student_progress')
      .select('completed_module_ids')
      .eq('bot_id', botId)
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay, means no progress yet
      console.error('   ❌ Failed to fetch progress:', error);
      return { error: error.message };
    }

    const completedModuleIds = progress?.completed_module_ids || [];
    console.log('   ✅ Loaded progress:', completedModuleIds);

    return { success: true, completedModuleIds };

  } catch (error: any) {
    console.error('❌ Get progress error:', error);
    return { error: error.message || 'Failed to fetch progress' };
  }
}




