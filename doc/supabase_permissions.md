# Supabase 数据库权限与 Schema 暴露修复指南 (本地与云端)

## 问题描述

应用在访问 `beer_terms` schema 下的表时，收到 `406 (Not Acceptable)` 或 `PGRST106` 错误。此外，TypeScript 可能会报告类型错误，如 `模块“"../types/supabase"”没有导出的成员“Database”`。

这表明存在多个问题：
1.  **Schema 未暴露** (`PGRST106` 错误)。
2.  **行级安全策略 (RLS)** 未配置 (`406` 错误)。
3.  **TypeScript 类型与数据库不匹配** (TS 错误)。

## 解决方案

请严格按顺序完成以下所有步骤，以确保完全解决问题。

---

### 方案一：本地部署 (Local Development)

**步骤 1: 重新生成 TypeScript 类型 (关键)**

这是解决 TypeScript 错误和确保类型安全的第一步。

1.  在你的 Supabase 项目的根目录中，运行以下命令：

    ```bash
    # 确保你已登录
    supabase login

    # 生成类型，指向你的项目 ID
    # 你可以在 Supabase 项目的 URL 中找到 project-id
    # 例如：https://app.supabase.com/project/your-project-id
    supabase gen types typescript --project-id <your-project-id> --schema beer_terms > beer-terms-dictionary/src/types/supabase.ts
    ```

    *注意：请将 `<your-project-id>` 替换为你的实际项目 ID。*

**步骤 2: 找到并修改 `config.toml` (暴露 Schema)**

1.  在你本地 Supabase 项目的根目录下，找到 `supabase/config.toml` 文件。
2.  在 `[api]` 部分，将 `beer_terms` 添加到 `extra_search_path` 字段中。

    ```toml
    [api]
    # ...
    extra_search_path = ["public", "beer_terms"]
    ```

**步骤 3: 重启 Supabase 服务**

1.  在终端中，进入你的 Supabase 项目根目录，运行以下命令：

    ```bash
    supabase stop
    supabase start
    ```

**步骤 4: 授予数据库权限**

1.  通过 SQL Editor 或 `psql` 连接到本地数据库，执行以下命令：

    ```sql
    GRANT USAGE ON SCHEMA beer_terms TO anon;
    GRANT SELECT ON ALL TABLES IN SCHEMA beer_terms TO anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA beer_terms GRANT SELECT ON TABLES TO anon;
    ```

**步骤 5: 创建行级安全 (RLS) 策略**

1.  在 SQL Editor 中执行以下命令：

    ```sql
    ALTER TABLE beer_terms.categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read access to categories" ON beer_terms.categories;
    CREATE POLICY "Allow public read access to categories"
    ON beer_terms.categories FOR SELECT TO anon USING (true);

    ALTER TABLE beer_terms.terms ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read access to terms" ON beer_terms.terms;
    CREATE POLICY "Allow public read access to terms"
    ON beer_terms.terms FOR SELECT TO anon USING (true);
    ```

---

### 方案二：云端部署 (Cloud Platform)

1.  **生成类型**: 在本地运行**步骤 1** 的 `supabase gen types` 命令。
2.  **暴露 Schema**: 在 **Project Settings > API > Exposed schemas** 中添加 `beer_terms`。
3.  **授予权限**: 在 **SQL Editor** 中执行**步骤 4** 的 SQL 命令。
4.  **创建 RLS 策略**: 在 **SQL Editor** 中执行**步骤 5** 的 SQL 命令。

---

完成所有步骤后，你的应用应该能够成功访问数据，所有错误都将得到解决。
