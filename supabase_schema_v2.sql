
-- Run this in Supabase SQL Editor to upgrade your database

-- 1. Add columns to daily_records to track specific Branch/Zone for each record
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS zone TEXT;
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS branch TEXT;

-- 2. Add column to users to store their assigned branches list (as JSON)
ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_locations TEXT; 
-- This will store something like: '[{"zone":"Zone A", "branch":"Matara"}, {"zone":"Zone A", "branch":"Galle"}]'

-- 3. Remove old unique constraint if it exists (Optional, but good practice to avoid conflicts)
-- We need records to be unique by User + Date + Branch now, not just User + Date
ALTER TABLE daily_records DROP CONSTRAINT IF EXISTS daily_records_user_id_date_key; -- Name might vary, ignore if error

-- 4. New constraint (Optional)
-- CREATE UNIQUE INDEX unique_daily_entry ON daily_records (user_id, date, branch);
