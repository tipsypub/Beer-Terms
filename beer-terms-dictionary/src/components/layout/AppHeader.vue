<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <i class="ri-beer-line text-white text-lg"></i>
          </div>
          <h1 class="text-xl font-bold text-gray-900">啤酒术语词典</h1>
        </div>
        <!-- Search bar has been moved to the new right sidebar -->
        <div class="flex-1"></div>
        <div class="flex items-center space-x-4">
          <!-- 贡献术语按钮 -->
          <button
            v-if="authStore.isAuthenticated"
            @click="goToContribute"
            class="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors whitespace-nowrap"
          >
            <i class="ri-add-line"></i>
            <span>贡献术语</span>
          </button>

          <!-- 修改术语按钮 -->
          <button
            v-if="authStore.isAuthenticated"
            @click="openEditModal"
            class="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors whitespace-nowrap"
          >
            <i class="ri-edit-line"></i>
            <span>修改术语</span>
          </button>

          <!-- 用户认证区域 -->
          <div v-if="!authStore.isAuthenticated" class="flex items-center space-x-2">
            <button
              @click="openAuthModal(true)"
              class="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              登录
            </button>
          </div>

          <!-- 已登录用户菜单 -->
          <div v-else class="relative user-menu-container">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-2 hover:bg-gray-100 rounded-md p-2"
            >
              <div class="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                <img
                  :src="userAvatar"
                  :alt="authStore.user?.username || '用户头像'"
                  class="w-full h-full object-cover"
                />
              </div>
              <span class="text-sm font-medium text-gray-700">
                {{ authStore.user?.username || authStore.user?.email }}
              </span>
              <i class="ri-arrow-down-s-line text-gray-500"></i>
            </button>

            <!-- 用户下拉菜单 -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
            >
              <div class="px-4 py-2 text-sm text-gray-700 border-b">
                <div class="font-medium">{{ authStore.user?.username }}</div>
                <div class="text-xs text-gray-500">{{ authStore.user?.email }}</div>
              </div>
              
              <button
                @click="goToProfile"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <i class="ri-user-line mr-2"></i>个人资料
              </button>
              
              <button
                v-if="authStore.isAdmin"
                @click="goToAdmin"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <i class="ri-admin-line mr-2"></i>管理后台
              </button>
              
              <div class="border-t">
                <button
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <i class="ri-logout-box-line mr-2"></i>退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTermsStore } from '@/stores/terms'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  authModalRef?: any
  editModalRef?: any
}>()

const termsStore = useTermsStore()
const authStore = useAuthStore()
const router = useRouter()

const showUserMenu = ref(false)

const userAvatar = computed(() => {
  return authStore.user?.username 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user.username)}&background=orange&color=fff&size=32`
    : 'https://readdy.ai/api/search-image?query=professional%20beer%20expert%20avatar%20portrait%20with%20beard%20and%20friendly%20smile%2C%20clean%20background&width=32&height=32&seq=avatar1&orientation=squarish'
})

const openAuthModal = (isLogin: boolean) => {
  props.authModalRef?.openModal(isLogin)
}

const openEditModal = () => {
  // 使用全局事件总线
  window.dispatchEvent(new CustomEvent('open-edit-modal'))
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    showUserMenu.value = false
  } catch (err) {
    console.error('登出失败:', err)
  }
}

const goToProfile = () => {
  showUserMenu.value = false
  router.push('/profile')
}

const goToAdmin = () => {
  showUserMenu.value = false
  console.log('跳转到管理后台')
}

const goToContribute = () => {
  router.push('/contribute')
}

const closeUserMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-container')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  authStore.checkAuth()
  document.addEventListener('click', closeUserMenu)
})
</script>
