<template>
  <main class="flex-1 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
        <div
          v-for="term in filteredTerms"
          :key="term.id"
          :class="[
            'p-4 transition-colors',
            isAuthenticated 
              ? 'hover:bg-gray-50 cursor-pointer' 
              : 'cursor-default'
          ]"
          @click="handleTermClick(term)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ term.english_term }}</h3>
              <h4 class="text-orange-500 font-medium mt-1">{{ term.chinese_term }}</h4>
            </div>
            <!-- 登录用户显示编辑提示 -->
            <div v-if="isAuthenticated" class="text-sm text-gray-400">
              点击编辑
            </div>
            <!-- View button removed as the whole card is clickable -->
          </div>
          <div class="flex items-center justify-between mt-2">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in term.tags"
                :key="tag"
                class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMoreTerms" class="text-center mt-8">
        <button
          @click="loadMore"
          :disabled="loading"
          class="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
        >
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTermsStore } from '@/stores/terms'
import { useAuthStore } from '@/stores/auth'

const termsStore = useTermsStore()
const authStore = useAuthStore()

// Use storeToRefs to keep reactivity
const { 
  filteredTerms, 
  hasMoreTerms, 
  loading
} = storeToRefs(termsStore)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleTermClick = (term: any) => {
  if (!isAuthenticated.value) {
    // 未登录用户点击无反应
    return
  }
  
  // 登录用户触发编辑模态框
  // 使用全局事件来打开编辑模态框
  window.dispatchEvent(new CustomEvent('open-edit-modal', { 
    detail: { term } 
  }))
}

onMounted(() => {
  termsStore.fetchTermsPaginated(1)
})

const loadMore = () => {
  termsStore.loadMoreTerms()
}
</script>
