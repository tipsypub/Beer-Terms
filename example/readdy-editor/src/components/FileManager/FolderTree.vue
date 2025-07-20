<template>
  <div class="folder-tree">
    <div 
      v-for="folder in rootFolders"
      :key="folder.id"
      class="folder-item"
    >
      <FolderNode
        :folder="folder"
        :selected-folder="selectedFolder"
        @folder-select="$emit('folder-select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FolderNode from './FolderNode.vue'
import type { FolderEntry } from '@/types'

interface Props {
  folders: FolderEntry[]
  selectedFolder?: FolderEntry | null
}

interface Emits {
  (e: 'folder-select', folder: FolderEntry | null): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// 获取根文件夹（没有parentId的文件夹）
const rootFolders = computed(() => {
  return props.folders.filter(folder => !folder.parentId)
})
</script>

<style scoped>
.folder-tree {
  padding: 0.5rem 0;
}

.folder-item {
  margin-bottom: 0.25rem;
}
</style>