<template>
  <footer class="h-6 bg-gray-800 text-white text-xs flex items-center justify-between px-4 border-t border-gray-700">
    <!-- 左侧状态信息 -->
    <div class="flex items-center space-x-4">
      <!-- 文件状态 -->
      <div class="flex items-center space-x-2">
        <div v-if="currentFile" class="flex items-center space-x-1">
          <i :class="getFileIcon(currentFile)" class="text-xs"></i>
          <span>{{ currentFile.name }}</span>
          <span v-if="isDirty" class="text-orange-400">●</span>
        </div>
        <span v-else class="text-gray-400">无打开文件</span>
      </div>

      <!-- 编码格式 -->
      <div class="text-gray-300">UTF-8</div>

      <!-- 文件类型 -->
      <div v-if="currentFile" class="text-gray-300">
        {{ getFileType(currentFile.name) }}
      </div>
    </div>

    <!-- 中间状态信息 -->
    <div class="flex items-center space-x-4">
      <!-- Git 分支（模拟） -->
      <div class="flex items-center space-x-1 text-gray-300">
        <i class="ri-git-branch-line"></i>
        <span>main</span>
      </div>

      <!-- 同步状态 -->
      <div class="flex items-center space-x-1 text-gray-300">
        <i class="ri-cloud-line"></i>
        <span>已同步</span>
      </div>
    </div>

    <!-- 右侧状态信息 -->
    <div class="flex items-center space-x-4">
      <!-- 光标位置 -->
      <div v-if="cursorPosition" class="text-gray-300">
        行 {{ cursorPosition.lineNumber }}, 列 {{ cursorPosition.column }}
      </div>

      <!-- 选择信息 -->
      <div v-if="selection && !selection.isEmpty()" class="text-gray-300">
        已选择 {{ getSelectionInfo(selection) }}
      </div>

      <!-- 字数统计 -->
      <div v-if="wordCount > 0" class="text-gray-300">
        字数: {{ wordCount }}
      </div>

      <!-- 最后编辑时间 -->
      <div v-if="currentFile" class="text-gray-300">
        最后编辑: {{ getLastModified(currentFile.updatedAt) }}
      </div>

      <!-- 编辑器模式 -->
      <div class="text-gray-300">
        {{ editorMode }}
      </div>

      <!-- 缩放级别 -->
      <div class="text-gray-300 cursor-pointer hover:text-white" @click="resetZoom">
        {{ Math.round(zoomLevel * 100) }}%
      </div>

      <!-- 通知指示器 -->
      <div v-if="hasNotifications" class="flex items-center">
        <i class="ri-notification-line text-blue-400 animate-pulse"></i>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileEntry } from '@/types'
import * as monaco from 'monaco-editor'

// Props
interface Props {
  currentFile?: FileEntry | null
  isDirty?: boolean
  cursorPosition?: monaco.Position | null
  selection?: monaco.Selection | null
  wordCount?: number
  editorMode?: string
  zoomLevel?: number
  hasNotifications?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDirty: false,
  wordCount: 0,
  editorMode: '编辑',
  zoomLevel: 1,
  hasNotifications: false,
})

// Emits
const emit = defineEmits<{
  'reset-zoom': []
}>()

// 获取文件图标
const getFileIcon = (file: FileEntry): string => {
  if (file.type === 'folder') {
    return 'ri-folder-line'
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'ri-markdown-line'
    case 'js':
    case 'ts':
      return 'ri-javascript-line'
    case 'vue':
      return 'ri-vuejs-line'
    case 'json':
      return 'ri-braces-line'
    case 'css':
      return 'ri-css3-line'
    case 'html':
      return 'ri-html5-line'
    default:
      return 'ri-file-text-line'
  }
}

// 获取文件类型
const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'Markdown'
    case 'js':
      return 'JavaScript'
    case 'ts':
      return 'TypeScript'
    case 'vue':
      return 'Vue'
    case 'json':
      return 'JSON'
    case 'css':
      return 'CSS'
    case 'html':
      return 'HTML'
    default:
      return ext ? ext.toUpperCase() : 'Text'
  }
}

// 获取选择信息
const getSelectionInfo = (selection: monaco.Selection): string => {
  const startLine = selection.startLineNumber
  const endLine = selection.endLineNumber
  const lineCount = endLine - startLine + 1
  
  if (lineCount === 1) {
    const charCount = selection.endColumn - selection.startColumn
    return `${charCount} 个字符`
  } else {
    return `${lineCount} 行`
  }
}

// 获取最后修改时间
const getLastModified = (updatedAt: Date): string => {
  const now = new Date()
  const diff = now.getTime() - updatedAt.getTime()
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }
  
  // 大于1天，显示具体日期
  return updatedAt.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 重置缩放
const resetZoom = () => {
  emit('reset-zoom')
}
</script>

<style scoped>
/* 状态栏样式 */
footer {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  user-select: none;
}

/* 悬停效果 */
.cursor-pointer:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 动画效果 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>