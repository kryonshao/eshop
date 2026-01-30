-- ============================================
-- 一键添加颜色、尺码和尺码指南功能
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 添加商品基础字段
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '/placeholder.svg',
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;

-- 2. 创建尺码指南分类表
CREATE TABLE IF NOT EXISTS public.size_guide_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 创建尺码指南表
CREATE TABLE IF NOT EXISTS public.size_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.size_guide_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  chart_data JSONB NOT NULL,
  measurement_tips JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 添加尺码指南关联字段
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL;

-- 5. 添加注释
COMMENT ON COLUMN public.products.image IS 'Primary product image URL';
COMMENT ON COLUMN public.products.images IS 'Array of product image URLs (max 5)';
COMMENT ON COLUMN public.products.category IS 'Product category';
COMMENT ON COLUMN public.products.stock IS 'Available stock quantity';
COMMENT ON COLUMN public.products.rating IS 'Average product rating (0-5)';
COMMENT ON COLUMN public.products.colors IS 'Available colors for this product';
COMMENT ON COLUMN public.products.sizes IS 'Available sizes for this product';
COMMENT ON COLUMN public.products.size_guide_id IS 'Reference to size guide template';
COMMENT ON TABLE public.size_guide_categories IS 'Size guide categories (tops, bottoms, etc.)';
COMMENT ON TABLE public.size_guides IS 'Reusable size guide templates';

-- 6. 设置 RLS 策略
ALTER TABLE public.size_guide_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Size guide categories are readable by everyone" ON public.size_guide_categories;
DROP POLICY IF EXISTS "Size guides are readable by everyone" ON public.size_guides;
DROP POLICY IF EXISTS "Size guide categories are writable by admin/merchant" ON public.size_guide_categories;
DROP POLICY IF EXISTS "Size guides are writable by admin/merchant" ON public.size_guides;

-- 创建新策略
CREATE POLICY "Size guide categories are readable by everyone" 
  ON public.size_guide_categories FOR SELECT USING (true);

CREATE POLICY "Size guides are readable by everyone" 
  ON public.size_guides FOR SELECT USING (true);

CREATE POLICY "Size guide categories are writable by admin/merchant" 
  ON public.size_guide_categories FOR ALL 
  USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  ) 
  WITH CHECK (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

CREATE POLICY "Size guides are writable by admin/merchant" 
  ON public.size_guides FOR ALL 
  USING (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  ) 
  WITH CHECK (
    public.has_role('admin', auth.uid()) OR public.has_role('merchant', auth.uid())
  );

-- 7. 插入默认尺码指南分类
INSERT INTO public.size_guide_categories (name, name_en, display_order) VALUES
  ('上装', 'Tops', 1),
  ('下装', 'Bottoms', 2),
  ('鞋类', 'Shoes', 3),
  ('配饰', 'Accessories', 4),
  ('通用', 'General', 0)
ON CONFLICT (name) DO NOTHING;

-- 8. 插入默认尺码指南
INSERT INTO public.size_guides (category_id, name, name_en, chart_data, measurement_tips) 
SELECT 
  (SELECT id FROM public.size_guide_categories WHERE name = '通用'),
  '标准尺码',
  'Standard Size',
  '{
    "headers": ["尺码", "适合身高(cm)", "适合体重(kg)"],
    "rows": [
      ["XS", "155-160", "40-45"],
      ["S", "160-165", "45-52"],
      ["M", "165-170", "52-60"],
      ["L", "170-175", "60-70"],
      ["XL", "175-180", "70-80"],
      ["XXL", "180-185", "80-90"]
    ]
  }'::jsonb,
  '{
    "tips": [
      {"title": "身高测量", "description": "赤脚站立，从头顶到脚底的垂直距离"},
      {"title": "体重测量", "description": "早晨空腹时测量最准确"}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.size_guides WHERE name = '标准尺码'
);

