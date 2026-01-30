-- Setup Admin Account
-- Run this script in Supabase SQL Editor after creating the admin user account

-- Step 1: First, manually create the admin account in Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Email: admin@altes.com
-- Password: (set a secure password)
-- Confirm Password: (same password)
-- Auto Confirm User: Yes

-- Step 2: After creating the account, run this script to set the role to admin:
UPDATE public.profiles 
SET user_role = 'admin', 
    full_name = 'System Administrator'
WHERE email = 'admin@altes.com';

-- Verify the admin account
SELECT id, email, user_role, full_name, created_at
FROM public.profiles
WHERE email = 'admin@altes.com';

-- Optional: Create a test merchant account
-- First create the user in Supabase Dashboard with email: merchant@altes.com
-- Then run:
-- UPDATE public.profiles 
-- SET user_role = 'merchant', 
--     full_name = 'Test Merchant'
-- WHERE email = 'merchant@altes.com';

-- Optional: Create a test customer account
-- First create the user in Supabase Dashboard with email: customer@altes.com
-- Then run:
-- UPDATE public.profiles 
-- SET user_role = 'customer', 
--     full_name = 'Test Customer'
-- WHERE email = 'customer@altes.com';

-- Check all user roles
SELECT email, user_role, full_name, created_at
FROM public.profiles
ORDER BY created_at DESC;
