<template>
  <div class="fixed bottom-4 right-4 z-50">
    <!-- 折叠/展开按钮 -->
    <button 
      @click="collapsed = !collapsed"
      class="mb-2 px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
    >
      {{ collapsed ? '🔧 权限调试' : '❌ 关闭' }}
    </button>

    <!-- 调试面板 -->
    <div 
      v-if="!collapsed" 
      class="bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto"
    >
      <h3 class="text-lg font-bold text-gray-800 mb-3">🔍 权限状态调试</h3>
      
      <!-- 当前认证状态 -->
      <div class="mb-4 p-3 bg-gray-50 rounded">
        <h4 class="font-semibold text-gray-700">认证状态</h4>
        <div class="text-sm space-y-1">
          <div>用户ID: <code>{{ authInfo.userId || '未登录' }}</code></div>
          <div>邮箱: <code>{{ authInfo.email || '无' }}</code></div>
          <div>角色: <code>{{ authInfo.role || '未知' }}</code></div>
          <div>Session: <span :class="authInfo.hasSession ? 'text-green-600' : 'text-red-600'">
            {{ authInfo.hasSession ? '✓ 有效' : '✗ 无效' }}
          </span></div>
        </div>
      </div>

      <!-- JWT Token信息 -->
      <div class="mb-4 p-3 bg-gray-50 rounded">
        <h4 class="font-semibold text-gray-700">JWT Token</h4>
        <div class="text-sm space-y-1">
          <div>Token角色: <code>{{ tokenInfo.role || '无' }}</code></div>
          <div>Audience: <code>{{ tokenInfo.aud || '无' }}</code></div>
          <div>过期时间: <code>{{ tokenInfo.exp || '无' }}</code></div>
          <div v-if="tokenInfo.isExpired !== null">
            状态: <span :class="tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'">
              {{ tokenInfo.isExpired ? '✗ 已过期' : '✓ 有效' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 权限测试按钮 -->
      <div class="mb-4">
        <h4 class="font-semibold text-gray-700 mb-2">权限测试</h4>
        <div class="space-y-2">
          <button 
            @click="testPermission('categories')"
            :disabled="testLoading"
            class="w-full px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            测试Categories加载
          </button>
          <button 
            @click="testPermission('read')"
            :disabled="testLoading"
            class="w-full px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            测试读取权限
          </button>
          <button 
            @click="testPermission('write')"
            :disabled="testLoading"
            class="w-full px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            测试写入权限
          </button>
          <button 
            @click="testPermission('delete')"
            :disabled="testLoading"
            class="w-full px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            测试删除权限
          </button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div v-if="testResults.length > 0" class="mb-4">
        <h4 class="font-semibold text-gray-700 mb-2">测试结果</h4>
        <div class="text-xs space-y-1 max-h-32 overflow-y-auto">
          <div 
            v-for="(result, index) in testResults" 
            :key="index"
            :class="result.success ? 'text-green-600' : 'text-red-600'"
          >
            {{ result.timestamp }} - {{ result.action }}: {{ result.message }}
          </div>
        </div>
      </div>

      <!-- 刷新按钮 -->
      <div class="flex space-x-2">
        <button 
          @click="refreshInfo"
          :disabled="refreshLoading"
          class="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ refreshLoading ? '刷新中...' : '刷新状态' }}
        </button>
        <button 
          @click="clearResults"
          class="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          清空结果
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const collapsed = ref(true)
const testLoading = ref(false)
const refreshLoading = ref(false)

const authInfo = reactive({
  userId: null as string | null,
  email: null as string | null,
  role: null as string | null,
  hasSession: false
})

const tokenInfo = reactive({
  role: null as string | null,
  aud: null as string | null,
  exp: null as string | null,
  isExpired: null as boolean | null
})

const testResults = ref<Array<{
  timestamp: string,
  action: string,
  message: string,
  success: boolean
}>>([])

const refreshInfo = async () => {
  refreshLoading.value = true
  try {
    // 获取认证信息
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    authInfo.userId = user?.id || null
    authInfo.email = user?.email || null
    authInfo.role = user?.user_metadata?.role || user?.app_metadata?.role || 'anon'
    authInfo.hasSession = !!session
    
    // 解析JWT Token
    if (session?.access_token) {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]))
        tokenInfo.role = payload.role || null
        tokenInfo.aud = payload.aud || null
        tokenInfo.exp = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null
        tokenInfo.isExpired = payload.exp ? Date.now() / 1000 > payload.exp : null
        
        console.log('JWT Payload:', payload)
      } catch (error) {
        console.error('JWT解析失败:', error)
        tokenInfo.role = 'JWT解析失败'
      }
    } else {
      tokenInfo.role = 'anon'
      tokenInfo.aud = null
      tokenInfo.exp = null
      tokenInfo.isExpired = null
    }
    
    console.log('认证信息:', { user, session, authInfo, tokenInfo })
  } catch (error) {
    console.error('获取认证信息失败:', error)
  } finally {
    refreshLoading.value = false
  }
}

