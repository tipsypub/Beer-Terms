<template>
  <main class="flex-1 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
        <div
          v-for="term in filteredTerms"
          :key="term.id"
          class="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="goToTermDetail(term.id)"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ term.english_term }}</h3>
              <h4 class="text-orange-500 font-medium mt-1">{{ term.chinese_term }}</h4>
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
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTermsStore } from '@/stores/terms'

const termsStore = useTermsStore()
const router = useRouter()

// Use storeToRefs to keep reactivity
const { 
  filteredTerms, 
  hasMoreTerms, 
  loading
} = storeToRefs(termsStore)

const goToTermDetail = (id: string) => {
  router.push(`/term/${id}`)
}

onMounted(() => {
  termsStore.fetchTermsPaginated(1)
})

const loadMore = () => {
  termsStore.loadMoreTerms()
}
</script>
