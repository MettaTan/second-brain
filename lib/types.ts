/**
 * Database Types
 * TypeScript definitions aligned with new SaaS schema
 */

// Auth Types
export interface Profile {
  id: string; // UUID from Supabase Auth
  email: string;
  created_at?: string;
}

// Bot Types
export interface Bot {
  id: string; // UUID
  owner_id: string; // FK to profiles
  name: string;
  assistant_id: string; // OpenAI Assistant ID
  system_prompt?: string; // Custom instructions for this bot
  course_map: CourseModule[] | CourseMap; // JSONB array (supports both flat and hierarchical)
  created_at?: string;
}

// Legacy flat structure (for backwards compatibility)
export interface CourseModule {
  id: string; // e.g., 'm1', 'm2'
  title: string; // e.g., 'Introduction to Marketing'
}

// New hierarchical structure
export type ItemType = 'file' | 'video' | 'quiz' | 'link';

export interface CourseItem {
  id: string; // UUID
  title: string; // e.g. "1.1 Welcome Video"
  type: ItemType;
  file_id?: string; // If type is 'file' (The "Brain" context)
  external_url?: string; // For 'video', 'link' types (Link to Skool/Whop)
  context_file_id?: string; // CRITICAL: Transcript/PDF for AI context (for external items)
  completed?: boolean; // For client-side tracking
}

export interface CourseSection {
  id: string; // UUID
  title: string; // e.g. "Phase 1: Foundations"
  items: CourseItem[];
}

export type CourseMap = CourseSection[];

// Thread Types (Updated)
export interface Thread {
  id: string; // OpenAI Thread ID
  bot_id: string; // FK to bots
  session_id: string; // Anonymous student UUID
  title?: string; // Optional preview
  created_at?: string;
}

// Message Types
export interface Message {
  id: number;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  student_id?: string; // Guest ID for chat privacy
  created_at: string;
}

// Student Progress Types
export interface StudentProgress {
  id?: number;
  session_id: string;
  bot_id: string;
  completed_module_ids: string[]; // JSONB array
  updated_at?: string;
}

/**
 * API Request/Response Types
 */

export interface ChatRequest {
  message: string;
  threadId?: string;
  botId: string; // Now required
}

export interface ChatResponse {
  threadId: string;
  message: string;
}

export interface BotListResponse {
  bots: Bot[];
}
