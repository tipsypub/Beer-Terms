-- 检查数据库级别的权限问题
-- 在Supabase SQL编辑器中执行

-- 1. 检查当前RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('terms', 'users', 'categories');

-- 2. 检查当前策略
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

-- 3. 检查表权限
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('terms', 'users', 'categories')
ORDER BY table_name, grantee;

-- 4. 检查authenticator和anon角色权限
SELECT 
    r.rolname,
    r.rolsuper,
    r.rolinherit,
    r.rolcreaterole,
    r.rolcreatedb,
    r.rolcanlogin,
    r.rolreplication
FROM pg_roles r 
WHERE r.rolname IN ('authenticator', 'anon', 'authenticated', 'service_role');

-- 5. 检查特定记录是否存在
SELECT id, english_term, created_by FROM terms WHERE id = '6e1b4ae7-6004-4201-9448-7d2b8a29e4a2';