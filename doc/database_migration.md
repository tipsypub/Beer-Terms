# 数据库迁移与修复指南

## 背景

为了解决本地 Supabase 环境的访问问题，我们采取了将所有表迁移到 `public` schema 并重建权限的策略。

## 最终修复步骤

请严格按照以下步骤操作，这将解决所有已知问题。

### 步骤 1: (如果尚未完成) 迁移表到 `public` Schema

如果你之前已经成功将表移动到 `public` schema，可以跳过此 `ALTER TABLE` 部分。

```sql
-- 将表从 'beer_terms' 移动到 'public' schema
ALTER TABLE beer_terms.terms SET SCHEMA public;
ALTER TABLE beer_terms.categories SET SCHEMA public;

-- (可选) 删除现在已经为空的 'beer_terms' schema
DROP SCHEMA IF EXISTS beer_terms CASCADE;
```

### 步骤 2: (关键) 重新创建 RLS 策略

这是解决词条数据无法显示问题的核心。请**完整地**、**再次**执行以下 SQL 脚本。

```sql
-- 1. 为 'public.categories' 表配置 RLS
-- 确保 RLS 已启用
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- 强制删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
-- 创建新的、明确的公共读取策略
CREATE POLICY "Allow public read access to categories"
ON public.categories
FOR SELECT
TO anon
USING (true);

-- 2. 为 'public.terms' 表配置 RLS
-- 确保 RLS 已启用
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
-- 强制删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow public read access to terms" ON public.terms;
-- 创建新的、明确的公共读取策略
CREATE POLICY "Allow public read access to terms"
ON public.terms
FOR SELECT
TO anon
USING (true);
```

### 步骤 3: (如果尚未完成) 重新生成 TypeScript 类型

在数据库结构和 RLS 策略最终确定后，重新生成类型以确保代码与数据库同步。

```bash
# 在你的项目根目录中运行
supabase gen types typescript --project-id <your-project-id> > beer-terms-dictionary/src/types/supabase.ts
```

---

执行完以上所有步骤，特别是**步骤 2**，你的应用应该可以正常工作了。
