/**
 * Supabase Migration: Create Tables
 * 
 * Run this in your Supabase SQL Editor to create the required tables.
 * These tables store anonymous user threads and messages.
 */

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,  -- OpenAI Thread ID
  session_id TEXT NOT NULL,  -- Anonymous UUID from LocalStorage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT  -- Optional: Preview of first message
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_session_id ON threads(session_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
-- Note: We're using the Service Role Key in the app, which bypasses RLS.
-- However, if you want to add public policies later, enable RLS:
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy for public read access (if needed in the future)
-- CREATE POLICY "Allow public read access to threads" ON threads
--   FOR SELECT USING (true);

-- CREATE POLICY "Allow public read access to messages" ON messages
--   FOR SELECT USING (true);

-- Add comments for documentation
COMMENT ON TABLE threads IS 'Stores OpenAI Assistant threads associated with anonymous sessions';
COMMENT ON TABLE messages IS 'Stores chat messages (user and assistant) for each thread';
COMMENT ON COLUMN threads.id IS 'OpenAI Thread ID (thread_xxx)';
COMMENT ON COLUMN threads.session_id IS 'Anonymous user session UUID from LocalStorage';
COMMENT ON COLUMN messages.role IS 'Message sender: user or assistant';




