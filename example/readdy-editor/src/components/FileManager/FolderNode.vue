<template>
  <div class="folder-node">
    <div 
      class="folder-header"
      :class="{ 
        'selected': selectedFolder?.id === folder.id,
        'has-children': folder.children && folder.children.length > 0
      }"
      @click="handleFolderClick"
    >
      <div class="folder-content">
        <i 
          v-if="folder.children && folder.children.length > 0"
          :class="[
            'expand-icon',
            isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'
          ]"
          @click.stop="toggleExpanded"
        ></i>
        <i class="ri-folder-line folder-icon"></i>
        <span class="folder-name">{{ folder.name }}</span>
        <span v-if="folder.fileCount !== undefined" class="file-count">
          ({{ folder.fileCount }})
        </span>
      </div>
    </div>

    <!-- 子文件夹 -->
    <div 
      v-if="isExpanded && folder.children && folder.children.length > 0"
      class="folder-children"
    >
      <FolderNode
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :selected-folder="selectedFolder"
        @folder-select="$emit('folder-select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FolderEntry } from '@/types'

interface Props {
  folder: FolderEntry
  selectedFolder?: FolderEntry | null
}

interface Emits {
  (e: 'folder-select', folder: FolderEntry | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isExpanded = ref(false)

const handleFolderClick = () => {
  emit('folder-select', props.folder)
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.folder-node {
  user-select: none;
}

.folder-header {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0.125rem 0;
}

.folder-header:hover {
  background: #f3f4f6;
}

.folder-header.selected {
  background: #dbeafe;
  color: #1d4ed8;
}

.folder-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.expand-icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.25rem;
  cursor: pointer;
  color: #6b7280;
  flex-shrink: 0;
}

.folder-icon {
  margin-right: 0.5rem;
  color: #f59e0b;
  flex-shrink: 0;
}

.folder-name {
  font-size: 0.875rem;
  font-weight: 500;
  truncate: true;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-count {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.folder-children {
  margin-left: 1rem;
  border-left: 1px solid #e5e7eb;
  padding-left: 0.5rem;
}

.has-children .expand-icon {
  opacity: 1;
}

.expand-icon {
  opacity: 0.6;
}
</style>