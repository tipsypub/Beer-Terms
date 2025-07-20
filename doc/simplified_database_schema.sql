-- 简化的数据库结构脚本
-- 移除复杂的权限系统，所有用户都是admin

-- 1. 首先禁用RLS以避免权限错误
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE terms DISABLE ROW LEVEL SECURITY; 
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 2. 删除现有的复杂权限相关字段
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS reputation;
ALTER TABLE users DROP COLUMN IF EXISTS contribution_count;

-- 3. 重新创建用户表结构（如果需要）
-- 注意：如果表已存在，这将不会重新创建
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- 4. 清除所有现有的RLS策略
DO $$ 
DECLARE
    pol record;
BEGIN
    -- 删除users表的所有策略
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON users';
    END LOOP;
    
    -- 删除terms表的所有策略  
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'terms' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON terms';
    END LOOP;
    
    -- 删除categories表的所有策略
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'categories' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON categories';
    END LOOP;
END $$;

-- 5. 重新启用RLS并创建简化策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 最简化的策略：认证用户可以进行所有操作，未认证用户可以查看
-- 用户表策略
CREATE POLICY "users_policy" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 术语表策略
CREATE POLICY "terms_select_policy" ON terms FOR SELECT USING (true);  -- 所有人可查看
CREATE POLICY "terms_all_policy" ON terms FOR ALL TO authenticated USING (true) WITH CHECK (true);  -- 认证用户全权限

-- 分类表策略  
CREATE POLICY "categories_select_policy" ON categories FOR SELECT USING (true);  -- 所有人可查看
CREATE POLICY "categories_all_policy" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);  -- 认证用户全权限

-- 4. 移除不必要的表（如果存在）
DROP TABLE IF EXISTS user_activities;
DROP TABLE IF EXISTS term_suggestions;

-- 5. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_terms_updated_at ON terms;
CREATE TRIGGER update_terms_updated_at 
  BEFORE UPDATE ON terms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();