# 权限问题修复指南

## 问题描述
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
403 (Forbidden) - Delete failed
```

## 修复步骤

### 1. 立即执行数据库脚本
在Supabase SQL Editor中执行以下脚本：

```sql
-- 复制粘贴 doc/simplified_database_schema.sql 的全部内容
```

### 2. 清除浏览器缓存
- 打开开发者工具 (F12)
- Application → Storage → Clear Site Data
- 或者使用无痕模式重新测试

### 3. 重新登录测试
- 退出当前账户
- 重新注册或登录
- 测试术语的增删查改功能

## 修复原理

### 认证问题修复
- 添加了自动token刷新监听器
- 改进了session处理逻辑
- 增强了错误恢复机制

### 权限问题修复
- 简化RLS策略为最基本的认证/未认证区分
- 移除所有复杂的角色权限检查
- 认证用户获得所有操作权限

### 数据库策略简化
```sql
-- 术语表：所有人可查看，认证用户全权限
CREATE POLICY "terms_select_policy" ON terms FOR SELECT USING (true);
CREATE POLICY "terms_all_policy" ON terms FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

## 验证修复
执行脚本后，以下功能应该正常工作：
- ✅ 用户注册/登录
- ✅ 查看术语列表
- ✅ 添加新术语
- ✅ 编辑术语
- ✅ 删除术语
- ✅ Token自动刷新

## 如果仍有问题
1. 检查Supabase项目的RLS设置
2. 确认脚本已完全执行
3. 清除所有浏览器数据重试
4. 检查网络和CORS配置