# 啤酒术语词典 UI 设计方案

## 设计概述

基于现代化简洁布局的响应式设计，采用白色和橙色主题配色，为双语啤酒术语词典提供清晰、友好的用户体验。采用Tailwind CSS实现快速开发和一致的设计语言。

## 配色方案

### 主色调
- **主橙色**: `#f97316` (orange-500) - 主要按钮、链接、强调元素
- **次橙色**: `#fb923c` (orange-400) - 悬停状态、次要强调
- **深橙色**: `#ea580c` (orange-600) - 激活状态、重要警告

### 辅助色
- **纯白色**: `#ffffff` - 主要背景
- **浅灰色**: `#f9fafb` (gray-50) - 次要背景、卡片背景
- **中灰色**: `#e5e7eb` (gray-200) - 边框、分割线
- **深灰色**: `#111827` (gray-900) - 主要文字
- **淡灰色**: `#6b7280` (gray-500) - 次要文字

### 状态色
- **成功绿**: `#10b981` (emerald-500) - 成功提示、审核通过
- **警告黄**: `#f59e0b` (amber-500) - 警告提示、待审核
- **错误红**: `#ef4444` (red-500) - 错误提示、审核拒绝
- **信息蓝**: `#3b82f6` (blue-500) - 信息提示、帮助文档

## 布局结构

### 实际实现的布局结构
基于demo-well.html的实际实现，采用三栏布局：

```
┌─────────────────────────────────────────────────────────────┐
│                     Header (固定顶部)                       │
│  Logo + 搜索框 + 用户菜单                                   │
├─────────────┬─────────────────────────────┬─────────────────┤
│             │                             │                 │
│   左侧栏    │         主内容区域         │     右侧栏     │
│  (256px)    │        (flex-1)             │    (320px)      │
│             │                             │                 │
│ - 分类导航   │   - 术语列表                │  - 搜索筛选    │
│ - 图标+文字  │   - 分页导航                │  - 热门标签    │
│             │                             │  - 我的贡献    │
│             │                             │                 │
└─────────────┴─────────────────────────────┴─────────────────┘
```

### 响应式调整
- **移动端**: 侧边栏可能会折叠或转换为底部导航
- **平板端**: 右侧栏可能会合并到主内容区域
- **桌面端**: 保持完整的三栏布局

## 核心组件设计

### 1. Header 组件
基于demo-well.html的实际实现：

```html
<header class="bg-white border-b border-gray-200 sticky top-0 z-50">
  <div class="px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Logo区域 -->
      <div class="flex items-center space-x-4">
        <div class="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <i class="ri-beer-line text-white text-lg"></i>
        </div>
        <h1 class="text-xl font-bold text-gray-900">啤酒术语词典</h1>
      </div>
      
      <!-- 搜索框 (中间) -->
      <div class="flex-1 max-w-md mx-8">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="ri-search-line text-gray-400"></i>
          </div>
          <input type="text" placeholder="搜索术语..." 
                 class="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white">
        </div>
      </div>
      
      <!-- 用户菜单 -->
      <div class="flex items-center space-x-4">
        <div class="relative">
          <div class="w-8 h-8 flex items-center justify-center">
            <i class="ri-notification-line text-gray-600 text-lg"></i>
          </div>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
        <div class="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
          <img src="[用户头像]" alt="用户头像" class="w-full h-full object-cover">
        </div>
      </div>
    </div>
  </div>
</header>
```

### 2. 左侧导航栏
基于demo-well.html的实际实现：

```html
<aside class="w-64 bg-white border-r border-gray-200 flex-shrink-0">
  <div class="p-6">
    <nav class="space-y-2">
      <!-- 分类按钮 -->
      <button class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
        <span>历史文化</span>
        <i class="ri-history-line text-gray-400"></i>
      </button>
      <button class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
        <span>酿造原料</span>
        <i class="ri-plant-line text-gray-400"></i>
      </button>
      <button class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
        <span>酿造设备</span>
        <i class="ri-tools-line text-gray-400"></i>
      </button>
      <button class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
        <span>啤酒风格</span>
        <i class="ri-goblet-line text-gray-400"></i>
      </button>
    </nav>
  </div>
</aside>
```

**设计特点：**
- 简洁的分类导航，每个分类配有相关图标
- 使用Remix Icon图标库
- 悬停效果：`hover:bg-gray-100`
- 固定宽度：`w-64` (256px)
- 与主内容区域用边框分隔：`border-r border-gray-200`

### 3. 主内容区域
基于demo-well.html的实际实现：

