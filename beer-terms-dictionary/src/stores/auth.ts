import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

interface User {
  id: string
  email: string
  username?: string
  role: 'user' | 'contributor' | 'admin'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authInitialized = ref(false)

  let authInitResolver: (value: boolean) => void;
  const authInitPromise = new Promise<boolean>(resolve => {
    authInitResolver = resolve;
  });

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isContributor = computed(() => user.value?.role === 'contributor' || user.value?.role === 'admin')

  const signUp = async (email: string, password: string, username: string) => {
    loading.value = true
    error.value = null

    try {
      // 1. 注册用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. 创建用户资料
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            username,
            role: 'user',
            reputation: 0,
            contribution_count: 0
          })

        if (profileError) {
          if (profileError.message.includes('row-level security')) {
            throw new Error('服务器权限配置错误，请联系管理员')
          }
          throw profileError
        }

        // 3. 设置当前用户
        user.value = {
          id: authData.user.id,
          email,
          username,
          role: 'user'
        }
      }
    } catch (err: any) {
      if (err.message?.includes('row-level security')) {
        error.value = '服务器权限配置错误，请联系管理员'
      } else if (err.message?.includes('404')) {
        error.value = '服务器配置错误：用户表不存在'
      } else if (err.message?.includes('429')) {
        error.value = '请求过于频繁，请稍后再试'
      } else {
        error.value = err.message || '注册失败'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      if (data.user) {
        // 获取用户资料 - 使用可能为空的查询
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .limit(1)

        if (profileError) {
          if (profileError.message.includes('row-level security')) {
            throw new Error('服务器权限配置错误，请联系管理员')
          }
          throw profileError
        }

        // 如果没有用户资料，创建默认资料
        if (!profileData || profileData.length === 0) {
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
              role: 'user',
              reputation: 0,
              contribution_count: 0
            })

          if (createError) {
            console.warn('创建用户资料失败:', createError)
            // 即使没有用户资料也允许登录
            user.value = {
              id: data.user.id,
              email: data.user.email!,
              username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
              role: 'user'
            }
          } else {
            user.value = {
              id: data.user.id,
              email: data.user.email!,
              username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
              role: 'user'
            }
          }
        } else {
          user.value = {
            id: data.user.id,
            email: data.user.email!,
            username: profileData[0].username,
            role: profileData[0].role
          }
        }
      }
    } catch (err: any) {
      if (err.message?.includes('row-level security')) {
        error.value = '服务器权限配置错误，请联系管理员'
      } else if (err.message?.includes('JSON object requested')) {
        error.value = '用户资料查询错误，请重试'
      } else {
        error.value = err.message || '登录失败'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      
      user.value = null
    } catch (err: any) {
      error.value = err.message || '登出失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    loading.value = true
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .limit(1)

        if (profileError) {
          console.error('获取用户资料失败:', profileError)
          // 即使没有用户资料也设置基本信息
          user.value = {
            id: authUser.id,
            email: authUser.email!,
            username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
            role: 'user'
          }
        } else if (!profileData || profileData.length === 0) {
          // 如果没有用户资料，使用基本信息
          user.value = {
            id: authUser.id,
            email: authUser.email!,
            username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
            role: 'user'
          }
        } else {
          user.value = {
            id: authUser.id,
            email: authUser.email!,
            username: profileData[0].username,
            role: profileData[0].role
          }
        }
      } else {
        user.value = null
      }
    } catch (err) {
      console.error('检查认证状态失败:', err)
      user.value = null
    } finally {
      loading.value = false
      if (!authInitialized.value) {
        authInitResolver(true)
        authInitialized.value = true
      }
    }
  }

  const waitForAuthInit = () => {
    return authInitPromise
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isContributor,
    signUp,
    signIn,
    logout,
    checkAuth,
    waitForAuthInit
  }
})
