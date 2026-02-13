-- Add date columns for recruitment stages
ALTER TABLE recruitments 
ADD COLUMN date_file_submitted DATE,
ADD COLUMN date_exam_passed DATE,
ADD COLUMN date_documents_complete DATE,
ADD COLUMN date_appointed DATE;

-- Optional: Drop boolean columns if you want to rely solely on dates, 
-- or keep them synced. For now, adding dates is safer for existing logic.
