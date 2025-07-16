import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TermsService } from '@/services/termsService'
// import type { Database } from '@/types/supabase' // Temporarily commented out as it cannot be generated.

// Using `any` as a final workaround because `supabase gen types` is not available in this environment.
type Term = any;
type Category = any;
type TermInsert = any;
type TermUpdate = any;

export const useTermsStore = defineStore('terms', () => {
  // 状态
  const terms = ref<Term[]>([])
  const categories = ref<Category[]>([])
  const currentTerm = ref<Term | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const selectedCategory = ref<string | null>(null)
  const currentPage = ref(1)
  const itemsPerPage = 20
  // We no longer fetch the total count, so this state is not needed.
  // const totalTerms = ref(0) 
  
  // This state will track if the last fetch returned a full page of items.
  // If it did, we assume there might be more.
  const hasMoreTerms = ref(true)

  // This computed property is no longer needed as we don't have totalTerms.
  /*
  const totalPages = computed(() => {
    return Math.ceil(totalTerms.value / itemsPerPage)
  })
  */
  
  // The filteredTerms computed property is no longer reliable for pagination
  // as it only operates on the currently loaded terms.
  // We will rely on fetching from the service directly.
  const filteredTerms = computed(() => terms.value)

  // 方法
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const fetchTerms = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await TermsService.getApprovedTerms()
      terms.value = data
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取术语失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await TermsService.getCategories()
      categories.value = data
    } catch (err) {
      console.error('获取分类失败:', err)
    }
  }

  const fetchTermById = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await TermsService.getTermById(id)
      currentTerm.value = data
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取术语详情失败')
    } finally {
      setLoading(false)
    }
  }

  const searchTerms = async (query: string) => {
    setLoading(true)
    setError(null)
    searchQuery.value = query
    
    try {
      if (query.trim()) {
        const data = await TermsService.searchTerms(query)
        terms.value = data
      } else {
        await fetchTerms()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  // Refactored to be a core fetching utility, loading state is managed by callers.
  const fetchTermsPaginated = async (page: number = 1) => {
    currentPage.value = page
    
    try {
      // We only fetch the terms now, no count query.
      const termsData = await TermsService.getTermsPaginated(page, itemsPerPage, selectedCategory.value || undefined)
      
      // If the number of returned items is less than the page size,
      // we know there are no more terms to load.
      hasMoreTerms.value = termsData.length === itemsPerPage

      // If it's the first page, replace the terms. Otherwise, append.
      terms.value = page === 1 ? termsData : [...terms.value, ...termsData]
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取术语失败')
      // Propagate the error to the caller
      throw err
    }
  }

  // This function is now the primary way to change categories and fetch terms.
  const selectCategoryAndFetch = async (categoryId: string | null) => {
    setLoading(true)
    setError(null)
    
    // Reset state for the new category selection
    selectedCategory.value = categoryId
    currentPage.value = 1
    // Clear existing terms to show the loading state correctly
    terms.value = []

    try {
      // Use the existing paginated function to fetch the first page of the new category
      await fetchTermsPaginated(1)
    } catch (err) {
      // The error is already set inside fetchTermsPaginated, just log it here if needed
      console.error('Failed to fetch terms for category:', categoryId, err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreTerms = async () => {
    if (!hasMoreTerms.value || loading.value) return
    
    await fetchTermsPaginated(currentPage.value + 1)
  }

  const fetchTermsByLetter = async (letter: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await TermsService.getTermsByLetter(letter)
      terms.value = data
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取字母索引术语失败')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = null
    currentPage.value = 1
  }

  const addTerm = async (term: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const newTerm = await TermsService.addTerm(term as TermInsert)
      if (newTerm) {
        terms.value.unshift(newTerm)
      }
      return newTerm
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加术语失败')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateTerm = async (id: string, updates: Partial<TermUpdate>) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedTerm = await TermsService.updateTerm(id, updates as TermUpdate)
      if (updatedTerm) {
        const index = terms.value.findIndex(term => term.id === id)
        if (index !== -1) {
          terms.value[index] = updatedTerm
        }
        if (currentTerm.value?.id === id) {
          currentTerm.value = updatedTerm
        }
      }
      return updatedTerm
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新术语失败')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 初始化
  const init = async () => {
    await Promise.all([
      fetchCategories(),
      fetchTermsPaginated()
    ])
  }

  return {
    // 状态
    terms,
    categories,
    currentTerm,
    loading,
    error,
    searchQuery,
    selectedCategory,
    currentPage,
    itemsPerPage,
    
    // 计算属性
    filteredTerms,
    hasMoreTerms,
    
    // 方法
    fetchTerms,
    fetchCategories,
    fetchTermById,
    searchTerms,
    fetchTermsPaginated,
    selectCategoryAndFetch, // New unified function
    loadMoreTerms,
    fetchTermsByLetter,
    clearFilters,
    addTerm,
    updateTerm,
    init
  }
})
