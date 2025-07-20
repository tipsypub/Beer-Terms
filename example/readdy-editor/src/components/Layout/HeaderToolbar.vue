<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm relative z-50">
    <!-- 左侧：Logo和项目 -->
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-2">
        <div
          class="w-8 h-8 bg-gradient-to-br from-primary to-ai rounded-lg flex items-center justify-center"
        >
          <i class="ri-quill-pen-fill text-white"></i>
        </div>
        <h1 class="font-semibold text-lg">Readdy AI</h1>
      </div>
      <div class="h-5 w-px bg-gray-300"></div>
      <span class="text-sm text-gray-600">{{ currentProjectName }}</span>
    </div>

    <!-- 中间：工具栏 -->
    <div class="flex-1 flex items-center justify-center space-x-2 relative z-10">
      <!-- 保留空间用于未来功能 -->
    </div>

    <!-- 右侧：Gemini AI 状态和控制按钮 -->
    <div class="flex items-center space-x-2">
      <div
        class="flex items-center space-x-2 bg-gradient-to-r from-ai to-primary text-white px-3 py-1.5 rounded"
      >
        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
        <i class="ri-google-fill"></i>
        <span class="text-sm font-medium">{{ selectedModel }}</span>
      </div>
      
      <!-- 控制按钮组 -->
      <div class="flex items-center space-x-1">
        <button
          class="w-8 h-8 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          @click="handleToggleSidebar"
          title="收起/展开侧边栏"
        >
          <i class="ri-layout-left-line text-gray-600"></i>
        </button>
        <button
          class="w-8 h-8 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          @click="handleToggleChat"
          title="收起/展开AI对话"
        >
          <i class="ri-chat-3-line text-gray-600"></i>
        </button>
        <button
          class="w-8 h-8 bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          @click="$emit('open-settings')"
          title="系统设置"
        >
          <i class="ri-settings-3-line text-gray-600"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Props
interface Props {
  currentProjectName?: string
}

withDefaults(defineProps<Props>(), {
  currentProjectName: '我的项目',
})

// Emits
const emit = defineEmits<{
  'new-file': []
  'save-file': []
  'model-change': [model: string]
  'open-settings': []
  'toggle-sidebar': []
  'toggle-chat': []
}>()

// Gemini 模型显示
const selectedModel = ref('Gemini 2.5 Flash-Lite Preview')

// 处理侧边栏切换
const handleToggleSidebar = () => {
  console.log('HeaderToolbar: 侧边栏切换按钮被点击')
  emit('toggle-sidebar')
}

// 处理聊天面板切换
const handleToggleChat = () => {
  console.log('HeaderToolbar: 聊天面板切换按钮被点击')
  emit('toggle-chat')
}

// 新建文件功能已移除，现在通过左侧边栏或快捷键操作
</script>
