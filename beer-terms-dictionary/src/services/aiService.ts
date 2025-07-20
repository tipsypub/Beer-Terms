import { GoogleGenAI } from '@google/genai'
import OpenAI from 'openai'

// AI服务提供商类型
export type AIProvider = 'gemini' | 'kimi'

// 提取的术语接口
export interface ExtractedTerm {
  english_term: string
  chinese_term: string
  context_english?: string
  context_chinese?: string
  confidence: number
}

// 分类后的术语接口
export interface ClassifiedTerm extends ExtractedTerm {
  category_id: string
  category_name: string
  classification_confidence: number
}

// AI服务配置
interface AIConfig {
  geminiApiKey: string
  kimiApiKey: string
}

class AIService {
  private geminiClient: GoogleGenAI | null = null
  private kimiClient: OpenAI | null = null
  private config: AIConfig

  constructor() {
    this.config = {
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCXVeAS0dFqYMjGDRBqRgewJU70zQu7Oa4',
      kimiApiKey: import.meta.env.VITE_KIMI_API_KEY || 'sk-tGf3nDkiVxPEigWriinQ0oCuPHCXX61ZqxYObExQDZGPyEBx'
    }
    
    this.initializeClients()
  }

  private initializeClients() {
    try {
      // 初始化Gemini客户端 - 使用新的@google/genai库
      this.geminiClient = new GoogleGenAI({ apiKey: this.config.geminiApiKey })

      // 初始化Kimi客户端 - 使用代理路径
      const baseURL = `${window.location.origin}/api/kimi/v1`
      this.kimiClient = new OpenAI({
        apiKey: this.config.kimiApiKey,
        baseURL: baseURL,
        dangerouslyAllowBrowser: true
      })
    } catch (error) {
      console.error('AI客户端初始化失败:', error)
    }
  }

  /**
   * 从文本中提取啤酒相关术语
   */
  async extractTerms(
    englishText: string, 
    chineseText: string, 
    provider: AIProvider = 'gemini'
  ): Promise<ExtractedTerm[]> {
    const prompt = this.createExtractionPrompt(englishText, chineseText)
    
    try {
      if (provider === 'gemini') {
        return await this.extractWithGemini(prompt)
      } else {
        return await this.extractWithKimi(prompt)
      }
    } catch (error) {
      console.error(`${provider} 术语提取失败:`, error)
      
      // 提供更友好的错误信息
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message
        if (errorMessage.includes('API key expired') || errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('PERMISSION_DENIED')) {
          throw new Error(`${provider} API密钥已过期或无效，请更新API密钥`)
        }
        if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
          throw new Error(`${provider} API存在跨域限制，建议通过后端代理调用`)
        }
        if (errorMessage.includes('Connection error')) {
          throw new Error(`${provider} API连接失败，请检查网络连接`)
        }
        if (errorMessage.includes('QUOTA_EXCEEDED')) {
          throw new Error(`${provider} API调用次数已达上限，请稍后再试`)
        }
      }
      
