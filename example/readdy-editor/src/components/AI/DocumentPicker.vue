<template>
  <div class="document-picker h-full flex flex-col bg-white">
    <!-- 头部工具栏 -->
    <div class="flex-shrink-0 p-4 border-b border-gray-200">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-900 flex items-center">
          <i class="ri-file-text-line mr-2"></i>
          文档片段选择
        </h3>
        <button
          class="p-1.5 text-gray-500 hover:text-gray-700 rounded"
          @click="$emit('close')"
          title="关闭选择器"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
      
      <!-- 选择统计和操作 -->
      <div class="flex items-center justify-between text-xs text-gray-600 mb-3">
        <span>{{ selectedContext.summary }}</span>
        <span v-if="selectedContext.totalLength > 0">
          {{ formatBytes(selectedContext.totalLength) }}
        </span>
      </div>
      
      <!-- 快速操作按钮 -->
      <div class="flex flex-wrap gap-1">
        <button
          class="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
          @click="selectAll"
          title="全选"
        >
          <i class="ri-checkbox-multiple-line mr-1"></i>
          全选
        </button>
        <button
          class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          @click="clearSelection"
          title="清空选择"
        >
          <i class="ri-checkbox-blank-line mr-1"></i>
          清空
        </button>
        <button
          class="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
          @click="selectByType('heading')"
          title="选择所有标题"
        >
          <i class="ri-h-1 mr-1"></i>
          标题
        </button>
        <button
          class="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
          @click="selectByType('code')"
          title="选择所有代码块"
        >
          <i class="ri-code-s-slash-line mr-1"></i>
          代码
        </button>
        <button
          class="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
          @click="useSelected"
          :disabled="selectedContext.fragments.length === 0"
          title="使用选中内容"
        >
          <i class="ri-check-line mr-1"></i>
          使用选中
        </button>
      </div>
    </div>

    <!-- 片段列表 -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="fragments.length === 0" class="p-8 text-center text-gray-500">
        <i class="ri-file-text-line text-4xl mb-4"></i>
        <p class="text-lg mb-2">暂无可选择的内容</p>
        <p class="text-sm">请在编辑器中输入一些内容</p>
      </div>
      
      <div v-else class="space-y-1 p-2">
        <div
          v-for="fragment in fragments"
          :key="fragment.id"
          class="fragment-item relative cursor-pointer rounded-lg border transition-all duration-200"
          :class="[
            fragment.selected 
              ? 'bg-blue-50 border-blue-200 shadow-sm' 
              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300',
            getFragmentTypeClass(fragment.type)
          ]"
          @click="toggleFragment(fragment.id)"
        >
          <!-- 选择复选框和类型图标 -->
          <div class="flex items-start p-3">
            <div class="flex items-center mr-3">
              <input
                type="checkbox"
                :checked="fragment.selected"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                @change.stop="toggleFragment(fragment.id)"
              />
              <i 
                :class="getFragmentIcon(fragment.type)"
                class="ml-2 text-gray-500"
              ></i>
            </div>
            
            <!-- 片段信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-sm font-medium text-gray-900 truncate">
                  {{ fragment.title }}
                </h4>
                <span class="text-xs text-gray-500 ml-2">
                  L{{ fragment.startLine }}-{{ fragment.endLine }}
                </span>
              </div>
              
              <p class="text-xs text-gray-600 leading-relaxed">
                {{ fragment.preview }}
              </p>
              
              <!-- 额外信息 -->
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                  <span class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                    {{ getTypeLabel(fragment.type) }}
                  </span>
                  <span v-if="fragment.level" class="text-xs">
                    H{{ fragment.level }}
                  </span>
                </div>
                <span class="text-xs text-gray-400">
                  {{ formatBytes(fragment.content.length) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 选中状态指示器 -->
          <div
            v-if="fragment.selected"
            class="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
          ></div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div 
      v-if="selectedContext.fragments.length > 0"
      class="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50"
    >
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600">
          <span class="font-medium">{{ selectedContext.fragments.length }}</span> 项已选择
          <span class="text-gray-400 ml-2">
            ({{ formatBytes(selectedContext.totalLength) }})
          </span>
        </div>
        <div class="flex space-x-2">
          <button
            class="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            @click="previewSelected"
          >
            <i class="ri-eye-line mr-1"></i>
            预览
          </button>
          <button
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            @click="useSelected"
          >
            <i class="ri-send-plane-line mr-1"></i>
            使用选中内容
          </button>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <div
      v-if="showPreview"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showPreview = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col"
        @click.stop
      >
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-semibold">选中内容预览</h3>
          <button
            class="p-1 text-gray-500 hover:text-gray-700"
            @click="showPreview = false"
          >
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <pre class="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">{{ previewContent }}</pre>
        </div>
        <div class="flex justify-end p-4 border-t">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            @click="copyPreviewContent"
          >
            <i class="ri-clipboard-line mr-1"></i>
            复制内容
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DocumentPickerService, type DocumentFragment, type SelectedContext } from '@/services/document-picker'

// Props
interface Props {
  content: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'close': []
  'selection-change': [context: SelectedContext]
  'use-selection': [content: string, context: SelectedContext]
}>()

// 响应式数据
const pickerService = new DocumentPickerService()
const fragments = ref<DocumentFragment[]>([])
const showPreview = ref(false)
const previewContent = ref('')

// 计算属性
const selectedContext = computed(() => pickerService.getSelectedContext())

// 方法
const parseContent = () => {
  if (props.content.trim()) {
    fragments.value = pickerService.parseDocument(props.content)
  } else {
    fragments.value = []
  }
}

const toggleFragment = (id: string) => {
  pickerService.toggleFragment(id)
  emit('selection-change', selectedContext.value)
}

const selectAll = () => {
  pickerService.selectAll()
  emit('selection-change', selectedContext.value)
}

const clearSelection = () => {
  pickerService.clearSelection()
  emit('selection-change', selectedContext.value)
}

const selectByType = (type: DocumentFragment['type']) => {
  pickerService.selectByType(type)
  emit('selection-change', selectedContext.value)
}

const useSelected = () => {
  const context = selectedContext.value
  if (context.fragments.length > 0) {
    const content = pickerService.exportSelectedContent()
    emit('use-selection', content, context)
  }
}

const previewSelected = () => {
  previewContent.value = pickerService.exportSelectedContent()
  showPreview.value = true
}

const copyPreviewContent = async () => {
  try {
    await navigator.clipboard.writeText(previewContent.value)
    // 可以添加一个成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const getFragmentIcon = (type: DocumentFragment['type']): string => {
  const icons = {
    heading: 'ri-h-1',
    paragraph: 'ri-paragraph',
    list: 'ri-list-unordered',
    code: 'ri-code-s-slash-line',
    table: 'ri-table-line',
    quote: 'ri-double-quotes-l',
    custom: 'ri-file-text-line'
  }
  return icons[type] || 'ri-file-text-line'
}

const getFragmentTypeClass = (type: DocumentFragment['type']): string => {
  const classes = {
    heading: 'border-l-4 border-l-blue-400',
    paragraph: 'border-l-4 border-l-gray-400',
    list: 'border-l-4 border-l-green-400',
    code: 'border-l-4 border-l-purple-400',
    table: 'border-l-4 border-l-orange-400',
    quote: 'border-l-4 border-l-yellow-400',
    custom: 'border-l-4 border-l-gray-400'
  }
  return classes[type] || 'border-l-4 border-l-gray-400'
}

const getTypeLabel = (type: DocumentFragment['type']): string => {
  const labels = {
    heading: '标题',
    paragraph: '段落',
    list: '列表',
    code: '代码',
    table: '表格',
    quote: '引用',
    custom: '自定义'
  }
  return labels[type] || '未知'
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 监听内容变化
watch(
  () => props.content,
  () => {
    parseContent()
  },
  { immediate: true }
)
</script>

<style scoped>
.fragment-item {
  transition: all 0.2s ease;
}

.fragment-item:hover {
  transform: translateY(-1px);
}

.fragment-item.bg-blue-50 {
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
}

/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>