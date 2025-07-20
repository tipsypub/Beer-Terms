<template>
  <aside class="w-72 min-w-72 max-w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
    <!-- 搜索和操作区 -->
    <div class="p-4 border-b border-gray-200">
      <div class="relative mb-3">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="搜索文件和内容..."
          class="w-full px-3 py-2 pl-9 bg-gray-50 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          @input="handleSearch"
        />
        <i class="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
      </div>
      <div class="flex space-x-2">
        <button
          class="flex-1 flex items-center justify-center space-x-1 px-2 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90"
          @click="$emit('create-file')"
        >
          <i class="ri-file-add-line"></i>
          <span>新建文件</span>
        </button>
        <button
          class="px-2 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          @click="$emit('create-folder')"
        >
          <i class="ri-folder-add-line"></i>
        </button>
      </div>
    </div>

    <!-- 文件树 -->
    <div 
      class="flex-1 overflow-y-auto p-2 relative"
      ref="fileTreeContainer"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 根级别放置提示 -->
      <div 
        v-if="showRootDropZone"
        class="absolute inset-2 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none z-10"
      >
        <div class="text-blue-600 text-sm font-medium">
          <i class="ri-folder-line mr-1"></i>
          移动到根目录
        </div>
      </div>
      
      <FileTree
        :files="filteredFiles"
        :active-file-id="activeFileId"
        @file-select="$emit('file-select', $event)"
        @folder-select="$emit('folder-select', $event)"
        @file-delete="$emit('file-delete', $event)"
        @file-rename="$emit('file-rename', $event)"
        @file-move="handleFileTreeMove"
      />

      <!-- 最近文件 -->
      <div v-if="recentFiles.length > 0" class="mt-4">
        <div class="px-2 py-1 text-xs text-gray-500 font-medium">最近打开</div>
        <div class="space-y-1">
          <div
            v-for="file in recentFiles"
            :key="file.id"
            class="file-tree-item flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100"
            @click="$emit('file-select', file.id)"
          >
            <i class="ri-time-line text-gray-400 mr-2"></i>
            <span class="text-sm">{{ file.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="p-3 border-t border-gray-200">
      <div class="flex justify-between text-xs text-gray-500 mb-2">
        <span>存储: {{ formatFileSize(totalSize) }}</span>
        <span>{{ totalFiles }}个文件</span>
      </div>
      <button
        class="w-full flex items-center justify-center space-x-1 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm"
        @click="$emit('toggle-sidebar')"
      >
        <i class="ri-layout-left-line"></i>
        <span>收起侧边栏</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FileEntry } from '@/types'
import FileTree from '../FileTree/FileTree.vue'
import { dragDropService, type DropTarget } from '@/services/drag-drop'

// Props
interface Props {
  files: FileEntry[]
  activeFileId?: string
  recentFiles?: FileEntry[]
}

const props = withDefaults(defineProps<Props>(), {
  files: () => [],
  recentFiles: () => [],
})

// Emits
const emit = defineEmits<{
  'create-file': []
  'create-folder': []
  'file-select': [fileId: string]
  'folder-select': [folderId: string]
  'file-delete': [fileId: string]
  'file-rename': [data: { fileId: string; newName: string }]
  'file-move': [data: { fileId: string; targetParentId: string | null; position?: 'before' | 'after'; targetFileId?: string }]
  'toggle-sidebar': []
}>()

// 搜索功能
const searchQuery = ref('')

// 拖拽状态
const fileTreeContainer = ref<HTMLElement>()
const showRootDropZone = ref(false)

const filteredFiles = computed(() => {
  if (!searchQuery.value) return props.files

  const query = searchQuery.value.toLowerCase()
  return props.files.filter(
    (file) => file.name.toLowerCase().includes(query) || file.content.toLowerCase().includes(query)
  )
})

// 统计信息
const totalFiles = computed(() => props.files.length)
const totalSize = computed(() => props.files.reduce((total, file) => total + (file.size || 0), 0))

// 工具函数
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    // 如果搜索为空，显示所有文件
    return
  }
  
  // 这里可以触发一个emit事件到父组件进行搜索
  // 或者直接调用文件系统的搜索功能
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 根级别拖拽事件处理
const handleDragOver = (event: DragEvent) => {
  console.log('🏠 Sidebar dragover - 鼠标位置:', { x: event.clientX, y: event.clientY })
  event.preventDefault()
  
  const dragData = dragDropService.getDragData()
  if (!dragData) return

  // 只有当拖拽的文件不在根目录时才显示放置区域
  if (dragData.parentId) {
    event.dataTransfer!.dropEffect = 'move'
    showRootDropZone.value = true
    console.log('🏠 Sidebar 显示根目录放置区域')
  } else {
    event.dataTransfer!.dropEffect = 'none'
    console.log('🏠 Sidebar 文件已在根目录，不显示放置区域')
  }
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  
  const dragData = dragDropService.getDragData()
  if (dragData && dragData.parentId) {
    showRootDropZone.value = true
  }
}

const handleDragLeave = (event: DragEvent) => {
  // 检查是否真的离开了容器
  const rect = fileTreeContainer.value?.getBoundingClientRect()
  if (rect) {
    const x = event.clientX
    const y = event.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      showRootDropZone.value = false
    }
  }
}

const handleDrop = (event: DragEvent) => {
  console.log('🏠 Sidebar handleDrop 开始')
  event.preventDefault()
  showRootDropZone.value = false
  
  const target: DropTarget = { type: 'root' }
  const dragEvent = dragDropService.handleDrop(event, target)
  
  if (dragEvent) {
    const moveData = {
      fileId: dragEvent.source.id,
      targetParentId: null
    }
    
    console.log('🏠 Sidebar 准备发射 file-move 事件到根目录:', moveData)
    
    // 发射文件移动到根目录事件
    emit('file-move', moveData)

    console.log('🏠 移动文件到根目录事件已发射:', dragEvent.source)
  } else {
    console.log('❌ Sidebar 拖拽服务未返回有效事件')
  }
}

// FileTree传来的file-move事件处理
const handleFileTreeMove = (data: { fileId: string; targetParentId: string | null; position?: 'before' | 'after'; targetFileId?: string }) => {
  console.log('🏠 Sidebar 收到 FileTree 的 file-move 事件:', data)
  emit('file-move', data)
  console.log('🏠 Sidebar 已转发 file-move 事件到 AppLayout')
}
</script>

<style scoped>
.file-tree-item:hover {
  background-color: rgba(74, 144, 226, 0.08);
}

.file-tree-item.active {
  background-color: rgba(74, 144, 226, 0.15);
}

/* 拖拽样式 */
:global(.drop-indicator) {
  position: absolute;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  pointer-events: none;
  z-index: 1000;
}

/* 根级别放置区域动画 */
.file-tree-container {
  transition: all 0.2s ease;
}

/* 拖拽悬停效果 */
.file-tree-container:hover {
  background-color: rgba(59, 130, 246, 0.02);
}
</style>
