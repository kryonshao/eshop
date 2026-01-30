# 管理员账号设置指南

## 📋 概述

本指南将帮助你设置系统的管理员账号和用户角色系统。

## 🎯 用户角色说明

系统支持三种用户角色：

| 角色 | 说明 | 权限 |
|------|------|------|
| **customer** | 普通客户 | 浏览商品、下单、查看自己的订单 |
| **merchant** | 商家 | 管理商品、库存、订单、物流、优惠券 |
| **admin** | 管理员 | 所有权限，包括用户管理、系统配置 |

## 🚀 快速设置步骤

### 步骤 1: 运行数据库迁移

```bash
# 确保 Supabase 本地环境正在运行
supabase start

# 运行用户角色迁移
supabase db push
```

或者在 Supabase Dashboard 中：
1. 进入 SQL Editor
2. 复制 `supabase/migrations/20260130000000_user_roles_and_admin.sql` 的内容
3. 执行 SQL

### 步骤 2: 创建管理员账号

#### 方法 A: 通过 Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard: https://supabase.com/dashboard/project/mqpicboeltjzhfnvtkeh

2. 进入 **Authentication** > **Users**

3. 点击 **Add User** 按钮

4. 填写信息：
   - **Email**: `admin@altes.com`
   - **Password**: 设置一个强密码（建议至少12位，包含大小写字母、数字和特殊字符）
   - **Auto Confirm User**: ✅ 勾选（跳过邮箱验证）

5. 点击 **Create User**

6. 进入 **SQL Editor**，运行以下 SQL：
   ```sql
   UPDATE public.profiles 
   SET user_role = 'admin', 
       full_name = 'System Administrator'
   WHERE email = 'admin@altes.com';
   ```

7. 验证设置：
   ```sql
   SELECT id, email, user_role, full_name, created_at
   FROM public.profiles
   WHERE email = 'admin@altes.com';
   ```

#### 方法 B: 通过前端注册

1. 访问 http://localhost:8080/

2. 点击右上角 **注册** 按钮

3. 填写信息：
   - **邮箱**: `admin@altes.com`
   - **密码**: 设置强密码

4. 注册成功后，在 Supabase Dashboard 的 SQL Editor 中运行：
   ```sql
   UPDATE public.profiles 
   SET user_role = 'admin'
   WHERE email = 'admin@altes.com';
   ```

5. 刷新页面，现在你就是管理员了！

### 步骤 3: 创建测试商家账号（可选）

1. 在 Supabase Dashboard 创建用户：
   - **Email**: `merchant@altes.com`
   - **Password**: 设置密码
   - **Auto Confirm User**: ✅

2. 设置为商家角色：
   ```sql
   UPDATE public.profiles 
   SET user_role = 'merchant', 
       full_name = 'Test Merchant'
   WHERE email = 'merchant@altes.com';
   ```

### 步骤 4: 验证设置

运行以下 SQL 查看所有用户：

```sql
SELECT 
  email, 
  user_role, 
  full_name, 
  created_at
FROM public.profiles
ORDER BY created_at DESC;
```

## 🔐 登录不同角色

### 管理员登录
- 访问: http://localhost:8080/
- 邮箱: `admin@altes.com`
- 密码: (你设置的密码)
- 登录后可访问: `/merchant` (商家后台)

### 商家登录
- 访问: http://localhost:8080/
- 邮箱: `merchant@altes.com`
- 密码: (你设置的密码)
- 登录后可访问: `/merchant` (商家后台)

### 普通客户
- 任何新注册的用户默认都是 `customer` 角色
- 只能访问前台购物功能

## 📝 注意事项

1. **默认角色**: 所有通过前端注册的新用户默认角色都是 `customer`

2. **角色提升**: 只能通过数据库 SQL 或管理员界面来提升用户角色

3. **安全建议**:
   - 管理员密码应该足够强（至少12位）
   - 不要在生产环境使用 `admin@altes.com` 这样的通用邮箱
   - 定期更换管理员密码

4. **权限检查**: 系统使用 `has_role()` 函数检查用户权限，确保数据安全

## 🛠️ 常用 SQL 命令

### 查看所有用户及其角色
```sql
SELECT 
  p.email, 
  p.user_role, 
  p.full_name,
  p.created_at,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;
```

### 将用户提升为商家
```sql
UPDATE public.profiles 
SET user_role = 'merchant'
WHERE email = 'user@example.com';
```

### 将用户提升为管理员
```sql
UPDATE public.profiles 
SET user_role = 'admin'
WHERE email = 'user@example.com';
```

### 将用户降级为普通客户
```sql
UPDATE public.profiles 
SET user_role = 'customer'
WHERE email = 'user@example.com';
```

### 统计各角色用户数量
```sql
SELECT 
  user_role, 
  COUNT(*) as count
FROM public.profiles
GROUP BY user_role
ORDER BY count DESC;
```

## 🔍 故障排查

### 问题: 登录后无法访问商家后台

**解决方案**:
1. 检查用户角色：
   ```sql
   SELECT email, user_role 
   FROM public.profiles 
   WHERE email = 'your@email.com';
   ```

2. 如果角色不是 `merchant` 或 `admin`，更新它：
   ```sql
   UPDATE public.profiles 
   SET user_role = 'merchant'
   WHERE email = 'your@email.com';
   ```

3. 退出登录并重新登录

### 问题: profiles 表中没有用户记录

**解决方案**:
1. 检查触发器是否正常工作
2. 手动插入 profile：
   ```sql
   INSERT INTO public.profiles (id, email, user_role)
   SELECT id, email, 'customer'
   FROM auth.users
   WHERE id NOT IN (SELECT id FROM public.profiles);
   ```

## 📚 相关文档

- [部署指南](./DEPLOYMENT_GUIDE.md)
- [生产就绪检查](./PRODUCTION_READINESS.md)
- [法律合规](./LEGAL_COMPLIANCE.md)

## 🎉 完成！

现在你已经成功设置了管理员账号和用户角色系统！

**推荐的测试账号**:
- 管理员: `admin@altes.com`
- 商家: `merchant@altes.com`
- 客户: 任何新注册的用户
