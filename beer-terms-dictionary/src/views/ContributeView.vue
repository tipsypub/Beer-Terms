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
            <input v-model="singleTerm.english_term" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">中文术语 *</label>
            <input v-model="singleTerm.chinese_term" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
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

    <!-- 批量导入 -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 class="text-xl font-semibold mb-4">批量导入</h2>
      <div class="flex items-center space-x-4">
        <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
        <button @click="handleBulkSubmit" :disabled="bulkTerms.length === 0 || loading" class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">
          {{ loading ? '导入中...' : `导入 ${bulkTerms.length} 条` }}
        </button>
      </div>
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
      <p v-if="successMessage" class="text-green-600 text-sm mt-2">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { useTermsStore } from '@/stores/terms'
import { useAuthStore } from '@/stores/auth'

const termsStore = useTermsStore()
const authStore = useAuthStore()
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
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const categories = computed(() => termsStore.categories)

onMounted(() => {
  if (categories.value.length === 0) {
    termsStore.fetchCategories()
  }
})

const handleSingleSubmit = async () => {
  loading.value = true
  error.value = null
  successMessage.value = null
  try {
    await termsStore.addTerm({
      ...singleTerm.value,
      status: 'approved'
    })
    successMessage.value = '术语添加成功！'
    singleTerm.value = { english_term: '', chinese_term: '', category_id: '' }
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

const processExcelData = (data: string[][]) => {
  error.value = null
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
        status: 'approved'
      })
    }
  }
  bulkTerms.value = termsToImport
}

const handleBulkSubmit = async () => {
  if (bulkTerms.value.length === 0) return

  loading.value = true
  error.value = null
  successMessage.value = null

  try {
    // Supabase's insert can take an array of objects for bulk insertion
    await termsStore.addTerm(bulkTerms.value)
    
    successMessage.value = `成功导入 ${bulkTerms.value.length} 条术语！`
    bulkTerms.value = []
    await termsStore.fetchTotalTermsCount() // 更新总数
  } catch (err: any) {
    error.value = err.message || '批量导入失败'
  } finally {
    loading.value = false
  }
}
</script>
