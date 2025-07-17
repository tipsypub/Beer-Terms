<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex-shrink-0">
    <div class="p-6">
      <nav class="space-y-2">
        <button
          @click="selectCategory(null)"
          class="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-orange-600 bg-orange-100 rounded-lg"
        >
          <div class="flex items-center space-x-2">
            <i class="ri-list-unordered"></i>
            <span>全部术语</span>
          </div>
          <span class="px-2 py-0.5 text-xs bg-orange-200 text-orange-700 rounded-full">
            {{ totalTerms }}
          </span>
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectCategory(category.id)"
          class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <span class="truncate">{{ category.name_zh }}</span>
        </button>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTermsStore } from '@/stores/terms'

const termsStore = useTermsStore()
const categories = computed(() => termsStore.categories)
const totalTerms = computed(() => termsStore.totalTerms)

const selectCategory = (categoryId: string | null) => {
  termsStore.selectCategoryAndFetch(categoryId)
}
</script>
