-- ============================================
-- 修复所有商家后台相关表的权限
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 辅助函数：删除表的所有策略
CREATE OR REPLACE FUNCTION drop_all_policies(table_name text)
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. PRODUCTS 表
-- ============================================
SELECT drop_all_policies('products');

CREATE POLICY "products_select_all"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_merchant"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

CREATE POLICY "products_update_merchant"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

CREATE POLICY "products_delete_merchant"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

-- ============================================
-- 2. ORDERS 表
-- ============================================
SELECT drop_all_policies('orders');

CREATE POLICY "orders_select_own_or_merchant"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

CREATE POLICY "orders_insert_authenticated"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_merchant"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.orders TO authenticated;

-- ============================================
-- 3. COUPONS 表
-- ============================================
SELECT drop_all_policies('coupons');

CREATE POLICY "coupons_select_all"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "coupons_manage_merchant"
  ON public.coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.coupons TO authenticated;

-- ============================================
-- 4. WAREHOUSES 表
-- ============================================
SELECT drop_all_policies('warehouses');

CREATE POLICY "warehouses_select_all"
  ON public.warehouses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "warehouses_manage_merchant"
  ON public.warehouses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.warehouses TO authenticated;

-- ============================================
-- 5. SKUS 表
-- ============================================
SELECT drop_all_policies('skus');

CREATE POLICY "skus_select_all"
  ON public.skus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "skus_manage_merchant"
  ON public.skus FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.skus TO authenticated;

-- ============================================
-- 6. INVENTORY 表
-- ============================================
SELECT drop_all_policies('inventory');

CREATE POLICY "inventory_select_all"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "inventory_manage_merchant"
  ON public.inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.inventory TO authenticated;

-- ============================================
-- 7. STOCK_MOVEMENTS 表
-- ============================================
SELECT drop_all_policies('stock_movements');

CREATE POLICY "stock_movements_select_merchant"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

CREATE POLICY "stock_movements_insert_merchant"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.stock_movements TO authenticated;

-- ============================================
-- 8. SHIPMENTS 表
-- ============================================
SELECT drop_all_policies('shipments');

CREATE POLICY "shipments_select_own_or_merchant"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
      AND (o.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
      ))
    )
  );

CREATE POLICY "shipments_manage_merchant"
  ON public.shipments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.shipments TO authenticated;

-- ============================================
-- 9. REVIEWS 表
-- ============================================
SELECT drop_all_policies('reviews');

CREATE POLICY "reviews_select_all"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "reviews_manage_merchant"
  ON public.reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.reviews TO authenticated;

-- ============================================
-- 清理辅助函数
-- ============================================
DROP FUNCTION IF EXISTS drop_all_policies(text);

-- ============================================
-- 验证
-- ============================================
SELECT 
  '========================================' as separator;

SELECT 
  '您的角色和权限' as info,
  email,
  user_role,
  CASE 
    WHEN user_role IN ('admin', 'merchant') THEN '✅ 拥有商家权限'
    ELSE '❌ 无商家权限'
  END as status
FROM public.profiles
WHERE email = 'yufeng@altes.com';

SELECT 
  '========================================' as separator;

SELECT 
  '所有表的 RLS 状态' as info,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'orders', 'coupons', 'warehouses', 
    'skus', 'inventory', 'stock_movements', 
    'shipments', 'reviews'
  )
GROUP BY tablename
ORDER BY tablename;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 所有商家后台权限已修复！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已修复的表：';
  RAISE NOTICE '1. ✅ products - 商品管理';
  RAISE NOTICE '2. ✅ orders - 订单管理';
  RAISE NOTICE '3. ✅ coupons - 优惠券管理';
  RAISE NOTICE '4. ✅ warehouses - 仓库管理';
  RAISE NOTICE '5. ✅ skus - SKU 管理';
  RAISE NOTICE '6. ✅ inventory - 库存管理';
  RAISE NOTICE '7. ✅ stock_movements - 库存变动';
  RAISE NOTICE '8. ✅ shipments - 物流管理';
  RAISE NOTICE '9. ✅ reviews - 评价管理';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在请：';
  RAISE NOTICE '1. 刷新浏览器（Ctrl+Shift+R）';
  RAISE NOTICE '2. 尝试添加、编辑、删除商品';
  RAISE NOTICE '3. 测试其他商家功能';
  RAISE NOTICE '';
END $$;
