<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
      <!-- 模态框头部 -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">批量导入预览</h2>
          <p class="text-sm text-gray-600 mt-1">
            共 {{ bulkTerms.length }} 条记录，其中 {{ duplicateCount }} 条存在重复或相似项
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
          <!-- 搜索框 -->
          <div class="flex-1 max-w-md">
            <div class="relative">
              <i class="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="搜索术语..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <!-- 过滤和操作按钮 -->
          <div class="flex space-x-2">
            <select 
              v-model="statusFilter" 
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">全部</option>
              <option value="no-duplicates">无重复</option>
              <option value="exact-duplicates">精确重复</option>
              <option value="fuzzy-duplicates">相似</option>
            </select>
            
            <button 
              @click="selectAllNoDuplicates" 
              class="px-4 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
            >
              选择无重复项
            </button>
            
            <button 
              @click="toggleSelectAll" 
              class="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
            >
              {{ allSelected ? '取消全选' : '全选' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="p-4 bg-blue-50 border-b border-gray-200">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div class="text-center">
            <div class="font-bold text-xl text-gray-900">{{ filteredTerms.length }}</div>
            <div class="text-gray-600">显示中</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-green-600">{{ noDuplicatesCount }}</div>
            <div class="text-gray-600">无重复</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-red-600">{{ exactDuplicatesCount }}</div>
            <div class="text-gray-600">精确重复</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-yellow-600">{{ fuzzyDuplicatesCount }}</div>
            <div class="text-gray-600">相似</div>
          </div>
        </div>
      </div>

      <!-- 表格区域 -->
      <div class="flex-1 overflow-hidden">
        <div class="h-full overflow-auto">
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
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">行号</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英文术语</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文术语</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">分类</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">查重状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="(term, index) in filteredTerms" 
                :key="index" 
                :class="{
                  'bg-red-50': term.hasDuplicates && term.duplicateResult?.exactDuplicates?.length > 0,
                  'bg-yellow-50': term.hasDuplicates && term.duplicateResult?.fuzzyDuplicates?.length > 0 && !term.duplicateResult?.exactDuplicates?.length,
                  'bg-green-50': !term.hasDuplicates
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
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">{{ term.rowIndex }}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  <div class="max-w-xs truncate" :title="term.english_term">
                    {{ term.english_term }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="max-w-xs truncate" :title="term.chinese_term">
                    {{ term.chinese_term }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div class="max-w-xs truncate" :title="getCategoryName(term.category_id)">
                    {{ getCategoryName(term.category_id) }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span v-if="!term.hasDuplicates" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i class="ri-checkbox-circle-line mr-1"></i>
                    无重复
                  </span>
                  <span v-else-if="term.duplicateResult?.exactDuplicates?.length > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <i class="ri-error-warning-line mr-1"></i>
                    精确重复 ({{ term.duplicateResult.exactDuplicates.length }})
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <i class="ri-alert-line mr-1"></i>
                    相似 ({{ term.duplicateResult?.fuzzyDuplicates?.length || 0 }})
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <button 
                    v-if="term.hasDuplicates"
                    @click="showDuplicateDetails(term)"
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
            <i class="ri-file-list-line text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">没有找到匹配的记录</p>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="p-6 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            已选择 <span class="font-semibold text-orange-600">{{ selectedCount }}</span> 条记录进行导入
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
              {{ loading ? '导入中...' : `确认导入 ${selectedCount} 条` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 重复详情模态框 -->
    <div v-if="showingDuplicateDetail" class="fixed inset-0 bg-black bg-opacity-75 z-60 flex justify-center items-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">重复详情</h3>
            <button 
              @click="showingDuplicateDetail = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>
          
          <div v-if="duplicateDetailTerm" class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-medium text-blue-900 mb-2">待导入术语</h4>
              <p><strong>英文:</strong> {{ duplicateDetailTerm.english_term }}</p>
              <p><strong>中文:</strong> {{ duplicateDetailTerm.chinese_term }}</p>
              <p><strong>分类:</strong> {{ getCategoryName(duplicateDetailTerm.category_id) }}</p>
            </div>
            
            <div v-if="duplicateDetailTerm.duplicateResult?.exactDuplicates?.length > 0">
              <h4 class="font-medium text-red-700 mb-2">精确重复的现有术语</h4>
              <div class="space-y-2">
                <div 
                  v-for="duplicate in duplicateDetailTerm.duplicateResult.exactDuplicates" 
                  :key="duplicate.id"
                  class="bg-red-50 p-3 rounded border border-red-200"
                >
                  <p><strong>英文:</strong> {{ duplicate.english_term }}</p>
                  <p><strong>中文:</strong> {{ duplicate.chinese_term }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="duplicateDetailTerm.duplicateResult?.fuzzyDuplicates?.length > 0">
              <h4 class="font-medium text-yellow-700 mb-2">相似的现有术语</h4>
              <div class="space-y-2">
                <div 
                  v-for="similar in duplicateDetailTerm.duplicateResult.fuzzyDuplicates" 
                  :key="similar.id"
                  class="bg-yellow-50 p-3 rounded border border-yellow-200"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <p><strong>英文:</strong> {{ similar.english_term }}</p>
                      <p><strong>中文:</strong> {{ similar.chinese_term }}</p>
                    </div>
                    <div class="text-sm text-yellow-600">
                      相似度: {{ Math.max(similar.englishSimilarity || 0, similar.chineseSimilarity || 0).toFixed(2) }}
                    </div>
                  </div>
                </div>
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

interface BulkTerm {
  english_term: string
  chinese_term: string
  category_id: string
  status: string
  rowIndex: number
  selected: boolean
  hasDuplicates: boolean
  duplicateResult?: {
    exactDuplicates?: any[]
    fuzzyDuplicates?: any[]
  }
}

interface Props {
  modelValue: boolean
  bulkTerms: BulkTerm[]
  categories: any[]
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm-import': [selectedTerms: BulkTerm[]]
}>()

// 搜索和过滤状态
const searchQuery = ref('')
const statusFilter = ref('all')
const showingDuplicateDetail = ref<BulkTerm | null>(null)

// 计算属性
const filteredTerms = computed(() => {
  let filtered = props.bulkTerms

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(term => 
      term.english_term.toLowerCase().includes(query) ||
      term.chinese_term.toLowerCase().includes(query)
    )
  }

  // 状态过滤
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(term => {
      switch (statusFilter.value) {
        case 'no-duplicates':
          return !term.hasDuplicates
        case 'exact-duplicates':
          return term.duplicateResult?.exactDuplicates?.length > 0
        case 'fuzzy-duplicates':
          return term.duplicateResult?.fuzzyDuplicates?.length > 0 && !term.duplicateResult?.exactDuplicates?.length
        default:
          return true
      }
    })
  }

  return filtered
})

const selectedCount = computed(() => props.bulkTerms.filter(term => term.selected).length)
const duplicateCount = computed(() => props.bulkTerms.filter(term => term.hasDuplicates).length)
const noDuplicatesCount = computed(() => props.bulkTerms.filter(term => !term.hasDuplicates).length)
const exactDuplicatesCount = computed(() => props.bulkTerms.filter(term => term.duplicateResult?.exactDuplicates?.length > 0).length)
const fuzzyDuplicatesCount = computed(() => props.bulkTerms.filter(term => term.duplicateResult?.fuzzyDuplicates?.length > 0 && !term.duplicateResult?.exactDuplicates?.length).length)

const allSelected = computed(() => props.bulkTerms.length > 0 && props.bulkTerms.every(term => term.selected))
const allFiltered = computed(() => filteredTerms.value.length > 0 && filteredTerms.value.every(term => term.selected))

const duplicateDetailTerm = computed(() => showingDuplicateDetail.value)

// 方法
const getCategoryName = (categoryId: string) => {
  const category = props.categories.find(c => c.id === categoryId)
  return category ? category.name_zh : '未知分类'
}

const toggleSelectAll = () => {
  const newSelectState = !allSelected.value
  props.bulkTerms.forEach(term => {
    term.selected = newSelectState
  })
}

const toggleSelectAllFiltered = () => {
  const newSelectState = !allFiltered.value
  filteredTerms.value.forEach(term => {
    term.selected = newSelectState
  })
}

const selectAllNoDuplicates = () => {
  props.bulkTerms.forEach(term => {
    term.selected = !term.hasDuplicates
  })
}

const showDuplicateDetails = (term: BulkTerm) => {
  showingDuplicateDetail.value = term
}

const confirmImport = () => {
  const selectedTerms = props.bulkTerms.filter(term => term.selected)
  emit('confirm-import', selectedTerms)
}

// 监听模态框关闭时重置搜索
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
    statusFilter.value = 'all'
    showingDuplicateDetail.value = null
  }
})
</script>