-- 确保categories表有正确的权限

-- 1. 检查categories表的权限
SELECT 
    grantee as role_name,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'categories'
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY grantee, privilege_type;

-- 2. 确保anon和authenticated角色有categories表的读取权限
GRANT SELECT ON TABLE categories TO anon;
GRANT SELECT ON TABLE categories TO authenticated;
GRANT ALL ON TABLE categories TO authenticated;

-- 3. 验证权限设置
SELECT 
    grantee as role_name,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'categories'
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY grantee, privilege_type;