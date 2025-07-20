<template>
  <div class="p-8 max-w-2xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">贡献术语</h1>
      <button @click="goBack" class="text-sm font-medium text-gray-600 hover:text-orange-500 flex items-center space-x-1">
        <i class="ri-arrow-left-line"></i>
        <span>返回列表</span>
      </button>
    </div>

    <!-- 单个术语贡献 -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h2 class="text-xl font-semibold mb-4">单个添加</h2>
      <form @submit.prevent="handleSingleSubmit">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">英文术语 *</label>
            <input 
              v-model="singleTerm.english_term" 
              @input="handleTermInput"
              type="text" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">中文术语 *</label>
            <input 
              v-model="singleTerm.chinese_term" 
              @input="handleTermInput"
              type="text" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
            />
          </div>
          <!-- 查重结果展示 -->
          <DuplicateChecker 
            :duplicate-results="duplicateCheckResult" 
            :checking="duplicateChecking"
            :show-no-results-message="showNoDuplicatesMessage"
          />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
            <select v-model="singleTerm.category_id" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option disabled value="">请选择分类</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name_zh }}
              </option>
            </select>
          </div>
        </div>
        <div class="mt-6 text-right">
          <button type="submit" :disabled="loading" class="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50">
            {{ loading ? '提交中...' : '提交' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 批量导入选项 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Excel批量导入 -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center mb-4">
          <i class="ri-file-excel-line text-2xl text-green-600 mr-3"></i>
          <h2 class="text-xl font-semibold">Excel批量导入</h2>
        </div>
        <div class="space-y-4">
        <!-- 文件选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择Excel文件</label>
          <div class="flex items-center space-x-4">
            <input 
              type="file" 
              @change="handleFileUpload" 
              accept=".xlsx, .xls" 
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">
            支持 .xlsx 和 .xls 格式，文件应包含：英文术语、中文术语、分类三列
          </p>
        </div>

        <!-- 处理状态和结果 -->
        <div v-if="processing" class="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <i class="ri-loader-line animate-spin text-blue-500"></i>
          <span class="text-blue-700">正在处理文件并检查重复...</span>
        </div>

        <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="ri-error-warning-line text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">处理失败</span>
          </div>
          <p class="text-red-600 text-sm mt-1">{{ error }}</p>
        </div>

        <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <i class="ri-checkbox-circle-line text-green-500 mr-2"></i>
            <span class="text-green-700 font-medium">导入成功</span>
          </div>
          <p class="text-green-600 text-sm mt-1">{{ successMessage }}</p>
        </div>

        <!-- 文件处理完成后的预览按钮 -->
        <div v-if="bulkTerms.length > 0 && !processing" class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-orange-900">文件处理完成</h4>
              <p class="text-sm text-orange-700 mt-1">
                共解析 {{ bulkTerms.length }} 条记录，其中 {{ duplicateCount }} 条存在重复或相似项
              </p>
              <div class="flex space-x-4 mt-2 text-xs">
                <span class="text-green-600">✓ {{ noDuplicatesCount }} 无重复</span>
                <span class="text-red-600">⚠ {{ exactDuplicatesCount }} 精确重复</span>
                <span class="text-yellow-600">~ {{ fuzzyDuplicatesCount }} 相似</span>
              </div>
            </div>
            <button 
              @click="showBulkImportModal = true"
              class="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              预览和选择导入
            </button>
          </div>
        </div>
        </div>
      </div>
      
      <!-- AI文章识别导入 -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center mb-4">
          <i class="ri-robot-line text-2xl text-purple-600 mr-3"></i>
          <h2 class="text-xl font-semibold">AI文章识别导入</h2>
        </div>
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            上传英文原文和中文翻译，AI将自动识别啤酒术语并智能分类
          </p>
          
          <div class="space-y-3">
            <div class="flex items-center text-xs text-gray-500">
              <i class="ri-check-line text-green-500 mr-2"></i>
              <span>支持PDF、Word、Markdown、HTML格式</span>
            </div>
            <div class="flex items-center text-xs text-gray-500">
              <i class="ri-check-line text-green-500 mr-2"></i>
              <span>智能术语提取和自动分类</span>
            </div>
            <div class="flex items-center text-xs text-gray-500">
              <i class="ri-check-line text-green-500 mr-2"></i>
              <span>支持Gemini和Kimi双AI引擎</span>
            </div>
          </div>
          
          <button 
            @click="showArticleImportModal = true"
            class="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          >
            <i class="ri-magic-line mr-2"></i>
            开始AI识别导入
          </button>
        </div>
      </div>
    </div>

    <!-- 批量导入预览模态框 -->
    <BulkImportModal
      v-model="showBulkImportModal"
      :bulk-terms="bulkTerms"
      :categories="categories"
      :loading="loading"
      @confirm-import="handleBulkImport"
    />

    <!-- AI文章识别导入模态框 -->
    <ArticleImportModal
      v-model="showArticleImportModal"
      :categories="categories"
      @terms-extracted="handleAITermsExtracted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { useTermsStore } from '@/stores/terms'
import { TermsService } from '@/services/termsService'
import DuplicateChecker from '@/components/terms/DuplicateChecker.vue'
import BulkImportModal from '@/components/terms/BulkImportModal.vue'
import ArticleImportModal from '@/components/terms/ArticleImportModal.vue'
import type { ClassifiedTerm } from '@/services/aiService'

const termsStore = useTermsStore()
const router = useRouter()

const goBack = () => {
  router.push('/')
}

const singleTerm = ref({
  english_term: '',
  chinese_term: '',
  category_id: ''
})

const bulkTerms = ref<any[]>([])
const loading = ref(false)
const processing = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const showBulkImportModal = ref(false)
const showArticleImportModal = ref(false)

// 查重相关状态
const duplicateChecking = ref(false)
const duplicateCheckResult = ref<any>(null)
const showNoDuplicatesMessage = ref(false)
let duplicateCheckTimeout: any = null

const categories = computed(() => termsStore.categories)

// 批量导入统计计算属性
const duplicateCount = computed(() => bulkTerms.value.filter(term => term.hasDuplicates).length)
const noDuplicatesCount = computed(() => bulkTerms.value.filter(term => !term.hasDuplicates).length)
const exactDuplicatesCount = computed(() => bulkTerms.value.filter(term => term.duplicateResult?.exactDuplicates?.length > 0).length)
const fuzzyDuplicatesCount = computed(() => bulkTerms.value.filter(term => term.duplicateResult?.fuzzyDuplicates?.length > 0 && !term.duplicateResult?.exactDuplicates?.length).length)

onMounted(() => {
  if (categories.value.length === 0) {
    termsStore.fetchCategories()
  }
})

// 防抖处理的查重检查
const handleTermInput = () => {
  // 清空之前的结果
  duplicateCheckResult.value = null
  showNoDuplicatesMessage.value = false
  
  // 清除之前的定时器
  if (duplicateCheckTimeout) {
    clearTimeout(duplicateCheckTimeout)
  }
  
  // 如果输入为空，不进行检查
  if (!singleTerm.value.english_term.trim() && !singleTerm.value.chinese_term.trim()) {
    return
  }
  
  // 设置新的定时器，延迟500ms后执行检查
  duplicateCheckTimeout = setTimeout(checkDuplicates, 500)
}

// 执行查重检查
const checkDuplicates = async () => {
  if (!singleTerm.value.english_term.trim() || !singleTerm.value.chinese_term.trim()) {
    return
  }
  
  try {
    duplicateChecking.value = true
    duplicateCheckResult.value = null
    
    const exactDuplicates = await TermsService.checkExactDuplicate(
      singleTerm.value.english_term.trim(), 
      singleTerm.value.chinese_term.trim()
    )
    
    let fuzzyDuplicates: any[] = []
    if (exactDuplicates.length === 0) {
      fuzzyDuplicates = await TermsService.checkFuzzyDuplicate(
        singleTerm.value.english_term.trim(), 
        singleTerm.value.chinese_term.trim(), 
        0.85
      )
    }
    
    duplicateCheckResult.value = {
      exactDuplicates,
      fuzzyDuplicates
    }
    
    // 如果没有找到重复，显示成功消息
    if (exactDuplicates.length === 0 && fuzzyDuplicates.length === 0) {
      showNoDuplicatesMessage.value = true
      setTimeout(() => {
        showNoDuplicatesMessage.value = false
      }, 3000)
    }
    
  } catch (error) {
    console.error('查重检查失败:', error)
  } finally {
    duplicateChecking.value = false
  }
}

const handleSingleSubmit = async () => {
  loading.value = true
  error.value = null
  successMessage.value = null
  
  try {
    // 提交前最终检查重复
    const exactDuplicates = await TermsService.checkExactDuplicate(
      singleTerm.value.english_term.trim(), 
      singleTerm.value.chinese_term.trim()
    )
    
    // 如果发现精确重复，要求用户确认
    if (exactDuplicates.length > 0) {
      const confirmMessage = `发现以下重复词条：\n${exactDuplicates.map(d => `${d.english_term} / ${d.chinese_term}`).join('\n')}\n\n确定要继续添加吗？`
      if (!confirm(confirmMessage)) {
        loading.value = false
        return
      }
    }
    
    await termsStore.addTerm({
      ...singleTerm.value,
      status: 'approved'
    })
    
    successMessage.value = '术语添加成功！'
    singleTerm.value = { english_term: '', chinese_term: '', category_id: '' }
    duplicateCheckResult.value = null
    showNoDuplicatesMessage.value = false
    await termsStore.fetchTotalTermsCount() // 更新总数
  } catch (err: any) {
    error.value = err.message || '添加失败'
  } finally {
    loading.value = false
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const file = target.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    processExcelData(json as string[][])
  }

  reader.readAsArrayBuffer(file)
}

const processExcelData = async (data: string[][]) => {
  error.value = null
  successMessage.value = null
  processing.value = true
  
  try {
    const termsToImport: any[] = []
    const categoryMap = new Map(categories.value.map(c => [c.name_zh, c.id]))

    // Skip header row if it exists
    const startRow = (data[0] && (data[0][0]?.toLowerCase().includes('english') || data[0][2]?.toLowerCase().includes('category'))) ? 1 : 0;

    for (let i = startRow; i < data.length; i++) {
      const row = data[i]
      if (row && row[0] && row[1] && row[2]) {
        const categoryId = categoryMap.get(row[2].trim())
        if (!categoryId) {
          error.value = `第 ${i + 1} 行的分类 "${row[2]}" 不存在。请检查分类名称。`
          bulkTerms.value = []
          return
        }
        termsToImport.push({
          english_term: row[0].trim(),
          chinese_term: row[1].trim(),
          category_id: categoryId,
          status: 'approved',
          rowIndex: i + 1
        })
      }
    }
    
    // 进行批量查重检查
    console.log('开始批量查重检查...')
    const duplicateResults = await TermsService.checkBatchDuplicates(termsToImport)
    
    // 为每个term添加查重结果和选择状态
    const processedTerms = termsToImport.map((term, index) => ({
      ...term,
      duplicateResult: duplicateResults[index],
      hasDuplicates: duplicateResults[index]?.hasDuplicates || false,
      selected: !duplicateResults[index]?.hasDuplicates // 默认选择无重复的项目
    }))
    
    bulkTerms.value = processedTerms
    
  } catch (err: any) {
    error.value = err.message || '文件处理失败'
    console.error('批量查重失败:', err)
    bulkTerms.value = []
  } finally {
    processing.value = false
  }
}

// 模态框确认导入方法
const handleBulkImport = async (selectedTerms: any[]) => {
  if (selectedTerms.length === 0) return

  loading.value = true
  error.value = null
  successMessage.value = null

  try {
    // 清理掉不需要的属性
    const termsToSubmit = selectedTerms.map(term => ({
      english_term: term.english_term,
      chinese_term: term.chinese_term,
      category_id: term.category_id,
      status: term.status
    }))
    
    // Supabase's insert can take an array of objects for bulk insertion
    await termsStore.addTerm(termsToSubmit)
    
    successMessage.value = `成功导入 ${selectedTerms.length} 条术语！`
    bulkTerms.value = []
    showBulkImportModal.value = false
    await termsStore.fetchTotalTermsCount() // 更新总数
  } catch (err: any) {
    error.value = err.message || '批量导入失败'
  } finally {
    loading.value = false
  }
}

// AI术语提取处理
const handleAITermsExtracted = async (classifiedTerms: ClassifiedTerm[]) => {
  try {
    // 将AI提取的术语转换为批量导入格式
    const termsToProcess = classifiedTerms.map((term, index) => ({
      english_term: term.english_term,
      chinese_term: term.chinese_term,
      category_id: term.category_id,
      status: 'approved',
      rowIndex: index + 1,
      confidence: term.confidence,
      classification_confidence: term.classification_confidence,
      context_english: term.context_english,
      context_chinese: term.context_chinese
    }))

    // 进行查重检查
    processing.value = true
    console.log('开始AI术语查重检查...')
    
    const duplicateResults = await TermsService.checkBatchDuplicates(termsToProcess)
    
    // 为每个term添加查重结果和选择状态
    const processedTerms = termsToProcess.map((term, index) => ({
      ...term,
      duplicateResult: duplicateResults[index],
      hasDuplicates: duplicateResults[index]?.hasDuplicates || false,
      selected: !duplicateResults[index]?.hasDuplicates // 默认选择无重复的项目
    }))
    
    bulkTerms.value = processedTerms
    showBulkImportModal.value = true
    
    // 显示处理结果
    const duplicateCount = processedTerms.filter(t => t.hasDuplicates).length
    if (duplicateCount > 0) {
      successMessage.value = `AI识别完成！提取 ${processedTerms.length} 个术语，其中 ${duplicateCount} 个存在重复或相似项。`
    } else {
      successMessage.value = `AI识别完成！提取 ${processedTerms.length} 个术语，未发现重复项，可以安全导入。`
    }
    
  } catch (error) {
    console.error('AI术语处理失败:', error)
    error.value = error instanceof Error ? error.message : 'AI术语处理失败'
  } finally {
    processing.value = false
  }
}

</script>
