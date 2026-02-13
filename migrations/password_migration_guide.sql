-- IMPORTANT: Existing User Password Reset Required
-- 
-- Since we've now implemented password hashing, all existing users with plain text passwords
-- need to reset their passwords.
--
-- OPTION 1: Admin manually resets passwords via the application
-- OPTION 2: Run a one-time migration script (requires Node.js script)
--
-- For now, we recommend OPTION 1:
-- 1. Admin logs in
-- 2. Goes to User Management
-- 3. Manually updates each user's password
-- 4. The new password will be automatically hashed via the signup/update API
--
-- NOTE: Old plain text passwords will NOT work anymore after this security update.
-- This is intentional and necessary for security.

-- You can identify users with plain text passwords (they won't start with $2a$ or $2b$)
SELECT id, username, 
       CASE 
         WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 'Hashed'
         ELSE 'Plain Text (NEEDS UPDATE)'
       END as password_status
FROM users;
