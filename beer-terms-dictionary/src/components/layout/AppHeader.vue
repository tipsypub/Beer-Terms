<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <i class="ri-beer-line text-white text-lg"></i>
          </div>
          <h1 class="text-xl font-bold text-gray-900">啤酒术语词典</h1>
        </div>
        <div class="flex-1 max-w-md mx-8">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="ri-search-line text-gray-400"></i>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索术语..."
              class="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <div class="relative">
            <div class="w-8 h-8 flex items-center justify-center">
              <i class="ri-notification-line text-gray-600 text-lg"></i>
            </div>
            <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div class="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            <img
              src="https://readdy.ai/api/search-image?query=professional%20beer%20expert%20avatar%20portrait%20with%20beard%20and%20friendly%20smile%2C%20clean%20background&width=32&height=32&seq=avatar1&orientation=squarish"
              alt="用户头像"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  </header>
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
