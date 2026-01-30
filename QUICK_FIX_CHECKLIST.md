# ✅ 快速修复清单

## 问题
❌ `/merchant` 页面无法访问（自动跳转首页）  
❌ F12 显示 404/500 错误（cart_items, wishlist 表不存在）

## 解决方案（只需 5 分钟）

### ☑️ 第 1 步：打开 Supabase Dashboard
```
https://supabase.com/dashboard/project/mqpicboeltjzhfnvtkeh
```
- [ ] 已登录 Supabase
- [ ] 已打开项目 mqpicboeltjzhfnvtkeh

### ☑️ 第 2 步：打开 SQL Editor
- [ ] 点击左侧菜单 **SQL Editor**
- [ ] 点击 **New Query** 按钮

### ☑️ 第 3 步：执行数据库脚本
- [ ] 打开本地文件：`supabase/COMPLETE_DATABASE_SETUP.sql`
- [ ] 全选复制（Ctrl+A / Cmd+A，然后 Ctrl+C / Cmd+C）
- [ ] 粘贴到 SQL Editor（Ctrl+V / Cmd+V）
- [ ] 点击右下角 **Run** 按钮
- [ ] 等待执行完成（应该显示 "Success"）

### ☑️ 第 4 步：验证数据库（可选）
- [ ] 在 SQL Editor 新建查询
- [ ] 复制粘贴 `verify_database.sql` 的内容
- [ ] 点击 **Run**
- [ ] 检查结果：
  - [ ] `yufeng@altes.com` 的角色是 `admin`
  - [ ] 看到 19+ 个表（包括 cart_items, wishlist）
  - [ ] `has_role` 函数存在

### ☑️ 第 5 步：测试访问
- [ ] 刷新浏览器（Ctrl+Shift+R / Cmd+Shift+R）
- [ ] 重新登录 `yufeng@altes.com`
- [ ] 访问 http://localhost:8080/merchant
- [ ] 按 F12 打开控制台
- [ ] 确认没有 404/500 错误
- [ ] 看到商家后台界面 🎉

## 🎯 预期结果

执行完成后，您应该能够：
- ✅ 成功访问 `/merchant` 页面
- ✅ 看到商家管理后台界面
- ✅ 看到 6 个标签页：概览、商品、库存、订单、评价、优惠券
- ✅ F12 控制台没有错误

## 🆘 如果还有问题

### 问题 1：SQL 执行失败
**错误信息**: "relation already exists" 或类似  
**解决**: 这是正常的，脚本使用 `IF NOT EXISTS`，可以安全忽略

### 问题 2：还是看到 404 错误
**检查**:
```sql
-- 在 SQL Editor 中运行
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cart_items', 'wishlist', 'profiles');
```
**预期**: 应该返回 3 行

### 问题 3：还是跳转到首页
**检查**:
```sql
-- 在 SQL Editor 中运行
SELECT id, email, user_role 
FROM public.profiles 
WHERE email = 'yufeng@altes.com';
```
**预期**: `user_role` 应该是 `admin`

### 问题 4：权限错误
**解决**: 在 SQL Editor 中运行：
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
```

## 📞 需要帮助？

如果以上步骤都完成了但还有问题：
1. 截图 F12 控制台的错误信息
2. 截图 SQL Editor 的执行结果
3. 提供具体的错误信息

---

**现在就开始吧！** 从第 1 步开始，逐步完成每个复选框 ✅