const testPermission = async (action: 'read' | 'write' | 'delete') => {
  testLoading.value = true
  const timestamp = new Date().toLocaleTimeString()
  
  try {
    let result: any
    let message: string
    
    switch (action) {
      case 'categories':
        result = await supabase.from('categories').select('*').order('sort_order')
        message = result.error ? `Categories加载失败: ${result.error.message}` : `Categories加载成功，共${result.data?.length}条`
        console.log('Categories data:', result.data)
        break
        
      case 'read':
        result = await supabase.from('terms').select('id').limit(1)
        message = result.error ? `读取失败: ${result.error.message}` : '读取成功'
        break
        
      case 'write':
        // 先获取一个有效的category_id
        const { data: categories } = await supabase.from('categories').select('id').limit(1)
        const categoryId = categories?.[0]?.id || null
        
        if (!categoryId) {
          message = '写入失败: 没有可用的分类ID'
          result = { error: { message: '没有可用的分类ID' } }
        } else {
          result = await supabase.from('terms').insert({
            english_term: `test_${Date.now()}`,
            chinese_term: `测试_${Date.now()}`,
            category_id: categoryId
          }).select()
          message = result.error ? `写入失败: ${result.error.message}` : '写入成功'
          
          // 清理测试数据
          if (!result.error && result.data?.[0]?.id) {
            await supabase.from('terms').delete().eq('id', result.data[0].id)
          }
        }
        break
        
      case 'delete':
        // 先获取一个有效的category_id
        const { data: categoriesForDelete } = await supabase.from('categories').select('id').limit(1)
        const categoryIdForDelete = categoriesForDelete?.[0]?.id || null
        
        if (!categoryIdForDelete) {
          message = '删除测试失败: 没有可用的分类ID'
          result = { error: { message: '没有可用的分类ID' } }
        } else {
          // 先插入一条测试数据
          const insertResult = await supabase.from('terms').insert({
            english_term: `delete_test_${Date.now()}`,
            chinese_term: `删除测试_${Date.now()}`,
            category_id: categoryIdForDelete
          }).select()
          
          if (insertResult.error) {
            message = `删除测试失败(插入失败): ${insertResult.error.message}`
            result = insertResult
          } else {
            result = await supabase.from('terms').delete().eq('id', insertResult.data[0].id)
            message = result.error ? `删除失败: ${result.error.message}` : '删除成功'
          }
        }
        break
    }
    
    testResults.value.unshift({
      timestamp,
      action: action.toUpperCase(),
      message,
      success: !result.error
    })
    
    console.log(`权限测试 ${action}:`, result)
    
  } catch (error: any) {
    testResults.value.unshift({
      timestamp,
      action: action.toUpperCase(),
      message: `异常: ${error.message}`,
      success: false
    })
    console.error(`权限测试 ${action} 异常:`, error)
  } finally {
    testLoading.value = false
  }
}

const clearResults = () => {
  testResults.value = []
}

onMounted(() => {
  refreshInfo()
  
  // 监听认证状态变化
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('认证状态变化:', event, session)
    refreshInfo()
  })
})
</script>