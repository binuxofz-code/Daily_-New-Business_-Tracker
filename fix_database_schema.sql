-- Run this in your Supabase SQL Editor to fix the schema
-- This adds the missing columns that the code is trying to use

ALTER TABLE daily_records 
ADD COLUMN IF NOT EXISTS zone_plan TEXT,
ADD COLUMN IF NOT EXISTS branch_plan TEXT,
ADD COLUMN IF NOT EXISTS aaf_agents NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_business NUMERIC DEFAULT 0;

-- Ensure these other new columns also exist (just in case)
ALTER TABLE daily_records 
ADD COLUMN IF NOT EXISTS agent_achievement NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bdo_branch_performance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT;

-- Update users table for zonal manager assignments
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS managed_locations TEXT;
