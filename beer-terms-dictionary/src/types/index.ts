// 术语类型定义
export interface Term {
  id: string
  english_term: string
  chinese_term: string
  chinese_explanation: string
  english_explanation: string
  category_id: string | null
  tags: string[] | null
  status: string
  created_by: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
  category?: Category
  creator?: {
    username: string
    reputation?: number
    contribution_count?: number
  }
}

// 分类类型定义
export interface Category {
  id: string
  name_en: string
  name_zh: string
  description: string | null
  sort_order: number
  created_at: string
}

// 用户类型定义
export interface User {
  id: string
  username: string
  email: string
  role: string
  reputation: number
  contribution_count: number
  created_at: string
  updated_at: string
}

// 术语建议类型定义
export interface TermSuggestion {
  id: string
  term_id: string | null
  english_term: string
  chinese_term: string
  chinese_explanation: string
  english_explanation: string
  category_id: string | null
  suggestion_type: string
  reason: string | null
  status: string
  suggested_by: string
  reviewed_by: string | null
  created_at: string
  reviewed_at: string | null
  term?: Term
  suggestor?: User
  reviewer?: User
}

// 用户活动类型定义
export interface UserActivity {
  id: string
  user_id: string
  activity_type: string
  target_type: string
  target_id: string
  points: number
  created_at: string
  user?: User
}

// 搜索筛选类型
export interface SearchFilters {
  query?: string
  category?: string
  letter?: string
  tags?: string[]
  status?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 应用状态类型
export interface AppState {
  loading: boolean
  error: string | null
  searchQuery: string
  selectedCategory: string | null
  currentPage: number
}
