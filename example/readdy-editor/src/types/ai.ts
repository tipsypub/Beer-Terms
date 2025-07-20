// AI 相关类型定义

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'qwen' | 'baidu' | 'local'

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey: string
  baseUrl?: string
  maxTokens?: number
  temperature?: number
  topP?: number
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: number
  model?: string
}

export interface AIConversation {
  id: string
  title: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
  config: AIConfig
}

export interface AIResponse {
  success: boolean
  message?: AIMessage
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIStreamResponse {
  content: string
  finished: boolean
  error?: string
}

export interface AIProviderConfig {
  name: string
  provider: AIProvider
  displayName: string
  models: AIModelInfo[]
  requiresApiKey: boolean
  baseUrl?: string
  icon?: string
}

export interface AIModelInfo {
  id: string
  name: string
  maxTokens: number
  contextWindow: number
  pricing?: {
    input: number  // per 1M tokens
    output: number // per 1M tokens
  }
}

// 预定义的AI提供商配置
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    name: 'openai',
    provider: 'openai',
    displayName: 'OpenAI',
    requiresApiKey: true,
    baseUrl: 'https://api.openai.com/v1',
    icon: 'ri-openai-fill',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 4096,
        contextWindow: 128000,
        pricing: { input: 5, output: 15 }
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        maxTokens: 4096,
        contextWindow: 128000,
        pricing: { input: 0.15, output: 0.6 }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        maxTokens: 4096,
        contextWindow: 16385,
        pricing: { input: 0.5, output: 1.5 }
      }
    ]
  },
  claude: {
    name: 'claude',
    provider: 'claude',
    displayName: 'Anthropic Claude',
    requiresApiKey: true,
    baseUrl: 'https://api.anthropic.com/v1',
    icon: 'ri-robot-fill',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        maxTokens: 8192,
        contextWindow: 200000,
        pricing: { input: 3, output: 15 }
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        maxTokens: 4096,
        contextWindow: 200000,
        pricing: { input: 0.25, output: 1.25 }
      }
    ]
  },
  gemini: {
    name: 'gemini',
    provider: 'gemini',
    displayName: 'Google Gemini',
    requiresApiKey: true,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    icon: 'ri-google-fill',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        maxTokens: 8192,
        contextWindow: 2000000,
        pricing: { input: 1.25, output: 5 }
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        maxTokens: 8192,
        contextWindow: 1000000,
        pricing: { input: 0.075, output: 0.3 }
      }
    ]
  },
  qwen: {
    name: 'qwen',
    provider: 'qwen',
    displayName: '通义千问',
    requiresApiKey: true,
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    icon: 'ri-cloud-fill',
    models: [
      {
        id: 'qwen-turbo',
        name: 'Qwen Turbo',
        maxTokens: 6000,
        contextWindow: 6000
      },
      {
        id: 'qwen-plus',
        name: 'Qwen Plus',
        maxTokens: 6000,
        contextWindow: 30000
      },
      {
        id: 'qwen-max',
        name: 'Qwen Max',
        maxTokens: 6000,
        contextWindow: 6000
      }
    ]
  },
  baidu: {
    name: 'baidu',
    provider: 'baidu',
    displayName: '百度文心一言',
    requiresApiKey: true,
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
    icon: 'ri-baidu-fill',
    models: [
      {
        id: 'ernie-4.0-8k',
        name: 'ERNIE 4.0 8K',
        maxTokens: 2048,
        contextWindow: 5120
      },
      {
        id: 'ernie-3.5-8k',
        name: 'ERNIE 3.5 8K',
        maxTokens: 2048,
        contextWindow: 5120
      },
      {
        id: 'ernie-turbo-8k',
        name: 'ERNIE Turbo 8K',
        maxTokens: 2048,
        contextWindow: 7168
      }
    ]
  },
  local: {
    name: 'local',
    provider: 'local',
    displayName: '本地模型',
    requiresApiKey: false,
    baseUrl: 'http://localhost:11434/v1',
    icon: 'ri-computer-fill',
    models: [
      {
        id: 'llama3.1:8b',
        name: 'Llama 3.1 8B',
        maxTokens: 4096,
        contextWindow: 131072
      },
      {
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B',
        maxTokens: 4096,
        contextWindow: 32768
      }
    ]
  }
}