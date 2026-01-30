-- ============================================
-- 创建所有缺失的表
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 创建 reviews 表
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  images JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- 2. 创建 review_replies 表
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);

-- 3. 创建 order_items 表
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  sku_id UUID,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  attributes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 4. 创建 order_tracking 表
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);

-- 5. 创建触发器
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_review_replies_updated_at ON public.review_replies;
CREATE TRIGGER update_review_replies_updated_at
  BEFORE UPDATE ON public.review_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. 启用 RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- 7. Reviews RLS 策略
DROP POLICY IF EXISTS "Reviews readable by all" ON public.reviews;
CREATE POLICY "Reviews readable by all"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Merchants can manage reviews" ON public.reviews;
CREATE POLICY "Merchants can manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

-- 8. Review Replies RLS 策略
DROP POLICY IF EXISTS "Review replies readable by all" ON public.review_replies;
CREATE POLICY "Review replies readable by all"
  ON public.review_replies FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Merchants can create replies" ON public.review_replies;
CREATE POLICY "Merchants can create replies"
  ON public.review_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

DROP POLICY IF EXISTS "Users can update own replies" ON public.review_replies;
CREATE POLICY "Users can update own replies"
  ON public.review_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. Order Items RLS 策略
DROP POLICY IF EXISTS "Order items readable by order owner or merchant" ON public.order_items;
CREATE POLICY "Order items readable by order owner or merchant"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
      ))
    )
  );

DROP POLICY IF EXISTS "Merchants can manage order items" ON public.order_items;
CREATE POLICY "Merchants can manage order items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

-- 10. Order Tracking RLS 策略
DROP POLICY IF EXISTS "Order tracking readable by order owner or merchant" ON public.order_tracking;
CREATE POLICY "Order tracking readable by order owner or merchant"
  ON public.order_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_tracking.order_id
      AND (o.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
      ))
    )
  );

DROP POLICY IF EXISTS "Merchants can create tracking" ON public.order_tracking;
CREATE POLICY "Merchants can create tracking"
  ON public.order_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

-- 11. 授予权限
GRANT SELECT ON public.reviews TO authenticated;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.review_replies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.review_replies TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT ON public.order_tracking TO authenticated;
GRANT INSERT ON public.order_tracking TO authenticated;

-- 12. 验证
SELECT 
  '========================================' as separator,
  '已创建的表' as title;

SELECT 
  table_name,
  '✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('reviews', 'review_replies', 'order_items', 'order_tracking')
ORDER BY table_name;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 所有缺失的表已创建！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '1. ✅ reviews - 用户评价';
  RAISE NOTICE '2. ✅ review_replies - 商家回复';
  RAISE NOTICE '3. ✅ order_items - 订单商品';
  RAISE NOTICE '4. ✅ order_tracking - 订单跟踪';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在请刷新浏览器，所有 404 错误应该消失了';
  RAISE NOTICE '';
END $$;
