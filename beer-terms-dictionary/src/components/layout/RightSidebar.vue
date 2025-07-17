<template>
  <aside class="w-80 bg-white border-l border-gray-200 p-6 flex-shrink-0">
    <!-- 搜索框 -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <i class="ri-search-line text-gray-400"></i>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索术语..."
        class="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTermsStore } from '@/stores/terms'

const termsStore = useTermsStore()
const searchQuery = ref(termsStore.searchQuery)

watch(searchQuery, (newQuery) => {
  termsStore.searchTerms(newQuery)
})
</script>
