<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader :auth-modal-ref="authModal" :edit-modal-ref="editModal" />
    <AuthModal ref="authModal" />
    <EditTermModal v-model="showEditModal" />
    
    <div class="flex h-[calc(100vh-4rem)]">
      <LeftSidebar />
      
      <main class="flex-1 flex">
        <RouterView class="flex-1" />
        <RightSidebar />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import RightSidebar from '@/components/layout/RightSidebar.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import EditTermModal from '@/components/terms/EditTermModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useTermsStore } from '@/stores/terms'

const authStore = useAuthStore()
const termsStore = useTermsStore()
const authModal = ref<InstanceType<typeof AuthModal>>()
const editModal = ref<InstanceType<typeof EditTermModal>>()
const showEditModal = ref(false)

onMounted(() => {
  // 检查认证状态，这将触发整个初始化链条
  authStore.checkAuth()
  // termsStore.init() 会在 authStore 初始化后自动调用
  termsStore.init()
  
  // 监听修改术语事件
  window.addEventListener('open-edit-modal', () => {
    showEditModal.value = true
  })
})
</script>

<style>
/* 全局样式已在 main.css 中定义 */
</style>
