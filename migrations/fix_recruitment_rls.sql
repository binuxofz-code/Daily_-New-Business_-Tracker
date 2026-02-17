-- FIX: Relax RLS Policies for Recruitment Feature
-- This ensures users can view/manage their own recruits, fixing the loading issue.

-- 1. Drop the overly strict service-role-only policy
DROP POLICY IF EXISTS "Service role full access recruitments" ON recruitments;

-- 2. Allow authenticated users to SELECT (view) their own records
CREATE POLICY "Users can view own recruits" ON recruitments
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Allow authenticated users to INSERT new records
CREATE POLICY "Users can insert own recruits" ON recruitments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Allow authenticated users to UPDATE their own records
CREATE POLICY "Users can update own recruits" ON recruitments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Allow authenticated users to DELETE their own records
CREATE POLICY "Users can delete own recruits" ON recruitments
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. KEEP/RESTORE Service Role access (essential for Admin/Zonal Manager view via API)
-- Note: When querying via API with service role key, this policy applies.
CREATE POLICY "Service role full access recruitments" ON recruitments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
