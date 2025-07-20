<template>
  <div class="h-screen bg-gray-50 text-gray-900 flex flex-col">
    <!-- 顶部工具栏 -->
    <HeaderToolbar 
      @new-file="handleNewFile"
      @save-file="$emit('save-file')"
      @model-change="$emit('model-change', $event)"
      @open-settings="$emit('open-settings')"
      @toggle-sidebar="toggleSidebar"
      @toggle-chat="toggleChat"
    />

    <!-- 主体内容区 -->
    <main class="relative flex-1 overflow-hidden">
      <!-- 左侧边栏 -->
      <div 
        class="absolute left-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out"
        :class="sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'"
        style="width: 288px;"
      >
        <Sidebar 
          :files="props.files"
          :recent-files="props.recentFiles"
          @create-file="handleNewFile"
          @create-folder="() => emit('create-folder')"
          @file-select="(fileId) => emit('file-select', fileId)"
          @folder-select="(folderId) => emit('folder-select', folderId)"
          @file-delete="(fileId) => emit('file-delete', fileId)"
          @file-rename="(data) => emit('file-rename', data)"
          @file-move="(data) => emit('file-move', data)"
          @toggle-sidebar="toggleSidebar"
        />
      </div>

      <!-- 右侧AI对话区 -->
      <div 
        class="absolute right-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out"
        :class="chatPanelCollapsed ? 'translate-x-full' : 'translate-x-0'"
        style="width: 384px;"
      >
        <ChatPanel :editor-ref="props.editorRef" />
      </div>

      <!-- 中间编辑器区域 -->
      <section 
        class="absolute top-0 bottom-0 flex flex-col bg-white min-h-0 overflow-hidden transition-all duration-300 ease-in-out"
        :style="{
          left: sidebarCollapsed ? '0px' : '288px',
          right: chatPanelCollapsed ? '0px' : '384px'
        }"
      >
        <!-- 侧边栏展开按钮（当侧边栏隐藏时显示） -->
        <button
          v-if="sidebarCollapsed"
          class="absolute left-2 top-4 z-10 w-8 h-8 bg-white border border-gray-300 rounded shadow-md hover:bg-gray-50 flex items-center justify-center"
          @click="toggleSidebar"
        >
          <i class="ri-sidebar-unfold-line text-gray-600"></i>
        </button>
        <!-- 聊天面板展开按钮（当聊天面板隐藏时显示） -->
        <button
          v-if="chatPanelCollapsed"
          class="absolute right-2 top-4 z-10 w-8 h-8 bg-white border border-gray-300 rounded shadow-md hover:bg-gray-50 flex items-center justify-center"
          @click="toggleChat"
        >
          <i class="ri-chat-3-line text-gray-600"></i>
        </button>
        <slot name="editor" />
      </section>
    </main>

    <!-- 底部状态栏 -->
    <StatusBar
      :current-file="props.currentFile"
      :is-dirty="props.isDirty"
      :cursor-position="props.cursorPosition"
      :selection="props.selection"
      :word-count="props.wordCount"
      :editor-mode="props.editorMode"
      @reset-zoom="() => emit('reset-zoom')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HeaderToolbar from './HeaderToolbar.vue'
import Sidebar from './Sidebar.vue'
import ChatPanel from '../AI/ChatPanel.vue'
import StatusBar from './StatusBar.vue'
import type { FileEntry } from '@/types'
import * as monaco from 'monaco-editor'

// Props
interface Props {
  files?: FileEntry[]
  recentFiles?: FileEntry[]
  currentFile?: FileEntry | null
  isDirty?: boolean
  cursorPosition?: monaco.Position | null
  selection?: monaco.Selection | null
  wordCount?: number
  editorMode?: string
  editorRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  files: () => [],
  recentFiles: () => [],
  currentFile: null,
  isDirty: false,
  cursorPosition: null,
  selection: null,
  wordCount: 0,
  editorMode: '编辑',
  editorRef: null,
})

// Emits
const emit = defineEmits<{
  'new-file': []
  'save-file': []
  'model-change': [model: string]
  'open-settings': []
  'file-select': [fileId: string]
  'folder-select': [folderId: string]
  'create-folder': []
  'file-rename': [data: { fileId: string; newName: string }]
  'file-delete': [fileId: string]
  'file-move': [data: { fileId: string; targetParentId: string | null; position?: 'before' | 'after'; targetFileId?: string }]
  'reset-zoom': []
}>()

// 处理新建文件事件
const handleNewFile = () => {
  console.log('AppLayout: 收到新建文件事件')
  emit('new-file')
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  console.log('切换侧边栏状态:', sidebarCollapsed.value ? '隐藏' : '显示')
}

// 切换聊天面板
const toggleChat = () => {
  chatPanelCollapsed.value = !chatPanelCollapsed.value
  console.log('切换聊天面板状态:', chatPanelCollapsed.value ? '隐藏' : '显示')
}

// 侧边栏和聊天面板折叠状态
const sidebarCollapsed = ref(false)
const chatPanelCollapsed = ref(false)

// 导出状态供父组件使用
defineExpose({
  sidebarCollapsed,
  chatPanelCollapsed,
})
</script>
