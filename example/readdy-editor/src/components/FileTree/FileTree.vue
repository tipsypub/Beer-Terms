<template>
  <div class="file-tree">
    <FileNode
      v-for="file in rootFiles"
      :key="file.id"
      :file="file"
      :children="getChildren(file.id)"
      :all-files="files"
      :active-file-id="activeFileId"
      @file-select="$emit('file-select', $event)"
      @folder-select="$emit('folder-select', $event)"
      @file-delete="$emit('file-delete', $event)"
      @file-rename="$emit('file-rename', $event)"
      @file-move="handleFileMove"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileEntry } from '@/types'
import FileNode from './FileNode.vue'

// Props
interface Props {
  files: FileEntry[]
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

// 添加调试信息的事件处理函数
const handleFileMove = (data: { fileId: string; targetParentId: string | null; position?: 'before' | 'after'; targetFileId?: string }) => {
  console.log('📂 FileTree 收到 file-move 事件:', data)
  emit('file-move', data)
  console.log('📂 FileTree 已转发 file-move 事件')
}

// 计算根文件（没有parentId的文件）并按order排序
const rootFiles = computed(() => {
  const roots = props.files
    .filter((file) => !file.parentId)
    .sort((a, b) => {
      // 首先按类型排序（文件夹优先）
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      // 然后按order排序
      const orderA = a.order || 0
      const orderB = b.order || 0
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // 最后按名称排序
      return a.name.localeCompare(b.name)
    })
  console.log('📂 FileTree 计算 rootFiles:', roots.map(f => ({ id: f.id, name: f.name, parentId: f.parentId, order: f.order })))
  return roots
})

// 获取指定文件的子文件并按order排序
const getChildren = (parentId: string): FileEntry[] => {
  const children = props.files
    .filter((file) => file.parentId === parentId)
    .sort((a, b) => {
      // 首先按类型排序（文件夹优先）
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      // 然后按order排序
      const orderA = a.order || 0
      const orderB = b.order || 0
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // 最后按名称排序
      return a.name.localeCompare(b.name)
    })
  console.log(`📂 FileTree getChildren(${parentId}):`, children.map(f => ({ id: f.id, name: f.name, parentId: f.parentId, order: f.order })))
  return children
}
</script>
