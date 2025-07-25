# Beer-Terms 项目规则

## 文件组织规则

为了保持项目整洁和可维护性，所有文件必须按照以下规则进行组织：

### 📁 文件夹结构

```
Beer-Terms/
├── doc/                    # 文档文件夹
├── test/                   # 测试文件夹
├── temp/                   # 临时文件夹
├── beer-terms-dictionary/  # 主项目代码
├── node_modules/          # 依赖包（自动生成）
├── .git/                  # Git仓库（自动生成）
└── [配置文件]             # 项目根配置文件
```

### 📋 文件分类规则

#### 1. doc/ - 文档文件夹
**存放所有项目文档，包括但不限于：**
- 项目计划文档（.md）
- 设计方案文档（.md）
- API文档（.md）
- 技术规范文档（.md）
- 会议纪要（.md）
- 用户手册（.md）
- 架构说明文档（.md）

#### 2. test/ - 测试文件夹
**存放所有测试相关文件，包括但不限于：**
- 单元测试文件（.js, .ts, .py）
- 集成测试文件
- API测试文件
- 测试配置文件
- 测试数据文件
- 测试报告

#### 3. temp/ - 临时文件夹
**存放临时文件和实验性文件，包括但不限于：**
- 临时HTML演示文件
- 实验性代码片段
- 临时数据文件
- 草稿文件
- 缓存文件
- 一次性使用的脚本

#### 4. 根目录保留文件
**以下文件可以保留在项目根目录：**
- `.gitignore` - Git忽略配置
- `.env` - 环境变量配置
- `package.json` - Node.js项目配置
- `package-lock.json` - 依赖锁定文件
- 其他必要的配置文件

### 🚫 禁止事项

1. **禁止**在根目录直接创建文档文件（.md文件）
2. **禁止**在根目录直接创建测试文件（test-*.js等）
3. **禁止**在根目录存放临时演示文件
4. **禁止**跨文件夹存放不相关类型的文件

### ✅ 最佳实践

1. **创建新文件时**，先考虑文件类型，再选择对应文件夹
2. **文档文件**统一使用 `.md` 格式，存放在 `doc/` 文件夹
3. **测试文件**使用 `test-` 前缀命名，存放在 `test/` 文件夹
4. **临时文件**定期清理，避免长期堆积
5. **定期审查**文件夹内容，确保分类正确

### 📅 维护计划

- **每周检查**：清理temp文件夹中的过期临时文件
- **每月审查**：检查各文件夹分类是否正确
- **版本发布前**：确保所有文件都在正确位置

---

**创建日期：** 2025年7月16日  
**最后更新：** 2025年7月16日  
**维护者：** 项目开发团队
