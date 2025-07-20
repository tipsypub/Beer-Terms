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

// 文本分块接口
export interface TextChunk {
  id: string
  englishText: string
  chineseText: string
  startIndex: number
  endIndex: number
  chunkSize: number
}

// 分步提取状态接口
export interface ExtractionState {
  sessionId: string
  totalChunks: number
  processedChunks: number
  currentChunkIndex: number
  extractedTerms: ExtractedTerm[]
  failedChunks: string[]
  isCompleted: boolean
  isPaused: boolean
  isAborted: boolean
  startTime: number
  lastUpdateTime: number
}

// 分步提取进度回调接口
export interface ExtractionProgress {
  state: ExtractionState
  currentChunk?: TextChunk
  recentTerms?: ExtractedTerm[]
  error?: string
}

// 分步提取配置
export interface ChunkedExtractionConfig {
  chunkSize: number // 每块的字符数
  maxConcurrency: number // 最大并发数
  retryAttempts: number // 重试次数
  saveInterval: number // 保存间隔（毫秒）
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
  
  // 分步提取相关状态
  private extractionSessions: Map<string, ExtractionState> = new Map()
  private activeExtractions: Map<string, AbortController> = new Map()
  
  // 默认配置
  private defaultChunkedConfig: ChunkedExtractionConfig = {
    chunkSize: 2000, // 2000字符每块
    maxConcurrency: 2, // 最多2个并发请求
    retryAttempts: 3, // 最多重试3次
    saveInterval: 5000 // 每5秒保存一次状态
  }

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
              const smartCategory = originalTerm ? this.findBestCategoryMatch(originalTerm, categories) : null
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
            english_term: originalTerm?.english_term || classified.english_term,
            chinese_term: originalTerm?.chinese_term || classified.chinese_term,
            confidence: originalTerm?.confidence || 0.5,
            context_english: originalTerm?.context_english,
            context_chinese: originalTerm?.context_chinese,
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
            const smartCategory = originalTerm ? this.findBestCategoryMatch(originalTerm, categories) : null
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
          english_term: this.normalizeTermCapitalization(originalTerm?.english_term || classified.english_term),
          chinese_term: originalTerm?.chinese_term || classified.chinese_term,
          confidence: originalTerm?.confidence || 0.5,
          context_english: originalTerm?.context_english,
          context_chinese: originalTerm?.context_chinese,
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
   * 智能文本分块 - 按句子边界分割，避免截断
   */
  private createTextChunks(englishText: string, chineseText: string, chunkSize: number): TextChunk[] {
    const chunks: TextChunk[] = []
    
    // 按句子分割英文文本
    const englishSentences = this.splitIntoSentences(englishText)
    const chineseSentences = this.splitIntoSentences(chineseText)
    
    // 确保句子数量匹配，否则按段落分割
    let englishParts = englishSentences
    let chineseParts = chineseSentences
    
    if (Math.abs(englishSentences.length - chineseSentences.length) > englishSentences.length * 0.3) {
      // 句子数量差异太大，改用段落分割
      englishParts = englishText.split(/\n\s*\n/).filter(p => p.trim())
      chineseParts = chineseText.split(/\n\s*\n/).filter(p => p.trim())
    }
    
    let currentEnglishChunk = ''
    let currentChineseChunk = ''
    let startIndex = 0
    
    for (let i = 0; i < Math.max(englishParts.length, chineseParts.length); i++) {
      const englishPart = englishParts[i] || ''
      const chinesePart = chineseParts[i] || ''
      
      // 检查添加这句话是否会超过块大小
      const potentialEnglish = currentEnglishChunk + (currentEnglishChunk ? ' ' : '') + englishPart
      const potentialChinese = currentChineseChunk + (currentChineseChunk ? ' ' : '') + chinesePart
      
      if ((potentialEnglish.length > chunkSize || potentialChinese.length > chunkSize) && currentEnglishChunk) {
        // 创建当前块
        chunks.push({
          id: `chunk_${chunks.length}`,
          englishText: currentEnglishChunk.trim(),
          chineseText: currentChineseChunk.trim(),
          startIndex,
          endIndex: startIndex + currentEnglishChunk.length,
          chunkSize: Math.max(currentEnglishChunk.length, currentChineseChunk.length)
        })
        
        // 开始新块
        currentEnglishChunk = englishPart
        currentChineseChunk = chinesePart
        startIndex = startIndex + currentEnglishChunk.length
      } else {
        // 添加到当前块
        currentEnglishChunk = potentialEnglish
        currentChineseChunk = potentialChinese
      }
    }
    
    // 添加最后一块
    if (currentEnglishChunk.trim() || currentChineseChunk.trim()) {
      chunks.push({
        id: `chunk_${chunks.length}`,
        englishText: currentEnglishChunk.trim(),
        chineseText: currentChineseChunk.trim(),
        startIndex,
        endIndex: startIndex + currentEnglishChunk.length,
        chunkSize: Math.max(currentEnglishChunk.length, currentChineseChunk.length)
      })
    }
    
    return chunks
  }
  
  /**
   * 按句子分割文本
   */
  private splitIntoSentences(text: string): string[] {
    // 英文句子结束符号
    const sentenceEnders = /[.!?]+\s+/g
    // 中文句子结束符号
    const chineseSentenceEnders = /[。！？]+\s*/g
    
    let sentences = text.split(sentenceEnders)
    if (sentences.length <= 1) {
      sentences = text.split(chineseSentenceEnders)
    }
    
    return sentences.filter(s => s.trim().length > 0)
  }
  
