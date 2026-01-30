-- ============================================
-- 诊断脚本 - 找出为什么 /merchant 无法访问
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 检查您的账号是否存在于 profiles 表
SELECT 
  '1. 检查账号' as step,
  id, 
  email, 
  user_role,
  created_at
FROM public.profiles 
WHERE email = 'yufeng@altes.com';

-- 2. 检查 auth.users 表中的账号
SELECT 
  '2. 检查 auth.users' as step,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'yufeng@altes.com';

-- 3. 检查 profiles 表是否为空
SELECT 
  '3. Profiles 表记录数' as step,
  COUNT(*) as total_profiles
FROM public.profiles;

-- 4. 检查所有用户的角色
SELECT 
  '4. 所有用户角色' as step,
  email,
  user_role
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 5. 测试 has_role 函数（需要替换 YOUR_USER_ID）
-- 先获取您的 user_id
SELECT 
  '5. 您的 User ID' as step,
  id as user_id
FROM auth.users
WHERE email = 'yufeng@altes.com';

-- 6. 检查 RLS 策略
SELECT 
  '6. Profiles 表的 RLS 策略' as step,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- 7. 检查必需的表是否存在
SELECT 
  '7. 必需表检查' as step,
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'cart_items', 'wishlist', 'products', 'orders') 
    THEN '✅ 核心表'
    ELSE '📦 其他表'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
