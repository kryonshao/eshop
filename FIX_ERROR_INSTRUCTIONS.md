# 🔧 修复 has_role 函数错误

## 错误信息
```
Error: Failed to run sql query: ERROR: 42P13: cannot change name of input parameter "role_name" 
HINT: Use DROP FUNCTION has_role(text,uuid) first.
```

## 原因
数据库中已经存在一个旧版本的 `has_role` 函数，参数名不同，导致无法直接替换。

## ✅ 解决方案（2 种方法）

### 方法 1：使用简化版脚本（推荐）⭐

这个脚本会自动处理所有问题，包括删除旧函数和重建策略。

1. **打开 Supabase SQL Editor**
   - 访问：https://supabase.com/dashboard/project/mqpicboeltjzhfnvtkeh
   - 点击左侧 **SQL Editor**
   - 点击 **New Query**

2. **执行简化版脚本**
   - 打开文件：`supabase/SIMPLE_DATABASE_SETUP.sql`
   - 复制全部内容（Ctrl+A / Cmd+A）
   - 粘贴到 SQL Editor
   - 点击 **Run** 按钮
   - 等待执行完成

3. **完成！**
   - 刷新浏览器（Ctrl+Shift+R / Cmd+Shift+R）
   - 重新登录 `yufeng@altes.com`
   - 访问 http://localhost:8080/merchant

### 方法 2：分步执行

如果方法 1 不行，可以分两步执行：

#### 步骤 1：删除旧函数
在 SQL Editor 中运行：
```sql
DROP FUNCTION IF EXISTS public.has_role(text, uuid) CASCADE;
```

#### 步骤 2：执行完整设置
然后运行 `supabase/COMPLETE_DATABASE_SETUP.sql`

## 📋 SIMPLE_DATABASE_SETUP.sql 包含什么？

这个脚本包含完整的数据库设置：

✅ **自动删除旧函数**
- 使用 `DROP FUNCTION ... CASCADE` 删除旧的 has_role 函数
- 自动删除所有依赖的策略

✅ **创建所有表**
- profiles（用户角色）
- cart_items（购物车）⭐
- wishlist（收藏夹）⭐
- products（商品）
- orders（订单）
- payments（支付）
- warehouses（仓库）
- skus（商品规格）
- inventory（库存）
- shipments（物流）
- 等等...

✅ **创建所有函数**
- has_role（角色检查）
- handle_new_user（自动创建 profile）
- update_updated_at_column（自动更新时间戳）

✅ **设置所有 RLS 策略**
- 用户只能访问自己的购物车和收藏夹
- Admin/Merchant 可以管理商品、订单、库存
- 所有人都可以查看商品

✅ **授予必要权限**
- authenticated 用户可以操作购物车和收藏夹
- anon 用户可以查看商品

## 🎯 执行后的预期结果

执行成功后，您会看到：
```
✅ 数据库设置完成！
📊 已创建所有必需的表
🔒 已设置 RLS 策略
🎉 现在可以刷新浏览器并访问 /merchant 页面了
```

## 🔍 验证设置

执行完成后，运行以下查询验证：

```sql
-- 1. 检查您的角色
SELECT id, email, user_role 
FROM public.profiles 
WHERE email = 'yufeng@altes.com';
-- 应该返回：user_role = 'admin'

-- 2. 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cart_items', 'wishlist', 'profiles', 'products', 'orders')
ORDER BY table_name;
-- 应该返回 5 行

-- 3. 检查 has_role 函数
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'has_role';
-- 应该返回 1 行
```

## 🆘 如果还有问题

### 问题：CASCADE 删除了太多东西
**不用担心**：脚本会重新创建所有必需的策略和依赖。

### 问题：某些表已存在
**不用担心**：脚本使用 `CREATE TABLE IF NOT EXISTS`，不会覆盖现有数据。

### 问题：还是看到 404 错误
**检查**：
1. 确认脚本执行成功（看到 "✅ 数据库设置完成！"）
2. 刷新浏览器（硬刷新：Ctrl+Shift+R）
3. 重新登录
4. 检查 F12 控制台的具体错误信息

### 问题：权限错误
**解决**：在 SQL Editor 中运行：
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
```

## 📁 相关文件

- ✅ **`supabase/SIMPLE_DATABASE_SETUP.sql`** - 推荐使用（自动处理所有问题）
- 📄 `supabase/FIX_HAS_ROLE_FUNCTION.sql` - 只删除旧函数
- 📄 `supabase/COMPLETE_DATABASE_SETUP.sql` - 完整版（需要先删除旧函数）
- 📄 `verify_database.sql` - 验证脚本

---

**现在就执行 `SIMPLE_DATABASE_SETUP.sql` 吧！** 🚀
