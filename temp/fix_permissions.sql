-- 修复权限问题的SQL脚本
-- 在你的Supabase实例中执行这些命令

-- 1. 为terms表添加允许认证用户进行增删改的策略
DROP POLICY IF EXISTS "Allow authenticated users to update terms" ON terms;
DROP POLICY IF EXISTS "Allow authenticated users to delete terms" ON terms;
DROP POLICY IF EXISTS "Allow authenticated users to insert terms" ON terms;

-- 允许认证用户更新术语
CREATE POLICY "Allow authenticated users to update terms" 
ON terms FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 允许认证用户删除术语
CREATE POLICY "Allow authenticated users to delete terms" 
ON terms FOR DELETE 
TO authenticated 
USING (true);

-- 允许认证用户插入术语
CREATE POLICY "Allow authenticated users to insert terms" 
ON terms FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. 为users表添加策略（如果需要）
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON users;

CREATE POLICY "Allow authenticated users to insert users" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update users" 
ON users FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. 确保RLS已启用
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('terms', 'users', 'categories')
ORDER BY tablename, policyname;