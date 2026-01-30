# 🔍 调试商家后台访问问题

## 问题
SQL 执行成功，但访问 `/merchant` 还是跳转到首页

## 可能的原因

### 1. Profile 记录不存在
您的账号 `yufeng@altes.com` 可能没有在 `profiles` 表中创建记录。

### 2. 角色不是 admin
Profile 记录存在，但 `user_role` 不是 `admin`。

### 3. useUserRole Hook 返回错误
Hook 可能无法正确读取角色。

## 🔍 诊断步骤

### 步骤 1：在 Supabase SQL Editor 中运行诊断脚本

打开文件 `supabase/DIAGNOSE_ISSUE.sql`，复制全部内容到 SQL Editor 并运行。

**检查结果**：

#### 查询 1：检查账号
```sql
SELECT id, email, user_role, created_at
FROM public.profiles 
WHERE email = 'yufeng@altes.com';
```

**预期结果**：
- 应该返回 1 行
- `user_role` 应该是 `'admin'`

**如果没有返回结果**：说明 profile 记录不存在，需要手动创建。

**如果 user_role 不是 admin**：需要更新角色。

#### 查询 2：检查 auth.users
```sql
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'yufeng@altes.com';
```

**预期结果**：
- 应该返回 1 行
- `email_confirmed_at` 不应该是 NULL

### 步骤 2：根据诊断结果执行修复

#### 情况 A：Profile 不存在

在 SQL Editor 中运行：
```sql
-- 获取您的 user_id
SELECT id FROM auth.users WHERE email = 'yufeng@altes.com';

-- 手动创建 profile（替换下面的 YOUR_USER_ID）
INSERT INTO public.profiles (id, email, user_role)
VALUES (
  'YOUR_USER_ID'::uuid,  -- 替换为上面查询到的 id
  'yufeng@altes.com',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET user_role = 'admin';
```

#### 情况 B：Profile 存在但角色不对

在 SQL Editor 中运行：
```sql
UPDATE public.profiles
SET user_role = 'admin'
WHERE email = 'yufeng@altes.com';

-- 验证
SELECT email, user_role FROM public.profiles WHERE email = 'yufeng@altes.com';
```

#### 情况 C：邮箱未确认

在 SQL Editor 中运行：
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'yufeng@altes.com';
```

### 步骤 3：清除浏览器缓存并重新登录

1. **完全退出登录**
   - 在网站上点击退出登录
   
2. **清除浏览器缓存**
   - Chrome/Edge: Ctrl+Shift+Delete / Cmd+Shift+Delete
   - 选择"Cookies 和其他网站数据"
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

3. **硬刷新页面**
   - Ctrl+Shift+R / Cmd+Shift+R

4. **重新登录**
   - 使用 `yufeng@altes.com` 登录

5. **访问商家后台**
   - 访问 http://localhost:8080/merchant

### 步骤 4：检查浏览器控制台

按 F12 打开开发者工具，查看：

1. **Console 标签页**
   - 查找 "Error fetching user role" 错误
   - 查找任何 404/500 错误
   - 记录完整的错误信息

2. **Network 标签页**
   - 刷新页面
   - 查找对 `profiles` 表的请求
   - 检查请求是否成功（状态码 200）
   - 检查返回的数据

## 🔧 快速修复脚本

如果上面的步骤太复杂，直接在 SQL Editor 中运行这个：

```sql
-- 一键修复脚本
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 获取 user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'yufeng@altes.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ 用户不存在：yufeng@altes.com';
  END IF;

  -- 确认邮箱
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_user_id;

  -- 创建或更新 profile
  INSERT INTO public.profiles (id, email, user_role)
  VALUES (v_user_id, 'yufeng@altes.com', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET user_role = 'admin',
      email = 'yufeng@altes.com';

  -- 验证
  RAISE NOTICE '✅ 修复完成！';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '请退出登录，清除缓存，然后重新登录';
END $$;

-- 验证结果
SELECT 
  p.email,
  p.user_role,
  u.email_confirmed_at,
  CASE 
    WHEN p.user_role = 'admin' THEN '✅ 角色正确'
    ELSE '❌ 角色错误'
  END as role_status,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ 邮箱已确认'
    ELSE '❌ 邮箱未确认'
  END as email_status
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'yufeng@altes.com';
```

## 🎯 预期结果

执行修复脚本后，应该看到：
```
✅ 角色正确
✅ 邮箱已确认
```

然后：
1. 退出登录
2. 清除浏览器缓存
3. 重新登录
4. 访问 http://localhost:8080/merchant
5. 应该能看到商家后台界面

## 🆘 如果还是不行

请提供以下信息：

1. **诊断脚本的输出**（所有 7 个查询的结果）
2. **浏览器 F12 Console 的错误信息**
3. **浏览器 F12 Network 标签页中对 profiles 的请求详情**

这样我可以更准确地定位问题。
