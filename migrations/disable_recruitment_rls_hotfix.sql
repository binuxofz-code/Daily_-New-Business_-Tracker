-- DISABLE RLS on Recruitments temporarily to fix 'Failed to add recruit' error
-- This is necessary because the application uses custom authentication (not Supabase Auth)
-- and the previous policies were likely blocking inserts from the application server.

-- 1. Disable RLS on the table
ALTER TABLE recruitments DISABLE ROW LEVEL SECURITY;

-- 2. OR alternatively, create a permissive policy if you prefer to keep RLS enabled (but it's redundant without Supabase Auth)
-- DROP POLICY IF EXISTS "Allow all access" ON recruitments;
-- CREATE POLICY "Allow all access" ON recruitments
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);
