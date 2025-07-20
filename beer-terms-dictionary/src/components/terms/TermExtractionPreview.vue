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
              @click="startDuplicateCheck" 
              :disabled="localLoading || manualDuplicateChecking"
              class="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
            >
              {{ manualDuplicateChecking ? '查重中...' : '启动查重检查' }}
            </button>
            <button 
              v-if="duplicateGroups.length > 0"
              @click="showDuplicateModal = true"
              class="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              管理重复项 ({{ duplicateGroups.length }})
            </button>
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
        <div class="grid grid-cols-2 sm:grid-cols-6 gap-4 text-sm">
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
            <div class="font-bold text-xl text-orange-600">{{ duplicateCount }}</div>
            <div class="text-gray-600">重复项</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-xl text-blue-600">{{ selectedCount }}</div>
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
                  'bg-green-50': term.confidence >= 0.8 && !term.hasDuplicates,
                  'bg-yellow-50': term.confidence >= 0.6 && term.confidence < 0.8 && !term.hasDuplicates,
                  'bg-red-50': term.confidence < 0.6 && !term.hasDuplicates,
                  'bg-orange-100 border-l-4 border-orange-500': term.hasDuplicates
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
                  <div class="max-w-xs flex items-center">
                    <span>{{ term.english_term }}</span>
                    <span v-if="term.hasDuplicates" class="ml-2 px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded-full">
                      重复
                    </span>
                  </div>
                  <div v-if="term.context_english" class="text-xs text-gray-500 mt-1 italic">
                    "{{ truncateContext(term.context_english) }}"
                  </div>
                  <div v-if="term.hasDuplicates && term.duplicateResult" class="text-xs text-orange-600 mt-1">
                    <div v-if="term.duplicateResult.exactDuplicates.length > 0">
                      精确重复: {{ term.duplicateResult.exactDuplicates.length }} 项
                    </div>
                    <div v-if="term.duplicateResult.fuzzyDuplicates.length > 0">
                      相似重复: {{ term.duplicateResult.fuzzyDuplicates.length }} 项
                    </div>
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

    <!-- 重复项管理模态框 -->
    <div v-if="showDuplicateModal" class="fixed inset-0 bg-black bg-opacity-75 z-80 flex justify-center items-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold">重复项管理</h3>
            <button 
              @click="showDuplicateModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <i class="ri-close-line text-xl"></i>
            </button>
          </div>
          
          <div class="space-y-6">
            <div 
              v-for="(group, index) in duplicateGroups" 
              :key="index"
              class="border border-gray-200 rounded-lg p-4"
            >
              <h4 class="font-semibold text-gray-900 mb-3">
                重复组 {{ index + 1 }} - {{ group.type === 'exact' ? '精确重复' : group.type === 'fuzzy' ? '相似重复' : '内部重复' }}
              </h4>
              
              <div class="space-y-3">
                <div 
                  v-for="(item, itemIndex) in group.items" 
                  :key="itemIndex"
                  class="flex items-center justify-between p-3 rounded border"
                  :class="{
                    'bg-green-50 border-green-200': item.selected,
                    'bg-gray-50 border-gray-200': !item.selected,
                    'bg-blue-50 border-blue-200': item.isFromDatabase
                  }"
                >
                  <div class="flex-1">
                    <div class="flex items-center space-x-4">
                      <input 
                        type="radio" 
                        :name="`group_${index}`"
                        :value="itemIndex"
                        v-model="group.selectedIndex"
                        class="h-4 w-4 text-orange-600 focus:ring-orange-500"
                      />
                      <div class="flex-1">
                        <div class="flex space-x-4">
                          <div class="flex-1">
                            <label class="block text-xs font-medium text-gray-700">英文术语</label>
                            <div class="font-medium">{{ item.english_term }}</div>
                          </div>
                          <div class="flex-1">
                            <label class="block text-xs font-medium text-gray-700">中文术语</label>
                            <div>{{ item.chinese_term }}</div>
                          </div>
                          <div class="w-32">
                            <label class="block text-xs font-medium text-gray-700">分类</label>
                            <div class="text-sm">{{ getCategoryName(item.category_id) }}</div>
                          </div>
                        </div>
                        <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span v-if="item.confidence">置信度: {{ (item.confidence * 100).toFixed(0) }}%</span>
                          <span v-if="item.isFromDatabase" class="text-blue-600">数据库中的术语</span>
                          <span v-else class="text-green-600">当前导入的术语</span>
                          <span v-if="item.similarity">相似度: {{ (item.similarity * 100).toFixed(0) }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4">
                    <button
                      @click="item.selected = group.selectedIndex === itemIndex"
                      class="text-xs text-blue-600 hover:text-blue-800"
                    >
                      选择此项
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-between items-center mt-6 pt-4 border-t">
            <div class="text-sm text-gray-600">
              共 {{ duplicateGroups.length }} 个重复组，请选择每组中要保留的术语
            </div>
            <div class="flex space-x-3">
              <button 
                @click="showDuplicateModal = false"
                class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                @click="applyDuplicateResolution"
                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                应用选择
              </button>
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
  hasDuplicates?: boolean
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

// 本地loading状态（用于查重）
const localLoading = ref(false)

// 手动查重相关状态
const manualDuplicateChecking = ref(false)
const showDuplicateModal = ref(false)
const duplicateGroups = ref<DuplicateGroup[]>([])

// 重复项组接口
interface DuplicateGroup {
  type: 'exact' | 'fuzzy' | 'internal'
  items: DuplicateItem[]
  selectedIndex: number
}

interface DuplicateItem {
  english_term: string
  chinese_term: string
  category_id: string
  confidence?: number
  isFromDatabase: boolean
  selected: boolean
  similarity?: number
  originalIndex?: number
}

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
watch(() => props.extractedTerms, async (newTerms) => {
  if (newTerms.length === 0) {
    termsWithSelection.value = []
    return
  }

  console.log('处理提取的术语，跳过自动查重')
  
  // 1. 仅进行基于英文术语的去重
  const deduplicatedTerms = removeDuplicatesByEnglishTerm(newTerms)
  console.log(`去重前: ${newTerms.length} 个术语，去重后: ${deduplicatedTerms.length} 个术语`)
  
  // 2. 设置选择状态（默认选择高置信度的术语）
  termsWithSelection.value = deduplicatedTerms.map(term => ({
    ...term,
    selected: term.confidence >= 0.8,
    hasDuplicates: false,
    duplicateResult: null
  }))
}, { immediate: true })

// 基于英文术语去重的函数
const removeDuplicatesByEnglishTerm = (terms: ClassifiedTerm[]): ClassifiedTerm[] => {
  const seenEnglishTerms = new Set<string>()
  const uniqueTerms: ClassifiedTerm[] = []
  
  for (const term of terms) {
    const normalizedEnglish = term.english_term.toLowerCase().trim()
    
    if (!seenEnglishTerms.has(normalizedEnglish)) {
      seenEnglishTerms.add(normalizedEnglish)
      uniqueTerms.push(term)
    } else {
      console.log(`跳过重复的英文术语: "${term.english_term}"`)
    }
  }
  
  return uniqueTerms
}

// 执行数据库查重检查
const performDuplicateCheck = async (terms: ClassifiedTerm[]): Promise<ClassifiedTerm[]> => {
  try {
    // 导入查重服务
    const { TermsService } = await import('@/services/termsService')
    
    const termsWithDuplicateCheck: ClassifiedTerm[] = []
    
    for (const term of terms) {
      try {
        // 检查精确重复（主要检查英文术语）
        const exactDuplicates = await TermsService.checkExactDuplicate(term.english_term, term.chinese_term)
        
        // 检查模糊重复（主要检查英文术语）
        const fuzzyDuplicates = await TermsService.checkFuzzyDuplicate(term.english_term, term.chinese_term, 0.85)
        
        const duplicateResult = {
          exactDuplicates,
          fuzzyDuplicates,
          hasDuplicates: exactDuplicates.length > 0 || fuzzyDuplicates.length > 0
        }
        
        termsWithDuplicateCheck.push({
          ...term,
          duplicateResult,
          hasDuplicates: duplicateResult.hasDuplicates
        })
        
      } catch (error) {
        console.error(`术语 "${term.english_term}" 查重失败:`, error)
        termsWithDuplicateCheck.push({
          ...term,
          duplicateResult: {
            exactDuplicates: [],
            fuzzyDuplicates: [],
            hasDuplicates: false
          },
          hasDuplicates: false
        })
      }
    }
    
    return termsWithDuplicateCheck
    
  } catch (error) {
    console.error('查重过程失败:', error)
    // 查重失败时返回原术语
    return terms.map(term => ({
      ...term,
      duplicateResult: {
        exactDuplicates: [],
        fuzzyDuplicates: [],
        hasDuplicates: false
      },
      hasDuplicates: false
    }))
  }
}

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
const duplicateCount = computed(() => termsWithSelection.value.filter(term => term.hasDuplicates).length)

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

// 手动启动查重检查
const startDuplicateCheck = async () => {
  if (termsWithSelection.value.length === 0) {
    alert('没有术语需要查重')
    return
  }

  manualDuplicateChecking.value = true
  duplicateGroups.value = []

  try {
    console.log('开始手动查重检查...')
    const { TermsService } = await import('@/services/termsService')
    
    // 1. 检查当前导入术语之间的重复
    const internalDuplicates = findInternalDuplicates(termsWithSelection.value)
    console.log(`发现内部重复组: ${internalDuplicates.length}`)
    
    // 2. 检查与数据库的重复
    const databaseDuplicates = await findDatabaseDuplicates(termsWithSelection.value, TermsService)
    console.log(`发现数据库重复组: ${databaseDuplicates.length}`)
    
    // 3. 合并重复组
    duplicateGroups.value = [...internalDuplicates, ...databaseDuplicates]
    
    // 4. 更新术语的重复状态
    updateTermDuplicateStatus()
    
    if (duplicateGroups.value.length > 0) {
      console.log(`总共发现 ${duplicateGroups.value.length} 个重复组`)
    } else {
      alert('未发现重复术语，可以安全导入')
    }
    
  } catch (error) {
    console.error('查重检查失败:', error)
    alert('查重检查失败，请重试')
  } finally {
    manualDuplicateChecking.value = false
  }
}

// 查找内部重复（当前导入术语之间的重复）
const findInternalDuplicates = (terms: TermWithSelection[]): DuplicateGroup[] => {
  const groups: DuplicateGroup[] = []
  const processed = new Set<number>()
  
  for (let i = 0; i < terms.length; i++) {
    if (processed.has(i)) continue
    
    const term1 = terms[i]
    const duplicates: DuplicateItem[] = [{
      english_term: term1.english_term,
      chinese_term: term1.chinese_term,
      category_id: term1.category_id,
      confidence: term1.confidence,
      isFromDatabase: false,
      selected: false,
      originalIndex: i
    }]
    
    for (let j = i + 1; j < terms.length; j++) {
      if (processed.has(j)) continue
      
      const term2 = terms[j]
      const similarity = calculateTermSimilarity(term1, term2)
      
      if (similarity.isExact) {
        duplicates.push({
          english_term: term2.english_term,
          chinese_term: term2.chinese_term,
          category_id: term2.category_id,
          confidence: term2.confidence,
          isFromDatabase: false,
          selected: false,
          similarity: 1.0,
          originalIndex: j
        })
        processed.add(j)
      } else if (similarity.isSimilar) {
        duplicates.push({
          english_term: term2.english_term,
          chinese_term: term2.chinese_term,
          category_id: term2.category_id,
          confidence: term2.confidence,
          isFromDatabase: false,
          selected: false,
          similarity: similarity.score,
          originalIndex: j
        })
        processed.add(j)
      }
    }
    
    if (duplicates.length > 1) {
      groups.push({
        type: 'internal',
        items: duplicates,
        selectedIndex: 0 // 默认选择第一个
      })
      processed.add(i)
    }
  }
  
  return groups
}

// 查找与数据库的重复
const findDatabaseDuplicates = async (terms: TermWithSelection[], TermsService: any): Promise<DuplicateGroup[]> => {
  const groups: DuplicateGroup[] = []
  
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i]
    
    try {
      // 检查精确重复
      const exactDuplicates = await TermsService.checkExactDuplicate(term.english_term, term.chinese_term)
      
      // 检查模糊重复
      const fuzzyDuplicates = await TermsService.checkFuzzyDuplicate(term.english_term, term.chinese_term, 0.85)
      
      if (exactDuplicates.length > 0 || fuzzyDuplicates.length > 0) {
        const duplicateItems: DuplicateItem[] = []
        
        // 添加当前导入的术语
        duplicateItems.push({
          english_term: term.english_term,
          chinese_term: term.chinese_term,
          category_id: term.category_id,
          confidence: term.confidence,
          isFromDatabase: false,
          selected: false,
          originalIndex: i
        })
        
        // 添加数据库中的精确重复
        exactDuplicates.forEach((dbTerm: any) => {
          duplicateItems.push({
            english_term: dbTerm.english_term,
            chinese_term: dbTerm.chinese_term,
            category_id: dbTerm.category_id,
            isFromDatabase: true,
            selected: false,
            similarity: 1.0
          })
        })
        
        // 添加数据库中的模糊重复
        fuzzyDuplicates.forEach((dbTerm: any) => {
          duplicateItems.push({
            english_term: dbTerm.english_term,
            chinese_term: dbTerm.chinese_term,
            category_id: dbTerm.category_id,
            isFromDatabase: true,
            selected: false,
            similarity: Math.max(dbTerm.englishSimilarity || 0, dbTerm.chineseSimilarity || 0)
          })
        })
        
        groups.push({
          type: exactDuplicates.length > 0 ? 'exact' : 'fuzzy',
          items: duplicateItems,
          selectedIndex: 1 // 默认选择数据库中的术语
        })
      }
    } catch (error) {
      console.error(`术语 "${term.english_term}" 查重失败:`, error)
    }
  }
  
  return groups
}

