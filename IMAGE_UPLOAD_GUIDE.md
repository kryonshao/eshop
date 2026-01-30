# 📸 商品图片上传功能

## 🎯 功能说明

现在您可以直接在商品管理页面上传图片到 Supabase Storage，无需手动输入图片 URL。

## 🚀 设置步骤

### 步骤 1：创建 Storage Bucket

在 Supabase SQL Editor 中运行：

**文件**：`supabase/CREATE_STORAGE_BUCKET.sql`

这个脚本会：
- ✅ 创建 `product-images` bucket
- ✅ 设置公开访问权限（所有人可以查看图片）
- ✅ 设置上传权限（已认证用户可以上传）
- ✅ 设置删除权限（已认证用户可以删除自己的图片）

### 步骤 2：刷新浏览器

- 按 `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)

### 步骤 3：测试上传功能

1. 访问商家后台 → 商品管理
2. 点击"添加商品"或"编辑"按钮
3. 在图片区域点击上传
4. 选择图片文件（JPG、PNG、GIF）
5. 等待上传完成

## 📋 功能特性

### 支持的图片格式
- ✅ JPG / JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP

### 文件大小限制
- 最大 5MB

### 上传流程
1. 选择图片文件
2. 自动上传到 Supabase Storage
3. 生成公开访问 URL
4. 自动填充到表单

### 图片管理
- ✅ 预览已上传的图片
- ✅ 更换图片
- ✅ 删除图片

## 🔧 技术实现

### Storage Bucket
- **Bucket ID**: `product-images`
- **访问权限**: 公开（public）
- **存储位置**: Supabase Storage

### 文件命名
- 格式：`{timestamp}-{random}.{ext}`
- 示例：`1706123456789-abc123.jpg`
- 避免文件名冲突

### URL 格式
```
https://mqpicboeltjzhfnvtkeh.supabase.co/storage/v1/object/public/product-images/{filename}
```

## 📊 Storage 配额

### Supabase 免费计划
- **存储空间**: 1GB
- **带宽**: 2GB/月
- **文件数量**: 无限制

### 建议
- 上传前压缩图片（推荐工具：TinyPNG、Squoosh）
- 使用合适的分辨率（推荐：800x800 或 1200x1200）
- 定期清理未使用的图片

## 🎨 使用示例

### 添加商品时上传图片

1. 点击"添加商品"
2. 填写商品信息
3. 在"商品图片"区域：
   - 点击虚线框
   - 选择图片文件
   - 等待上传完成
4. 图片 URL 自动填充
5. 点击"添加"保存

### 编辑商品时更换图片

1. 点击商品的"编辑"按钮
2. 鼠标悬停在图片上
3. 点击"更换图片"按钮
4. 选择新图片
5. 点击"保存"

### 删除图片

1. 鼠标悬停在图片上
2. 点击"删除"按钮
3. 图片被移除（但不会从 Storage 中删除）

## ⚠️ 注意事项

### 图片不会自动删除
- 从商品中删除图片时，文件仍保留在 Storage 中
- 需要手动在 Supabase Dashboard 中清理

### 清理未使用的图片

1. 访问 Supabase Dashboard
2. 点击 **Storage** → **product-images**
3. 查看所有上传的文件
4. 手动删除不需要的文件

### 图片优化建议

**上传前**：
- 压缩图片（使用 TinyPNG 等工具）
- 调整尺寸（推荐 800x800 或 1200x1200）
- 转换为 WebP 格式（更小的文件大小）

**命名规范**：
- 使用描述性文件名
- 避免特殊字符
- 使用小写字母

## 🔍 故障排除

### 上传失败

**错误**: "图片上传失败"

**可能原因**：
1. 文件太大（超过 5MB）
2. 文件格式不支持
3. Storage bucket 未创建
4. 权限配置错误

**解决方法**：
1. 压缩图片
2. 确认文件格式
3. 运行 `CREATE_STORAGE_BUCKET.sql`
4. 检查 Storage 策略

### 图片无法显示

**错误**: 图片 URL 返回 404

**可能原因**：
1. Bucket 不是公开的
2. 文件被删除
3. URL 格式错误

**解决方法**：
1. 检查 bucket 的 public 设置
2. 在 Storage 中确认文件存在
3. 验证 URL 格式

### 权限错误

**错误**: "Permission denied"

**解决方法**：
```sql
-- 在 SQL Editor 中运行
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');
```

## 📖 相关文档

- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [Storage 策略配置](https://supabase.com/docs/guides/storage/security/access-control)
- [图片优化指南](https://web.dev/fast/#optimize-your-images)

## 🎉 总结

现在您可以：
- ✅ 直接上传图片到 Supabase Storage
- ✅ 自动生成公开访问 URL
- ✅ 预览和管理上传的图片
- ✅ 无需手动输入图片 URL

享受更便捷的商品管理体验！🚀