  /**
   * 开始分步提取术语
   */
  async startChunkedExtraction(
    englishText: string,
    chineseText: string,
    provider: AIProvider = 'gemini',
    config?: Partial<ChunkedExtractionConfig>,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<string> {
    const sessionId = `extraction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const finalConfig = { ...this.defaultChunkedConfig, ...config }
    
    // 创建文本分块
    const chunks = this.createTextChunks(englishText, chineseText, finalConfig.chunkSize)
    
    // 初始化提取状态
    const state: ExtractionState = {
      sessionId,
      totalChunks: chunks.length,
      processedChunks: 0,
      currentChunkIndex: 0,
      extractedTerms: [],
      failedChunks: [],
      isCompleted: false,
      isPaused: false,
      isAborted: false,
      startTime: Date.now(),
      lastUpdateTime: Date.now()
    }
    
    this.extractionSessions.set(sessionId, state)
    
    // 创建中止控制器
    const abortController = new AbortController()
    this.activeExtractions.set(sessionId, abortController)
    
    // 开始处理
    this.processChunksSequentially(chunks, provider, finalConfig, state, onProgress, abortController.signal)
      .catch(error => {
        console.error('分步提取失败:', error)
        state.isAborted = true
        state.lastUpdateTime = Date.now()
        onProgress?.({ state, error: error.message })
      })
    
    return sessionId
  }
  
  /**
   * 顺序处理文本块
   */
  private async processChunksSequentially(
    chunks: TextChunk[],
    provider: AIProvider,
    config: ChunkedExtractionConfig,
    state: ExtractionState,
    onProgress?: (progress: ExtractionProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const semaphore = new Array(config.maxConcurrency).fill(null)
    let activePromises = 0
    
    for (let i = state.currentChunkIndex; i < chunks.length; i++) {
      // 检查是否被中止或暂停
      if (abortSignal?.aborted || state.isAborted) {
        console.log('提取被中止')
        break
      }
      
      if (state.isPaused) {
        console.log('提取被暂停')
        break
      }
      
      // 等待有可用的并发槽位
      while (activePromises >= config.maxConcurrency) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const chunk = chunks[i]
      state.currentChunkIndex = i
      state.lastUpdateTime = Date.now()
      
      // 处理当前块
      activePromises++
      this.processChunkWithRetry(chunk, provider, config, state, onProgress)
        .finally(() => {
          activePromises--
        })
      
      // 小延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // 等待所有活动请求完成
    while (activePromises > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 更新完成状态
    if (!state.isAborted && !state.isPaused) {
      state.isCompleted = true
      state.lastUpdateTime = Date.now()
      onProgress?.({ state })
    }
  }
  
  /**
   * 带重试的块处理
   */
  private async processChunkWithRetry(
    chunk: TextChunk,
    provider: AIProvider,
    config: ChunkedExtractionConfig,
    state: ExtractionState,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < config.retryAttempts; attempt++) {
      try {
        const terms = await this.extractTerms(chunk.englishText, chunk.chineseText, provider)
        
        // 成功提取，更新状态
        state.extractedTerms.push(...terms)
        state.processedChunks++
        state.lastUpdateTime = Date.now()
        
        // 触发进度回调
        onProgress?.({
          state: { ...state },
          currentChunk: chunk,
          recentTerms: terms
        })
        
        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误')
        console.warn(`块 ${chunk.id} 处理失败 (尝试 ${attempt + 1}/${config.retryAttempts}):`, error)
        
        // 重试前等待
        if (attempt < config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }
    
    // 所有重试都失败了
    console.error(`块 ${chunk.id} 处理最终失败:`, lastError)
    state.failedChunks.push(chunk.id)
    state.processedChunks++
    state.lastUpdateTime = Date.now()
    
    onProgress?.({
      state: { ...state },
      currentChunk: chunk,
      error: `块 ${chunk.id} 处理失败: ${lastError?.message}`
    })
  }
  
  /**
   * 暂停提取
   */
  pauseExtraction(sessionId: string): boolean {
    const state = this.extractionSessions.get(sessionId)
    if (state && !state.isCompleted && !state.isAborted) {
      state.isPaused = true
      state.lastUpdateTime = Date.now()
      return true
    }
    return false
  }
  
  /**
   * 恢复提取
   */
  resumeExtraction(sessionId: string, onProgress?: (progress: ExtractionProgress) => void): boolean {
    const state = this.extractionSessions.get(sessionId)
    if (state && state.isPaused && !state.isCompleted && !state.isAborted) {
      state.isPaused = false
      state.lastUpdateTime = Date.now()
      
      // 重新开始处理（从当前位置继续）
      // 这里需要重新获取原始参数，简化起见，返回false提示需要重新开始
      return false
    }
    return false
  }
  
  /**
   * 中止提取
   */
  abortExtraction(sessionId: string): boolean {
    const state = this.extractionSessions.get(sessionId)
    const controller = this.activeExtractions.get(sessionId)
    
    if (state) {
      state.isAborted = true
      state.lastUpdateTime = Date.now()
    }
    
    if (controller) {
      controller.abort()
      this.activeExtractions.delete(sessionId)
    }
    
    return true
  }
  
  /**
   * 获取提取状态
   */
  getExtractionState(sessionId: string): ExtractionState | null {
    return this.extractionSessions.get(sessionId) || null
  }
  
  /**
   * 清理提取会话
   */
  cleanupExtraction(sessionId: string): void {
    this.extractionSessions.delete(sessionId)
    const controller = this.activeExtractions.get(sessionId)
    if (controller) {
      controller.abort()
      this.activeExtractions.delete(sessionId)
    }
  }
  
  /**
   * 获取所有活跃的提取会话
   */
  getActiveExtractions(): ExtractionState[] {
    return Array.from(this.extractionSessions.values())
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