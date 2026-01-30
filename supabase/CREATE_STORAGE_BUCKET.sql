-- ============================================
-- 创建 Supabase Storage Bucket 用于存储商品图片
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 创建 product-images bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置 Storage 策略 - 允许所有人查看图片
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3. 允许已认证用户上传图片
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 4. 允许已认证用户更新自己上传的图片
DROP POLICY IF EXISTS "Authenticated users can update own images" ON storage.objects;
CREATE POLICY "Authenticated users can update own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 5. 允许已认证用户删除自己上传的图片
DROP POLICY IF EXISTS "Authenticated users can delete own images" ON storage.objects;
CREATE POLICY "Authenticated users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 6. 验证 bucket 是否创建成功
SELECT 
  '========================================' as separator;

SELECT 
  'Storage Bucket 信息' as info,
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'product-images';

-- 7. 验证策略
SELECT 
  '========================================' as separator;

SELECT 
  'Storage 策略' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%product-images%' OR policyname LIKE '%Public Access%' OR policyname LIKE '%Authenticated%';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Storage Bucket 创建完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Bucket 信息：';
  RAISE NOTICE '- ID: product-images';
  RAISE NOTICE '- 公开访问: 是';
  RAISE NOTICE '- 上传权限: 已认证用户';
  RAISE NOTICE '';
  RAISE NOTICE '📋 现在可以在商品管理中上传图片了';
  RAISE NOTICE '';
END $$;
