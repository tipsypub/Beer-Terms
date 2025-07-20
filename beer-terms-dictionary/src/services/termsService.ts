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

    if (error) throw error
    
    // 如果是单个术语，返回第一个；如果是数组，返回整个数组
    return Array.isArray(term) ? data : data?.[0]
  }

  /**
   * 更新术语（需要认证）
   */
  static async updateTerm(id: string, updates: any) {
    const { data, error } = await (supabase as any)
      .from('terms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * 删除术语（需要认证）
   */
  static async deleteTerm(id: string) {
    const { error } = await (supabase as any)
      .from('terms')
      .delete()
      .eq('id', id)

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

  /**
   * 检查词条重复 - 精确匹配
   */
  static async checkExactDuplicate(englishTerm: string, chineseTerm: string) {
    const { data, error } = await supabase
      .from('terms')
      .select('id, english_term, chinese_term, category_id')
      .or(`english_term.eq.${englishTerm},chinese_term.eq.${chineseTerm}`)

    if (error) throw error
    return data || []
  }

  /**
   * 检查词条重复 - 模糊匹配
   */
  static async checkFuzzyDuplicate(englishTerm: string, chineseTerm: string, threshold: number = 0.8) {
    // 标准化处理：去除空格、标点，转小写
    const normalizeText = (text: string) => {
      return text.toLowerCase().replace(/[\s\-_.()]/g, '')
    }

    const normalizedEnglish = normalizeText(englishTerm)
    const normalizedChinese = normalizeText(chineseTerm)

    // 获取所有词条进行客户端相似度计算
    const { data, error } = await supabase
      .from('terms')
      .select('id, english_term, chinese_term, category_id')

    if (error) throw error
    if (!data) return []

    // 计算相似度
    const similarTerms = data.filter(term => {
      const termEnglishNorm = normalizeText(term.english_term)
      const termChineseNorm = normalizeText(term.chinese_term)
      
      const englishSimilarity = this.calculateSimilarity(normalizedEnglish, termEnglishNorm)
      const chineseSimilarity = this.calculateSimilarity(normalizedChinese, termChineseNorm)
      
      return englishSimilarity >= threshold || chineseSimilarity >= threshold
    })

    return similarTerms.map(term => ({
      ...term,
      englishSimilarity: this.calculateSimilarity(normalizedEnglish, normalizeText(term.english_term)),
      chineseSimilarity: this.calculateSimilarity(normalizedChinese, normalizeText(term.chinese_term))
    }))
  }

  /**
   * 计算两个字符串的相似度（简单的编辑距离算法）
   */
  static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0.0

    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    const maxLength = Math.max(str1.length, str2.length)
    return (maxLength - matrix[str2.length][str1.length]) / maxLength
  }

  /**
   * 批量检查词条重复
   */
  static async checkBatchDuplicates(terms: Array<{english_term: string, chinese_term: string}>) {
    const results = []
    
    for (const term of terms) {
      const exactDuplicates = await this.checkExactDuplicate(term.english_term, term.chinese_term)
      const fuzzyDuplicates = await this.checkFuzzyDuplicate(term.english_term, term.chinese_term, 0.85)
      
      results.push({
        term,
        exactDuplicates,
        fuzzyDuplicates,
        hasDuplicates: exactDuplicates.length > 0 || fuzzyDuplicates.length > 0
      })
    }
    
    return results
  }
}
