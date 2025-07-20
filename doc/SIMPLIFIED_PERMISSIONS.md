# 用户权限系统简化说明

## 简化前的问题
- 复杂的角色权限系统（user/contributor/admin）
- 复杂的RLS策略导致各种权限错误
- 用户体验不一致，权限检查逻辑分散

## 简化后的方案
所有用户都是**admin类型**，具备完整的增删查改权限。

## 主要变更

### 1. 前端代码变更
- **认证Store** (`stores/auth.ts`)：
  - 移除 `role` 字段和相关逻辑
  - 移除 `isAdmin`、`isContributor` 计算属性
  - 简化用户注册和登录逻辑

- **类型定义** (`types/index.ts`)：
  - 简化 `User` 接口，移除 `role`、`reputation`、`contribution_count` 字段

- **组件更新**：
  - `AppHeader.vue`：移除基于角色的条件渲染
  - `UserProfile.vue`：移除角色显示，简化统计信息

### 2. 数据库变更
执行 `doc/simplified_database_schema.sql` 脚本：

- **用户表简化**：
  ```sql
  -- 移除复杂字段
  ALTER TABLE users DROP COLUMN IF EXISTS role;
  ALTER TABLE users DROP COLUMN IF EXISTS reputation;
  ALTER TABLE users DROP COLUMN IF EXISTS contribution_count;
  ```

- **RLS策略简化**：
  - 认证用户对所有表都有完整的CRUD权限
  - 移除复杂的基于角色的权限检查

### 3. 新的权限模型
```
认证用户 = 管理员权限
- ✅ 查看所有术语
- ✅ 添加新术语
- ✅ 编辑任何术语
- ✅ 删除任何术语
- ✅ 管理分类
```

## 如何应用变更

1. **前端代码**：已完成更新，无需额外操作

2. **数据库迁移**：
   ```bash
   # 在Supabase SQL Editor中执行
   \i doc/simplified_database_schema.sql
   ```

3. **测试验证**：
   - 用户注册/登录流程
   - 术语的增删查改操作
   - 确认没有权限错误

## 优势
- ✅ 大幅减少权限相关的错误
- ✅ 简化用户体验
- ✅ 更容易维护和调试
- ✅ 减少代码复杂度

## 注意事项
- 所有注册用户都有管理员权限
- 如需要用户权限区分，可在未来重新引入简化的权限系统
- 当前重点是确保功能稳定性和用户体验