# Readdy AI Editor - MVP

一个基于Vue 3 + TypeScript的AI驱动Markdown编辑器。

## 项目概述

这是Readdy AI Editor的MVP版本，包含以下核心功能：

- 📝 Markdown编辑器（基于Monaco Editor）
- 🤖 AI写作助手（支持多种AI模型）
- 📁 文件管理系统
- 👀 实时预览功能
- 💾 本地数据存储

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI框架**: TailwindCSS
- **编辑器**: Monaco Editor
- **状态管理**: Pinia
- **Markdown渲染**: markdown-it
- **数据存储**: IndexedDB (Dexie)
- **代码规范**: ESLint + Prettier

## 开发环境

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖
```bash
npm install
```

### 开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建
```bash
npm run preview
```

### 代码格式化
```bash
npm run format
```

### 代码检查
```bash
npm run lint
npm run lint:fix
```

## 项目结构

```
src/
├── components/          # Vue组件
│   ├── Editor/         # 编辑器相关组件
│   ├── FileTree/       # 文件树组件
│   ├── ChatPanel/      # AI聊天面板
│   └── Layout/         # 布局组件
├── stores/             # Pinia状态管理
├── services/           # 业务服务
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
└── assets/             # 静态资源
```

## 功能特性

### 已完成 ✅
- [x] 项目脚手架搭建
- [x] 基础UI布局（三栏布局）
- [x] 文件树组件
- [x] AI聊天面板
- [x] 基础编辑器功能
- [x] 简单Markdown预览
- [x] 响应式设计

### 开发中 🚧
- [ ] Monaco Editor集成
- [ ] 完整Markdown渲染
- [ ] 文件系统操作
- [ ] AI服务集成
- [ ] IndexedDB存储

### 计划开发 📋
- [ ] 多AI模型支持
- [ ] 语法高亮
- [ ] 实时同步
- [ ] 导入导出功能
- [ ] 主题切换

## 开发进度

按照开发计划，当前已完成 **Phase 1: 基础架构搭建**

- ✅ Step 1: 项目初始化和脚手架搭建
- ✅ Step 2: 开发环境配置
- ✅ Step 3: 核心依赖安装和配置
- ✅ Step 4: 项目目录结构设计
- ✅ Step 5: 基础UI布局组件开发

下一步将进入 **Phase 2: 核心功能开发**

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License