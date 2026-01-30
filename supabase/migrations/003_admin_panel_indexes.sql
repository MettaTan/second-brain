-- Indexes for admin panel queries
-- Speeds up conversation listing and stats aggregation

CREATE INDEX IF NOT EXISTS idx_threads_bot_id ON threads(bot_id);
CREATE INDEX IF NOT EXISTS idx_messages_student_id ON messages(student_id);
