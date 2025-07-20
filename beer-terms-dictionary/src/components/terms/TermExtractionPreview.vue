<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-75 z-60 flex justify-center items-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
      <!-- 模态框头部 -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">AI提取结果预览</h2>
          <p class="text-sm text-gray-600 mt-1">
            AI已从文章中提取 {{ extractedTerms.length }} 个啤酒相关术语，请审核分类并选择导入
          </p>
        </div>
        <button 
          @click="$emit('update:modelValue', false)"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>

      <!-- 工具栏 -->
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <!-- 搜索和过滤 -->
          <div class="flex space-x-3">
            <div class="relative">
              <i class="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="搜索术语..."
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <select 
              v-model="categoryFilter" 
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">全部分类</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name_zh }}
              </option>
            </select>
            
            <select 
              v-model="confidenceFilter" 
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">全部置信度</option>
              <option value="high">高置信度 (>0.8)</option>
              <option value="medium">中等置信度 (0.6-0.8)</option>
              <option value="low">低置信度 (<0.6)</option>
            </select>
          </div>
          
          <!-- 批量操作 -->
          <div class="flex space-x-2">
            <button 
              @click="selectHighConfidence" 
              class="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              选择高置信度
            </button>
            <button 
              @click="toggleSelectAll" 
              class="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {{ allSelected ? '取消全选' : '全选' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="p-4 bg-blue-50 border-b border-gray-200">
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
          <div class="text-center">
            <div class="font-bold text-xl text-gray-900">{{ filteredTerms.length }}</div>
            <div class="text-gray-600">显示中</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-green-600">{{ highConfidenceCount }}</div>
            <div class="text-gray-600">高置信度</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-yellow-600">{{ mediumConfidenceCount }}</div>
            <div class="text-gray-600">中等置信度</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-red-600">{{ lowConfidenceCount }}</div>
            <div class="text-gray-600">低置信度</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-orange-600">{{ selectedCount }}</div>
            <div class="text-gray-600">已选择</div>
          </div>
        </div>
      </div>

      <!-- 术语列表 -->
      <div class="flex-1 overflow-hidden min-h-0 relative">
        <div 
          class="h-full overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          @scroll="handleScroll"
        >
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  <input 
                    type="checkbox" 
                    :checked="allFiltered"
                    @change="toggleSelectAllFiltered"
                    class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英文术语</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文术语</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">分类</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">置信度</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="(term, index) in filteredTerms" 
                :key="index" 
                :class="{
                  'bg-green-50': term.confidence >= 0.8,
                  'bg-yellow-50': term.confidence >= 0.6 && term.confidence < 0.8,
                  'bg-red-50': term.confidence < 0.6
                }"
                class="hover:bg-opacity-80 transition-colors"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    v-model="term.selected"
                    class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  <div class="max-w-xs">
                    {{ term.english_term }}
                  </div>
                  <div v-if="term.context_english" class="text-xs text-gray-500 mt-1 italic">
                    "{{ truncateContext(term.context_english) }}"
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="max-w-xs">
                    {{ term.chinese_term }}
                  </div>
                  <div v-if="term.context_chinese" class="text-xs text-gray-500 mt-1 italic">
                    "{{ truncateContext(term.context_chinese) }}"
                  </div>
                </td>
                <td class="px-4 py-3 text-sm">
                  <select 
                    v-model="term.category_id"
                    @change="updateCategoryName(term)"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">选择分类</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name_zh }}
                    </option>
                  </select>
                  <div class="text-xs text-gray-500 mt-1">
                    分类置信度: {{ ((term.classification_confidence || 0) * 100).toFixed(0) }}%
                  </div>
                </td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex flex-col items-center">
                    <div 
                      class="w-full bg-gray-200 rounded-full h-2"
                      :title="`提取置信度: ${(term.confidence * 100).toFixed(1)}%`"
                    >
                      <div 
                        class="h-2 rounded-full"
                        :class="getConfidenceColor(term.confidence)"
                        :style="{ width: `${term.confidence * 100}%` }"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-600 mt-1">
                      {{ (term.confidence * 100).toFixed(0) }}%
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm">
                  <button 
                    @click="showTermDetail(term)"
                    class="text-blue-600 hover:text-blue-900 text-xs"
                  >
                    详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- 空状态 -->
          <div v-if="filteredTerms.length === 0" class="text-center py-12">
            <i class="ri-search-line text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">没有找到匹配的术语</p>
          </div>
        </div>
        
        <!-- 滚动提示 -->
        <div 
          v-if="filteredTerms.length > 5 && showScrollHint" 
          class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none flex items-end justify-center pb-1"
        >
          <div class="text-xs text-gray-400 flex items-center">
            <i class="ri-arrow-down-line mr-1 animate-bounce"></i>
            向下滚动查看更多
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="p-6 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            已选择 <span class="font-semibold text-orange-600">{{ selectedCount }}</span> 个术语进行导入
          </div>
          <div class="flex space-x-3">
            <button 
              @click="$emit('update:modelValue', false)"
              class="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              取消
            </button>
            <button 
              @click="confirmImport"
              :disabled="selectedCount === 0 || loading"
              class="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {{ loading ? '处理中...' : `确认导入 ${selectedCount} 个术语` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 术语详情模态框 -->
    <div v-if="selectedTermForDetail" class="fixed inset-0 bg-black bg-opacity-75 z-70 flex justify-center items-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">术语详情</h3>
            <button 
              @click="selectedTermForDetail = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">英文术语</label>
                <div class="p-3 bg-gray-50 rounded border">{{ selectedTermForDetail.english_term }}</div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">中文术语</label>
                <div class="p-3 bg-gray-50 rounded border">{{ selectedTermForDetail.chinese_term }}</div>
              </div>
            </div>
            
            <div v-if="selectedTermForDetail.context_english">
              <label class="block text-sm font-medium text-gray-700 mb-1">英文上下文</label>
              <div class="p-3 bg-gray-50 rounded border text-sm italic">
                "{{ selectedTermForDetail.context_english }}"
              </div>
            </div>
            
            <div v-if="selectedTermForDetail.context_chinese">
              <label class="block text-sm font-medium text-gray-700 mb-1">中文上下文</label>
              <div class="p-3 bg-gray-50 rounded border text-sm italic">
                "{{ selectedTermForDetail.context_chinese }}"
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">提取置信度</label>
                <div class="flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-3 mr-2">
                    <div 
                      class="h-3 rounded-full"
                      :class="getConfidenceColor(selectedTermForDetail.confidence)"
                      :style="{ width: `${selectedTermForDetail.confidence * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium">{{ (selectedTermForDetail.confidence * 100).toFixed(1) }}%</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">分类置信度</label>
                <div class="flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-3 mr-2">
                    <div 
                      class="h-3 rounded-full bg-blue-500"
                      :style="{ width: `${(selectedTermForDetail.classification_confidence || 0) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium">{{ ((selectedTermForDetail.classification_confidence || 0) * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">当前分类</label>
              <div class="p-3 bg-gray-50 rounded border">
                {{ getCategoryName(selectedTermForDetail.category_id) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ClassifiedTerm } from '@/services/aiService'

interface TermWithSelection extends ClassifiedTerm {
  selected?: boolean
}

interface Props {
  modelValue: boolean
  extractedTerms: ClassifiedTerm[]
  categories: any[]
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm-import': [terms: ClassifiedTerm[]]
}>()

// 搜索和过滤状态
const searchQuery = ref('')
const categoryFilter = ref('')
const confidenceFilter = ref('')
const selectedTermForDetail = ref<ClassifiedTerm | null>(null)

// 滚动状态
const showScrollHint = ref(true)

// 处理滚动事件
const handleScroll = (event: Event) => {
  const target = event.target as HTMLDivElement
  const { scrollTop, scrollHeight, clientHeight } = target
  // 当滚动到底部或接近底部时隐藏提示
  showScrollHint.value = scrollTop < scrollHeight - clientHeight - 20
}

// 处理术语选择状态
const termsWithSelection = ref<TermWithSelection[]>([])

// 监听提取的术语变化
watch(() => props.extractedTerms, (newTerms) => {
  termsWithSelection.value = newTerms.map(term => ({
    ...term,
    selected: term.confidence >= 0.8 // 默认选择高置信度术语
  }))
}, { immediate: true })

// 计算属性
const filteredTerms = computed(() => {
  let filtered = termsWithSelection.value

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(term => 
      term.english_term.toLowerCase().includes(query) ||
      term.chinese_term.toLowerCase().includes(query)
    )
  }

  // 分类过滤
  if (categoryFilter.value) {
    filtered = filtered.filter(term => term.category_id === categoryFilter.value)
  }

  // 置信度过滤
  if (confidenceFilter.value) {
    filtered = filtered.filter(term => {
      switch (confidenceFilter.value) {
        case 'high':
          return term.confidence > 0.8
        case 'medium':
          return term.confidence >= 0.6 && term.confidence <= 0.8
        case 'low':
          return term.confidence < 0.6
        default:
          return true
      }
    })
  }

  return filtered
})

const selectedCount = computed(() => termsWithSelection.value.filter(term => term.selected).length)
const highConfidenceCount = computed(() => termsWithSelection.value.filter(term => term.confidence > 0.8).length)
const mediumConfidenceCount = computed(() => termsWithSelection.value.filter(term => term.confidence >= 0.6 && term.confidence <= 0.8).length)
const lowConfidenceCount = computed(() => termsWithSelection.value.filter(term => term.confidence < 0.6).length)

const allSelected = computed(() => termsWithSelection.value.length > 0 && termsWithSelection.value.every(term => term.selected))
const allFiltered = computed(() => filteredTerms.value.length > 0 && filteredTerms.value.every(term => term.selected))

// 方法
const getCategoryName = (categoryId: string) => {
  const category = props.categories.find(c => c.id === categoryId)
  return category ? category.name_zh : '未分类'
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-500'
  if (confidence >= 0.6) return 'bg-yellow-500'
  return 'bg-red-500'
}

const truncateContext = (context: string, maxLength: number = 50) => {
  if (context.length <= maxLength) return context
  return context.substring(0, maxLength) + '...'
}

const toggleSelectAll = () => {
  const newSelectState = !allSelected.value
  termsWithSelection.value.forEach(term => {
    term.selected = newSelectState
  })
}

const toggleSelectAllFiltered = () => {
  const newSelectState = !allFiltered.value
  filteredTerms.value.forEach(term => {
    term.selected = newSelectState
  })
}

const selectHighConfidence = () => {
  termsWithSelection.value.forEach(term => {
    term.selected = term.confidence >= 0.8
  })
}

const updateCategoryName = (term: TermWithSelection) => {
  const category = props.categories.find(c => c.id === term.category_id)
  if (category) {
    term.category_name = category.name_zh
  }
}

const showTermDetail = (term: ClassifiedTerm) => {
  selectedTermForDetail.value = term
}

const confirmImport = () => {
  const selectedTerms = termsWithSelection.value
    .filter(term => term.selected)
    .map(term => {
      // 确保分类信息完整
      const category = props.categories.find(c => c.id === term.category_id)
      return {
        ...term,
        category_name: category ? category.name_zh : '其他'
      }
    })
  
  emit('confirm-import', selectedTerms)
}

// 重置状态
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
    categoryFilter.value = ''
    confidenceFilter.value = ''
    selectedTermForDetail.value = null
  } else {
    // 模态框打开时重置滚动提示
    showScrollHint.value = true
  }
})
</script>