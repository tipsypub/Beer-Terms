<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">登录</h2>
        <button
          @click="closeModal"
          class="text-gray-500 hover:text-gray-700"
        >
          <i class="ri-close-line text-xl"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            邮箱
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="请输入邮箱"
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            密码
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="请输入密码"
          />
        </div>

        <div v-if="error" class="mb-4 text-red-600 text-sm">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
        >
          {{ loading ? '处理中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const isOpen = ref(false)
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const openModal = () => {
  isOpen.value = true
  resetForm()
}

const closeModal = () => {
  isOpen.value = false
  resetForm()
}

const resetForm = () => {
  email.value = ''
  password.value = ''
  error.value = ''
  loading.value = false
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    await authStore.signIn(email.value, password.value)
    closeModal()
  } catch (err: any) {
    error.value = err.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

defineExpose({
  openModal
})
</script>
