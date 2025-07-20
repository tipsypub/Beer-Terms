-- 专门修复DELETE权限的SQL脚本

-- 1. 先删除可能存在的DELETE策略
DROP POLICY IF EXISTS "Allow authenticated users to delete terms" ON terms;
DROP POLICY IF EXISTS "terms_delete_policy" ON terms;

-- 2. 创建新的DELETE策略
CREATE POLICY "terms_delete_policy" 
ON terms FOR DELETE 
TO authenticated 
USING (true);

-- 3. 验证DELETE策略是否创建成功
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'terms' AND cmd = 'DELETE';

-- 4. 如果上面还不行，尝试更宽松的策略
-- DROP POLICY IF EXISTS "terms_delete_policy" ON terms;
-- CREATE POLICY "terms_delete_policy" 
-- ON terms FOR ALL 
-- TO authenticated 
-- USING (true) 
-- WITH CHECK (true);