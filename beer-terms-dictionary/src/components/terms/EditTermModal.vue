<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">修改术语</h2>
      
      <!-- 搜索框 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">搜索要修改的术语</label>
        <input 
          type="text" 
          v-model="searchTerm" 
          @input="searchTerms" 
          placeholder="输入英文或中文术语..." 
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        <ul v-if="searchResults.length" class="border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto">
          <li 
            v-for="term in searchResults" 
            :key="term.id" 
            @click="selectTerm(term)" 
            class="p-2 hover:bg-gray-100 cursor-pointer"
          >
            {{ term.english_term }} / {{ term.chinese_term }}
          </li>
        </ul>
      </div>

      <!-- 修改表单 -->
      <form v-if="selectedTerm" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">英文术语 *</label>
            <input 
              v-model="form.english_term" 
              type="text" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">中文术语 *</label>
            <input 
              v-model="form.chinese_term" 
              type="text" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
            <select 
              v-model="form.category_id" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name_zh }}
              </option>
            </select>
          </div>
        </div>
        <div class="mt-6 flex justify-between items-center">
          <button 
            type="button" 
            @click="handleDelete" 
            :disabled="loading"
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            {{ loading ? '处理中...' : '删除术语' }}
          </button>
          <div class="flex space-x-4">
            <button 
              type="button" 
              @click="closeModal" 
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md"
            >
              取消
            </button>
            <button 
              type="submit" 
              :disabled="loading" 
              class="px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              {{ loading ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTermsStore } from '@/stores/terms'
import { TermsService } from '@/services/termsService'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const termsStore = useTermsStore()
const loading = ref(false)
const searchTerm = ref('')
const searchResults = ref<any[]>([])
const selectedTerm = ref<any>(null)

const form = ref({
  english_term: '',
  chinese_term: '',
  category_id: ''
})

const categories = computed(() => termsStore.categories)

watch(searchTerm, (newVal) => {
  if (!newVal) {
    searchResults.value = []
  }
})

const searchTerms = async () => {
  if (searchTerm.value.length < 2) {
    searchResults.value = []
    return
  }
  try {
    searchResults.value = await TermsService.searchTerms(searchTerm.value)
  } catch (error) {
    console.error("Search failed:", error)
  }
}

const selectTerm = (term: any) => {
  selectedTerm.value = term
  form.value = {
    english_term: term.english_term,
    chinese_term: term.chinese_term,
    category_id: term.category_id
  }
  searchTerm.value = ''
  searchResults.value = []
}

const handleSubmit = async () => {
  if (!selectedTerm.value) return
  loading.value = true
  try {
    await termsStore.updateTerm(selectedTerm.value.id, form.value)
    closeModal()
  } catch (error) {
    console.error("Update failed:", error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!selectedTerm.value) return
  
  if (!confirm('确定要删除这个术语吗？此操作不可撤销。')) {
    return
  }
  
  loading.value = true
  try {
    await termsStore.deleteTerm(selectedTerm.value.id)
    closeModal()
  } catch (error) {
    console.error("Delete failed:", error)
    alert('删除失败，请重试')
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
  selectedTerm.value = null
  searchTerm.value = ''
}
</script>
