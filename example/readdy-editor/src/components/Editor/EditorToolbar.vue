<template>
  <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
    <div class="flex items-center space-x-4">
      <!-- 文件操作按钮 -->
      <div class="flex items-center space-x-1">
        <button
          class="flex items-center space-x-1 px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white"
          @click="$emit('save')"
        >
          <i class="ri-save-line"></i>
          <span>保存</span>
        </button>
        <button
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white"
          @click="$emit('undo')"
        >
          <i class="ri-arrow-go-back-line"></i>
        </button>
        <button
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white"
          @click="$emit('redo')"
        >
          <i class="ri-arrow-go-forward-line"></i>
        </button>
      </div>

      <!-- 文件信息 -->
      <div class="flex items-center space-x-2">
        <i :class="getFileIcon(currentFile?.name || '')" class="text-blue-500"></i>
        <span class="text-sm font-medium">{{ currentFile?.name || '未命名文件' }}</span>
        <span 
          :class="[
            'px-2 py-0.5 text-xs rounded-full',
            isDirty 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-green-100 text-green-700'
          ]"
        >
          {{ isDirty ? '未保存' : '已保存' }}
        </span>
      </div>

      <!-- 格式化工具 -->
      <div class="flex items-center space-x-1">
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="粗体 (Ctrl+B)"
          @click="$emit('format', 'bold')"
        >
          <i class="ri-bold"></i>
        </button>
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="斜体 (Ctrl+I)"
          @click="$emit('format', 'italic')"
        >
          <i class="ri-italic"></i>
        </button>
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="链接 (Ctrl+K)"
          @click="$emit('format', 'link')"
        >
          <i class="ri-link"></i>
        </button>
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="代码块"
          @click="$emit('format', 'code')"
        >
          <i class="ri-code-line"></i>
        </button>
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="标题"
          @click="$emit('format', 'heading')"
        >
          <i class="ri-h-1"></i>
        </button>
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="列表"
          @click="$emit('format', 'list')"
        >
          <i class="ri-list-unordered"></i>
        </button>
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="引用"
          @click="$emit('format', 'quote')"
        >
          <i class="ri-double-quotes-l"></i>
        </button>
      </div>

      <!-- 编辑器设置 -->
      <div class="flex items-center space-x-1">
        <button 
          class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
          data-tooltip="字体大小"
          @click="showFontSizeMenu = !showFontSizeMenu"
        >
          <i class="ri-font-size"></i>
        </button>
        <button 
          :class="[
            'px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white',
            config.wordWrap ? 'bg-primary text-white' : ''
          ]"
          @click="$emit('config-change', 'wordWrap', !config.wordWrap)"
        >
          <i class="ri-text-wrap"></i>
        </button>
        <button 
          :class="[
            'px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white',
            config.minimap ? 'bg-primary text-white' : ''
          ]"
          @click="$emit('config-change', 'minimap', !config.minimap)"
        >
          <i class="ri-map-line"></i>
        </button>
      </div>
    </div>

    <!-- 右侧配置区域 -->
    <div class="flex items-center space-x-2">
      <!-- 打开文件 -->
      <button 
        class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
        data-tooltip="打开文件"
        @click="$emit('open-file')"
      >
        <i class="ri-folder-open-line"></i>
      </button>

      <!-- 导出文件 -->
      <button 
        class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip"
        data-tooltip="导出文件"
        @click="$emit('export-file')"
      >
        <i class="ri-download-line"></i>
      </button>

      <!-- 主题切换 -->
      <button 
        :class="[
          'px-2 py-1 text-xs rounded border border-gray-300 hover:bg-white tooltip',
          config.theme === 'dark' ? 'bg-primary text-white' : ''
        ]"
        data-tooltip="主题切换"
        @click="$emit('config-change', 'theme', config.theme === 'dark' ? 'light' : 'dark')"
      >
        <i :class="config.theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'"></i>
      </button>
    </div>

    <!-- 字体大小菜单 -->
    <div 
      v-if="showFontSizeMenu"
      ref="fontSizeMenu"
      class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 z-10"
    >
      <button
        v-for="size in fontSizes"
        :key="size"
        class="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
        :class="{ 'bg-primary text-white': config.fontSize === size }"
        @click="changeFontSize(size)"
      >
        {{ size }}px
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { FileEntry, EditorConfig } from '@/types'
import * as monaco from 'monaco-editor'

// Props
interface Props {
  currentFile?: FileEntry | null
  isDirty?: boolean
  config: EditorConfig
}

const props = withDefaults(defineProps<Props>(), {
  isDirty: false,
})

// Emits
const emit = defineEmits<{
  format: [type: string]
  'config-change': [key: keyof EditorConfig, value: any]
  save: []
  undo: []
  redo: []
  'open-file': []
  'export-file': []
}>()

// 响应式数据
const showFontSizeMenu = ref(false)
const fontSizeMenu = ref<HTMLElement>()

// 字体大小选项
const fontSizes = [10, 12, 14, 16, 18, 20, 22, 24]

// 计算属性 - 移除了状态信息相关的计算属性

// 方法
const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'ri-markdown-fill'
    case 'js':
    case 'ts':
      return 'ri-javascript-fill'
    case 'vue':
      return 'ri-vuejs-fill'
    case 'json':
      return 'ri-braces-fill'
    default:
      return 'ri-file-text-line'
  }
}

// getSelectionInfo 方法已移动到 StatusBar 组件

const changeFontSize = (size: number) => {
  emit('config-change', 'fontSize', size)
  showFontSizeMenu.value = false
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (fontSizeMenu.value && !fontSizeMenu.value.contains(event.target as Node)) {
    showFontSizeMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 工具提示样式 */
.tooltip {
  position: relative;
}

.tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #374151;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: 4px;
}

.tooltip:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #374151;
  z-index: 1000;
}
</style>