      throw new Error(`${provider} AI术语提取失败，请稍后重试`)
    }
  }

  /**
   * 对提取的术语进行智能分类
   */
  async classifyTerms(
    terms: ExtractedTerm[], 
    provider: AIProvider = 'gemini',
    categories: any[] = []
  ): Promise<ClassifiedTerm[]> {
    const prompt = this.createClassificationPrompt(terms, categories)
    
    try {
      if (provider === 'gemini') {
        return await this.classifyWithGemini(terms, prompt, categories)
      } else {
        return await this.classifyWithKimi(terms, prompt, categories)
      }
    } catch (error) {
      console.error(`${provider} 术语分类失败:`, error)
      throw new Error(`AI术语分类失败: ${error}`)
    }
  }

  private createExtractionPrompt(englishText: string, chineseText: string): string {
    return `
你是一个专业的啤酒术语提取专家。请从以下英文和中文文本中提取所有与啤酒相关的术语对。

英文文本：
${englishText}

中文文本：
${chineseText}

请按照以下要求提取术语：
1. 只提取与啤酒行业相关的术语（酿造、原料、设备、风格、品鉴等）
2. 确保英文术语和中文术语是对应的翻译关系
3. 包括专业术语、品牌名称、技术概念等
4. 给出提取置信度（0-1之间）

请以JSON格式返回，格式如下：
{
  "terms": [
    {
      "english_term": "IPA",
      "chinese_term": "印度淡色艾尔",
      "context_english": "IPA is a hoppy beer style",
      "context_chinese": "IPA是一种酒花味浓郁的啤酒风格",
      "confidence": 0.95
    }
  ]
}

注意：
- 只返回JSON格式，不要包含其他解释文字
- 术语要准确对应
- 避免重复提取相同术语
    `.trim()
  }

  private createClassificationPrompt(terms: ExtractedTerm[], categories: any[]): string {
    // 创建分类列表文本
    const categoryList = categories.length > 0 
      ? categories.map(cat => `${cat.id}. ${cat.name_en || cat.name_zh} (${cat.name_zh})`).join('\n')
      : `1. History and Culture (历史与文化)
2. Raw Materials (原材料) 
3. Brewing Equipment (酿造设备)
4. Biochemistry (生物化学)
5. Brewing Technology (酿造技术)
6. Beer Styles (啤酒风格)
7. Competition and Tasting (比赛与品鉴)
8. Festivals and Exhibitions (啤酒节与展览)
9. Beer Events (啤酒活动)
10. Marketing and Communication (市场与传播)
11. Brewery Brands (啤酒厂牌)
12. Packaging and Transportation (包装与运输)
13. Serving (侍酒)
14. Food Pairing (配餐)
15. On-Premise (门店相关)
16. Beer People (啤酒人物)
17. Beer Books (啤酒书籍)
18. Beer Websites (啤酒网站)
19. Beer Apps (啤酒程序)
20. Other (其他)`

    // 创建示例中的分类ID，如果有真实分类则使用第一个，否则使用默认值
    const exampleCategoryId = categories.length > 0 ? categories[0].id : "1"
    const exampleCategoryName = categories.length > 0 ? categories[0].name_en || categories[0].name_zh : "History and Culture"

    return `
你是一个啤酒术语分类专家。请将以下术语按照标准分类进行归类。

可用分类：
${categoryList}

术语列表：
${JSON.stringify(terms, null, 2)}

请以JSON格式返回分类结果：
{
  "classified_terms": [
    {
      "english_term": "IPA",
      "chinese_term": "印度淡色艾尔",
      "category_id": "${exampleCategoryId}",
      "category_name": "${exampleCategoryName}",
      "classification_confidence": 0.98
    }
  ]
}

注意：
- 只返回JSON格式
- 选择最合适的分类
- category_id必须是上述列表中的真实ID
- 给出分类置信度
    `.trim()
  }

  private async extractWithGemini(prompt: string): Promise<ExtractedTerm[]> {
    if (!this.geminiClient) {
      throw new Error('Gemini客户端未初始化')
    }

    console.log('使用Gemini提取术语...')
    console.log('API Key前缀:', this.config.geminiApiKey.substring(0, 10) + '...')

    try {
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.5-flash-lite-preview-06-17',
        contents: prompt
      })

      const text = response.text || ''
      console.log('Gemini响应:', text.substring(0, 200) + '...')
      
      try {
        // 处理Gemini可能返回的代码块格式
        let cleanText = text.trim()
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        const parsed = JSON.parse(cleanText)
        const terms = parsed.terms || []
        
        // 规范化术语大小写
        return terms.map((term: ExtractedTerm) => ({
          ...term,
          english_term: this.normalizeTermCapitalization(term.english_term)
        }))
      } catch (parseError) {
        console.error('Gemini响应解析失败:', text)
        throw new Error('AI响应格式错误')
      }
    } catch (error: any) {
      console.error('Gemini API调用失败:', error)
      if (error.message) {
        throw new Error(error.message)
      }
      throw error
    }
  }

  private async extractWithKimi(prompt: string): Promise<ExtractedTerm[]> {
    if (!this.kimiClient) {
      throw new Error('Kimi客户端未初始化')
    }

    const completion = await this.kimiClient.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: '你是专业的啤酒术语提取专家，擅长从中英文文本中准确提取啤酒相关术语。请严格按照JSON格式返回结果。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) {
      throw new Error('Kimi未返回有效响应')
    }

    try {
      const parsed = JSON.parse(text)
      const terms = parsed.terms || []
      
      // 规范化术语大小写
      return terms.map((term: ExtractedTerm) => ({
        ...term,
        english_term: this.normalizeTermCapitalization(term.english_term)
      }))
    } catch (error) {
      console.error('Kimi响应解析失败:', text)
      throw new Error('AI响应格式错误')
    }
  }

  private async classifyWithGemini(terms: ExtractedTerm[], prompt: string, categories: any[] = []): Promise<ClassifiedTerm[]> {
    if (!this.geminiClient) {
      throw new Error('Gemini客户端未初始化')
    }

    console.log('使用Gemini分类术语...')

    try {
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.5-flash-lite-preview-06-17',
        contents: prompt
      })

      const text = response.text || ''
      console.log('Gemini分类响应:', text.substring(0, 200) + '...')
      
      try {
        // 处理Gemini可能返回的代码块格式
        let cleanText = text.trim()
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        const parsed = JSON.parse(cleanText)
        const classifiedTerms = parsed.classified_terms || []
        
        // 确保每个分类结果都有classification_confidence字段
        return classifiedTerms.map((classified: any) => {
          // 找到对应的原始术语
          const originalTerm = terms.find(term => 
            term.english_term === classified.english_term || 
            term.chinese_term === classified.chinese_term
          )
          
          // 验证分类ID是否存在于真实分类中
          let validCategoryId = classified.category_id
          let validCategoryName = classified.category_name
          
          if (categories.length > 0) {
            const foundCategory = categories.find(cat => 
              cat.id === classified.category_id || 
              cat.name_zh === classified.category_name ||
              cat.name_en === classified.category_name
            )
            
            if (foundCategory) {
              validCategoryId = foundCategory.id
              validCategoryName = foundCategory.name_zh
            } else {
              // 尝试智能匹配分类
              const smartCategory = this.findBestCategoryMatch(originalTerm, categories)
              if (smartCategory) {
                validCategoryId = smartCategory.id
                validCategoryName = smartCategory.name_zh
              } else {
                // 如果没找到匹配的分类，使用默认分类（通常是"其他"）
                const defaultCategory = categories.find(cat => 
                  cat.name_zh.includes('其他') || 
                  cat.name_en?.toLowerCase().includes('other')
                ) || categories[categories.length - 1] // 使用最后一个分类作为默认
                
                if (defaultCategory) {
                  validCategoryId = defaultCategory.id
                  validCategoryName = defaultCategory.name_zh
                }
              }
            }
          }
          
          return {
            ...originalTerm,
            category_id: validCategoryId || '20',
            category_name: validCategoryName || 'Other',
            classification_confidence: classified.classification_confidence || 0.5
          }
        })
      } catch (parseError) {
        console.error('Gemini分类响应解析失败:', text)
        throw new Error('AI分类响应格式错误')
      }
    } catch (error: any) {
      console.error('Gemini分类API调用失败:', error)
      if (error.message) {
        throw new Error(error.message)
      }
      throw error
    }
  }

  private async classifyWithKimi(terms: ExtractedTerm[], prompt: string, categories: any[] = []): Promise<ClassifiedTerm[]> {
    if (!this.kimiClient) {
      throw new Error('Kimi客户端未初始化')
    }

    const completion = await this.kimiClient.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: '你是专业的啤酒术语分类专家，根据提供的标准分类对啤酒术语进行准确归类。请严格按照JSON格式返回结果，确保category_id使用提供的真实ID。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
    })

    const text = completion.choices[0]?.message?.content
    if (!text) {
      throw new Error('Kimi未返回有效响应')
    }

    try {
      const parsed = JSON.parse(text)
      const classifiedTerms = parsed.classified_terms || []
      
      // 确保每个分类结果都有classification_confidence字段
      return classifiedTerms.map((classified: any) => {
        // 找到对应的原始术语
        const originalTerm = terms.find(term => 
          term.english_term === classified.english_term || 
          term.chinese_term === classified.chinese_term
        )
        
        // 验证分类ID是否存在于真实分类中
        let validCategoryId = classified.category_id
        let validCategoryName = classified.category_name
        
        if (categories.length > 0) {
          const foundCategory = categories.find(cat => 
            cat.id === classified.category_id || 
            cat.name_zh === classified.category_name ||
            cat.name_en === classified.category_name
          )
          
          if (foundCategory) {
            validCategoryId = foundCategory.id
            validCategoryName = foundCategory.name_zh
          } else {
            // 尝试智能匹配分类
            const smartCategory = this.findBestCategoryMatch(originalTerm, categories)
            if (smartCategory) {
              validCategoryId = smartCategory.id
              validCategoryName = smartCategory.name_zh
            } else {
              // 如果没找到匹配的分类，使用默认分类（通常是"其他"）
              const defaultCategory = categories.find(cat => 
                cat.name_zh.includes('其他') || 
                cat.name_en?.toLowerCase().includes('other')
              ) || categories[categories.length - 1] // 使用最后一个分类作为默认
              
              if (defaultCategory) {
                validCategoryId = defaultCategory.id
                validCategoryName = defaultCategory.name_zh
              }
            }
          }
        }
        
        return {
          ...originalTerm,
          english_term: this.normalizeTermCapitalization(originalTerm?.english_term || classified.english_term),
          category_id: validCategoryId || '20',
          category_name: validCategoryName || 'Other',
          classification_confidence: classified.classification_confidence || 0.5
        }
      })
    } catch (error) {
      console.error('Kimi分类响应解析失败:', text)
      throw new Error('AI分类响应格式错误')
    }
  }

  /**
   * 术语规范化 - 自动修正大小写
   */
  private normalizeTermCapitalization(englishTerm: string): string {
    // 常见的啤酒术语大小写规范
    const termCapitalizationRules: Record<string, string> = {
      // 啤酒风格缩写
      'ipa': 'IPA',
      'i.p.a': 'IPA',
      'i.p.a.': 'IPA',
      'neipa': 'NEIPA',
      'dipa': 'DIPA',
      'tipa': 'TIPA',
      'apa': 'APA',
      'epa': 'EPA',
      'pa': 'PA',
      'pils': 'Pils',
      'pilsner': 'Pilsner',
      'lager': 'Lager',
      'ale': 'Ale',
      'stout': 'Stout',
      'porter': 'Porter',
      'saison': 'Saison',
      'gose': 'Gose',
      'kolsch': 'Kölsch',
      'weizen': 'Weizen',
      'weissbier': 'Weissbier',
      'witbier': 'Witbier',
      'lambic': 'Lambic',
      'gueuze': 'Gueuze',
      'barleywine': 'Barleywine',
      
      // 原料
      'hop': 'Hop',
      'hops': 'Hops',
      'malt': 'Malt',
      'malts': 'Malts',
      'yeast': 'Yeast',
      'barley': 'Barley',
      'wheat': 'Wheat',
      'oats': 'Oats',
      'rice': 'Rice',
      'corn': 'Corn',
      'cascade': 'Cascade',
      'centennial': 'Centennial',
      'chinook': 'Chinook',
      'columbus': 'Columbus',
      'simcoe': 'Simcoe',
      'amarillo': 'Amarillo',
      'citra': 'Citra',
      'mosaic': 'Mosaic',
      
      // 工艺术语
      'mash': 'Mash',
      'wort': 'Wort',
      'boil': 'Boil',
      'fermentation': 'Fermentation',
      'conditioning': 'Conditioning',
      'lagering': 'Lagering',
      'dry hop': 'Dry Hop',
      'dry hopping': 'Dry Hopping',
      'cold crash': 'Cold Crash',
      'whirlpool': 'Whirlpool',
      'sparge': 'Sparge',
      'lauter': 'Lauter',
      
      // 设备
      'fermenter': 'Fermenter',
      'kettle': 'Kettle',
      'mash tun': 'Mash Tun',
      'lauter tun': 'Lauter Tun',
      'tank': 'Tank',
      'vessel': 'Vessel',
      'keg': 'Keg',
      'bottle': 'Bottle',
      'can': 'Can',
      
      // 度量单位
      'abv': 'ABV',
      'ibu': 'IBU',
      'srm': 'SRM',
      'ebc': 'EBC',
      'og': 'OG',
      'fg': 'FG',
      'brix': 'Brix',
      'plato': 'Plato',
      
      // 其他常见术语
      'dms': 'DMS',
      'diacetyl': 'Diacetyl',
      'ester': 'Ester',
      'phenol': 'Phenol',
      'tannin': 'Tannin',
      'alpha acid': 'Alpha Acid',
      'beta acid': 'Beta Acid',
      'lovibond': 'Lovibond'
    }
    
    const lowerTerm = englishTerm.toLowerCase().trim()
    
    // 直接匹配
    if (termCapitalizationRules[lowerTerm]) {
      return termCapitalizationRules[lowerTerm]
    }
    
    // 处理多词术语
    const words = englishTerm.toLowerCase().split(/\s+/)
    const normalizedWords = words.map(word => {
      // 去除标点符号进行匹配
      const cleanWord = word.replace(/[^\w]/g, '')
      if (termCapitalizationRules[cleanWord]) {
        return termCapitalizationRules[cleanWord]
      }
      
      // 默认首字母大写
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      }
      return word
    })
    
    return normalizedWords.join(' ')
  }

  /**
   * 智能匹配分类
   */
  private findBestCategoryMatch(term: ExtractedTerm, categories: any[]): any | null {
    if (!term || !categories.length) return null
    
    const termLower = (term.english_term + ' ' + term.chinese_term).toLowerCase()
    
    // 设备相关关键词
    const equipmentKeywords = ['tank', '罐', 'fermenter', '发酵', 'boiler', '锅炉', 'pump', '泵', 'valve', '阀', 'pipe', '管', 'vessel', '容器']
    // 原料相关关键词  
    const materialKeywords = ['malt', '麦芽', 'hop', '酒花', 'yeast', '酵母', 'water', '水', 'grain', '谷物', 'barley', '大麦']
    // 工艺相关关键词
    const processKeywords = ['mash', '糖化', 'boil', '煮沸', 'fermentation', '发酵', 'condition', '调节', 'filter', '过滤']
    // 风格相关关键词
    const styleKeywords = ['ale', '艾尔', 'lager', '拉格', 'ipa', 'stout', '世涛', 'porter', '波特', 'wheat', '小麦']
    
    // 根据关键词匹配分类
    if (equipmentKeywords.some(keyword => termLower.includes(keyword))) {
      return categories.find(cat => 
        cat.name_zh.includes('设备') || 
        cat.name_en?.toLowerCase().includes('equipment')
      )
    }
    
    if (materialKeywords.some(keyword => termLower.includes(keyword))) {
      return categories.find(cat => 
        cat.name_zh.includes('原材料') || 
        cat.name_en?.toLowerCase().includes('material')
      )
    }
    
    if (processKeywords.some(keyword => termLower.includes(keyword))) {
      return categories.find(cat => 
        cat.name_zh.includes('技术') || 
        cat.name_en?.toLowerCase().includes('technology')
      )
    }
    
    if (styleKeywords.some(keyword => termLower.includes(keyword))) {
      return categories.find(cat => 
        cat.name_zh.includes('风格') || 
        cat.name_en?.toLowerCase().includes('style')
      )
    }
    
    return null
  }

  /**
   * 测试AI服务连接
   */
  async testConnection(provider: AIProvider): Promise<boolean> {
    try {
      const testTerms = await this.extractTerms(
        'IPA is a hoppy beer style',
        'IPA是一种酒花味浓郁的啤酒风格',
        provider
      )
      return testTerms.length > 0
    } catch (error) {
      console.error(`${provider} 连接测试失败:`, error)
      return false
    }
  }
}

// 导出单例实例
export const aiService = new AIService()

// 导出类型和服务
export { AIService }
export default aiService