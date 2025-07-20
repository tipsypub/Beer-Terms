import type { 
  AIConfig, 
  AIMessage, 
  AIResponse, 
  AIStreamResponse, 
  AIProvider,
  AIConversation 
} from '@/types/ai'

// AI 服务抽象基类
export abstract class AIServiceBase {
  protected config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  abstract sendMessage(
    messages: AIMessage[], 
    options?: {
      stream?: boolean
      systemPrompt?: string
    }
  ): Promise<AIResponse>

  abstract sendStreamMessage(
    messages: AIMessage[],
    onChunk: (chunk: AIStreamResponse) => void,
    options?: {
      systemPrompt?: string
    }
  ): Promise<void>

  // 通用方法
  protected generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  protected createUserMessage(content: string): AIMessage {
    return {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date()
    }
  }

  protected createAssistantMessage(content: string): AIMessage {
    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      model: this.config.model
    }
  }

  protected async makeRequest(url: string, body: any, headers: Record<string, string> = {}): Promise<Response> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }
}

// OpenAI API 服务
export class OpenAIService extends AIServiceBase {
  async sendMessage(messages: AIMessage[], options?: { systemPrompt?: string }): Promise<AIResponse> {
    try {
      const apiMessages = this.formatMessages(messages, options?.systemPrompt)
      
      const response = await this.makeRequest(
        `${this.config.baseUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: apiMessages,
          max_tokens: this.config.maxTokens || 4096,
          temperature: this.config.temperature || 0.7,
          top_p: this.config.topP || 1
        },
        {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      )

      const data = await response.json()
      
      if (data.error) {
        return { success: false, error: data.error.message }
      }

      const assistantMessage = this.createAssistantMessage(data.choices[0].message.content)
      
      return {
        success: true,
        message: assistantMessage,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message || '请求失败' }
    }
  }

  async sendStreamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: AIStreamResponse) => void,
    options?: { systemPrompt?: string }
  ): Promise<void> {
    try {
      const apiMessages = this.formatMessages(messages, options?.systemPrompt)
      
      const response = await this.makeRequest(
        `${this.config.baseUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: apiMessages,
          max_tokens: this.config.maxTokens || 4096,
          temperature: this.config.temperature || 0.7,
          top_p: this.config.topP || 1,
          stream: true
        },
        {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      )

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onChunk({ content, finished: true })
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                content += parsed.choices[0].delta.content
                onChunk({ content: parsed.choices[0].delta.content, finished: false })
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      onChunk({ content: '', finished: true, error: error.message })
    }
  }

  private formatMessages(messages: AIMessage[], systemPrompt?: string) {
    const apiMessages: any[] = []
    
    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt })
    }
    
    apiMessages.push(...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })))
    
    return apiMessages
  }
}

// Claude API 服务
export class ClaudeService extends AIServiceBase {
  async sendMessage(messages: AIMessage[], options?: { systemPrompt?: string }): Promise<AIResponse> {
    try {
      const { systemPrompt, formattedMessages } = this.formatMessages(messages, options?.systemPrompt)
      
      const response = await this.makeRequest(
        `${this.config.baseUrl}/messages`,
        {
          model: this.config.model,
          max_tokens: this.config.maxTokens || 4096,
          messages: formattedMessages,
          system: systemPrompt,
          temperature: this.config.temperature || 0.7,
          top_p: this.config.topP || 1
        },
        {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        }
      )

      const data = await response.json()
      
      if (data.error) {
        return { success: false, error: data.error.message }
      }

      const assistantMessage = this.createAssistantMessage(data.content[0].text)
      
      return {
        success: true,
        message: assistantMessage,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message || '请求失败' }
    }
  }

  async sendStreamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: AIStreamResponse) => void,
    options?: { systemPrompt?: string }
  ): Promise<void> {
    try {
      const { systemPrompt, formattedMessages } = this.formatMessages(messages, options?.systemPrompt)
      
      const response = await this.makeRequest(
        `${this.config.baseUrl}/messages`,
        {
          model: this.config.model,
          max_tokens: this.config.maxTokens || 4096,
          messages: formattedMessages,
          system: systemPrompt,
          temperature: this.config.temperature || 0.7,
          top_p: this.config.topP || 1,
          stream: true
        },
        {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        }
      )

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                content += parsed.delta.text
                onChunk({ content: parsed.delta.text, finished: false })
              } else if (parsed.type === 'message_stop') {
                onChunk({ content, finished: true })
                return
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      onChunk({ content: '', finished: true, error: error.message })
    }
  }

  private formatMessages(messages: AIMessage[], systemPrompt?: string) {
    const filteredMessages = messages.filter(msg => msg.role !== 'system')
    
    return {
      systemPrompt,
      formattedMessages: filteredMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    }
  }
}

