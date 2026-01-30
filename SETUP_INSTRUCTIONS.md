# 🚀 数据库设置说明

## 当前问题
您的商家后台 `/merchant` 无法访问，因为数据库缺少必要的表：
- ❌ `profiles` 表（用户角色）
- ❌ `cart_items` 表（购物车）
- ❌ `wishlist` 表（收藏夹）
- ❌ `orders` 表（订单）
- ❌ 其他核心表

## ✅ 解决方案（只需 3 步）

### 步骤 1：打开 Supabase Dashboard
1. 访问：https://supabase.com/dashboard/project/mqpicboeltjzhfnvtkeh
2. 登录您的 Supabase 账号

### 步骤 2：执行 SQL 脚本
1. 在左侧菜单点击 **SQL Editor**
2. 点击 **New Query** 创建新查询
3. 打开项目中的文件：`supabase/COMPLETE_DATABASE_SETUP.sql`
4. **复制整个文件内容**（全选 Ctrl+A / Cmd+A）
5. **粘贴到 SQL Editor** 中
6. 点击右下角 **Run** 按钮执行

### 步骤 3：验证和测试
1. 刷新浏览器页面（Ctrl+R / Cmd+R）
2. 重新登录账号：`yufeng@altes.com`
3. 访问：http://localhost:8080/merchant
4. 按 F12 打开开发者工具，检查 Console 是否还有错误

## 📋 脚本包含的内容

`COMPLETE_DATABASE_SETUP.sql` 会创建：

✅ **用户系统**
- `profiles` 表（用户角色：customer/merchant/admin）
- `has_role()` 函数
- 自动创建 profile 的触发器

✅ **电商核心**
- `products` 表（商品）
- `orders` 表（订单）
- `cart_items` 表（购物车）
- `wishlist` 表（收藏夹）
- `coupons` 表（优惠券）
- `coupon_redemptions` 表（优惠券使用记录）

✅ **支付系统**
- `payments` 表（支付记录）
- `refunds` 表（退款记录）
- `nowpayments_webhook_events` 表（支付回调）

✅ **库存系统**
- `warehouses` 表（仓库）
- `skus` 表（商品规格）
- `inventory` 表（库存）
- `stock_movements` 表（库存变动）

✅ **物流系统**
- `shipping_providers` 表（物流商）
- `shipments` 表（发货记录）
- `tracking_events` 表（物流跟踪）

✅ **监控系统**
- `system_events` 表（系统事件）

✅ **权限控制**
- 所有表的 RLS（Row Level Security）策略
- Admin/Merchant/Customer 权限分离

## ⚠️ 重要提示

1. **不要使用 `supabase db push`**
   - 您使用的是远程 Supabase 项目
   - 必须在 Dashboard SQL Editor 中手动执行

2. **脚本是幂等的**
   - 使用 `CREATE TABLE IF NOT EXISTS`
   - 使用 `DROP POLICY IF EXISTS`
   - 可以安全地重复执行

3. **您的管理员账号已设置**
   - 邮箱：`yufeng@altes.com`
   - 角色：`admin`
   - 邮箱已确认

## 🔍 如何确认成功

执行完 SQL 后，在 SQL Editor 中运行以下查询验证：

```sql
-- 检查您的角色
SELECT id, email, user_role 
FROM public.profiles 
WHERE email = 'yufeng@altes.com';

-- 应该返回：user_role = 'admin'

-- 检查所有表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 应该看到所有表：cart_items, coupons, inventory, orders, payments, products, profiles, refunds, shipments, skus, stock_movements, system_events, tracking_events, warehouses, wishlist 等
```

## 🆘 如果还有问题

1. **检查浏览器控制台**（F12）
   - 查看是否还有 404/500 错误
   - 记录错误信息

2. **检查 Supabase Logs**
   - Dashboard → Logs → Postgres Logs
   - 查看是否有权限或查询错误

3. **清除浏览器缓存**
   - 硬刷新：Ctrl+Shift+R / Cmd+Shift+R
   - 或清除站点数据

---

**准备好了吗？** 现在就去执行 `supabase/COMPLETE_DATABASE_SETUP.sql` 吧！ 🚀
