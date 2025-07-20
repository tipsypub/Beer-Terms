<template>
  <div v-if="term" class="max-w-2xl mx-auto">
    <!-- 返回按钮 -->
    <button 
      @click="$emit('back')"
      class="mb-6 flex items-center text-gray-600 hover:text-orange-500"
    >
      <i class="ri-arrow-left-line mr-2"></i>
      返回列表
    </button>

    <!-- 词条详情卡片 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <!-- 词条标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">{{ term.english_term }}</h1>
        <h2 class="text-xl text-orange-500 font-medium mt-2">{{ term.chinese_term }}</h2>
      </div>

      <!-- 词条解释 -->
      <div class="mb-6 space-y-4">
        <div v-if="term.english_explanation">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">English Explanation</h3>
          <p class="text-gray-700 leading-relaxed">{{ term.english_explanation }}</p>
        </div>
        
        <div v-if="term.chinese_explanation">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">中文解释</h3>
          <p class="text-gray-700 leading-relaxed">{{ term.chinese_explanation }}</p>
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="term.tags && term.tags.length > 0" class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">标签</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in term.tags"
            :key="tag"
            class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 分类信息 -->
      <div v-if="categoryName" class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">分类</h3>
        <span class="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
          {{ categoryName }}
        </span>
      </div>

      <!-- 操作按钮（仅登录用户可见） -->
      <div v-if="isAuthenticated" class="flex space-x-4 pt-6 border-t border-gray-200">
        <button 
          @click="$emit('edit', term)"
          class="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
        >
          编辑词条
        </button>
        <button 
          @click="handleDelete"
          class="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          删除词条
        </button>
      </div>
    </div>
  </div>

  <!-- 加载状态 -->
  <div v-else-if="loading" class="flex justify-center items-center h-64">
    <div class="text-gray-500">加载中...</div>
  </div>

  <!-- 未找到词条 -->
  <div v-else class="text-center py-12">
    <div class="text-gray-500 mb-4">未找到该词条</div>
    <button 
      @click="$emit('back')"
      class="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
    >
      返回列表
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTermsStore } from '@/stores/terms'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps<{
  termId: string
}>()

// Emits
const emit = defineEmits<{
  edit: [term: any]
  back: []
}>()

// Stores
const termsStore = useTermsStore()
const authStore = useAuthStore()

// State
const term = ref<any>(null)
const loading = ref(true)

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

const categoryName = computed(() => {
  if (!term.value?.category_id) return ''
  const category = termsStore.categories.find(c => c.id === term.value.category_id)
  return category?.name_zh || ''
})

// Methods
const fetchTerm = async () => {
  try {
    loading.value = true
    await termsStore.fetchTermById(props.termId)
    term.value = termsStore.currentTerm
  } catch (error) {
    console.error('获取词条详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!term.value) return
  
  if (confirm('确定要删除这个词条吗？此操作不可撤销。')) {
    try {
      await termsStore.deleteTerm(term.value.id)
      // 删除成功后返回列表
      emit('back')
    } catch (error) {
      console.error('删除词条失败:', error)
      alert('删除失败，请重试')
    }
  }
}

// Lifecycle
onMounted(() => {
  fetchTerm()
  // 确保categories已加载
  if (termsStore.categories.length === 0) {
    termsStore.fetchCategories()
  }
})
</script>