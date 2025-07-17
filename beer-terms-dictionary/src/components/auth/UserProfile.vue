<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">个人资料</h2>
      
      <!-- 用户信息卡片 -->
      <div class="flex items-center space-x-6 mb-8">
        <div class="w-24 h-24 bg-gray-300 rounded-full overflow-hidden">
          <img
            :src="userAvatar"
            :alt="authStore.user?.username || '用户头像'"
            class="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800">
            {{ authStore.user?.username || authStore.user?.email }}
          </h3>
          <p class="text-gray-600">{{ authStore.user?.email }}</p>
          <div class="mt-2">
            <span class="inline-block px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full">
              {{ roleText }}
            </span>
          </div>
        </div>
      </div>

      <!-- 用户统计 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-500">
            {{ userStats.contributionCount }}
          </div>
          <div class="text-sm text-gray-600">贡献术语</div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-500">
            {{ userStats.reputation }}
          </div>
          <div class="text-sm text-gray-600">信誉积分</div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-500">
            {{ userStats.joinDate }}
          </div>
          <div class="text-sm text-gray-600">加入时间</div>
        </div>
      </div>

      <!-- 退出登录按钮 -->
      <div class="mt-8 text-center">
        <button
          @click="handleLogout"
          class="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          退出登录
        </button>
      </div>

      <!-- 用户贡献列表 -->
      <div class="mt-8">
        <h4 class="text-lg font-semibold text-gray-800 mb-4">我的贡献</h4>
        <div v-if="userTerms.length === 0" class="text-center text-gray-500 py-8">
          <i class="ri-file-list-line text-4xl mb-2"></i>
          <p>暂无贡献的术语</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="term in userTerms"
            :key="term.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div>
                <h5 class="font-semibold text-gray-800">{{ term.english_term }}</h5>
                <p class="text-gray-600">{{ term.chinese_term }}</p>
                <p class="text-sm text-gray-500 mt-1">{{ term.chinese_explanation?.substring(0, 100) }}...</p>
              </div>
              <div class="flex space-x-2">
                <span
                  :class="statusClass(term.status)"
                  class="px-2 py-1 text-xs rounded-full"
                >
                  {{ statusText(term.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

interface Term {
  id: string
  english_term: string
  chinese_term: string
  chinese_explanation: string
  status: string
  created_at: string
}

const userTerms = ref<Term[]>([])
const loading = ref(false)

const userAvatar = computed(() => {
  return authStore.user?.username 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user.username)}&background=orange&color=fff&size=96`
    : 'https://readdy.ai/api/search-image?query=professional%20beer%20expert%20avatar%20portrait%20with%20beard%20and%20friendly%20smile%2C%20clean%20background&width=96&height=96&seq=avatar1&orientation=squarish'
})

const roleText = computed(() => {
  const roles = {
    user: '普通用户',
    contributor: '贡献者',
    admin: '管理员'
  }
  return roles[authStore.user?.role as keyof typeof roles] || '未知'
})

const userStats = ref({
  contributionCount: 0,
  reputation: 0,
  joinDate: '未知'
})

const loadUserStats = async () => {
  if (!authStore.user?.id) return
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('contribution_count, reputation, created_at')
      .eq('id', authStore.user.id)
      .single()

    if (error) throw error
    
    if (data) {
      userStats.value = {
        contributionCount: data.contribution_count || 0,
        reputation: data.reputation || 0,
        joinDate: data.created_at 
          ? new Date(data.created_at).toLocaleDateString('zh-CN')
          : '未知'
      }
    }
  } catch (err) {
    console.error('加载用户统计失败:', err)
  }
}

const statusClass = (status: string) => {
  const classes = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const statusText = (status: string) => {
  const texts = {
    approved: '已审核',
    pending: '待审核',
    rejected: '已拒绝',
    draft: '草稿'
  }
  return texts[status as keyof typeof texts] || status
}

const loadUserTerms = async () => {
  if (!authStore.user?.id) return
  
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('id, english_term, chinese_term, chinese_explanation, status, created_at')
      .eq('created_by', authStore.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    userTerms.value = data || []
  } catch (err) {
    console.error('加载用户术语失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUserStats()
  loadUserTerms()
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>
