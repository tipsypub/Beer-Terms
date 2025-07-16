<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex-shrink-0">
    <div class="p-6">
      <nav class="space-y-2">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectCategory(category.id)"
          class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <span>{{ category.name_zh }}</span>
          <i :class="getCategoryIcon(category.id)" class="text-gray-400"></i>
        </button>
        <button
          @click="selectCategory(null)"
          class="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <span>全部术语</span>
          <i class="ri-list-line text-gray-400"></i>
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

const getCategoryIcon = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  if (!category) return 'ri-folder-line'
  
  const iconMap: Record<string, string> = {
    '酿造工艺': 'ri-flask-line',
    '原料': 'ri-plant-line',
    '啤酒风格': 'ri-goblet-line',
    '设备': 'ri-tools-line'
  }
  
  return iconMap[category.name_zh] || 'ri-folder-line'
}

const selectCategory = (categoryId: string | null) => {
  // Use the new, unified, and paginated function for all category selections
  termsStore.selectCategoryAndFetch(categoryId)
}
</script>
