<template>
  <div class="file-node">
    <!-- 文件/文件夹节点 -->
    <div
      ref="nodeElement"
      :class="[
        'file-tree-item flex items-center px-2 py-1.5 rounded cursor-pointer transition-all duration-200',
        { 
          active: activeFileId === file.id,
          'opacity-50': isDragging,
          'bg-blue-50 border-2 border-blue-300 border-dashed': isDropTarget
        },
      ]"
      :draggable="!isRenaming"
      @click="handleClick"
      @contextmenu.prevent="showContextMenu"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop.prevent.stop="handleDrop"
      @mouseenter="() => console.log('🖱️ 鼠标进入:', props.file.name, props.file.type)"
    >
      <!-- 展开/折叠图标（仅文件夹） -->
      <button
        v-if="file.type === 'folder'"
        class="w-4 h-4 flex items-center justify-center mr-1 hover:bg-gray-200 rounded"
        @click.stop="toggleExpanded"
      >
        <i :class="expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
      </button>
      <div v-else class="w-5"></div>

      <!-- 文件图标 -->
      <i :class="getFileIcon(file)" class="mr-2"></i>

      <!-- 文件名 -->
      <input
        v-if="isRenaming"
        v-model="renamingText"
        class="flex-1 bg-transparent border border-primary rounded px-1 text-sm"
        @blur="handleRenameComplete"
        @keydown.enter="handleRenameComplete"
        @keydown.escape="cancelRename"
        @click.stop
      />
      <span v-else class="text-sm flex-1">{{ file.name }}</span>

      <!-- 文件大小（仅文件） -->
      <span v-if="file.type === 'file' && file.size" class="ml-auto text-xs text-gray-400">
        {{ formatFileSize(file.size) }}
      </span>
    </div>

    <!-- 子文件（仅文件夹展开时显示） -->
    <div v-if="file.type === 'folder' && expanded && children.length > 0" class="ml-4">
      <FileNode
        v-for="child in children"
        :key="child.id"
        :file="child"
        :children="getGrandChildren(child.id)"
        :all-files="allFiles"
        :active-file-id="activeFileId"
        @file-select="$emit('file-select', $event)"
        @folder-select="$emit('folder-select', $event)"
        @file-delete="$emit('file-delete', $event)"
        @file-rename="$emit('file-rename', $event)"
        @file-move="$emit('file-move', $event)"
      />
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="showMenu"
      ref="contextMenu"
      class="fixed bg-white border border-gray-200 rounded shadow-lg py-1 z-50"
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
    >
      <button
        class="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center"
        @click="startRename"
      >
        <i class="ri-edit-line mr-2"></i>
        重命名
      </button>
      <button
        class="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center text-red-600"
        @click="handleDelete"
      >
        <i class="ri-delete-bin-line mr-2"></i>
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import type { FileEntry } from '@/types'
import { dragDropService, type DragData, type DropTarget, type DragDropEvent } from '@/services/drag-drop'

// Props
interface Props {
  file: FileEntry
  children: FileEntry[]
  allFiles: FileEntry[] // 添加全部文件列表
  activeFileId?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'file-select': [fileId: string]
  'folder-select': [folderId: string]
  'file-delete': [fileId: string]
  'file-rename': [data: { fileId: string; newName: string }]
  'file-move': [data: { fileId: string; targetParentId: string | null; position?: 'before' | 'after'; targetFileId?: string }]
}>()

// 展开状态
const expanded = ref(false)

// 重命名状态
const isRenaming = ref(false)
const renamingText = ref('')

// 右键菜单
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

// 拖拽状态
const nodeElement = ref<HTMLElement>()
const isDragging = ref(false)
const isDropTarget = ref(false)
const dragOverTimer = ref<number | null>(null)

// 获取孙子文件（递归所需）
const getGrandChildren = (parentId: string): FileEntry[] => {
  return props.allFiles.filter((file) => file.parentId === parentId)
}

