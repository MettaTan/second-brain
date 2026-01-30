-- Add optional password protection for bots
ALTER TABLE bots ADD COLUMN IF NOT EXISTS password TEXT;