// Gemini API 服务
export class GeminiService extends AIServiceBase {
  async sendMessage(messages: AIMessage[], options?: { systemPrompt?: string }): Promise<AIResponse> {
    try {
      const formattedMessages = this.formatMessages(messages, options?.systemPrompt)
      
      const response = await this.makeRequest(
        `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          contents: formattedMessages,
          generationConfig: {
            maxOutputTokens: this.config.maxTokens || 4096,
            temperature: this.config.temperature || 0.7,
            topP: this.config.topP || 1
          }
        }
      )

      const data = await response.json()
      
      if (data.error) {
        return { success: false, error: data.error.message }
      }

      const assistantMessage = this.createAssistantMessage(
        data.candidates[0]?.content?.parts[0]?.text || ''
      )
      
      return {
        success: true,
        message: assistantMessage,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message || '请求失败' }
    }
  }

  async sendStreamMessage(
    messages: AIMessage[], 
    onChunk: (chunk: AIStreamResponse) => void,
    options?: { systemPrompt?: string }
  ): Promise<void> {
    // Gemini 流式实现较复杂，这里先实现非流式然后模拟流式
    try {
      const result = await this.sendMessage(messages, options)
      if (result.success && result.message) {
        // 模拟流式输出
        const content = result.message.content
        const words = content.split('')
        
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20))
          onChunk({ content: words[i], finished: false })
        }
        
        onChunk({ content, finished: true })
      } else {
        onChunk({ content: '', finished: true, error: result.error })
      }
    } catch (error: any) {
      onChunk({ content: '', finished: true, error: error.message })
    }
  }

  private formatMessages(messages: AIMessage[], systemPrompt?: string) {
    const contents: any[] = []
    
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      })
    }
    
    messages.forEach(msg => {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })
      }
    })
    
    return contents
  }
}

// AI 服务管理器
export class AIServiceManager {
  private services: Map<string, AIServiceBase> = new Map()
  private currentConfig: AIConfig | null = null

  setConfig(config: AIConfig) {
    this.currentConfig = config
    const serviceKey = `${config.provider}_${config.model}`
    
    if (!this.services.has(serviceKey)) {
      const service = this.createService(config)
      this.services.set(serviceKey, service)
    }
  }

  getCurrentService(): AIServiceBase | null {
    if (!this.currentConfig) return null
    
    const serviceKey = `${this.currentConfig.provider}_${this.currentConfig.model}`
    return this.services.get(serviceKey) || null
  }

  async sendMessage(
    messages: AIMessage[], 
    options?: { stream?: boolean; systemPrompt?: string }
  ): Promise<AIResponse> {
    const service = this.getCurrentService()
    if (!service) {
      return { success: false, error: 'AI 服务未配置' }
    }

    return await service.sendMessage(messages, options)
  }

  async sendStreamMessage(
    messages: AIMessage[],
    onChunk: (chunk: AIStreamResponse) => void,
    options?: { systemPrompt?: string }
  ): Promise<void> {
    const service = this.getCurrentService()
    if (!service) {
      onChunk({ content: '', finished: true, error: 'AI 服务未配置' })
      return
    }

    await service.sendStreamMessage(messages, onChunk, options)
  }

  private createService(config: AIConfig): AIServiceBase {
    switch (config.provider) {
      case 'openai':
        return new OpenAIService(config)
      case 'claude':
        return new ClaudeService(config)
      case 'gemini':
        return new GeminiService(config)
      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`)
    }
  }

  // 清除所有服务缓存
  clearCache() {
    this.services.clear()
    this.currentConfig = null
  }
}

// 全局 AI 服务实例
export const aiServiceManager = new AIServiceManager()

// 预设的系统提示词
export const SYSTEM_PROMPTS = {
  writing: '你是一个专业的写作助手，帮助用户改进文档内容，提供清晰、准确、有用的建议。',
  coding: '你是一个专业的编程助手，帮助用户编写、调试和优化代码。请提供准确的代码示例和解释。',
  translation: '你是一个专业的翻译助手，帮助用户进行准确、流畅的翻译工作。',
  analysis: '你是一个专业的分析师，帮助用户分析文档内容，提供深入的见解和建议。',
  general: '你是一个有用的AI助手，可以帮助用户完成各种任务。请提供准确、有用的回答。'
}