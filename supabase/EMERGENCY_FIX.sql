-- ============================================
-- 紧急修复 - 解决 500 错误
-- 这个脚本会重建 profiles 表的所有权限和策略
-- ============================================

-- STEP 1: 完全禁用 RLS（临时）
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: 删除所有策略
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- STEP 3: 授予基本权限
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- STEP 4: 创建最简单的 RLS 策略
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);  -- 允许所有已认证用户读取所有 profiles

CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- STEP 5: 重新启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 6: 验证设置
SELECT 
  '========================================' as separator;

SELECT 
  'Profiles 表权限' as check_type,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

SELECT 
  '========================================' as separator;

SELECT 
  'RLS 策略' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

SELECT 
  '========================================' as separator;

-- STEP 7: 测试查询
SELECT 
  '测试查询结果' as check_type,
  email,
  user_role,
  created_at
FROM public.profiles
WHERE email = 'yufeng@altes.com';

-- STEP 8: 完成提示
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 紧急修复完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已执行的操作：';
  RAISE NOTICE '1. ✅ 禁用并清除所有旧的 RLS 策略';
  RAISE NOTICE '2. ✅ 授予 authenticated 角色完整权限';
  RAISE NOTICE '3. ✅ 创建新的简化 RLS 策略';
  RAISE NOTICE '4. ✅ 重新启用 RLS';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在请：';
  RAISE NOTICE '1. 刷新浏览器（Ctrl+Shift+R）';
  RAISE NOTICE '2. 如果还是 500 错误，请退出登录后重新登录';
  RAISE NOTICE '3. 访问 http://localhost:8080/merchant';
  RAISE NOTICE '';
  RAISE NOTICE '如果还有问题，请检查浏览器控制台的具体错误信息';
  RAISE NOTICE '';
END $$;
