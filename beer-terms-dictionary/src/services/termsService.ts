import { supabase } from './supabase'

export class TermsService {
  /**
   * 获取所有已审核的术语
   */
  static async getApprovedTerms() {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * 根据分类获取术语
   */
  static async getTermsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * 搜索术语
   */
  static async searchTerms(query: string) {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .or(`english_term.ilike.%${query}%,chinese_term.ilike.%${query}%,chinese_explanation.ilike.%${query}%,english_explanation.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * 获取所有分类
   */
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')

    if (error) throw error
    return data || []
  }

  /**
   * 获取术语详情
   */
  static async getTermById(id: string) {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * 添加新术语（需要认证）
   */
  static async addTerm(term: any) {
    const { data, error } = await (supabase as any)
      .from('terms')
      .insert(term)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 更新术语（需要认证）
   */
  static async updateTerm(id: string, updates: any) {
    // 添加调试信息
    console.log('UPDATE attempt for ID:', id, 'with updates:', updates)
    
    // 检查认证状态
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user for update:', user)
    
    const { data, error } = await (supabase as any)
      .from('terms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    console.log('Update error:', error)
    if (error) throw error
    return data
  }

  /**
   * 删除术语（需要认证）
   */
  static async deleteTerm(id: string) {
    // 添加调试信息
    console.log('DELETE attempt for ID:', id)
    
    // 检查认证状态
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user for delete:', user)
    
    // 检查session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Current session for delete:', session)
    
    const { error } = await (supabase as any)
      .from('terms')
      .delete()
      .eq('id', id)

    console.log('Delete error:', error)
    if (error) throw error
    return true
  }

  /**
   * 获取术语总数
   */
  static async getTotalTermsCount() {
    const { count, error } = await supabase
      .from('terms')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }

  /**
   * 分页获取术语
   */
  static async getTermsPaginated(page: number = 1, limit: number = 20, categoryId?: string) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('terms')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * 获取A-Z索引的术语
   */
  static async getTermsByLetter(letter: string) {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .ilike('english_term', `${letter}%`)
      .order('english_term')

    if (error) throw error
    return data || []
  }

  /**
   * 获取热门术语（按贡献次数排序）
   */
  static async getPopularTerms(limit: number = 10) {
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}
