-- ============================================
-- 添加商品标签和分类功能
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 添加商品标签字段
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;

-- 2. 添加注释
COMMENT ON COLUMN public.products.is_new IS '是否为新品';
COMMENT ON COLUMN public.products.is_featured IS '是否为特色商品（首页展示）';
COMMENT ON COLUMN public.products.is_sale IS '是否为特价商品';
COMMENT ON COLUMN public.products.featured_order IS '特色商品排序（数字越小越靠前）';

-- 3. 创建分类表（如果不存在）
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 添加注释
COMMENT ON TABLE public.product_categories IS '商品分类表';
COMMENT ON COLUMN public.product_categories.name IS '分类名称（中文）';
COMMENT ON COLUMN public.product_categories.name_en IS '分类名称（英文）';
COMMENT ON COLUMN public.product_categories.image_url IS '分类展示图片';
COMMENT ON COLUMN public.product_categories.display_order IS '显示顺序（数字越小越靠前）';

-- 5. 设置 RLS 策略
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Product categories are readable by everyone" ON public.product_categories;
DROP POLICY IF EXISTS "Product categories are writable by admin/merchant" ON public.product_categories;

-- 创建新策略
CREATE POLICY "Product categories are readable by everyone" 
  ON public.product_categories FOR SELECT USING (true);

CREATE POLICY "Product categories are writable by admin/merchant" 
  ON public.product_categories FOR ALL 
  USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  ) 
  WITH CHECK (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- 6. 清理旧分类，插入新的季节性分类
-- 先删除可能存在的旧分类
DELETE FROM public.product_categories 
WHERE name NOT IN ('春秋装', '夏装', '冬装');

-- 插入3个季节性分类（使用 Unsplash 高质量图片）
INSERT INTO public.product_categories (name, name_en, display_order, image_url) VALUES
  ('春秋装', 'Spring & Autumn', 1, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=1200&fit=crop'),
  ('夏装', 'Summer', 2, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop'),
  ('冬装', 'Winter', 3, 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800&h=1200&fit=crop')
ON CONFLICT (name) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  display_order = EXCLUDED.display_order,
  image_url = EXCLUDED.image_url,
  is_active = true;

-- 7. 验证结果
DO $$
DECLARE
  category_count INTEGER;
  new_products_count INTEGER;
  featured_products_count INTEGER;
  sale_products_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO category_count FROM public.product_categories;
  SELECT COUNT(*) INTO new_products_count FROM public.products WHERE is_new = true;
  SELECT COUNT(*) INTO featured_products_count FROM public.products WHERE is_featured = true;
  SELECT COUNT(*) INTO sale_products_count FROM public.products WHERE is_sale = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 商品标签和分类功能添加完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已完成的操作：';
  RAISE NOTICE '1. ✅ 添加 is_new 字段（新品标记）';
  RAISE NOTICE '2. ✅ 添加 is_featured 字段（特色商品标记）';
  RAISE NOTICE '3. ✅ 添加 is_sale 字段（特价商品标记）';
  RAISE NOTICE '4. ✅ 添加 featured_order 字段（排序）';
  RAISE NOTICE '5. ✅ 创建商品分类表（% 个分类）', category_count;
  RAISE NOTICE '6. ✅ 设置 RLS 安全策略';
  RAISE NOTICE '';
  RAISE NOTICE '当前统计：';
  RAISE NOTICE '  • 新品商品: % 个', new_products_count;
  RAISE NOTICE '  • 特色商品: % 个', featured_products_count;
  RAISE NOTICE '  • 特价商品: % 个', sale_products_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在可以：';
  RAISE NOTICE '  • 标记商品为"新品"';
  RAISE NOTICE '  • 标记商品为"特色商品"（首页展示）';
  RAISE NOTICE '  • 标记商品为"特价商品"';
  RAISE NOTICE '  • 管理商品分类';
  RAISE NOTICE '';
END $$;

-- 8. 显示可用的分类
SELECT 
  '========================================' as separator;

SELECT 
  name as "分类名称",
  name_en as "英文名称",
  display_order as "显示顺序",
  CASE WHEN is_active THEN '✓' ELSE '✗' END as "启用状态"
FROM public.product_categories
ORDER BY display_order;
