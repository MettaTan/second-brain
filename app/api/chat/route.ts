/**
 * Chat API Route (Multi-Tenant)
 * Handles OpenAI Assistants API integration with bot-specific assistants
 */

import { NextRequest } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { supabaseAdmin, isValidSessionId } from '@/lib/supabase';
import { Thread, Message, CourseSection, CourseItem } from '@/lib/types';
import { flattenCourseMap, resolveCompletedTitles, computePhaseProgress, formatPhaseProgressSummary } from '@/lib/courseProgress';

export async function POST(req: NextRequest) {
  try {
    const openai = getOpenAIClient();

    // Extract session ID from headers
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId || !isValidSessionId(sessionId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing session ID' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { message, threadId, botId, assistantId, studentId, completedModuleIds } = body;

    console.log('📨 Chat API request:', { 
      message: message.substring(0, 50), 
      threadId, 
      botId, 
      assistantId: assistantId.substring(0, 20), 
      hasStudentId: !!studentId,
      completedModuleIdsCount: completedModuleIds?.length || 0
    });

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!botId || !assistantId) {
      return new Response(
        JSON.stringify({ error: 'Bot ID and Assistant ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify bot exists and fetch system prompt + course map
    const { data: bot, error: botError } = await supabaseAdmin
      .from('bots')
      .select('id, assistant_id, system_prompt, course_map')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return new Response(
        JSON.stringify({ error: 'Bot not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🤖 Bot loaded:', { id: bot.id, hasSystemPrompt: !!bot.system_prompt });
    
    // Ensure course_map is properly parsed (Supabase should handle this, but add safeguard)
    if (bot.course_map && typeof bot.course_map === 'string') {
      try {
        bot.course_map = JSON.parse(bot.course_map);
        console.log('   📦 Parsed course_map from JSON string');
      } catch (e) {
        console.error('   ❌ Failed to parse course_map JSON:', e);
      }
    }

    // Step 1: Handle Thread Creation or Retrieval
    let activeThreadId = threadId;

    if (!activeThreadId) {
      console.log('🆕 Creating new thread...');
      const newThread = await openai.beta.threads.create();
      activeThreadId = newThread.id;
      console.log('   Thread created:', activeThreadId);

      // Insert into Supabase with bot_id
      const { error: threadError } = await supabaseAdmin
        .from('threads')
        .insert<Partial<Thread>>({
          id: activeThreadId,
          bot_id: botId,
          session_id: sessionId,
          created_at: new Date().toISOString(),
          title: message.slice(0, 50),
        });

      if (threadError) {
        console.error('Failed to insert thread:', threadError);
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('📝 Using existing thread:', activeThreadId);
    }

    // Step 2: Save User Message to Supabase
    const { error: userMessageError } = await supabaseAdmin
      .from('messages')
      .insert<Omit<Message, 'id'>>({
        thread_id: activeThreadId,
        role: 'user',
        content: message,
        student_id: studentId, // Guest ID for chat privacy
        created_at: new Date().toISOString(),
      });

    if (userMessageError) {
      console.error('Failed to save user message:', userMessageError);
    }

    // Step 3: Add Message to OpenAI Thread
    console.log('💬 Adding message to thread...');
    await openai.beta.threads.messages.create(activeThreadId, {
      role: 'user',
      content: message,
    });

    // Step 4: Build Completed Modules List from Client-Side Progress
    // CRITICAL: Use client-side completedModuleIds (from localStorage) instead of DB query
    // This ensures guests (who don't save to DB) can still have their progress reflected in AI responses
    console.log('📊 Processing client-side progress for context injection...');
    
    const clientCompletedIds = Array.isArray(completedModuleIds) ? completedModuleIds : [];
    
    // 🔍 DIAGNOSTIC: Compare client IDs vs server IDs
    console.log('🔍 DIAGNOSTIC - ID COMPARE:');
    console.log('   Client sent (first3):', clientCompletedIds?.slice(0, 3));
    
    const flat = flattenCourseMap(bot.course_map || []);
    console.log('   Server has (first3):', flat.slice(0, 3).map(i => i.id));
    console.log('   Counts:', { client: clientCompletedIds?.length ?? 0, server: flat.length });
    
    // Build Set of server IDs for fast lookup
    const serverIdSet = new Set(flat.map(i => i.id));
    const unmatched = (clientCompletedIds ?? []).filter(id => !serverIdSet.has(String(id)));
    if (unmatched.length > 0) {
      console.warn('⚠️ Unmatched client module IDs:', unmatched.slice(0, 50));
    }
    
    console.log(`📥 Received ${clientCompletedIds.length} completed IDs from client`);

    // Step 4: Build Phase-Aware Progress Summary from Client-Side Progress
    // Use phase-aware computation instead of flat list
    const progressSummary = computePhaseProgress(bot.course_map, clientCompletedIds);
    
    // Log unmatched IDs (server-side only, not in system prompt)
    const resolved = resolveCompletedTitles(bot.course_map, clientCompletedIds);
    if (resolved.unmatchedIds.length > 0) {
      console.warn(`⚠️ Unmatched client module IDs (${resolved.unmatchedIds.length}):`, 
        resolved.unmatchedIds.slice(0, 50));
    }
    
    // Format phase progress summary for system prompt
    let completedModulesList = 'No modules completed yet';
    if (progressSummary.totalModules > 0) {
      completedModulesList = formatPhaseProgressSummary(progressSummary);
      console.log(`✅ Generated phase progress summary: ${progressSummary.completedModules}/${progressSummary.totalModules} modules across ${progressSummary.phases.length} phases`);
      console.log(`📊 FINAL: System prompt will contain phase-aware progress summary`);
    } else if (clientCompletedIds.length > 0) {
      console.warn('⚠️ Client sent completed IDs but course_map is empty or invalid');
    }

    // Step 5.5: Generate Curriculum Legend for AI Context
    let curriculumLegend = '';
    if (bot.course_map && Array.isArray(bot.course_map) && bot.course_map.length > 0) {
      const isHierarchical = 'items' in bot.course_map[0];
      
      const legendLines: string[] = [];
      
      if (isHierarchical) {
        // Hierarchical structure: iterate through sections and items
        for (const section of bot.course_map as CourseSection[]) {
          for (const item of section.items || []) {
            let sourceFile: string | null = null;
            
            // Priority 1: Check for context_file_id (external items like videos with linked transcripts)
            if (item.context_file_id) {
              // Extract filename from temp ID format: "file_0_intro.pdf" -> "intro.pdf"
              // Temp IDs are preserved in the database (not replaced with OpenAI IDs)
              if (item.context_file_id.startsWith('file_') && item.context_file_id.includes('_')) {
                // Format: "file_0_intro.pdf" or "file_1_my document.pdf"
                // Use regex to extract everything after "file_<number>_"
                const match = item.context_file_id.match(/^file_\d+_(.+)$/);
                if (match && match[1]) {
                  sourceFile = match[1]; // Extract the actual filename
                } else {
                  // Fallback: try to extract manually
                  const parts = item.context_file_id.split('_');
                  if (parts.length >= 3) {
                    sourceFile = parts.slice(2).join('_');
                  } else {
                    sourceFile = item.context_file_id;
                  }
                }
              } else {
                // It's not a temp ID format, might be an OpenAI file ID or something else
                // Use item title as reference since we can't determine the filename
                sourceFile = item.title;
              }
            }
            // Priority 2: Check for file_id (file-type items)
            else if (item.type === 'file' && item.file_id) {
              // For file-type items, the title is typically derived from the filename
              // Use the item title as the source file reference
              sourceFile = item.title;
            }
            
            // Only add to legend if we have a source file reference
            if (sourceFile) {
              legendLines.push(`> Sidebar Item "${item.title}" is derived from file: "${sourceFile}"`);
            }
          }
        }
      } else {
        // Flat structure (backwards compatible)
        for (const module of bot.course_map as any[]) {
          // For flat structure, modules don't have file references
          // Skip or use module title
          if (module.title) {
            legendLines.push(`> Sidebar Item "${module.title}" (module reference)`);
          }
        }
      }
      
      if (legendLines.length > 0) {
        curriculumLegend = legendLines.join('\n');
        console.log('   📚 Generated curriculum legend with', legendLines.length, 'items');
      }
    }

    // Step 5: Create a Run with Streaming + Dynamic System Prompt + Progress Context
    console.log('🚀 Starting OpenAI streaming run with assistant:', assistantId);
    console.log('📝 System prompt:', bot.system_prompt ? `${bot.system_prompt.substring(0, 100)}...` : '(none)');
    
    // Log course_map structure for debugging
    if (bot.course_map && Array.isArray(bot.course_map)) {
      const isHierarchical = bot.course_map.length > 0 && 'items' in bot.course_map[0];
      const totalItems = isHierarchical 
        ? bot.course_map.reduce((sum: number, s: any) => sum + (s.items?.length || 0), 0)
        : bot.course_map.length;
      console.log('📚 Course Map Structure:', {
        totalSections: bot.course_map.length,
        isHierarchical,
        totalItems,
        sampleItemIds: isHierarchical 
          ? bot.course_map[0]?.items?.slice(0, 5).map((i: any) => i.id) || []
          : bot.course_map.slice(0, 5).map((m: any) => m.id) || []
      });
    }
    
    // Replace {{COMPLETED_MODULES_LIST}} placeholder with phase-aware progress
    let finalInstructions = bot.system_prompt || 'You are a helpful AI assistant.';
    
    // Check if all items are complete
    const allItemsComplete = progressSummary.totalModules > 0 && 
                             progressSummary.completedModules === progressSummary.totalModules;
    
    // Build progress section with phase-aware format and AI instructions
    let progressSection: string;
    if (completedModulesList === 'No modules completed yet') {
      progressSection = 'No modules completed yet.';
    } else {
      progressSection = `${completedModulesList}\n\n[PROGRESS REPORTING RULES]\nWhen the user asks about their progress:\n`;
      progressSection += `1. ALWAYS use the phase summary format shown above.\n`;
      progressSection += `2. For complete phases: Show "Phase X: ✅ Complete" (do NOT enumerate completed modules).\n`;
      progressSection += `3. For incomplete phases: Show "Phase X: a/b complete" and list ONLY remaining modules (max 3) + "and N more" if applicable.\n`;
      progressSection += `4. If all phases are complete: Respond "All phases complete (N/N)" and list phase names only (no module enumeration).\n`;
      progressSection += `5. NEVER enumerate completed modules if the phase is marked as COMPLETE.`;
      
      if (allItemsComplete) {
        progressSection += `\n\n🎉 ALL MODULES COMPLETE: The user has finished every single module. Congratulate them!`;
      }
    }
    
    if (finalInstructions.includes('{{COMPLETED_MODULES_LIST}}')) {
      // Template-based replacement (new bots)
      finalInstructions = finalInstructions.replace('{{COMPLETED_MODULES_LIST}}', progressSection);
      console.log('   ✅ Replaced placeholder with phase-aware progress summary');
      if (allItemsComplete) {
        console.log('   🎯 ALL ITEMS COMPLETE - Added completion message');
      }
      console.log('   ' + completedModulesList.split('\n').slice(0, 5).join('\n   ') + '...');
    } else {
      // Fallback: Append progress context (old bots or custom prompts)
      finalInstructions += `\n\n[CONTEXT: USER PROGRESS]\n${progressSection}`;
      console.log('   ℹ️  No placeholder found, appending phase-aware progress context');
      if (allItemsComplete) {
        console.log('   🎯 ALL ITEMS COMPLETE - Added completion message');
      }
      console.log('   ' + completedModulesList.split('\n').slice(0, 5).join('\n   ') + '...');
    }
    
    // Inject Curriculum Legend (Dynamic File Mapping)
    if (curriculumLegend) {
      finalInstructions += `\n\n[CURRICULUM STRUCTURE MAP]\nUse this map to locate the correct source file for user questions:\n${curriculumLegend}`;
      console.log('   📚 Injected curriculum legend with', curriculumLegend.split('\n').length, 'mappings');
    }
    
    console.log('📝 Final instructions with progress:', finalInstructions.substring(0, 200) + '...');
    
    const run = openai.beta.threads.runs.stream(activeThreadId, {
      assistant_id: assistantId,
      // Inject custom instructions with dynamic progress
      additional_instructions: finalInstructions,
    });

    // Step 5: Setup Streaming Response
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        console.log('📡 Stream started, sending thread ID:', activeThreadId);
        
        // Send the thread ID first
        controller.enqueue(
          encoder.encode(
            `event: thread\ndata: ${JSON.stringify({ threadId: activeThreadId })}\n\n`
          )
        );

        run.on('textCreated', () => {
          console.log('📝 Text creation started');
        });

        run.on('textDelta', (textDelta: any, snapshot: any) => {
          console.log('💬 textDelta event:', { 
            value: textDelta.value, 
            type: typeof textDelta.value,
            keys: Object.keys(textDelta)
          });
          
          const text = textDelta.value;
          if (text) {
            fullResponse += text;
            console.log('   Adding text, total length now:', fullResponse.length);
            
            const payload = { text };
            const message = `event: text\ndata: ${JSON.stringify(payload)}\n\n`;
            console.log('   📤 Sending to client:', message.substring(0, 100));
            
            controller.enqueue(encoder.encode(message));
          } else {
            console.log('   ⚠️ Text delta received but value is empty/undefined');
          }
        });

        run.on('end', async () => {
          console.log('✅ Run ended. Full response length:', fullResponse.length);
          console.log('   Response preview:', fullResponse.substring(0, 100));
          
          // Save AI response to Supabase
          if (fullResponse.trim()) {
            await supabaseAdmin.from('messages').insert<Omit<Message, 'id'>>({
              thread_id: activeThreadId,
              role: 'assistant',
              content: fullResponse,
              student_id: studentId, // Guest ID for chat privacy
              created_at: new Date().toISOString(),
            });
            console.log('   💾 Saved to database');
          } else {
            console.warn('   ⚠️ No response to save - fullResponse is empty');
          }

          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
          controller.close();
        });

        run.on('error', (error: any) => {
          console.error('❌ Stream error:', error);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`
            )
          );
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
