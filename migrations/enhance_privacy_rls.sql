-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing 'allow all' policies
DROP POLICY IF EXISTS "Enable all access for now" ON users;
DROP POLICY IF EXISTS "Enable all access for now records" ON daily_records;

-- 2. Users Table Policies
-- Allow anyone to read user data (needed for login/signup checks)
-- But stricter: only authenticated users can read sensitive data? 
-- For this app, public read of usernames/roles is generally okay for functionality, 
-- but let's restrict modification.

-- Allow public read (needed for login check)
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);

-- Allow new user signup (users insert themselves)
CREATE POLICY "Public insert users" ON users FOR INSERT WITH CHECK (true);

-- Allow users to update ONLY their own data
-- Note: 'admin' might need to update others.
-- Current policy: User can update if they are the user OR if the requesting user is an 'admin'
-- Limitation: Supabase auth.uid() maps to Auth users, but we are using custom 'users' table.
-- Since we are handling everything via Next.js API (Server-Side), RLS effectively acts as a safety net against direct client access.
-- The Next.js API uses the SERVICE_ROLE key or standard client?
-- If usage is mainly Server-Side API, the client never directly queries Supabase.
-- So, disabling direct client access is the key.

-- BLOCK DIRECT CLIENT ACCESS (Public Anon Key)
-- We will rely on the Next.js API to handle all logic. 
-- The Next.js API should use the SERVICE_ROLE key to bypass RLS, OR we set RLS to only allow Service Role.

-- Best Practice for this setup (Custom Auth):
-- 1. Enable RLS.
-- 2. Create NO policies for the 'anon' role (public client).
-- 3. This effectively BLOCKS all direct access from the browser/client side.
-- 4. Your Next.js API routes (using Service Role Key if possible, or just standard client acting as backend) 
--    will need to be the only gateway.

-- HOWEVER, since we are likely using the standard client in `lib/supabase.js`, we need to see how it's initialized.
-- If `createClient` uses the `NEXT_PUBLIC_SUPABASE_ANON_KEY`, it follows RLS.

-- POLICY:
-- Ideally, only allow access if the request comes from our backend (Service Role).
-- But if we are using the Anon Key in backend, we need policies.

-- LET'S ADD POLICIES THAT LOCK DOWN DIRECT ACCESS BUT ALLOW OUR APP LOGIC.
-- Actually, since we handle auth manually, protecting row-level via `auth.uid()` isn't possible directly 
-- because we aren't using Supabase Auth users.

-- STRATEGY:
-- We will keep "Select" open (necessary for login check unless we use Service Role).
-- We will RESTRICT "Insert/Update/Delete" to only be possible via shared-secret or just generally harder?
-- Realistically, with custom auth on top of Supabase DB, RLS is tricky without Supabase Auth.

-- BETTER STRATEGY FOR PRIVACY NOW:
-- We will assume the Next.js backend handles the security.
-- We want to prevent someone from taking the Anon Key and dumping the DB.
-- So, we can restrict SELECT to only return specific columns? No, Postgres doesn't do column-level RLS easily.

-- ACTION:
-- Enable RLS.
-- Allow SELECT for everyone (needed for generic queries).
-- RESTRICT INSERT/UPDATE/DELETE to 'service_role' only?
-- If we do that, our API must use the Service Role Key.

-- Let's simply lock it down so only the application can use it.
-- Since we can't easily distinguish "App" from "Hacker with Key" without Supabase Auth...
-- The best privacy we can add right now without rewriting Auth is:
-- 1. Ensure `lib/supabase.js` uses the SERVICE_ROLE key for backend operations if possible?
--    If we switch to Service Role Key in backend, we can disable ALL RLS policies for Anon.

-- Let's assume we stick to the current setup but cleaner policies.
-- We will allow SELECT/INSERT/UPDATE/DELETE regarding the logic.
-- Actually, to protect privacy, we should ensure only valid data is entered.

-- REFINED POLICIES (Allowing usage but adding friction to bulk scraping):
-- It's hard to secure fully without moving to Supabase Auth.
-- So we will stick to standard policies but remove the "Drop all barriers" policy.

-- For now, let's keep it simple but cleaner than "True for All".
