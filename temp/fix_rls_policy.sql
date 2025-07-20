-- =================================================================
-- 步骤 1: 授予基础表级权限 (关键修复)
-- =================================================================
-- 为 'authenticated' (已登录) 角色授予权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON TABLE public.terms TO authenticated;
GRANT SELECT ON TABLE public.categories TO authenticated;

-- 为 'anon' (匿名) 角色授予权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.terms TO anon;
GRANT SELECT ON TABLE public.categories TO anon;


-- =================================================================
-- 步骤 2: 设置行级安全 (RLS) 策略
-- =================================================================

-- 确保相关表已启用 RLS
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 'terms' 表的策略
-- 1. 允许所有人读取所有词条
DROP POLICY IF EXISTS "Allow public read access to all terms" ON public.terms;
CREATE POLICY "Allow public read access to all terms"
ON public.terms FOR SELECT USING (true);

-- 2. 允许登录用户插入他们自己的词条
DROP POLICY IF EXISTS "Allow authenticated users to insert their own terms" ON public.terms;
CREATE POLICY "Allow authenticated users to insert their own terms"
ON public.terms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- 3. 允许用户更新他们自己的词条
DROP POLICY IF EXISTS "Allow users to update their own terms" ON public.terms;
CREATE POLICY "Allow users to update their own terms"
ON public.terms FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- 4. 允许用户删除他们自己的词条
DROP POLICY IF EXISTS "Allow users to delete their own terms" ON public.terms;
CREATE POLICY "Allow users to delete their own terms"
ON public.terms FOR DELETE TO authenticated USING (auth.uid() = created_by);
>>>>>>> REPLACE

-- 'categories' 表的策略
-- 1. 允许所有人读取所有分类
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories"
ON public.categories FOR SELECT USING (true);
