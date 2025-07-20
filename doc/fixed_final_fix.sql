-- 修复版本：最终权限修复方案
-- 在Supabase SQL编辑器中执行

-- 1. 完全禁用RLS
ALTER TABLE terms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;  
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有策略（确保清理干净）
DROP POLICY IF EXISTS "allow_all_terms" ON terms;
DROP POLICY IF EXISTS "allow_all_users" ON users;
DROP POLICY IF EXISTS "allow_all_categories" ON categories;
DROP POLICY IF EXISTS "full_access_terms" ON terms;

-- 3. 直接授予权限给authenticated角色
GRANT ALL ON TABLE terms TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE categories TO authenticated;  -- 修复：这里应该是authenticated，不是categories

-- 4. 也授予权限给anon角色（用于非登录用户）
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE terms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE categories TO anon;

-- 5. 授予权限给service_role
GRANT ALL ON TABLE terms TO service_role;
GRANT ALL ON TABLE users TO service_role;
GRANT ALL ON TABLE categories TO service_role;

-- 6. 验证权限授予
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('terms', 'users', 'categories')
    AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee;