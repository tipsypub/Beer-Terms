import { GoogleGenAI } from '@google/genai'

export interface GeminiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface GeminiConfig {
  apiKey: string
  model?: string
}

export interface GeminiResponse {
  success: boolean
  message?: GeminiMessage
  error?: string
}

export interface GeminiStreamChunk {
  content: string
  finished: boolean
  error?: string
}

export class GeminiAIService {
  private genAI: GoogleGenAI | null = null
  private config: GeminiConfig | null = null
  private currentStreamController: AbortController | null = null

  setConfig(config: GeminiConfig) {
    this.config = config
    this.genAI = new GoogleGenAI({ apiKey: config.apiKey })
  }

  isConfigured(): boolean {
    const configured = !!(this.config && this.genAI)
    console.log('GeminiAIService.isConfigured:', { 
      hasConfig: !!this.config, 
      hasGenAI: !!this.genAI,
      configured 
    })
    return configured
  }

  // 获取可用模型列表
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const response = await this.genAI!.models.list()
      console.log('可用的 Gemini 模型:', response.models?.map(m => m.name) || [])
      return response.models?.map(m => m.name || '') || []
    } catch (error: any) {
      console.error('获取模型列表失败:', error)
      return ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'] // 返回默认列表
    }
  }

  async sendMessage(messages: GeminiMessage[]): Promise<GeminiResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Gemini AI 未配置' }
    }

    try {
      // 格式化最后一条用户消息作为内容
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()
      if (!lastUserMessage) {
        return { success: false, error: '没有找到用户消息' }
      }

      let model = this.config!.model || 'gemini-2.5-flash-lite-preview-06-17'
      
      console.log('使用模型:', model)
      console.log('API Key前缀:', this.config!.apiKey.substring(0, 10) + '...')
      console.log('发送消息:', lastUserMessage.content.substring(0, 100) + '...')
      
      const response = await this.genAI!.models.generateContent({
        model,
        contents: lastUserMessage.content
      })

      const responseText = response.text || ''
      console.log('收到回复:', responseText.substring(0, 100) + '...')

      const assistantMessage: GeminiMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      }

      return {
        success: true,
        message: assistantMessage
      }
    } catch (error: any) {
      console.error('Gemini API error详情:', error)
      return {
        success: false,
        error: this.parseError(error)
      }
    }
  }

  async sendStreamMessage(
    messages: GeminiMessage[],
    onChunk: (chunk: GeminiStreamChunk) => void
  ): Promise<void> {
    if (!this.isConfigured()) {
      onChunk({ content: '', finished: true, error: 'Gemini AI 未配置' })
      return
    }

    // 创建新的中断控制器
    this.currentStreamController = new AbortController()
    const signal = this.currentStreamController.signal

    try {
      // 使用真实的 Gemini 流式 API
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()
      if (!lastUserMessage) {
        onChunk({ content: '', finished: true, error: '没有找到用户消息' })
        return
      }

      let model = this.config!.model || 'gemini-2.5-flash-lite-preview-06-17'
      
      console.log('使用模型:', model)
      
      // 检查是否已被中断
      if (signal.aborted) {
        onChunk({ content: '', finished: true, error: '请求已被中断' })
        return
      }
      
      // 直接使用普通API并模拟流式效果
      console.log('使用普通API模拟流式效果')
      const response = await this.sendMessage(messages)
      
      if (signal.aborted) {
        onChunk({ content: '', finished: true, error: '请求已被中断' })
        return
      }
      
      if (response.success && response.message) {
        const content = response.message.content
        console.log('收到完整回复，开始模拟流式显示:', content.length, '字符')
        
        const chars = Array.from(content)
        
        for (let i = 0; i < chars.length; i++) {
          // 检查是否被中断
          if (signal.aborted) {
            console.log('流式输出被中断')
            onChunk({ content: '', finished: true, error: '输出已被中断' })
            return
          }
          
          const char = chars[i]
          const delay = char === ' ' ? 10 : 
                       /[.!?。！？\n]/.test(char) ? 150 :
                       /[，,；;：:]/.test(char) ? 100 : 30
          
          await new Promise(resolve => {
            const timeoutId = setTimeout(resolve, delay)
            
            // 如果被中断，清除超时
            signal.addEventListener('abort', () => {
              clearTimeout(timeoutId)
              resolve(undefined)
            })
          })
          
          // 再次检查是否被中断
          if (signal.aborted) {
            onChunk({ content: '', finished: true, error: '输出已被中断' })
            return
          }
          
          onChunk({ content: char, finished: false })
        }
        
        onChunk({ content: '', finished: true })
      } else {
        console.error('API调用失败:', response.error)
        onChunk({ content: '', finished: true, error: response.error })
      }
    } catch (error: any) {
      if (signal.aborted) {
        onChunk({ content: '', finished: true, error: '请求已被中断' })
      } else {
        onChunk({ content: '', finished: true, error: error.message })
      }
    } finally {
      this.currentStreamController = null
    }
  }

  // 中断当前的流式输出
  abortCurrentStream(): void {
    if (this.currentStreamController) {
      console.log('中断当前的流式输出')
      this.currentStreamController.abort()
      this.currentStreamController = null
    }
  }

  // 检查是否有正在进行的流式输出
  isStreaming(): boolean {
    return this.currentStreamController !== null
  }

  private formatMessages(messages: GeminiMessage[]): string[] {
    return messages.map(message => {
      const prefix = message.role === 'user' ? 'User: ' : 'Assistant: '
      return prefix + message.content
    })
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }


  private parseError(error: any): string {
    if (error.message) {
      if (error.message.includes('PERMISSION_DENIED')) {
        return 'API Key 无效或已暂停，请检查你的 Gemini API Key'
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        return 'API 调用次数已达上限，请稍后再试'
      }
      if (error.message.includes('INVALID_API_KEY')) {
        return 'API Key 格式错误，请检查你的 Gemini API Key'
      }
      return error.message
    }
    return '调用 Gemini API 失败'
  }
}

// 全局 Gemini AI 服务实例
export const geminiAI = new GeminiAIService()

// 常用的系统提示词
export const SYSTEM_PROMPTS = {
  writing: '你是一个专业的写作助手，帮助用户改进文档内容，提供清晰、准确、有用的建议。请用简体中文回答。',
  coding: '你是一个专业的编程助手，帮助用户编写、调试和优化代码。请提供准确的代码示例和解释。请用简体中文回答。',
  translation: '你是一个专业的翻译助手，帮助用户进行准确、流畅的翻译工作。请用简体中文回答。',
  analysis: '你是一个专业的分析师，帮助用户分析文档内容，提供深入的见解和建议。请用简体中文回答。',
  general: '你是一个有用的AI助手，可以帮助用户完成各种任务。请提供准确、有用的回答，并用简体中文回答。'
}