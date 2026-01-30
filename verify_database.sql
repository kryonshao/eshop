-- ============================================
-- 数据库验证脚本
-- 在 Supabase SQL Editor 中运行此脚本来验证设置
-- ============================================

-- 1. 检查您的管理员账号
SELECT 
  id, 
  email, 
  user_role,
  created_at
FROM public.profiles 
WHERE email = 'yufeng@altes.com';
-- 预期结果：user_role = 'admin'

-- 2. 检查所有必需的表是否存在
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'profiles', 'products', 'orders', 'cart_items', 'wishlist',
      'coupons', 'coupon_redemptions', 'payments', 'refunds',
      'warehouses', 'skus', 'inventory', 'stock_movements',
      'shipping_providers', 'shipments', 'tracking_events',
      'nowpayments_webhook_events', 'system_events'
    ) THEN '✅ 必需'
    ELSE '📦 其他'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE 
    WHEN table_name IN (
      'profiles', 'products', 'orders', 'cart_items', 'wishlist',
      'coupons', 'coupon_redemptions', 'payments', 'refunds',
      'warehouses', 'skus', 'inventory', 'stock_movements',
      'shipping_providers', 'shipments', 'tracking_events',
      'nowpayments_webhook_events', 'system_events'
    ) THEN 0
    ELSE 1
  END,
  table_name;

-- 3. 检查 has_role 函数是否存在
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'has_role';
-- 预期结果：应该返回 1 行

-- 4. 检查 cart_items 表结构
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cart_items'
ORDER BY ordinal_position;

-- 5. 检查 wishlist 表结构
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'wishlist'
ORDER BY ordinal_position;

-- 6. 检查 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'cart_items', 'wishlist', 'products', 'orders')
ORDER BY tablename, policyname;

-- 7. 统计各表的记录数
SELECT 
  'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
UNION ALL
SELECT 'cart_items', COUNT(*) FROM public.cart_items
UNION ALL
SELECT 'wishlist', COUNT(*) FROM public.wishlist
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'coupons', COUNT(*) FROM public.coupons
UNION ALL
SELECT 'warehouses', COUNT(*) FROM public.warehouses
UNION ALL
SELECT 'skus', COUNT(*) FROM public.skus
UNION ALL
SELECT 'inventory', COUNT(*) FROM public.inventory
ORDER BY table_name;

-- 8. 测试 has_role 函数（使用您的 user_id）
-- 首先获取您的 user_id
SELECT id FROM public.profiles WHERE email = 'yufeng@altes.com';

-- 然后测试 has_role 函数（替换下面的 'YOUR_USER_ID'）
-- SELECT public.has_role('admin', 'YOUR_USER_ID'::uuid);
-- 预期结果：应该返回 true

-- ============================================
-- 如果所有查询都成功返回结果，说明数据库设置正确！
-- ============================================
