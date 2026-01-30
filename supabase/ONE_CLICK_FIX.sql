-- ============================================
-- 一键修复脚本 - 确保 yufeng@altes.com 是管理员
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  -- 1. 获取 user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'yufeng@altes.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ 错误：用户 yufeng@altes.com 不存在于 auth.users 表中';
  END IF;

  RAISE NOTICE '✅ 找到用户 ID: %', v_user_id;

  -- 2. 确认邮箱
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_user_id;

  RAISE NOTICE '✅ 邮箱已确认';

  -- 3. 检查 profile 是否存在
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  IF v_profile_exists THEN
    RAISE NOTICE '📝 Profile 已存在，正在更新...';
    
    -- 更新现有 profile
    UPDATE public.profiles
    SET user_role = 'admin',
        email = 'yufeng@altes.com',
        updated_at = NOW()
    WHERE id = v_user_id;
  ELSE
    RAISE NOTICE '📝 Profile 不存在，正在创建...';
    
    -- 创建新 profile
    INSERT INTO public.profiles (id, email, user_role)
    VALUES (v_user_id, 'yufeng@altes.com', 'admin');
  END IF;

  RAISE NOTICE '✅ Profile 设置完成';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 修复完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 下一步操作：';
  RAISE NOTICE '1. 在网站上退出登录';
  RAISE NOTICE '2. 清除浏览器缓存（Ctrl+Shift+Delete）';
  RAISE NOTICE '3. 硬刷新页面（Ctrl+Shift+R）';
  RAISE NOTICE '4. 重新登录 yufeng@altes.com';
  RAISE NOTICE '5. 访问 http://localhost:8080/merchant';
  RAISE NOTICE '';
END $$;

-- 验证结果
SELECT 
  '========================================' as separator,
  '验证结果' as title;

SELECT 
  p.email as "邮箱",
  p.user_role as "角色",
  u.email_confirmed_at as "邮箱确认时间",
  CASE 
    WHEN p.user_role = 'admin' THEN '✅ 正确'
    ELSE '❌ 错误：' || p.user_role
  END as "角色状态",
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ 已确认'
    ELSE '❌ 未确认'
  END as "邮箱状态"
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'yufeng@altes.com';

-- 测试 has_role 函数
SELECT 
  '========================================' as separator,
  '测试 has_role 函数' as title;

SELECT 
  public.has_role('admin', u.id) as "是否是 Admin",
  public.has_role('merchant', u.id) as "是否是 Merchant",
  public.has_role('customer', u.id) as "是否是 Customer"
FROM auth.users u
WHERE u.email = 'yufeng@altes.com';
