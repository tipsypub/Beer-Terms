<template>
  <div v-if="duplicateResults" class="mt-2">
    <!-- 精确重复警告 -->
    <div v-if="duplicateResults.exactDuplicates && duplicateResults.exactDuplicates.length > 0" 
         class="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
      <div class="flex items-center">
        <i class="ri-error-warning-line text-red-500 mr-2"></i>
        <span class="text-red-700 font-medium">发现完全重复的词条</span>
      </div>
      <div class="mt-2 space-y-1">
        <div v-for="duplicate in duplicateResults.exactDuplicates" :key="duplicate.id" 
             class="text-sm text-red-600">
          {{ duplicate.english_term }} / {{ duplicate.chinese_term }}
        </div>
      </div>
    </div>

    <!-- 相似词条提示 -->
    <div v-else-if="duplicateResults.fuzzyDuplicates && duplicateResults.fuzzyDuplicates.length > 0" 
         class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2">
      <div class="flex items-center">
        <i class="ri-alert-line text-yellow-500 mr-2"></i>
        <span class="text-yellow-700 font-medium">发现相似的词条</span>
      </div>
      <div class="mt-2 space-y-1">
        <div v-for="similar in duplicateResults.fuzzyDuplicates" :key="similar.id" 
             class="text-sm text-yellow-600 flex justify-between">
          <span>{{ similar.english_term }} / {{ similar.chinese_term }}</span>
          <span class="text-xs">
            相似度: {{ Math.max(similar.englishSimilarity || 0, similar.chineseSimilarity || 0).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 无重复提示 -->
    <div v-else-if="showNoResultsMessage" 
         class="bg-green-50 border border-green-200 rounded-md p-2">
      <div class="flex items-center">
        <i class="ri-checkbox-circle-line text-green-500 mr-2"></i>
        <span class="text-green-700 text-sm">未发现重复词条</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="checking" 
         class="bg-blue-50 border border-blue-200 rounded-md p-2">
      <div class="flex items-center">
        <i class="ri-loader-line animate-spin text-blue-500 mr-2"></i>
        <span class="text-blue-700 text-sm">正在检查重复...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DuplicateResult {
  exactDuplicates?: any[]
  fuzzyDuplicates?: any[]
}

defineProps<{
  duplicateResults: DuplicateResult | null
  checking: boolean
  showNoResultsMessage?: boolean
}>()
</script>