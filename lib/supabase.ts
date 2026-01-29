/**
 * Supabase Admin Client
 * Uses Service Role Key to bypass RLS for anonymous session writes
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

/**
 * Admin client with full database access (bypasses RLS)
 * ONLY use this on the server side (API routes, server actions)
 */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Helper function to validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  // UUID v4 validation regex
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

