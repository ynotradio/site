-- Fix enum_users_role conflict
-- Run this on production database before running the new migration

-- Step 1: Drop the old enum (CASCADE will drop dependent columns)
DROP TYPE IF EXISTS enum_users_role CASCADE;

-- Step 2: If you have existing users, you'll need to recreate the column
-- Uncomment and run these if the users table exists with data:
-- ALTER TABLE users ADD COLUMN role_temp VARCHAR(50);
-- UPDATE users SET role_temp = 'editor' WHERE role IS NULL;
-- Then the migration will recreate the proper role column with the enum