// 文件图标
const getFileIcon = (file: FileEntry): string => {
  if (file.type === 'folder') {
    return expanded.value ? 'ri-folder-open-fill text-primary' : 'ri-folder-fill text-primary'
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'ri-markdown-fill text-blue-500'
    case 'js':
    case 'ts':
      return 'ri-javascript-fill text-yellow-500'
    case 'vue':
      return 'ri-vuejs-fill text-green-500'
    case 'json':
      return 'ri-braces-fill text-orange-500'
    default:
      return 'ri-file-text-line text-gray-500'
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 事件处理
const handleClick = () => {
  if (props.file.type === 'folder') {
    toggleExpanded()
    emit('folder-select', props.file.id)
  } else {
    emit('file-select', props.file.id)
  }
}

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const showContextMenu = (event: MouseEvent) => {
  menuPosition.value = { x: event.clientX, y: event.clientY }
  showMenu.value = true
}

const hideContextMenu = () => {
  showMenu.value = false
}

const startRename = () => {
  isRenaming.value = true
  renamingText.value = props.file.name
  hideContextMenu()
  nextTick(() => {
    const input = document.querySelector('.file-node input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const handleRenameComplete = () => {
  if (renamingText.value && renamingText.value !== props.file.name) {
    emit('file-rename', { fileId: props.file.id, newName: renamingText.value })
  }
  isRenaming.value = false
}

const cancelRename = () => {
  isRenaming.value = false
  renamingText.value = ''
}

const handleDelete = () => {
  if (confirm(`确定要删除 "${props.file.name}" 吗？`)) {
    emit('file-delete', props.file.id)
  }
  hideContextMenu()
}

// 拖拽事件处理
const handleDragStart = (event: globalThis.DragEvent) => {
  if (isRenaming.value) {
    event.preventDefault()
    return
  }

  const dragData: DragData = {
    type: props.file.type,
    id: props.file.id,
    name: props.file.name,
    parentId: props.file.parentId
  }

  // 设置拖拽数据
  event.dataTransfer?.setData('text/plain', JSON.stringify(dragData))
  event.dataTransfer!.effectAllowed = 'move'

  // 使用拖拽服务
  if (nodeElement.value) {
    dragDropService.startDrag(dragData, nodeElement.value)
  }

  isDragging.value = true
  console.log('开始拖拽:', dragData)
}

const handleDragEnd = () => {
  isDragging.value = false
  dragDropService.endDrag()
  console.log('拖拽结束')
}

const handleDragOver = (event: globalThis.DragEvent) => {
  console.log('🔄 FileNode dragover 事件', {
    target: props.file.name,
    targetType: props.file.type
  })
  
  event.preventDefault()
  event.stopPropagation()
  
  const dragData = dragDropService.getDragData()
  console.log('🔄 dragover 获取到的拖拽数据:', dragData)
  
  if (!dragData || dragData.id === props.file.id) {
    console.log('🔄 dragover 阻止 - 无数据或拖拽到自己')
    return
  }

  // 智能确定放置目标
  let target: DropTarget
  
  if (props.file.type === 'folder') {
    // 对于文件夹，检查鼠标位置来决定是移入文件夹还是排序
    const rect = nodeElement.value.getBoundingClientRect()
    const mouseY = event.clientY
    const elementTop = rect.top
    const elementBottom = rect.bottom
    const elementHeight = rect.height
    
    // 定义敏感区域：上下各占15%用于排序，中间70%用于移入文件夹
    const sortZoneHeight = elementHeight * 0.15
    
    if (mouseY < elementTop + sortZoneHeight) {
      // 上方排序区域
      target = { type: 'before', id: props.file.id, name: props.file.name, insertPosition: 'before' }
    } else if (mouseY > elementBottom - sortZoneHeight) {
      // 下方排序区域
      target = { type: 'after', id: props.file.id, name: props.file.name, insertPosition: 'after' }
    } else {
      // 中间区域：移入文件夹
      target = { type: 'folder', id: props.file.id, name: props.file.name }
    }
  } else {
    // 对于文件，根据鼠标位置决定排序位置
    const rect = nodeElement.value.getBoundingClientRect()
    const mouseY = event.clientY
    const elementMiddle = rect.top + rect.height / 2
    
    if (mouseY < elementMiddle) {
      target = { type: 'before', id: props.file.id, name: props.file.name, insertPosition: 'before' }
    } else {
      target = { type: 'after', id: props.file.id, name: props.file.name, insertPosition: 'after' }
    }
  }

  console.log('🔄 dragover 智能目标:', target)

  if (nodeElement.value) {
    const canDrop = dragDropService.handleDragOver(event, target, nodeElement.value)
    console.log('🔄 canDrop 结果:', canDrop)
    // 拖拽服务已经设置了 dropEffect，不需要重复设置
    // event.dataTransfer!.dropEffect = canDrop ? 'move' : 'none'
  }
}

const handleDragEnter = (event: globalThis.DragEvent) => {
  console.log('🎯 FileNode dragenter 事件', {
    target: props.file.name,
    targetType: props.file.type
  })
  
  event.preventDefault()
  event.stopPropagation()
  
  const dragData = dragDropService.getDragData()
  if (!dragData || dragData.id === props.file.id) {
    console.log('🎯 dragenter 阻止 - 无数据或拖拽到自己')
    return
  }

  console.log('🎯 dragenter 设置 isDropTarget = true')
  isDropTarget.value = true

  // 如果是文件夹，在悬停一段时间后自动展开
  if (props.file.type === 'folder' && !expanded.value) {
    console.log('🎯 dragenter 设置自动展开定时器')
    dragOverTimer.value = window.setTimeout(() => {
      console.log('🎯 自动展开文件夹:', props.file.name)
      expanded.value = true
    }, 800)
  }
}

const handleDragLeave = (event: globalThis.DragEvent) => {
  // 检查是否真的离开了元素
  const rect = nodeElement.value?.getBoundingClientRect()
  if (rect) {
    const x = event.clientX
    const y = event.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      isDropTarget.value = false
      
      if (dragOverTimer.value) {
        clearTimeout(dragOverTimer.value)
        dragOverTimer.value = null
      }
    }
  }
}

const handleDrop = (event: globalThis.DragEvent) => {
  console.log('🎯 FileNode handleDrop 开始', {
    dropTarget: props.file.name,
    dropTargetType: props.file.type,
    dropTargetId: props.file.id
  })
  
  event.preventDefault()
  isDropTarget.value = false
  
  if (dragOverTimer.value) {
    clearTimeout(dragOverTimer.value)
    dragOverTimer.value = null
  }

  // 使用相同的智能逻辑确定放置目标
  let target: DropTarget
  
  if (props.file.type === 'folder') {
    // 对于文件夹，检查鼠标位置来决定是移入文件夹还是排序
    const rect = nodeElement.value?.getBoundingClientRect()
    if (rect) {
      const mouseY = event.clientY
      const elementTop = rect.top
      const elementBottom = rect.bottom
      const elementHeight = rect.height
      
      // 定义敏感区域：上下各占15%用于排序，中间70%用于移入文件夹
      const sortZoneHeight = elementHeight * 0.15
      
      if (mouseY < elementTop + sortZoneHeight) {
        // 上方排序区域
        target = { type: 'before', id: props.file.id, name: props.file.name, insertPosition: 'before' }
      } else if (mouseY > elementBottom - sortZoneHeight) {
        // 下方排序区域
        target = { type: 'after', id: props.file.id, name: props.file.name, insertPosition: 'after' }
      } else {
        // 中间区域：移入文件夹
        target = { type: 'folder', id: props.file.id, name: props.file.name }
      }
    } else {
      // 备用方案
      target = { type: 'folder', id: props.file.id, name: props.file.name }
    }
  } else {
    // 对于文件，根据鼠标位置决定排序位置
    const rect = nodeElement.value?.getBoundingClientRect()
    if (rect) {
      const mouseY = event.clientY
      const elementMiddle = rect.top + rect.height / 2
      
      if (mouseY < elementMiddle) {
        target = { type: 'before', id: props.file.id, name: props.file.name, insertPosition: 'before' }
      } else {
        target = { type: 'after', id: props.file.id, name: props.file.name, insertPosition: 'after' }
      }
    } else {
      // 备用方案
      target = { type: 'after', id: props.file.id, name: props.file.name, insertPosition: 'after' }
    }
  }

  console.log('🎯 放置目标确定:', target)

  const dragEvent = dragDropService.handleDrop(event, target)
  console.log('🎯 拖拽服务返回事件:', dragEvent)
  
  if (dragEvent) {
    let moveData: any
    
    if (target.type === 'folder') {
      // 移入文件夹
      moveData = {
        fileId: dragEvent.source.id,
        targetParentId: props.file.id
      }
    } else if (target.type === 'before' || target.type === 'after') {
      // 排序操作
      moveData = {
        fileId: dragEvent.source.id,
        targetParentId: props.file.parentId || null,
        position: target.insertPosition,
        targetFileId: props.file.id // 相对于哪个文件进行排序
      }
    } else {
      // 备用方案
      moveData = {
        fileId: dragEvent.source.id,
        targetParentId: props.file.parentId || null
      }
    }
    
    console.log('🎯 准备发射 file-move 事件:', moveData)
    console.log('🎯 目标文件详情:', {
      name: props.file.name,
      type: props.file.type,
      id: props.file.id,
      操作类型: target.type
    })
    
    emit('file-move', moveData)

    console.log('🎯 file-move 事件已发射:', {
      from: dragEvent.source,
      to: target,
      moveData
    })
  } else {
    console.log('❌ 拖拽服务未返回有效事件')
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.file-node')) {
    hideContextMenu()
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
.file-tree-item:hover {
  background-color: rgba(74, 144, 226, 0.08);
}

.file-tree-item.active {
  background-color: rgba(74, 144, 226, 0.15);
}

/* 拖拽样式 */
.file-tree-item.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

/* 放置目标样式 */
:global(.drop-target-inside) {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border: 2px dashed #3b82f6 !important;
  border-radius: 6px;
}

/* 放置指示器 */
:global(.drop-indicator) {
  position: absolute;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  pointer-events: none;
  z-index: 1000;
}

/* 拖拽时的游标 */
.file-tree-item[draggable="true"] {
  cursor: grab;
}

.file-tree-item[draggable="true"]:active {
  cursor: grabbing;
}

/* 确保文件夹可以接收拖拽事件 */
.file-tree-item {
  position: relative;
  z-index: 1;
}
</style>
