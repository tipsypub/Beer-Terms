-- 简化版权限检查脚本
-- 避免复杂的测试，专注于权限状态检查

-- 1. 角色信息检查
SELECT '=== 角色基础信息 ===' as info;
SELECT 
    rolname as role_name,
    rolsuper as is_superuser,
    rolinherit as inherits_privileges,
    rolcanlogin as can_login
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'authenticator')
ORDER BY rolname;

-- 2. 当前会话信息
SELECT '=== 当前会话信息 ===' as info;
SELECT 
    current_user,
    session_user,
    current_setting('role') as current_role;

-- 3. 表权限检查
SELECT '=== 表权限检查 ===' as info;
SELECT 
    grantee as role_name,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('terms', 'users', 'categories')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY table_name, grantee, privilege_type;

-- 4. RLS状态检查
SELECT '=== RLS策略状态 ===' as info;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('terms', 'users', 'categories')
ORDER BY tablename;

-- 5. 现有RLS策略
SELECT '=== 现有RLS策略 ===' as info;
SELECT 
    tablename, 
    policyname, 
    roles,
    cmd as command_type
FROM pg_policies 
WHERE tablename IN ('terms', 'users', 'categories')
ORDER BY tablename, policyname;

-- 6. 检查categories表中的数据（获取有效的category_id）
SELECT '=== Categories数据 ===' as info;
SELECT id, name_zh FROM categories LIMIT 5;

-- 7. 检查是否有任何terms数据
SELECT '=== Terms数据示例 ===' as info;
SELECT id, english_term, chinese_term, category_id FROM terms LIMIT 3;