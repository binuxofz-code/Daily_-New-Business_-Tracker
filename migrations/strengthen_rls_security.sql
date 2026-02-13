-- CRITICAL SECURITY UPDATE: Strengthen Row Level Security
-- Run this in Supabase SQL Editor to prevent direct client database access

-- 1. Drop existing permissive policies
DROP POLICY IF EXISTS "Public read users" ON users;
DROP POLICY IF EXISTS "Public insert users" ON users;
DROP POLICY IF EXISTS "Public manage records" ON daily_records;
DROP POLICY IF EXISTS "Users can manage own recruits" ON recruitments;

-- 2. Create strict service-role-only policies
-- This forces all access to go through your Next.js API routes

-- Users table: Only service role can access
CREATE POLICY "Service role full access users" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Daily records table: Only service role can access
CREATE POLICY "Service role full access records" ON daily_records
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Recruitments table: Only service role can access
CREATE POLICY "Service role full access recruitments" ON recruitments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- IMPORTANT: After running this, make sure your Next.js API routes use the Service Role key
-- Update lib/supabase.js to use SUPABASE_SERVICE_ROLE_KEY for backend operations
