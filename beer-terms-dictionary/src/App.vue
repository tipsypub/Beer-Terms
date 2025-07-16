<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <div class="flex h-[calc(100vh-4rem)]">
      <LeftSidebar />
      
      <main class="flex-1 flex">
        <TermList class="flex-1" />
        <RightSidebar />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import RightSidebar from '@/components/layout/RightSidebar.vue'
import TermList from '@/components/terms/TermList.vue'
import { useTermsStore } from '@/stores/terms'

const termsStore = useTermsStore()

onMounted(() => {
  // 初始化数据
  termsStore.init()
})
</script>

<style>
/* 全局样式已在 main.css 中定义 */
</style>
