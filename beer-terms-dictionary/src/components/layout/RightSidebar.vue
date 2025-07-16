<template>
  <aside class="w-80 bg-white border-l border-gray-200 p-6 flex-shrink-0">
    <!-- 搜索筛选 -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">搜索筛选</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">排序</label>
          <div class="relative">
            <button class="w-full px-3 py-2 bg-gray-100 border-none rounded-lg text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between">
              <span>按名称</span>
              <i class="ri-arrow-down-s-line text-gray-400"></i>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">语言</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <div class="relative">
                <input type="checkbox" checked class="sr-only">
                <div class="w-4 h-4 bg-primary border-2 border-primary rounded-sm flex items-center justify-center">
                  <i class="ri-check-line text-white text-xs"></i>
                </div>
              </div>
              <span class="ml-2 text-sm text-gray-700">中文</span>
            </label>
            <label class="flex items-center">
              <div class="relative">
                <input type="checkbox" checked class="sr-only">
                <div class="w-4 h-4 bg-primary border-2 border-primary rounded-sm flex items-center justify-center">
                  <i class="ri-check-line text-white text-xs"></i>
                </div>
              </div>
              <span class="ml-2 text-sm text-gray-700">English</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门标签 -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">热门标签</h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">发酵</span>
          <span class="text-sm text-gray-500">(45)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">麦芽</span>
          <span class="text-sm text-gray-500">(38)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">啤酒花</span>
          <span class="text-sm text-gray-500">(32)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">酵母</span>
          <span class="text-sm text-gray-500">(28)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">IPA</span>
          <span class="text-sm text-gray-500">(25)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">拉格</span>
          <span class="text-sm text-gray-500">(22)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">艾尔</span>
          <span class="text-sm text-gray-500">(20)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">品鉴</span>
          <span class="text-sm text-gray-500">(18)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">口感</span>
          <span class="text-sm text-gray-500">(15)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">工艺</span>
          <span class="text-sm text-gray-500">(12)</span>
        </div>
      </div>
    </div>

    <!-- 我的贡献 -->
    <div>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">我的贡献</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">贡献次数</span>
          <span class="text-lg font-bold text-primary">23</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">用户角色</span>
          <span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">贡献者</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTermsStore } from '@/stores/terms'

const termsStore = useTermsStore()

const totalTerms = computed(() => termsStore.terms.length)
const approvedTerms = computed(() => termsStore.terms.filter(t => t.status === 'approved').length)
const pendingTerms = computed(() => termsStore.terms.filter(t => t.status === 'pending').length)
</script>
