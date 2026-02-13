-- Add date_code_issued to recruits
ALTER TABLE recruitments ADD COLUMN IF NOT EXISTS date_code_issued DATE;
