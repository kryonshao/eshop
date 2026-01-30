-- ============================================
-- 创建 reviews 表和相关表
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 创建 reviews 表
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
  helpful_count INTEGER NOT NULL DEFAULT 0,
  images JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- 创建 review_replies 表（商家回复）
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);

-- 创建 updated_at 触发器
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

-- 启用 RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Reviews 表的 RLS 策略
DROP POLICY IF EXISTS "Reviews are readable by everyone" ON public.reviews;
CREATE POLICY "Reviews are readable by everyone"
  ON public.reviews
  FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
  ));

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and merchants can manage reviews" ON public.reviews;
CREATE POLICY "Admins and merchants can manage reviews"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

-- Review Replies 表的 RLS 策略
DROP POLICY IF EXISTS "Review replies are readable by everyone" ON public.review_replies;
CREATE POLICY "Review replies are readable by everyone"
  ON public.review_replies
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Merchants can create replies" ON public.review_replies;
CREATE POLICY "Merchants can create replies"
  ON public.review_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

DROP POLICY IF EXISTS "Users can update own replies" ON public.review_replies;
CREATE POLICY "Users can update own replies"
  ON public.review_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own replies" ON public.review_replies;
CREATE POLICY "Users can delete own replies"
  ON public.review_replies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 授予权限
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;
GRANT SELECT ON public.review_replies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.review_replies TO authenticated;

-- 验证
SELECT 
  '========================================' as separator;

SELECT 
  'Reviews 表已创建' as status,
  COUNT(*) as review_count
FROM public.reviews;

SELECT 
  '========================================' as separator;

SELECT 
  'Review Replies 表已创建' as status,
  COUNT(*) as reply_count
FROM public.review_replies;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Reviews 表创建完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '1. ✅ reviews - 用户评价表';
  RAISE NOTICE '2. ✅ review_replies - 商家回复表';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在请刷新浏览器，404 错误应该消失了';
  RAISE NOTICE '';
END $$;
