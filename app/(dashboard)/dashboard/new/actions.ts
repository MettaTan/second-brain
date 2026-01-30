/**
 * Server Actions for Bot Creation
 * Handles OpenAI Assistant creation, file upload, and course map generation
 */

'use server';

import { createClient } from '@/lib/supabase-server';
import { getOpenAIClient } from '@/lib/openai';
import { revalidatePath } from 'next/cache';

export async function createBotAction(formData: FormData) {
  console.log('========================================');
  console.log('🚀 Starting bot creation process');
  console.log('========================================');
  
  try {
    const supabase = await createClient();

    // Get current user
    console.log('👤 Step 1: Getting authenticated user...');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('   ❌ No authenticated user found');
      return { error: 'Unauthorized' };
    }

    console.log('   ✅ User authenticated:', user.id);

    // Get OpenAI client
    console.log('📦 Step 2: Initializing OpenAI client...');
    let openai;
    try {
      openai = getOpenAIClient();
      console.log('✅ OpenAI client initialized successfully');
      console.log('   - Client type:', typeof openai);
      console.log('   - Has beta:', typeof openai.beta);
      console.log('   - Has files:', typeof openai.files);
      console.log('   - Has vectorStores (root):', typeof openai.vectorStores);
      if (openai.beta) {
        console.log('   - Has beta.assistants:', typeof openai.beta.assistants);
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize OpenAI:', error);
      return { error: 'OpenAI configuration error' };
    }

    // Extract form data
    console.log('📝 Step 3: Extracting form data...');
    const botName = formData.get('botName') as string;
    const systemInstructions = formData.get('systemInstructions') as string;
    const curriculumJson = formData.get('curriculum') as string;
    const files = formData.getAll('files') as File[];
    const password = formData.get('password') as string | null;
    
    console.log('   - Bot name:', botName);
    console.log('   - Instructions length:', systemInstructions?.length || 0);
    console.log('   - Files received:', files.length);
    console.log('   - Curriculum provided:', !!curriculumJson);

    if (!botName) {
      console.error('❌ Bot name is missing');
      return { error: 'Bot name is required' };
    }

    let vectorStoreId: string | undefined;
    let assistantId: string;
    let courseMap: any[] = [];
    let curriculum: any[] = [];

    // Parse curriculum if provided
    if (curriculumJson) {
      try {
        curriculum = JSON.parse(curriculumJson);
        console.log('   - Parsed curriculum:', curriculum.length, 'sections');
      } catch (error) {
        console.error('   ❌ Failed to parse curriculum JSON:', error);
      }
    }

    // Step 4: If files are provided, upload to OpenAI Vector Store
    const validFiles = files.filter(f => f && f.size > 0);
    console.log('📂 Step 4: Processing files...');
    console.log('   - Valid files:', validFiles.length);
    
    if (validFiles.length > 0) {
      console.log(`📤 Uploading ${validFiles.length} file(s) to OpenAI...`);

      const fileIds: string[] = [];
      const fileIdMapping: Record<string, string> = {}; // temp ID -> OpenAI file ID

      // Helper: Get MIME type from file extension
      const getMimeType = (filename: string, fallbackType?: string): string => {
        if (fallbackType) return fallbackType;
        
        const ext = filename.toLowerCase().split('.').pop();
        const mimeTypes: Record<string, string> = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain',
        };
        
        return mimeTypes[ext || ''] || 'application/octet-stream';
      };

      // Upload all files
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const tempFileId = `file_${i}_${file.name}`;
        console.log(`   📄 [${i + 1}/${validFiles.length}] Processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        
        try {
          console.log('      - Converting to buffer...');
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const mimeType = getMimeType(file.name, file.type);
          console.log('      - Detected MIME type:', mimeType);
          
          console.log('      - Creating File object...');
          const blob = new Blob([buffer], { type: mimeType });
          const openaiFile = new File([blob], file.name, { 
            type: mimeType
          });

          console.log('      - Uploading to OpenAI...');
          
          const uploadedFile = await openai.files.create({
            file: openaiFile,
            purpose: 'assistants',
          });

          fileIds.push(uploadedFile.id);
          fileIdMapping[tempFileId] = uploadedFile.id;
          console.log(`      ✅ Uploaded: ${uploadedFile.id} (mapped from ${tempFileId})`);
        } catch (error: any) {
          console.error(`      ❌ Failed to upload ${file.name}:`, error);
          console.error('      Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          return { error: `Failed to upload ${file.name}: ${error.message}` };
        }
      }

      console.log(`   ✅ All files uploaded. Total: ${fileIds.length}`);
      console.log('   File ID mapping:', fileIdMapping);

      // Create Vector Store with all files
      console.log('📦 Step 5: Creating Vector Store...');
      console.log('   - openai.vectorStores type:', typeof openai.vectorStores);
      console.log('   - openai.vectorStores.create type:', typeof openai.vectorStores?.create);
      
      try {
        const vectorStore = await openai.vectorStores.create({
          name: `${botName} - Course Content`,
          file_ids: fileIds,
        });

        vectorStoreId = vectorStore.id;
        console.log('   ✅ Vector Store created:', vectorStoreId);
      } catch (error: any) {
        console.error('   ❌ Failed to create Vector Store:', error);
        console.error('   Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
        return { error: `Failed to create Vector Store: ${error.message}` };
      }

      // Step 6: Process Curriculum Structure
      console.log('🗺️  Step 6: Processing curriculum structure...');
      
      if (curriculum.length > 0) {
        // Use provided hierarchical curriculum
        console.log(`   - Using hierarchical curriculum: ${curriculum.length} sections`);
        
        // Map temp file IDs to real OpenAI file IDs
        courseMap = curriculum.map((section: any) => ({
          ...section,
          items: section.items.map((item: any) => ({
            ...item,
            // Replace temp file_id with real OpenAI file ID
            file_id: item.file_id && fileIdMapping[item.file_id] 
              ? fileIdMapping[item.file_id] 
              : item.file_id,
          })),
        }));
        
        const totalItems = courseMap.reduce((sum: number, s: any) => sum + s.items.length, 0);
        console.log(`   ✅ Curriculum processed: ${courseMap.length} sections, ${totalItems} total items`);
      } else {
        // Fallback: Generate flat structure from filenames (backwards compatibility)
        console.log(`   - No curriculum provided, generating flat structure from ${validFiles.length} files`);
        
        courseMap = validFiles.map((file, index) => {
          // Remove common file extensions (.pdf, .doc, .docx, .txt)
          const cleanTitle = file.name.replace(/\.(pdf|doc|docx|txt)$/i, '').trim();
          return {
            id: `m${index + 1}`,
            title: cleanTitle,
          };
        });
        
        console.log(`   ✅ Flat course map generated: ${courseMap.length} modules`);
      }
    } else {
      console.log('   ℹ️  No files provided, skipping file processing');
      console.log('   📝 Creating empty course map (no modules)');
      courseMap = []; // Empty course map - sidebar won't show
    }

    // Step 7: Create OpenAI Assistant
    console.log('🤖 Step 7: Creating OpenAI Assistant...');
    const instructions =
      systemInstructions ||
      `You are a helpful course assistant for "${botName}". Help students learn by answering their questions using the course materials.`;

    console.log('   - Model: gpt-4o');
    console.log('   - Vector Store ID:', vectorStoreId || 'none');
    console.log('   - Instructions length:', instructions.length);

    try {
      const assistant = await openai.beta.assistants.create({
        name: botName,
        instructions,
        model: 'gpt-4o',
        tools: vectorStoreId ? [{ type: 'file_search' }] : [],
        tool_resources: vectorStoreId
          ? {
              file_search: {
                vector_store_ids: [vectorStoreId],
              },
            }
          : undefined,
      });

      assistantId = assistant.id;
      console.log('   ✅ Assistant created:', assistantId);
    } catch (error: any) {
      console.error('   ❌ Failed to create assistant:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
      });
      return { error: `Failed to create assistant: ${error.message}` };
    }

    // Step 8: Save bot to Supabase
    console.log('💾 Step 8: Saving bot to database...');
    console.log('   - Bot name:', botName);
    console.log('   - Owner ID:', user.id);
    console.log('   - Assistant ID:', assistantId);
    console.log('   - System prompt:', systemInstructions ? `${systemInstructions.substring(0, 50)}...` : '(none)');
    console.log('   - Course map modules:', courseMap.length);

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .insert({
        owner_id: user.id,
        name: botName,
        assistant_id: assistantId,
        system_prompt: systemInstructions || null,
        course_map: courseMap,
        password: password || null,
      })
      .select()
      .single();

    if (botError) {
      console.error('   ❌ Failed to save bot to database:', botError);
      return { error: 'Failed to save bot to database: ' + botError.message };
    }

    console.log('   ✅ Bot saved to database:', bot.id);
    console.log('========================================');
    console.log('🎉 Bot creation completed successfully!');
    console.log('========================================');

    revalidatePath('/dashboard');

    return { success: true, botId: bot.id };
  } catch (error: any) {
    console.error('========================================');
    console.error('❌ FATAL ERROR during bot creation:');
    console.error('========================================');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    console.error('========================================');
    return { error: error.message || 'Failed to create bot' };
  }
}
