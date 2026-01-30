-- ============================================
-- 创建国际化（i18n）相关表
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 创建 product_translations 表
CREATE TABLE IF NOT EXISTS public.product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en-US', 'zh-CN', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR')),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_product_translations_product_id ON public.product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_locale ON public.product_translations(locale);

-- 2. 创建 category_translations 表（如果需要）
CREATE TABLE IF NOT EXISTS public.category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en-US', 'zh-CN', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR')),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON public.category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_category_translations_locale ON public.category_translations(locale);

-- 3. 创建触发器
DROP TRIGGER IF EXISTS update_product_translations_updated_at ON public.product_translations;
CREATE TRIGGER update_product_translations_updated_at
  BEFORE UPDATE ON public.product_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_category_translations_updated_at ON public.category_translations;
CREATE TRIGGER update_category_translations_updated_at
  BEFORE UPDATE ON public.category_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. 启用 RLS
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_translations ENABLE ROW LEVEL SECURITY;

-- 5. Product Translations RLS 策略
DROP POLICY IF EXISTS "product_translations_select_all" ON public.product_translations;
CREATE POLICY "product_translations_select_all"
  ON public.product_translations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "product_translations_manage_merchant" ON public.product_translations;
CREATE POLICY "product_translations_manage_merchant"
  ON public.product_translations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

-- 6. Category Translations RLS 策略
DROP POLICY IF EXISTS "category_translations_select_all" ON public.category_translations;
CREATE POLICY "category_translations_select_all"
  ON public.category_translations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "category_translations_manage_merchant" ON public.category_translations;
CREATE POLICY "category_translations_manage_merchant"
  ON public.category_translations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_role IN ('admin', 'merchant')
    )
  );

-- 7. 授予权限
GRANT SELECT ON public.product_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_translations TO authenticated;
GRANT SELECT ON public.category_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_translations TO authenticated;

-- 8. 为现有商品创建默认翻译（可选）
-- 这会为所有现有商品创建中文翻译
INSERT INTO public.product_translations (product_id, locale, name, description)
SELECT 
  id,
  'zh-CN',
  name,
  description
FROM public.products
WHERE id NOT IN (
  SELECT product_id 
  FROM public.product_translations 
  WHERE locale = 'zh-CN'
)
ON CONFLICT (product_id, locale) DO NOTHING;

-- 9. 验证
SELECT 
  '========================================' as separator;

SELECT 
  'Product Translations 表' as info,
  COUNT(*) as translation_count,
  COUNT(DISTINCT product_id) as product_count,
  COUNT(DISTINCT locale) as locale_count
FROM public.product_translations;

SELECT 
  '========================================' as separator;

SELECT 
  'Products 表' as info,
  COUNT(*) as total_products
FROM public.products;

SELECT 
  '========================================' as separator;

SELECT 
  '按语言统计' as info,
  locale,
  COUNT(*) as count
FROM public.product_translations
GROUP BY locale
ORDER BY locale;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 国际化表创建完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '1. ✅ product_translations - 商品翻译';
  RAISE NOTICE '2. ✅ category_translations - 分类翻译';
  RAISE NOTICE '';
  RAISE NOTICE '支持的语言：';
  RAISE NOTICE '- en-US (英语)';
  RAISE NOTICE '- zh-CN (简体中文)';
  RAISE NOTICE '- es-ES (西班牙语)';
  RAISE NOTICE '- fr-FR (法语)';
  RAISE NOTICE '- de-DE (德语)';
  RAISE NOTICE '- ja-JP (日语)';
  RAISE NOTICE '- ko-KR (韩语)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在请刷新浏览器，404 错误应该消失了';
  RAISE NOTICE '';
END $$;
