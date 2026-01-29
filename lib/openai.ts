/**
 * OpenAI Client
 * Centralized OpenAI SDK initialization
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  console.log('🔧 getOpenAIClient called');
  
  if (!openaiClient) {
    console.log('   - Creating new OpenAI client...');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('   ❌ OPENAI_API_KEY is not configured');
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    console.log('   - API Key found:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });

    console.log('   - Client created successfully');
    console.log('   - Client type:', typeof openaiClient);
    console.log('   - Has beta:', !!openaiClient.beta);
    console.log('   - Has files:', !!openaiClient.files);
    console.log('   - Has chat:', !!openaiClient.chat);
    console.log('   - Has vectorStores (root):', !!openaiClient.vectorStores);
    
    if (openaiClient.beta) {
      console.log('   - Has beta.assistants:', !!openaiClient.beta.assistants);
      console.log('   - Has beta.threads:', !!openaiClient.beta.threads);
    }
  } else {
    console.log('   - Reusing existing client');
  }

  return openaiClient;
}