INSERT INTO public.size_guides (category_id, name, name_en, chart_data, measurement_tips) 
SELECT 
  (SELECT id FROM public.size_guide_categories WHERE name = '上装'),
  '标准上装尺码',
  'Standard Tops Size',
  '{
    "headers": ["尺码", "胸围(cm)", "腰围(cm)", "肩宽(cm)"],
    "rows": [
      ["XS", "84-88", "66-70", "38-40"],
      ["S", "88-92", "70-74", "40-42"],
      ["M", "92-96", "74-78", "42-44"],
      ["L", "96-100", "78-82", "44-46"],
      ["XL", "100-104", "82-86", "46-48"],
      ["XXL", "104-108", "86-90", "48-50"]
    ]
  }'::jsonb,
  '{
    "tips": [
      {"title": "胸围测量", "description": "在胸部最丰满处水平测量一周"},
      {"title": "腰围测量", "description": "在腰部最细处水平测量一周"},
      {"title": "肩宽测量", "description": "从左肩点到右肩点的直线距离"}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.size_guides WHERE name = '标准上装尺码'
);

INSERT INTO public.size_guides (category_id, name, name_en, chart_data, measurement_tips) 
SELECT 
  (SELECT id FROM public.size_guide_categories WHERE name = '下装'),
  '标准下装尺码',
  'Standard Bottoms Size',
  '{
    "headers": ["尺码", "腰围(cm)", "臀围(cm)", "裤长(cm)"],
    "rows": [
      ["XS", "66-70", "88-92", "98-100"],
      ["S", "70-74", "92-96", "100-102"],
      ["M", "74-78", "96-100", "102-104"],
      ["L", "78-82", "100-104", "104-106"],
      ["XL", "82-86", "104-108", "106-108"],
      ["XXL", "86-90", "108-112", "108-110"]
    ]
  }'::jsonb,
  '{
    "tips": [
      {"title": "腰围测量", "description": "在腰部最细处水平测量一周"},
      {"title": "臀围测量", "description": "在臀部最丰满处水平测量一周"},
      {"title": "裤长测量", "description": "从腰部到脚踝的垂直距离"}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.size_guides WHERE name = '标准下装尺码'
);

-- 9. 验证结果
DO $$
DECLARE
  category_count INTEGER;
  guide_count INTEGER;
  default_guide_id UUID;
BEGIN
  SELECT COUNT(*) INTO category_count FROM public.size_guide_categories;
  SELECT COUNT(*) INTO guide_count FROM public.size_guides;
  SELECT id INTO default_guide_id FROM public.size_guides WHERE name = '标准尺码' LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 颜色、尺码和尺码指南功能添加完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已完成的操作：';
  RAISE NOTICE '1. ✅ 添加 colors 字段（JSONB 数组）';
  RAISE NOTICE '2. ✅ 添加 sizes 字段（JSONB 数组）';
  RAISE NOTICE '3. ✅ 添加 images 字段（JSONB 数组）';
  RAISE NOTICE '4. ✅ 添加 category、stock、rating 字段';
  RAISE NOTICE '5. ✅ 创建尺码指南分类表（% 个分类）', category_count;
  RAISE NOTICE '6. ✅ 创建尺码指南表（% 个模板）', guide_count;
  RAISE NOTICE '7. ✅ 设置 RLS 安全策略';
  RAISE NOTICE '';
  RAISE NOTICE '默认尺码指南 ID: %', default_guide_id;
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在可以：';
  RAISE NOTICE '  • 为商品添加多个颜色选项';
  RAISE NOTICE '  • 为商品添加多个尺码选项';
  RAISE NOTICE '  • 为商品选择尺码指南模板';
  RAISE NOTICE '  • 在商品详情页显示尺码对照表';
  RAISE NOTICE '';
END $$;

-- 10. 显示可用的尺码指南
SELECT 
  '========================================' as separator;

SELECT 
  sg.name as "尺码指南名称",
  sgc.name as "分类",
  sg.id as "ID",
  CASE WHEN sg.is_active THEN '✓' ELSE '✗' END as "启用状态"
FROM public.size_guides sg
LEFT JOIN public.size_guide_categories sgc ON sg.category_id = sgc.id
ORDER BY sgc.display_order, sg.created_at;
