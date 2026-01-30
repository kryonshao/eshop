-- ============================================
-- 修复 has_role 函数的参数名问题
-- 先运行这个脚本，然后再运行 COMPLETE_DATABASE_SETUP.sql
-- ============================================

-- 删除旧的 has_role 函数及其所有依赖的策略
DROP FUNCTION IF EXISTS public.has_role(text, uuid) CASCADE;

-- 重新创建 has_role 函数（使用正确的参数名）
CREATE FUNCTION public.has_role(required_role TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND user_role = required_role
  );
END;
$$;

-- 提示信息
DO $$
BEGIN
  RAISE NOTICE '✅ has_role 函数已重新创建';
  RAISE NOTICE '📝 现在请运行 COMPLETE_DATABASE_SETUP.sql 来创建所有表和策略';
END $$;