```html
<main class="flex-1 p-6">
  <div class="max-w-4xl">
    <!-- 标题和添加按钮 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">术语列表</h2>
        <p class="text-sm text-gray-600 mt-1">共 <span class="text-primary font-semibold">156</span> 个术语</p>
      </div>
      <button class="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-button hover:bg-orange-600 transition-colors">
        <i class="ri-add-line"></i>
        <span>贡献术语</span>
      </button>
    </div>
    
    <!-- 术语列表 -->
    <div class="space-y-6">
      <!-- 术语条目 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Ale</h3>
            <h4 class="text-primary font-medium mt-1">艾尔啤酒</h4>
          </div>
          <div class="flex items-center space-x-3">
            <button class="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
              <i class="ri-eye-line"></i>
              <span class="text-sm">查看</span>
            </button>
            <button class="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
              <i class="ri-edit-line"></i>
              <span class="text-sm">编辑</span>
            </button>
          </div>
        </div>
        <p class="text-gray-700 mb-4">使用上发酵酵母在相对较高温度下发酵的啤酒类型...</p>
        <div class="flex flex-wrap gap-2">
          <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">啤酒风格</span>
          <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">发酵</span>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="flex items-center justify-between mt-8">
      <p class="text-sm text-gray-600">显示第 1 到 10 项，共 156 项</p>
      <div class="flex items-center space-x-2">
        <button class="w-8 h-8 flex items-center justify-center bg-primary text-white rounded">1</button>
        <button class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">2</button>
      </div>
    </div>
  </div>
</main>
```

**设计特点：**
- 卡片式设计，每个术语独立展示
- 双语标题：英文术语 + 中文术语
- 简洁的操作按钮（查看、编辑）
- 标签系统显示分类信息
- 清晰的分页导航

### 4. 右侧栏组件
基于demo-well.html的实际实现：

```html
<aside class="w-80 bg-white border-l border-gray-200 p-6 flex-shrink-0">
  <!-- 搜索筛选 -->
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">搜索筛选</h3>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">排序</label>
        <div class="relative">
          <button class="w-full px-3 py-2 bg-gray-100 border-none rounded-lg text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between">
            <span>按名称</span>
            <i class="ri-arrow-down-s-line text-gray-400"></i>
          </button>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">语言</label>
        <div class="space-y-2">
          <label class="flex items-center">
            <div class="w-4 h-4 bg-primary border-2 border-primary rounded-sm flex items-center justify-center">
              <i class="ri-check-line text-white text-xs"></i>
            </div>
            <span class="ml-2 text-sm text-gray-700">中文</span>
          </label>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 热门标签 -->
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">热门标签</h3>
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700">发酵</span>
        <span class="text-sm text-gray-500">(45)</span>
      </div>
    </div>
  </div>
  
  <!-- 我的贡献 -->
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4">我的贡献</h3>
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700">贡献次数</span>
        <span class="text-lg font-bold text-primary">23</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700">用户角色</span>
        <span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">贡献者</span>
      </div>
    </div>
  </div>
</aside>
```

**设计特点：**
- 固定宽度：`w-80` (320px)
- 三个主要功能区域：搜索筛选、热门标签、我的贡献
- 自定义复选框设计
- 角色标签采用彩色背景
- 统计数据突出显示

## 技术实现细节

### Tailwind CSS 配置
```javascript
// tailwind.config.js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#f97316',    // orange-500
        secondary: '#fb923c'   // orange-400
      },
      borderRadius: {
        'button': '8px'
      }
    }
  }
}
```

### 图标库
- **使用**: Remix Icon (`ri-*`)
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css`
- **常用图标**:
  - `ri-beer-line` - 啤酒图标
  - `ri-search-line` - 搜索图标
  - `ri-notification-line` - 通知图标
  - `ri-history-line` - 历史图标
  - `ri-plant-line` - 植物图标
  - `ri-tools-line` - 工具图标
  - `ri-goblet-line` - 酒杯图标

### 交互功能
1. **导航切换**: 左侧栏分类按钮点击切换
2. **复选框**: 自定义样式的复选框组件
3. **搜索**: 实时搜索功能
4. **分页**: 数字分页导航
5. **悬停效果**: 按钮和卡片的悬停状态

## 响应式设计策略

### 断点设置
基于Tailwind CSS的断点系统：
- **移动端**: `< 768px`
- **平板端**: `768px - 1023px`
- **桌面端**: `≥ 1024px`

### 响应式调整建议
1. **移动端**: 
   - 左侧栏折叠为汉堡菜单
   - 右侧栏内容合并到主内容区域
   - 搜索框移至顶部
   - 术语卡片堆叠布局

2. **平板端**:
   - 保持左侧栏，右侧栏内容可能需要折叠
   - 术语卡片保持网格布局
   - 适中的间距和字体大小

3. **桌面端**:
   - 完整三栏布局
   - 固定侧边栏
   - 丰富的交互效果

## 设计规范总结

### 间距系统
- **页面内边距**: `p-6` (24px)
- **组件间距**: `space-y-6` (24px)
- **元素间距**: `space-x-4` (16px)
- **卡片内边距**: `p-6` (24px)

### 字体层级
- **主标题**: `text-2xl font-bold` (24px)
- **次标题**: `text-lg font-semibold` (18px)
- **正文**: `text-sm` (14px)
- **小字**: `text-xs` (12px)

### 边框和圆角
- **卡片边框**: `border border-gray-200`
- **圆角**: `rounded-lg` (8px)
- **按钮圆角**: `rounded-button` (8px)

### 状态样式
- **悬停**: `hover:bg-gray-100`
- **焦点**: `focus:ring-2 focus:ring-primary`
- **激活**: `bg-primary text-white`

这个UI设计方案基于实际demo的实现，提供了现代化、简洁的用户界面，采用Tailwind CSS确保了一致的设计语言和良好的可维护性。