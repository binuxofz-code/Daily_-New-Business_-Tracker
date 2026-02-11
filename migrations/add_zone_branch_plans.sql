-- Add zone and branch level planning fields to daily_records table
-- Run this SQL in your Supabase SQL Editor

-- Add new columns for zone and branch level planning
ALTER TABLE daily_records 
ADD COLUMN IF NOT EXISTS zone_plan TEXT,
ADD COLUMN IF NOT EXISTS branch_plan TEXT,
ADD COLUMN IF NOT EXISTS aaf_agents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS branch_business DECIMAL(15,2) DEFAULT 0;

-- Update existing records to have default values
UPDATE daily_records 
SET zone_plan = '', 
    branch_plan = '', 
    aaf_agents = 0,
    branch_business = 0
WHERE zone_plan IS NULL;
