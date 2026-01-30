-- ============================================
-- 修复 products 表的权限问题
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 检查当前的 products 表策略
SELECT 
  '当前 Products 表的 RLS 策略' as info,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'products';

-- 2. 删除所有现有的 products 表策略
DROP POLICY IF EXISTS "Products are readable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products are writable by admin/merchant" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.products;

-- 3. 创建新的简化策略
-- 所有人都可以读取商品
CREATE POLICY "products_select_policy"
  ON public.products
  FOR SELECT
  USING (true);

-- Admin 和 Merchant 可以插入商品
CREATE POLICY "products_insert_policy"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'merchant')
    )
  );

-- Admin 和 Merchant 可以更新商品
CREATE POLICY "products_update_policy"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'merchant')
    )
  );

-- Admin 和 Merchant 可以删除商品
CREATE POLICY "products_delete_policy"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND user_role IN ('admin', 'merchant')
    )
  );

-- 4. 确保 RLS 已启用
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. 授予权限
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- 6. 测试权限（使用您的账号）
SELECT 
  '========================================' as separator;

SELECT 
  '测试：检查您的角色' as test,
  p.email,
  p.user_role,
  CASE 
    WHEN p.user_role IN ('admin', 'merchant') THEN '✅ 有权限'
    ELSE '❌ 无权限'
  END as permission_status
FROM public.profiles p
WHERE p.email = 'yufeng@altes.com';

-- 7. 验证新策略
SELECT 
  '========================================' as separator;

SELECT 
  '新的 Products RLS 策略' as info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'products'
ORDER BY cmd;

-- 8. 检查表权限
SELECT 
  '========================================' as separator;

SELECT 
  'Products 表权限' as info,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Products 表权限已修复！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已完成的操作：';
  RAISE NOTICE '1. ✅ 删除旧的 RLS 策略';
  RAISE NOTICE '2. ✅ 创建新的 RLS 策略（SELECT/INSERT/UPDATE/DELETE）';
  RAISE NOTICE '3. ✅ 授予 authenticated 角色完整权限';
  RAISE NOTICE '4. ✅ Admin 和 Merchant 可以管理商品';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在请：';
  RAISE NOTICE '1. 刷新浏览器（Ctrl+Shift+R）';
  RAISE NOTICE '2. 尝试添加、编辑或删除商品';
  RAISE NOTICE '';
  RAISE NOTICE '如果还有问题，请检查浏览器 F12 控制台的错误信息';
  RAISE NOTICE '';
END $$;