// 计算术语相似度
const calculateTermSimilarity = (term1: TermWithSelection, term2: TermWithSelection) => {
  const english1 = term1.english_term.toLowerCase().trim()
  const english2 = term2.english_term.toLowerCase().trim()
  const chinese1 = term1.chinese_term.toLowerCase().trim()
  const chinese2 = term2.chinese_term.toLowerCase().trim()
  
  const isExact = (english1 === english2) || (chinese1 === chinese2)
  
  // 简单的相似度计算
  const englishSim = calculateStringSimilarity(english1, english2)
  const chineseSim = calculateStringSimilarity(chinese1, chinese2)
  const maxSim = Math.max(englishSim, chineseSim)
  
  return {
    isExact,
    isSimilar: maxSim >= 0.85,
    score: maxSim
  }
}

// 计算字符串相似度
const calculateStringSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0

  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  const maxLength = Math.max(str1.length, str2.length)
  return (maxLength - matrix[str2.length][str1.length]) / maxLength
}

// 更新术语重复状态
const updateTermDuplicateStatus = () => {
  // 重置所有术语的重复状态
  termsWithSelection.value.forEach(term => {
    term.hasDuplicates = false
  })
  
  // 根据重复组更新状态
  duplicateGroups.value.forEach(group => {
    group.items.forEach(item => {
      if (!item.isFromDatabase && typeof item.originalIndex === 'number') {
        const term = termsWithSelection.value[item.originalIndex]
        if (term) {
          term.hasDuplicates = true
        }
      }
    })
  })
}

// 应用重复项解决方案
const applyDuplicateResolution = () => {
  // 根据用户选择更新术语状态
  duplicateGroups.value.forEach(group => {
    const selectedItem = group.items[group.selectedIndex]
    
    group.items.forEach((item, index) => {
      if (!item.isFromDatabase && typeof item.originalIndex === 'number') {
        const term = termsWithSelection.value[item.originalIndex]
        if (term) {
          // 如果选择的是数据库中的术语，则取消选择当前导入的术语
          if (selectedItem.isFromDatabase) {
            term.selected = false
          } else {
            // 如果选择的是当前导入的术语，只保留选中的那个
            term.selected = index === group.selectedIndex
          }
        }
      }
    })
  })
  
  showDuplicateModal.value = false
  alert('重复项处理完成！已根据您的选择更新术语状态。')
}

const confirmImport = async () => {
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

  if (selectedTerms.length === 0) {
    alert('请选择要导入的术语')
    return
  }

  // 直接导入，不再进行自动查重
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