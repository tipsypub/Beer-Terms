-- 彻底解决权限和约束问题
-- 在Supabase SQL编辑器中执行

-- 第一部分：彻底清空所有RLS策略
DO $$
DECLARE
    pol_name text;
BEGIN
    -- 删除terms表的所有策略
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'terms')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON terms';
    END LOOP;
    
    -- 删除users表的所有策略  
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'users')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON users';
    END LOOP;
    
    -- 删除categories表的所有策略
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON categories';
    END LOOP;
END $$;

-- 第二部分：修改表结构，移除not-null约束（如果需要）
ALTER TABLE terms ALTER COLUMN chinese_explanation DROP NOT NULL;
ALTER TABLE terms ALTER COLUMN english_explanation DROP NOT NULL;
ALTER TABLE terms ALTER COLUMN tags DROP NOT NULL;
ALTER TABLE terms ALTER COLUMN status DROP NOT NULL;
ALTER TABLE terms ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE terms ALTER COLUMN approved_by DROP NOT NULL;
ALTER TABLE terms ALTER COLUMN approved_at DROP NOT NULL;

-- 第三部分：完全禁用RLS然后重新启用
ALTER TABLE terms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 重新启用RLS
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 第四部分：创建最简单的策略 - 允许所有用户（包括匿名用户）进行所有操作
CREATE POLICY "allow_all_terms" ON terms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- 第五部分：设置默认值
ALTER TABLE terms ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE terms ALTER COLUMN tags SET DEFAULT '';
ALTER TABLE terms ALTER COLUMN chinese_explanation SET DEFAULT '';
ALTER TABLE terms ALTER COLUMN english_explanation SET DEFAULT '';

-- 第六部分：验证设置
SELECT 'Current RLS policies:' as info;
SELECT tablename, policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename IN ('terms', 'users', 'categories')
ORDER BY tablename, policyname;

SELECT 'Table constraints:' as info;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('terms', 'users', 'categories')
    AND tc.constraint_type IN ('NOT NULL', 'CHECK')
ORDER BY tc.table_name, tc.constraint_name;