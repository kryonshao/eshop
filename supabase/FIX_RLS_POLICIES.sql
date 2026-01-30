-- ============================================
-- 修复 RLS 策略 - 解决 500 错误
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 临时禁用 RLS 来测试
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有的 profiles 表策略
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. 重新创建简单的策略
-- 允许所有已认证用户读取自己的 profile
CREATE POLICY "Enable read access for authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 允许用户插入自己的 profile
CREATE POLICY "Enable insert for authenticated users"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的 profile
CREATE POLICY "Enable update for users based on id"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. 重新启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. 确保表权限正确
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- 6. 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- 7. 测试查询（应该能成功）
SELECT 
  '✅ 测试查询' as status,
  email,
  user_role
FROM public.profiles
WHERE email = 'yufeng@altes.com';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS 策略已修复！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 下一步：';
  RAISE NOTICE '1. 刷新浏览器（Ctrl+Shift+R）';
  RAISE NOTICE '2. 重新登录';
  RAISE NOTICE '3. 访问 /merchant 页面';
  RAISE NOTICE '';
END $$;
