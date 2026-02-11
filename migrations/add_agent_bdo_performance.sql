-- Add agent achievement and BDO branch performance fields
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE daily_records 
ADD COLUMN IF NOT EXISTS agent_achievement DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bdo_branch_performance DECIMAL(15,2) DEFAULT 0;

-- Update existing records
UPDATE daily_records 
SET agent_achievement = 0, 
    bdo_branch_performance = 0
WHERE agent_achievement IS NULL;
