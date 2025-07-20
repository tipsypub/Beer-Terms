-- Supabase权限全面诊断脚本
-- 用于排查anon key和authenticated角色的权限问题

-- ==========================================
-- 1. 基础角色信息检查
-- ==========================================
SELECT '=== 角色基础信息 ===' as info;
SELECT 
    rolname as role_name,
    rolsuper as is_superuser,
    rolinherit as inherits_privileges,
    rolcreaterole as can_create_roles,
    rolcreatedb as can_create_db,
    rolcanlogin as can_login,
    rolreplication as can_replicate
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'authenticator')
ORDER BY rolname;

-- ==========================================
-- 2. 当前会话信息
-- ==========================================
SELECT '=== 当前会话信息 ===' as info;
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role,
    inet_client_addr() as client_ip,
    inet_server_addr() as server_ip;

-- ==========================================
-- 3. 表权限检查
-- ==========================================
SELECT '=== 表权限检查 ===' as info;
SELECT 
    grantee as role_name,
    table_schema,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name IN ('terms', 'users', 'categories')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY table_name, grantee, privilege_type;

-- ==========================================
-- 4. RLS策略状态检查
-- ==========================================
SELECT '=== RLS策略状态 ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('terms', 'users', 'categories')
ORDER BY tablename;

-- ==========================================
-- 5. 现有RLS策略详情
-- ==========================================
SELECT '=== 现有RLS策略 ===' as info;
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd as command_type,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('terms', 'users', 'categories')
ORDER BY tablename, policyname;

-- ==========================================
-- 6. 模拟不同角色的权限测试
-- ==========================================
SELECT '=== 权限测试开始 ===' as info;

-- 测试anon角色权限
SELECT '--- 测试anon角色 ---' as test_stage;
SET ROLE anon;
DO $$
BEGIN
    -- 测试SELECT权限
    BEGIN
        PERFORM count(*) FROM terms;
        RAISE NOTICE 'anon SELECT权限: 正常';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'anon SELECT权限: 失败 - %', SQLERRM;
    END;
    
    -- 测试INSERT权限
    BEGIN
        INSERT INTO terms (english_term, chinese_term, category_id) 
        VALUES ('test_anon', 'test_anon', '00000000-0000-0000-0000-000000000001');
        RAISE NOTICE 'anon INSERT权限: 正常';
        -- 清理测试数据
        DELETE FROM terms WHERE english_term = 'test_anon';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'anon INSERT权限: 失败 - %', SQLERRM;
    END;
END $$;

-- 测试authenticated角色权限
SELECT '--- 测试authenticated角色 ---' as test_stage;
SET ROLE authenticated;
DO $$
BEGIN
    -- 测试SELECT权限
    BEGIN
        PERFORM count(*) FROM terms;
        RAISE NOTICE 'authenticated SELECT权限: 正常';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'authenticated SELECT权限: 失败 - %', SQLERRM;
    END;
    
    -- 测试INSERT权限
    BEGIN
        INSERT INTO terms (english_term, chinese_term, category_id) 
        VALUES ('test_auth', 'test_auth', '00000000-0000-0000-0000-000000000001');
        RAISE NOTICE 'authenticated INSERT权限: 正常';
        -- 清理测试数据
        DELETE FROM terms WHERE english_term = 'test_auth';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'authenticated INSERT权限: 失败 - %', SQLERRM;
    END;
END $$;

-- 恢复默认角色
RESET ROLE;
SELECT '=== 权限测试完成 ===' as info;

-- ==========================================
-- 7. 检查序列权限
-- ==========================================
SELECT '=== 序列权限检查 ===' as info;
SELECT 
    grantee,
    object_schema,
    object_name,
    privilege_type
FROM information_schema.usage_privileges 
WHERE object_name LIKE '%_id_seq'
    AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY object_name, grantee;

-- ==========================================
-- 8. 检查函数权限
-- ==========================================
SELECT '=== 函数权限检查 ===' as info;
SELECT 
    grantee,
    routine_schema,
    routine_name,
    privilege_type
FROM information_schema.routine_privileges 
WHERE grantee IN ('anon', 'authenticated', 'service_role')
    AND routine_schema = 'public'
ORDER BY routine_name, grantee;

-- ==========================================
-- 9. 数据库连接和配置检查
-- ==========================================
SELECT '=== 数据库配置检查 ===' as info;
SELECT name, setting, context FROM pg_settings WHERE name LIKE '%row_security%';

-- 检查扩展
SELECT '=== 扩展检查 ===' as info;
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

SELECT '=== 诊断完成 ===' as info;