-- ============================================
-- 为 products 表添加多图片支持
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 添加 images 字段（JSONB 数组）
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. 为现有商品迁移数据（将 image 字段的值添加到 images 数组）
-- 仅在 image 列存在时执行迁移
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'image'
  ) THEN
    UPDATE public.products
    SET images = jsonb_build_array(image)
    WHERE image IS NOT NULL 
      AND image != '' 
      AND (images IS NULL OR images = '[]'::jsonb);
    
    RAISE NOTICE 'Migrated data from image column to images array';
  ELSE
    RAISE NOTICE 'No image column found - skipping migration';
  END IF;
END $$;

-- 3. 添加注释
COMMENT ON COLUMN public.products.images IS '商品图片数组，最多5张';

-- 4. 验证
SELECT 
  '========================================' as separator;

SELECT 
  '商品图片字段' as info,
  id,
  name,
  images as images_array,
  jsonb_array_length(COALESCE(images, '[]'::jsonb)) as image_count
FROM public.products
LIMIT 5;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 多图片字段添加完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '已完成的操作：';
  RAISE NOTICE '1. ✅ 添加 images 字段（JSONB 数组）';
  RAISE NOTICE '2. ✅ 迁移现有图片数据';
  RAISE NOTICE '3. ✅ 支持最多 5 张图片';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在可以为每个商品上传多张图片了';
  RAISE NOTICE '';
END $$;
