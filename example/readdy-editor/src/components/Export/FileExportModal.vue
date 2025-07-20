<template>
  <div 
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="close"
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
      @click.stop
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          <i class="ri-download-line mr-2"></i>
          导出文件
        </h3>
        <button 
          class="text-gray-400 hover:text-gray-600"
          @click="close"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>

      <!-- 内容 -->
      <div class="p-6">
        <!-- 文件名输入 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            文件名
          </label>
          <input
            v-model="fileName"
            type="text"
            placeholder="document"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- 导出类型选择 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            导出类型
          </label>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div 
              class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{ 'border-blue-500 bg-blue-50': exportType === 'single' }"
              @click="exportType = 'single'"
            >
              <input
                type="radio"
                id="single"
                value="single"
                v-model="exportType"
                class="mr-3"
              />
              <div class="flex items-center flex-1">
                <i class="ri-file-line text-lg mr-3"></i>
                <div>
                  <div class="font-medium text-gray-900">单文件导出</div>
                  <div class="text-sm text-gray-500">导出当前文件</div>
                </div>
              </div>
            </div>
            
            <div 
              class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{ 'border-blue-500 bg-blue-50': exportType === 'folder' }"
              @click="exportType = 'folder'"
            >
              <input
                type="radio"
                id="folder"
                value="folder"
                v-model="exportType"
                class="mr-3"
              />
              <div class="flex items-center flex-1">
                <i class="ri-folder-line text-lg mr-3"></i>
                <div>
                  <div class="font-medium text-gray-900">文件夹导出</div>
                  <div class="text-sm text-gray-500">批量导出文档</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出格式选择（单文件模式） -->
        <div v-if="exportType === 'single'" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            导出格式
          </label>
          <div class="grid grid-cols-1 gap-2">
            <div 
              v-for="format in availableFormats"
              :key="format.value"
              class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{ 'border-blue-500 bg-blue-50': selectedFormat === format.value }"
              @click="selectedFormat = format.value"
            >
              <input
                type="radio"
                :id="format.value"
                :value="format.value"
                v-model="selectedFormat"
                class="mr-3"
              />
              <div class="flex items-center flex-1">
                <i :class="format.icon" class="text-lg mr-3"></i>
                <div>
                  <div class="font-medium text-gray-900">{{ format.label }}</div>
                  <div class="text-sm text-gray-500">{{ format.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 高级选项 -->
        <div class="mb-6">
          <button 
            class="flex items-center text-sm text-gray-600 hover:text-gray-800"
            @click="showAdvanced = !showAdvanced"
          >
            <i 
              :class="showAdvanced ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"
              class="mr-1"
            ></i>
            高级选项
          </button>
          
          <div v-if="showAdvanced" class="mt-3 space-y-3">
            <!-- 包含元数据 -->
            <div class="flex items-center">
              <input
                id="includeMetadata"
                v-model="includeMetadata"
                type="checkbox"
                class="mr-2"
              />
              <label for="includeMetadata" class="text-sm text-gray-700">
                包含文档元数据
              </label>
            </div>

            <!-- PDF/打印选项 -->
            <div v-if="selectedFormat === 'pdf'" class="space-y-2">
              <div class="flex items-center space-x-4">
                <div class="flex items-center">
                  <label class="text-sm text-gray-700 mr-2">页面大小:</label>
                  <select 
                    v-model="pageSize"
                    class="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="A3">A3</option>
                  </select>
                </div>
                <div class="flex items-center">
                  <label class="text-sm text-gray-700 mr-2">方向:</label>
                  <select 
                    v-model="orientation"
                    class="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="portrait">纵向</option>
                    <option value="landscape">横向</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 自定义样式 -->
            <div v-if="selectedFormat === 'html'" class="space-y-2">
              <label class="block text-sm text-gray-700">自定义CSS样式:</label>
              <textarea
                v-model="customStyles"
                rows="3"
                placeholder="body { font-family: Arial; }"
                class="w-full text-sm border border-gray-300 rounded px-2 py-1"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
        <button 
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          @click="close"
        >
          取消
        </button>
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          :disabled="isExporting"
          @click="handleExport"
        >
          <i v-if="isExporting" class="ri-loader-2-line animate-spin mr-2"></i>
          <i v-else class="ri-download-line mr-2"></i>
          {{ isExporting ? '导出中...' : (exportType === 'folder' ? '打开文件夹选择器' : '导出') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { FileExportService, type ExportFormat, type ExportOptions } from '@/services/file-export'

interface Props {
  show: boolean
  content: string
}

interface Emits {
  (e: 'close'): void
  (e: 'export-success', fileName: string): void
  (e: 'export-error', error: string): void
  (e: 'open-folder-export'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const exportService = new FileExportService()

// 表单状态
const exportType = ref<'single' | 'folder'>('single')
const fileName = ref('')
const selectedFormat = ref<ExportFormat>('md')
const includeMetadata = ref(false)
const pageSize = ref<'A4' | 'Letter' | 'A3'>('A4')
const orientation = ref<'portrait' | 'landscape'>('portrait')
const customStyles = ref('')
const showAdvanced = ref(false)
const isExporting = ref(false)

// 可用的导出格式
const availableFormats = computed(() => {
  return exportService.getSupportedFormats()
})

// 导出处理
const handleExport = async () => {
  if (exportType.value === 'folder') {
    emit('open-folder-export')
    return
  }

  if (!props.content) {
    emit('export-error', '没有可导出的内容')
    return
  }

  isExporting.value = true

  try {
    const options: ExportOptions = {
      format: selectedFormat.value,
      fileName: fileName.value,
      includeMetadata: includeMetadata.value,
      customStyles: customStyles.value || undefined,
      pageSize: pageSize.value,
      orientation: orientation.value,
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    }

    const result = await exportService.exportFile(props.content, options)

    if (result.success) {
      emit('export-success', result.fileName || fileName.value)
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

// 关闭模态框
const close = () => {
  emit('close')
}

// 生成默认文件名
const generateDefaultFileName = () => {
  const timestamp = new Date().toISOString().slice(0, 10)
  fileName.value = `document-${timestamp}`
}

onMounted(() => {
  generateDefaultFileName()
})
</script>