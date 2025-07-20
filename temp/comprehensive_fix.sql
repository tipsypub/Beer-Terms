-- 全面修复权限和策略问题
-- 在Supabase SQL编辑器中执行

-- 1. 首先检查当前表结构和策略
SELECT tablename, schemaname FROM pg_tables WHERE tablename IN ('terms', 'users', 'categories');

-- 2. 删除所有现有策略，重新开始
DROP POLICY IF EXISTS "Allow authenticated users to select terms" ON terms;
DROP POLICY IF EXISTS "Allow authenticated users to update terms" ON terms;
DROP POLICY IF EXISTS "Allow authenticated users to delete terms" ON terms;
DROP POLICY IF EXISTS "Allow authenticated users to insert terms" ON terms;
DROP POLICY IF EXISTS "terms_select_policy" ON terms;
DROP POLICY IF EXISTS "terms_insert_policy" ON terms;
DROP POLICY IF EXISTS "terms_update_policy" ON terms;
DROP POLICY IF EXISTS "terms_delete_policy" ON terms;

-- 3. 暂时禁用RLS以确保策略重建
ALTER TABLE terms DISABLE ROW LEVEL SECURITY;

-- 4. 重新启用RLS
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

-- 5. 创建最宽松的策略 - 允许所有认证用户进行所有操作
CREATE POLICY "terms_full_access_policy" 
ON terms FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 6. 为users表做同样的处理
DROP POLICY IF EXISTS "Allow authenticated users to select users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON users;

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_full_access_policy" 
ON users FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 7. 为categories表也添加策略（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'categories') THEN
        ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        
        EXECUTE 'DROP POLICY IF EXISTS "categories_full_access_policy" ON categories';
        EXECUTE 'CREATE POLICY "categories_full_access_policy" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true)';
    END IF;
END $$;

-- 8. 验证所有策略
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('terms', 'users', 'categories')
ORDER BY tablename, policyname;

-- 9. 检查表的RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('terms', 'users', 'categories');