# 调试指南 - 数据加载问题诊断

## 🔍 现在在控制台中可以看到的调试信息

### 应用启动流程
```
🔧 初始化Supabase客户端...
🔧 Supabase配置检查: {hasUrl: true, hasKey: true, urlDomain: "xxx.supabase.co"}
✅ Supabase客户端初始化完成
🔗 Supabase连接测试: {success: true/false, error: "...", canConnect: true}
🚀 应用启动 - 开始初始化...
🚀 应用挂载完成
```

### 认证流程
```
🔍 开始检查认证状态...
📡 获取Supabase session...
📡 Session请求完成 (XXXms): {hasSession: true/false, hasUser: true/false, error: "...", userId: "..."}
✅ 发现有效session，设置用户状态 / ℹ️ 未发现有效session，用户未登录
👤 用户状态设置完成: {id: "...", email: "...", username: "..."}
✅ 认证初始化完成
🔍 认证状态检查结束
```

### 数据加载流程
```
🚀 开始初始化terms store...
📦 并行执行初始化任务...

🗂️ 开始获取分类列表...
📡 调用TermsService.getCategories()...
🔄 TermsService.getCategories() - 开始查询分类...
🔄 分类查询完成 (XXXms): {success: true/false, errorMessage: "...", dataCount: X, hasData: true/false}

📖 开始分页获取术语...
📡 调用TermsService.getTermsPaginated()...
🔄 TermsService.getTermsPaginated() - 开始分页查询...
🔄 分页查询完成 (XXXms): {success: true/false, errorMessage: "...", dataCount: X, hasData: true/false}

📖 术语状态更新完成: {totalTerms: X, hasMoreTerms: true/false}
✅ terms store初始化完成 (XXXms): {categoriesCount: X, termsCount: X, totalTerms: X, hasError: true/false}
```

### 登录流程
```
🔐 开始登录流程 {email: "..."}
📡 发送登录请求到Supabase...
📡 Supabase登录响应: {success: true/false, error: "...", hasUser: true/false, userId: "..."}
✅ 登录成功，设置用户状态
👤 用户状态已设置: {id: "...", email: "...", username: "..."}
🔐 登录流程结束
```

## 🐛 故障排查步骤

### 1. 检查Supabase连接
查看控制台是否有：
- `🔧 Supabase配置检查` - 确认环境变量正确
- `🔗 Supabase连接测试` - 确认网络连接正常

### 2. 检查数据库权限
如果看到错误信息包含：
- `403 Forbidden` - 数据库RLS策略问题，需要执行数据库脚本
- `row-level security` - 权限策略配置错误
- `JSON object requested` - 查询语法问题

### 3. 检查数据加载
观察以下关键指标：
- `dataCount: 0` - 数据库为空或查询条件错误
- `hasData: false` - 查询返回null/undefined
- `success: false` - 查询执行失败
- `elapsed time > 5000ms` - 网络或服务器响应慢

### 4. 检查认证状态
观察以下状态：
- `hasSession: false` - 用户未登录
- `hasUser: false` - session无效
- `认证检查超时` - 认证服务响应慢

## 🚨 常见问题和解决方案

### 问题1：未登录时无数据
**症状**：控制台显示查询成功但`dataCount: 0`
**解决**：执行数据库脚本确保RLS策略允许未认证用户查看数据

### 问题2：登录卡住
**症状**：登录按钮显示"处理中..."但无进展
**解决**：查看控制台是否有Supabase响应，检查网络连接

### 问题3：数据库连接失败
**症状**：`🔗 Supabase连接测试: {success: false}`
**解决**：检查环境变量、网络连接、Supabase服务状态

## 📋 调试清单

打开浏览器控制台，检查以下项目：

- [ ] Supabase配置检查通过
- [ ] Supabase连接测试成功
- [ ] 应用初始化完成
- [ ] 术语查询返回数据
- [ ] 分类查询返回数据
- [ ] 认证状态检查正常（如需登录）

如果任何步骤失败，查看具体错误信息进行排查。