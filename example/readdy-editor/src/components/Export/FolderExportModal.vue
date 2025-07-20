<template>
  <div 
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="close"
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
      @click.stop
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="ri-folder-line mr-2"></i>
          批量导出文档
        </h3>
        <button 
          class="text-gray-400 hover:text-gray-600"
          @click="close"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="flex flex-1 min-h-0">
        <!-- 左侧文件夹树 -->
        <div class="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div class="p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">选择要导出的文件夹</h4>
            <FolderTree
              :folders="folders"
              :selected-folder="selectedFolder"
              @folder-select="handleFolderSelect"
            />
          </div>
        </div>

        <!-- 右侧文件预览 -->
        <div class="w-1/2 overflow-y-auto">
          <div class="p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-700">
                {{ selectedFolder ? `${selectedFolder.name} 中的文件` : '选择文件夹查看文件' }}
              </h4>
              <div v-if="selectedFiles.length > 0" class="text-xs text-gray-500">
                已选择 {{ selectedFiles.length }} 个文件
              </div>
            </div>
            
            <div v-if="!selectedFolder" class="text-center py-8 text-gray-500">
              <i class="ri-folder-line text-3xl mb-2 block"></i>
              请从左侧选择一个文件夹
            </div>

            <div v-else-if="folderFiles.length === 0" class="text-center py-8 text-gray-500">
              <i class="ri-file-line text-3xl mb-2 block"></i>
              该文件夹下暂无 Markdown 文件
            </div>

            <div v-else-if="folderFiles.length > 0" class="space-y-2">
              <!-- 全选/取消全选 -->
              <div class="flex items-center p-2 bg-gray-50 rounded">
                <input
                  id="selectAll"
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isSomeSelected"
                  @change="toggleSelectAll"
                  class="mr-2"
                />
                <label for="selectAll" class="text-sm text-gray-700 flex-1">
                  {{ isAllSelected ? '取消全选' : '全选' }}
                </label>
                <span class="text-xs text-gray-500">
                  {{ markdownFiles.length }} 个 Markdown 文件
                </span>
              </div>

              <!-- 文件列表 -->
              <div class="space-y-1">
                <div 
                  v-for="file in markdownFiles"
                  :key="file.id"
                  class="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                  @click="toggleFileSelection(file)"
                >
                  <input
                    type="checkbox"
                    :checked="selectedFiles.includes(file.id)"
                    @click.stop
                    @change="toggleFileSelection(file)"
                    class="mr-3"
                  />
                  <i class="ri-markdown-line text-blue-500 mr-2"></i>
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">{{ file.name }}</div>
                    <div class="text-xs text-gray-500">
                      {{ (file.content?.length || 0).toLocaleString() }} 字符
                    </div>
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ formatDate(file.updatedAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出配置 -->
      <div class="flex-shrink-0 p-6 border-t border-gray-200">
        <div class="grid grid-cols-2 gap-6">
          <!-- 基本设置 -->
          <div class="space-y-4">
            <h5 class="text-sm font-medium text-gray-700">基本设置</h5>
            
            <div>
              <label class="block text-sm text-gray-700 mb-1">文档标题</label>
              <input
                v-model="exportConfig.title"
                type="text"
                placeholder="产品文档"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">文件名</label>
              <input
                v-model="exportConfig.fileName"
                type="text"
                placeholder="documentation"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div class="flex items-center">
              <input
                id="includeMetadata"
                v-model="exportConfig.includeMetadata"
                type="checkbox"
                class="mr-2"
              />
              <label for="includeMetadata" class="text-sm text-gray-700">
                包含文档元数据
              </label>
            </div>
          </div>

          <!-- 显示选项 -->
          <div class="space-y-4">
            <h5 class="text-sm font-medium text-gray-700">显示选项</h5>
            
            <div class="flex items-center">
              <input
                id="showToc"
                v-model="exportConfig.showToc"
                type="checkbox"
                class="mr-2"
              />
              <label for="showToc" class="text-sm text-gray-700">
                显示目录导航
              </label>
            </div>

            <div class="flex items-center">
              <input
                id="showSearch"
                v-model="exportConfig.showSearch"
                type="checkbox"
                class="mr-2"
              />
              <label for="showSearch" class="text-sm text-gray-700">
                包含搜索功能
              </label>
            </div>

            <div class="flex items-center">
              <input
                id="collapsible"
                v-model="exportConfig.collapsible"
                type="checkbox"
                class="mr-2"
              />
              <label for="collapsible" class="text-sm text-gray-700">
                可折叠目录结构
              </label>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="selectedFiles.length > 0" class="mt-4 p-3 bg-blue-50 rounded-lg">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-lg font-semibold text-blue-600">{{ selectedFiles.length }}</div>
              <div class="text-xs text-blue-700">选中文件</div>
            </div>
            <div>
              <div class="text-lg font-semibold text-blue-600">
                {{ totalCharacters.toLocaleString() }}
              </div>
              <div class="text-xs text-blue-700">总字符数</div>
            </div>
            <div>
              <div class="text-lg font-semibold text-blue-600">
                {{ Math.ceil(totalCharacters / 2000) }}
              </div>
              <div class="text-xs text-blue-700">预估页数</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex-shrink-0 flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
        <button 
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          @click="close"
        >
          取消
        </button>
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          :disabled="selectedFiles.length === 0 || isExporting"
          @click="handleExport"
        >
          <i v-if="isExporting" class="ri-loader-2-line animate-spin mr-2"></i>
          <i v-else class="ri-download-line mr-2"></i>
          {{ isExporting ? '导出中...' : `导出 HTML 文档` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FolderTree from '../FileManager/FolderTree.vue'
import type { FileEntry, FolderEntry } from '@/types'

interface Props {
  show: boolean
  folders: FolderEntry[]
  files: FileEntry[]
}

interface Emits {
  (e: 'close'): void
  (e: 'export-success', fileName: string): void
  (e: 'export-error', error: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()


// 状态管理
const selectedFolder = ref<FolderEntry | null>(null)
const selectedFiles = ref<string[]>([])
const isExporting = ref(false)

// 导出配置
const exportConfig = ref({
  title: '产品文档',
  fileName: 'documentation',
  includeMetadata: true,
  showToc: true,
  showSearch: true,
  collapsible: true
})

// 计算属性
const folderFiles = computed(() => {
  if (!selectedFolder.value) return []
  return props.files.filter(file => 
    file.parentId === selectedFolder.value?.id && file.type === 'file'
  )
})

const markdownFiles = computed(() => {
  return folderFiles.value.filter(file => 
    file.name.toLowerCase().endsWith('.md') ||
    file.name.toLowerCase().endsWith('.markdown')
  )
})

const isAllSelected = computed(() => {
  return markdownFiles.value.length > 0 && 
         selectedFiles.value.length === markdownFiles.value.length
})

const isSomeSelected = computed(() => {
  return selectedFiles.value.length > 0 && 
         selectedFiles.value.length < markdownFiles.value.length
})

const totalCharacters = computed(() => {
  return props.files
    .filter(file => selectedFiles.value.includes(file.id))
    .reduce((total, file) => total + (file.content?.length || 0), 0)
})

// 事件处理
const handleFolderSelect = (folder: FolderEntry | null) => {
  selectedFolder.value = folder
  selectedFiles.value = []
}

const toggleFileSelection = (file: FileEntry) => {
  const index = selectedFiles.value.indexOf(file.id)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file.id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedFiles.value = []
  } else {
    selectedFiles.value = markdownFiles.value.map(file => file.id)
  }
}

const handleExport = async () => {
  if (selectedFiles.value.length === 0) {
    emit('export-error', '请选择至少一个文件进行导出')
    return
  }

  isExporting.value = true

  try {
    // 这里将调用文件夹导出服务
    const { FolderExportService } = await import('@/services/folder-export')
    const exportService = new FolderExportService()

    const selectedFileEntries = props.files.filter(file => 
      selectedFiles.value.includes(file.id)
    )

    const result = await exportService.exportToHTML(selectedFileEntries, {
      ...exportConfig.value,
      folderName: selectedFolder.value?.name || '文档'
    })

    if (result.success) {
      emit('export-success', result.fileName || exportConfig.value.fileName)
      close()
    } else {
      emit('export-error', result.error || '导出失败')
    }
  } catch (error) {
    emit('export-error', error instanceof Error ? error.message : '导出失败')
  } finally {
    isExporting.value = false
  }
}

const close = () => {
  emit('close')
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 监听选中文件夹变化，自动选择所有 Markdown 文件
watch(selectedFolder, (newFolder) => {
  if (newFolder && markdownFiles.value.length > 0) {
    // 可选：自动选择所有文件
    // selectedFiles.value = markdownFiles.value.map(file => file.id)
  }
})
</script>