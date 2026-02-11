-- Add managed_locations column to users table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor

-- For users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS managed_locations TEXT DEFAULT '[]';

-- Update existing zonal_manager users to have empty array if NULL
UPDATE users 
SET managed_locations = '[]' 
WHERE role = 'zonal_manager' AND managed_locations IS NULL;
