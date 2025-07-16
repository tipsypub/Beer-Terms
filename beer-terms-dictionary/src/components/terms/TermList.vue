<template>
  <main class="flex-1 p-6">
    <div class="max-w-4xl">
      <!-- 标题和添加按钮 -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">术语列表</h2>
          <p class="text-sm text-gray-600 mt-1">
            共 <span class="text-primary font-semibold">{{ filteredTerms.length }}</span> 个术语
          </p>
        </div>
        <button class="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-button hover:bg-orange-600 transition-colors whitespace-nowrap">
          <i class="ri-add-line"></i>
          <span>贡献术语</span>
        </button>
      </div>

      <!-- 术语列表 -->
      <div class="space-y-6">
        <div
          v-for="term in filteredTerms"
          :key="term.id"
          class="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ term.english_term }}</h3>
              <h4 class="text-primary font-medium mt-1">{{ term.chinese_term }}</h4>
            </div>
            <div class="flex items-center space-x-3">
              <button class="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                <i class="ri-eye-line"></i>
                <span class="text-sm">查看</span>
              </button>
              <button class="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
                <i class="ri-edit-line"></i>
                <span class="text-sm">编辑</span>
              </button>
            </div>
          </div>
          <div class="mb-4">
            <div class="mb-3">
              <p class="text-gray-700">{{ term.chinese_explanation }}</p>
            </div>
            <div>
              <p class="text-gray-700">{{ term.english_explanation }}</p>
            </div>
          </div>
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

      <!-- 分页 -->
      <div class="flex items-center justify-between mt-8">
        <p class="text-sm text-gray-600">显示第 1 到 10 项，共 {{ filteredTerms.length }} 项</p>
        <div class="flex items-center space-x-2">
          <button class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <i class="ri-arrow-left-s-line"></i>
          </button>
          <button class="w-8 h-8 flex items-center justify-center bg-primary text-white rounded">1</button>
          <button class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">2</button>
          <button class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">3</button>
          <span class="px-2 text-gray-400">...</span>
          <button class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">16</button>
          <button class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTermsStore } from '@/stores/terms'

const termsStore = useTermsStore()
const filteredTerms = computed(() => termsStore.filteredTerms)
</script>
