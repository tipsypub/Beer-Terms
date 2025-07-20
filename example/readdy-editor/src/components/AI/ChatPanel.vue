<template>
  <div class="ai-chat-panel flex flex-col h-full bg-white border-l border-gray-200">
    <!-- 头部工具栏 -->
    <div class="flex-shrink-0 p-4 border-b border-gray-200">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900">
          AI 助手
          <span v-if="isTyping" class="ml-2 text-sm text-orange-600 animate-pulse">
            正在回答...
          </span>
        </h3>
        <div class="flex space-x-2">
          <!-- 全局中断按钮 - 仅在AI生成时显示 -->
          <button
            v-if="isTyping"
            class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded animate-pulse"
            @click="stopGeneration"
            title="中断AI回答"
          >
            <i class="ri-stop-circle-line"></i>
          </button>
          
          <button
            class="p-1.5 text-gray-500 hover:text-gray-700 rounded"
            @click="toggleDocumentPicker"
            :class="{ 'bg-blue-100 text-blue-600': showDocumentPicker }"
            title="文档片段选择器"
          >
            <i class="ri-file-text-line"></i>
          </button>
          <button
            class="p-1.5 text-gray-500 hover:text-gray-700 rounded"
            @click="clearConversation"
            title="清空对话"
          >
            <i class="ri-delete-bin-line"></i>
          </button>
          <button
            class="p-1.5 text-gray-500 hover:text-gray-700 rounded"
            @click="showSettings = !showSettings"
            title="设置"
          >
            <i class="ri-settings-3-line"></i>
          </button>
        </div>
      </div>
      
      <!-- Gemini 模型选择 -->
      <div class="flex items-center space-x-2 text-sm">
        <i class="ri-google-fill text-primary"></i>
        <select 
          v-model="selectedModel" 
          class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          @change="handleModelChange"
        >
          <option value="gemini-2.5-flash-lite-preview-06-17">Gemini 2.5 Flash-Lite Preview 06-17</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
        </select>
      </div>
      
      <!-- 快速提示词 -->
      <div class="mt-3 flex flex-wrap gap-1">
        <button
          v-for="prompt in quickPrompts"
          :key="prompt.key"
          class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
          @click="selectQuickPrompt(prompt)"
        >
          {{ prompt.label }}
        </button>
      </div>
      
      <!-- 选中内容显示 -->
      <div 
        v-if="hasSelectedContext && selectedContext"
        class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center text-sm text-blue-800">
            <i class="ri-file-text-line mr-1"></i>
            <span class="font-medium">已选择上下文</span>
          </div>
          <button
            class="text-xs text-blue-600 hover:text-blue-800"
            @click="clearSelectedContext"
          >
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="text-xs text-blue-700">
          {{ selectedContext.summary }}
        </div>
        <div class="text-xs text-blue-600 mt-1">
          将作为上下文一同发送给AI模型
        </div>
      </div>
      
      <!-- 智能操作按钮 -->
      <div class="mt-3 flex flex-wrap gap-1">
        <button
          class="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors"
          @click="analyzeCurrentContent"
          title="分析当前编辑器内容"
        >
          <i class="ri-search-eye-line mr-1"></i>
          分析内容
        </button>
        <button
          class="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors"
          @click="improveSelectedText"
          title="改进选中文本"
        >
          <i class="ri-edit-2-line mr-1"></i>
          改进文本
        </button>
        <button
          class="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors"
          @click="translateSelectedText"
          title="翻译选中文本"
        >
          <i class="ri-translate-2 mr-1"></i>
          翻译
        </button>
        <button
          class="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full transition-colors"
          @click="summarizeContent"
          title="总结当前内容"
        >
          <i class="ri-file-list-3-line mr-1"></i>
          总结
        </button>
        <button
          class="px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full transition-colors"
          @click="generateCode"
          title="AI代码生成"
        >
          <i class="ri-code-s-slash-line mr-1"></i>
          生成代码
        </button>
        <button
          class="px-2 py-1 text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-full transition-colors"
          @click="explainCode"
          title="解释代码"
        >
          <i class="ri-question-line mr-1"></i>
          解释代码
        </button>
        <button
          class="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-full transition-colors"
          @click="formatContent"
          title="AI智能排版 - 优化Markdown格式"
        >
          <i class="ri-layout-line mr-1"></i>
          AI排版
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
          <input
            v-model="apiKey"
            type="password"
            placeholder="输入 Gemini API Key"
            class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            @change="saveSettings"
          />
          <p class="text-xs text-gray-500 mt-1">
            在 
            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-primary hover:underline">
              Google AI Studio
            </a> 
            获取免费 API Key
          </p>
          <div class="mt-2 flex space-x-2">
            <button 
              class="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              @click="useTestKey"
            >
              使用测试 API Key
            </button>
            <button 
              class="px-3 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded"
              @click="listAvailableModels"
              :disabled="!isConfigured"
            >
              查看可用模型
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
        <i class="ri-robot-line text-4xl mb-4"></i>
        <p class="text-lg mb-2">欢迎使用 AI 助手</p>
        <p class="text-sm">选择模型并输入消息开始对话</p>
      </div>
      
      <!-- 消息列表 -->
      <div v-for="message in messages" :key="message.id" class="message-item">
        <div 
          :class="[
            'flex',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div 
            :class="[
              'max-w-[80%] rounded-lg px-3 py-2',
              message.role === 'user' 
                ? 'bg-primary text-white' 
                : message.metadata?.interrupted 
                  ? 'bg-orange-50 text-gray-900 border border-orange-200'
                  : message.metadata?.isSystemMessage 
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-gray-100 text-gray-900'
            ]"
          >
            <!-- 上下文指示器 -->
            <div 
              v-if="message.role === 'user' && message.metadata?.hasContext"
              class="mb-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"
            >
              <i class="ri-file-text-line mr-1"></i>
              {{ message.metadata.contextSummary }}
            </div>
            
            <!-- 消息内容 -->
            <div class="message-content">
              <div v-if="message.role === 'assistant'" v-html="renderMarkdown(message.content)"></div>
              <div v-else>{{ message.content }}</div>
              <!-- 打字机光标效果 -->
              <span 
                v-if="message.role === 'assistant' && isTyping && messages[messages.length - 1].id === message.id"
                class="typing-cursor"
              >|</span>
            </div>
            
            <!-- AI消息操作按钮 -->
            <div v-if="message.role === 'assistant'" class="mt-2 flex flex-wrap gap-1">
              <button
                class="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                @click="insertToEditor(message.content)"
                title="插入到编辑器"
              >
                <i class="ri-file-copy-line mr-1"></i>
                插入到编辑器
              </button>
              <button
                class="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                @click="replaceEditorContent(message.content)"
                title="替换编辑器内容"
              >
                <i class="ri-file-edit-line mr-1"></i>
                替换内容
              </button>
              <button
                class="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                @click="copyToClipboard(message.content)"
                title="复制到剪贴板"
              >
                <i class="ri-clipboard-line mr-1"></i>
                复制
              </button>
              <!-- 格式化专用按钮 - 仅在检测到格式化响应时显示 -->
              <button
                v-if="isFormattingResponse(message.content)"
                class="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
                @click="applyFormattingDirectly(message.content)"
                title="直接应用格式化结果"
              >
                <i class="ri-magic-line mr-1"></i>
                应用格式
              </button>
              <!-- 智能排版专用按钮 - 仅在检测到智能格式化响应时显示 -->
              <button
                v-if="isSmartFormattingResponse(message)"
                class="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                @click="applySmartFormatting(message)"
                title="应用智能排版结果"
              >
                <i class="ri-wand-line mr-1"></i>
                应用智能排版
              </button>
              <!-- 被中断消息的重新生成按钮 -->
              <button
                v-if="message.metadata?.interrupted"
                class="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
                @click="regenerateResponse(message)"
                title="重新生成回答"
              >
                <i class="ri-refresh-line mr-1"></i>
                重新生成
              </button>
            </div>
            
            <!-- 消息元信息 -->
            <div 
              :class="[
                'text-xs mt-1 opacity-70',
                message.role === 'user' ? 'text-white' : 'text-gray-500'
              ]"
            >
              {{ formatTime(message.timestamp) }}
              <span v-if="message.role === 'assistant'" class="ml-2">{{ selectedModel }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 正在输入指示器 -->
      <div v-if="isTyping" class="flex justify-start">
        <div class="bg-gray-100 rounded-lg px-3 py-2 relative">
          <div class="flex items-center space-x-3">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span class="text-xs text-gray-500">AI正在思考...</span>
            <button
              class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              @click="stopGeneration"
              title="中断AI回答"
            >
              <i class="ri-stop-circle-line"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文档选择器 -->
    <div 
      v-if="showDocumentPicker"
      class="flex-shrink-0 h-64 border-t border-gray-200"
    >
      <DocumentPicker
        :content="getEditorContent()"
        @close="showDocumentPicker = false"
        @selection-change="handleSelectionChange"
        @use-selection="handleUseSelection"
      />
    </div>

    <!-- 输入区域 -->
    <div class="flex-shrink-0 p-4 border-t border-gray-200">
      <div class="relative">
        <textarea
          ref="messageInput"
          v-model="currentMessage"
          placeholder="输入消息... (Shift+Enter 换行，Enter 发送)"
          class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg resize-none"
          rows="2"
          :disabled="isTyping || !isConfigured"
          @keydown="handleKeydown"
        ></textarea>
        <!-- 发送/中断按钮 -->
        <div class="absolute right-2 bottom-2 flex space-x-1">
          <!-- 中断按钮 - 仅在AI生成时显示 -->
          <button
            v-if="isTyping"
            class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            @click="stopGeneration"
            title="中断AI回答"
          >
            <i class="ri-stop-circle-fill"></i>
          </button>
          
          <!-- 发送按钮 -->
          <button
            v-if="!isTyping"
            class="p-1.5 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!currentMessage.trim() || !isConfigured"
            @click="sendMessageWithContext"
          >
            <i class="ri-send-plane-fill"></i>
          </button>
        </div>
      </div>
      
      <!-- 状态提示 -->
      <div v-if="!isConfigured" class="mt-2 text-sm text-orange-600">
        <i class="ri-alert-line mr-1"></i>
        请先配置 Gemini API Key
      </div>
      <div v-if="lastError" class="mt-2 text-sm text-red-600">
        <i class="ri-error-warning-line mr-1"></i>
        {{ lastError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { geminiAI, SYSTEM_PROMPTS } from '@/services/gemini-ai'
import type { GeminiMessage, GeminiConfig } from '@/services/gemini-ai'
import MarkdownIt from 'markdown-it'
import * as monaco from 'monaco-editor'
import { createSmartFormatter } from '@/services/markdown-formatter'
import DocumentPicker from './DocumentPicker.vue'
import type { SelectedContext } from '@/services/document-picker'

// Props
interface Props {
  editorRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  editorRef: null,
})

// Emits
const emit = defineEmits<{
  'insert-to-editor': [content: string]
  'replace-editor-content': [content: string]
  'get-editor-content': []
  'get-selected-text': []
}>()

// 响应式数据
const messages = ref<GeminiMessage[]>([])
const currentMessage = ref('')
const isTyping = ref(false)
const showSettings = ref(false)
const lastError = ref('')
const showDocumentPicker = ref(false)
const selectedContext = ref<SelectedContext | null>(null)
const hasSelectedContext = ref(false)

// 配置
const apiKey = ref('')
const selectedModel = ref('gemini-2.5-flash-lite-preview-06-17')

// 快速提示词
const quickPrompts = [
  { key: 'writing', label: '写作助手', prompt: SYSTEM_PROMPTS.writing },
  { key: 'coding', label: '编程助手', prompt: SYSTEM_PROMPTS.coding },
  { key: 'translation', label: '翻译助手', prompt: SYSTEM_PROMPTS.translation },
  { key: 'analysis', label: '分析助手', prompt: SYSTEM_PROMPTS.analysis }
]

// 计算属性
const isConfigured = computed(() => {
  const configured = selectedModel.value && apiKey.value
  console.log('isConfigured check:', { 
    model: selectedModel.value, 
    hasApiKey: !!apiKey.value,
    configured 
  })
  return configured
})

// Markdown 渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 引用
const messageInput = ref<HTMLTextAreaElement>()

// 方法
const handleModelChange = () => {
  saveSettings()
  updateGeminiConfig()
}

const saveSettings = () => {
  if (typeof window !== 'undefined') {
    const settings = {
      selectedModel: selectedModel.value,
      apiKey: apiKey.value
    }
    localStorage.setItem('gemini-chat-settings', JSON.stringify(settings))
  }
}

const loadSettings = () => {
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem('gemini-chat-settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        selectedModel.value = settings.selectedModel || 'gemini-2.5-flash-lite-preview-06-17'
        apiKey.value = settings.apiKey || ''
      } catch (e) {
        console.error('Failed to load Gemini settings:', e)
      }
    }
  }
}

const updateGeminiConfig = () => {
  console.log('updateGeminiConfig called:', { 
    model: selectedModel.value, 
    hasApiKey: !!apiKey.value 
  })
  
  if (!selectedModel.value || !apiKey.value) {
    console.log('配置不完整，跳过设置')
    return
  }
  
  const config: GeminiConfig = {
    apiKey: apiKey.value,
    model: selectedModel.value
  }
  
  console.log('设置 Gemini 配置:', { ...config, apiKey: config.apiKey.substring(0, 10) + '...' })
  geminiAI.setConfig(config)
}

const useTestKey = () => {
  // Please set your own API key
  apiKey.value = ''
  saveSettings()
  updateGeminiConfig()
}

const listAvailableModels = async () => {
  if (!isConfigured.value) return
  
  try {
    const models = await geminiAI.listModels()
    console.log('获取到的模型列表:', models)
    
    // 显示在聊天界面中
    const modelListMessage: GeminiMessage = {
      id: `system_${Date.now()}`,
      role: 'assistant',
      content: `可用的 Gemini 模型列表：\n\n${models.map(model => `• ${model}`).join('\n')}\n\n请查看浏览器控制台获取完整信息。`,
      timestamp: new Date()
    }
    
    messages.value.push(modelListMessage)
    scrollToBottom()
  } catch (error: any) {
    console.error('获取模型列表失败:', error)
    lastError.value = '获取模型列表失败: ' + error.message
  }
}

const selectQuickPrompt = (prompt: any) => {
  currentMessage.value = `使用${prompt.label}模式：`
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const sendMessage = async () => {
  console.log('sendMessage called:', { 
    message: currentMessage.value.trim(),
    isTyping: isTyping.value,
    isConfigured: isConfigured.value 
  })
  
  if (!currentMessage.value.trim() || isTyping.value || !isConfigured.value) return
  
  lastError.value = ''
  
  // 添加用户消息
  const userMessage: GeminiMessage = {
    id: `user_${Date.now()}`,
    role: 'user',
    content: currentMessage.value.trim(),
    timestamp: new Date()
  }
  
  messages.value.push(userMessage)
  currentMessage.value = ''
  isTyping.value = true
  
  // 滚动到底部
  scrollToBottom()
  
  try {
    console.log('开始发送消息到 Gemini API')
    
    // 创建助手消息占位符
    const assistantMessage: GeminiMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    
    messages.value.push(assistantMessage)
    console.log('已添加占位符消息，当前消息数量:', messages.value.length)
    
    // 发送流式请求
    console.log('调用 sendStreamMessage')
    await geminiAI.sendStreamMessage(
      messages.value.slice(0, -1), // 不包括占位符消息
      (chunk) => {
        console.log('收到 chunk:', chunk)
        
        if (chunk.error) {
          console.error('流式错误:', chunk.error)
          lastError.value = chunk.error
          isTyping.value = false
          return
        }
        
        if (!chunk.finished) {
          // 逐字添加内容
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += chunk.content
            console.log('更新消息内容:', lastMessage.content.length, '字符')
            // 触发响应式更新
            messages.value = [...messages.value]
          }
          scrollToBottom()
        }
        
        if (chunk.finished) {
          console.log('流式完成，最终内容长度:', assistantMessage.content.length)
          isTyping.value = false
          scrollToBottom()
        }
      }
    )
    console.log('sendStreamMessage 调用完成')
  } catch (error: any) {
    lastError.value = error.message || '发送消息失败'
    isTyping.value = false
    // 移除占位符消息
    if (messages.value[messages.value.length - 1].content === '') {
      messages.value.pop()
    }
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessageWithContext()
  }
}

const clearConversation = () => {
  if (confirm('确定要清空对话吗？')) {
    messages.value = []
    lastError.value = ''
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.ai-chat-panel .overflow-y-auto')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

const renderMarkdown = (content: string): string => {
  return md.render(content)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 编辑器交互功能
const insertToEditor = (content: string) => {
  // 提取纯文本内容，去除 Markdown 格式
  const plainText = extractPlainText(content)
  
  if (props.editorRef) {
    // 使用 Monaco Editor 的原生方法插入文本
    const position = props.editorRef.getPosition()
    if (position) {
      props.editorRef.executeEdits('insert-ai-content', [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: plainText,
        },
      ])
      props.editorRef.focus()
    }
  } else {
    // 通过事件传递给父组件
    emit('insert-to-editor', plainText)
  }
}

const replaceEditorContent = (content: string) => {
  const plainText = extractPlainText(content)
  
  if (props.editorRef) {
    // 获取编辑器模型并替换全部内容
    const model = props.editorRef.getModel()
    if (model) {
      model.setValue(plainText)
      props.editorRef.focus()
    }
  } else {
    emit('replace-editor-content', plainText)
  }
}

const copyToClipboard = async (content: string) => {
  try {
    const plainText = extractPlainText(content)
    await navigator.clipboard.writeText(plainText)
    
    // 显示复制成功提示
    const successMessage: GeminiMessage = {
      id: `system_${Date.now()}`,
      role: 'assistant',
      content: '✅ 内容已复制到剪贴板',
      timestamp: new Date()
    }
    
    messages.value.push(successMessage)
    
    // 3秒后自动删除提示消息
    setTimeout(() => {
      const index = messages.value.findIndex(m => m.id === successMessage.id)
      if (index > -1) {
        messages.value.splice(index, 1)
      }
    }, 3000)
    
    scrollToBottom()
  } catch (error) {
    console.error('复制到剪贴板失败:', error)
  }
}

// 提取纯文本内容
const extractPlainText = (markdownContent: string): string => {
  // 移除 Markdown 语法，保留纯文本
  return markdownContent
    .replace(/```[\s\S]*?```/g, (match) => {
      // 保留代码块内容，但移除 ``` 标记
      return match.replace(/```(\w+)?\n?/g, '').replace(/```$/g, '')
    })
    .replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
    .replace(/~~([^~]+)~~/g, '$1') // 移除删除线标记
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/>\s+/g, '') // 移除引用标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/^\s*[-*+]\s+/gm, '') // 移除无序列表标记
    .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
    .trim()
}

// 获取编辑器当前内容
const getEditorContent = (): string => {
  if (props.editorRef) {
    const model = props.editorRef.getModel()
    return model ? model.getValue() : ''
  }
  return ''
}

// 获取编辑器选中文本
const getSelectedText = (): string => {
  if (props.editorRef) {
    const selection = props.editorRef.getSelection()
    const model = props.editorRef.getModel()
    if (selection && model) {
      return model.getValueInRange(selection)
    }
  }
  return ''
}

// 智能操作功能
const analyzeCurrentContent = async () => {
  const content = getEditorContent()
  if (!content.trim()) {
    lastError.value = '编辑器内容为空，无法分析'
    return
  }
  
  // 检测内容类型并提供针对性分析
  const contentType = detectContentType(content)
  let prompt = ''
  
  switch (contentType) {
    case 'code':
      prompt = `请对以下代码进行专业分析，包括：
1. 代码语言和框架识别
2. 代码结构和设计模式分析
3. 潜在的性能问题和优化建议
4. 代码规范和最佳实践建议
5. 安全性检查

请用简体中文回答。

代码内容：
${content}`
      break
      
    case 'markdown':
      prompt = `请分析以下 Markdown 文档，提供：
1. 文档结构和组织评估
2. 内容完整性检查
3. 可读性和表达改进建议
4. SEO 优化建议（如果适用）
5. 格式和样式优化

请用简体中文回答。

文档内容：
${content}`
      break
      
    case 'documentation':
      prompt = `请分析以下技术文档，重点关注：
1. 文档清晰度和逻辑性
2. 信息完整性和准确性
3. 读者体验和可理解性
4. 缺失的重要信息
5. 改进建议和最佳实践

请用简体中文回答。

文档内容：
${content}`
      break
      
    default:
      prompt = `请分析以下内容，提供结构化的分析报告，包括：
1. 内容类型和主题识别
2. 关键信息提取和摘要
3. 逻辑结构和组织评估
4. 语言表达和风格分析
5. 改进建议和优化方向

请用简体中文回答。

内容如下：
${content}`
  }

  currentMessage.value = prompt
  await sendMessage()
}

// 检测内容类型
const detectContentType = (content: string): 'code' | 'markdown' | 'documentation' | 'general' => {
  // 检测代码特征
  const codeIndicators = [
    /function\s+\w+\s*\(/,
    /class\s+\w+/,
    /import\s+.*from/,
    /const\s+\w+\s*=/,
    /def\s+\w+\s*\(/,
    /<\w+.*>/,
    /{\s*[\w\s:;,]*}/,
    /\[\s*[\w\s:;,]*\]/
  ]
  
  // 检测 Markdown 特征
  const markdownIndicators = [
    /^#{1,6}\s+/m,
    /\*\*.*\*\*/,
    /\[.*\]\(.*\)/,
    /```[\s\S]*```/,
    /^\s*[-*+]\s+/m
  ]
  
  // 检测文档特征
  const docIndicators = [
    /API|接口|文档|说明|指南|教程/i,
    /安装|配置|使用方法|快速开始/i,
    /参数|返回值|示例|注意事项/i
  ]
  
  const codeScore = codeIndicators.filter(regex => regex.test(content)).length
  const markdownScore = markdownIndicators.filter(regex => regex.test(content)).length
  const docScore = docIndicators.filter(regex => regex.test(content)).length
  
  if (codeScore >= 2) return 'code'
  if (markdownScore >= 2) return 'markdown'
  if (docScore >= 2) return 'documentation'
  return 'general'
}

const improveSelectedText = async () => {
  const selectedText = getSelectedText()
  if (!selectedText.trim()) {
    lastError.value = '请先选中要改进的文本'
    return
  }
  
  // 基于选中文本类型提供针对性改进
  const textType = detectTextType(selectedText)
  let prompt = ''
  
  switch (textType) {
    case 'code':
      prompt = `请改进以下代码，重点关注：
1. 代码可读性和清晰度
2. 性能优化
3. 最佳实践应用
4. 错误处理和边界情况
5. 代码注释和文档

请用简体中文回答。

原代码：
${selectedText}

请提供改进后的代码，并详细说明改进理由。`
      break
      
    case 'comment':
      prompt = `请改进以下注释或文档说明，使其：
1. 更加清晰易懂
2. 信息更完整准确
3. 符合技术写作规范
4. 对读者更有帮助

请用简体中文回答。

原注释：
${selectedText}

请提供改进后的注释。`
      break
      
    case 'technical':
      prompt = `请改进以下技术性文本，重点提升：
1. 专业术语的准确使用
2. 逻辑表达的清晰度
3. 信息的完整性
4. 可理解性和可操作性

请用简体中文回答。

原文：
${selectedText}

请提供改进版本并说明改进要点。`
      break
      
    default:
      prompt = `请改进以下文本，使其更加清晰、准确和易读：
1. 提升语言表达的流畅性
2. 增强逻辑性和条理性
3. 改进用词的准确性
4. 优化句式结构

请用简体中文回答。

原文：
${selectedText}

请提供改进后的版本，并说明主要改进点。`
  }

  currentMessage.value = prompt
  await sendMessage()
}

// 检测文本类型
const detectTextType = (text: string): 'code' | 'comment' | 'technical' | 'general' => {
  // 代码特征
  if (/^[\s]*\/\/|^[\s]*\/\*|^[\s]*#|function|class|const|let|var|import|export/m.test(text)) {
    return 'code'
  }
  
  // 注释特征
  if (/^[\s]*\/\/|^[\s]*\/\*|^[\s]*#|TODO|FIXME|NOTE/m.test(text)) {
    return 'comment'
  }
  
  // 技术文档特征
  if (/API|接口|配置|参数|返回值|示例|安装|部署|框架|库|模块|组件/i.test(text)) {
    return 'technical'
  }
  
  return 'general'
}

const translateSelectedText = async () => {
  const selectedText = getSelectedText()
  if (!selectedText.trim()) {
    lastError.value = '请先选中要翻译的文本'
    return
  }
  
  // 检测语言并提供双向翻译
  const prompt = `请翻译以下文本。如果是中文，请翻译成英文；如果是英文，请翻译成中文。同时提供原文的语言识别结果。请用简体中文说明：

原文：
${selectedText}`

  currentMessage.value = prompt
  await sendMessage()
}

const summarizeContent = async () => {
  const content = getEditorContent()
  if (!content.trim()) {
    lastError.value = '编辑器内容为空，无法总结'
    return
  }
  
  const prompt = `请为以下内容提供简洁的总结，包括：
1. 主要观点（3-5个要点）
2. 核心结论
3. 关键信息

请用简体中文回答。

内容如下：
${content}`

  currentMessage.value = prompt
  await sendMessage()
}

const generateCode = async () => {
  const selectedText = getSelectedText()
  const prompt = selectedText.trim() 
    ? `请根据以下需求生成代码：

需求描述：
${selectedText}

请提供完整的实现，包括：
1. 清晰的代码结构
2. 必要的注释说明
3. 错误处理机制
4. 使用示例（如果适用）

请用简体中文说明。`
    : `请描述您想要生成的代码功能，我可以帮您：
1. 生成函数或类的实现
2. 创建完整的应用程序结构
3. 编写测试用例
4. 实现算法和数据结构
5. 解决特定的编程问题

请在下方输入您的具体需求，我将用简体中文为您解释和生成代码。`

  currentMessage.value = prompt
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const explainCode = async () => {
  const selectedText = getSelectedText()
  if (!selectedText.trim()) {
    lastError.value = '请先选中要解释的代码'
    return
  }
  
  const prompt = `请详细解释以下代码，包括：
1. 代码的主要功能和目的
2. 关键变量和数据结构
3. 算法逻辑和执行流程
4. 潜在的问题或改进点
5. 使用场景和最佳实践

请用简体中文回答。

代码：
${selectedText}`

  currentMessage.value = prompt
  await sendMessage()
}

// AI智能排版功能
const formatContent = async () => {
  const content = getEditorContent()
  if (!content.trim()) {
    lastError.value = '编辑器内容为空，无法进行排版'
    return
  }
  
  try {
    // 使用智能Markdown格式化器
    const formatter = createSmartFormatter({
      enableIncrementalFormatting: true,
      preserveOriginalStructure: false,
      enableCodeFormatting: true
    })
    
    // 显示格式化进度
    const progressMessage: GeminiMessage = {
      id: `progress_${Date.now()}`,
      role: 'assistant',
      content: '🔄 正在分析文档结构并进行智能排版...',
      timestamp: new Date()
    }
    
    messages.value.push(progressMessage)
    scrollToBottom()
    
    // 执行智能格式化
    const result = await formatter.formatDocument(content)
    
    // 移除进度消息
    const progressIndex = messages.value.findIndex(m => m.id === progressMessage.id)
    if (progressIndex > -1) {
      messages.value.splice(progressIndex, 1)
    }
    
    // 创建格式化结果消息
    const formatResultMessage: GeminiMessage = {
      id: `format_${Date.now()}`,
      role: 'assistant',
      content: `✅ **智能排版完成**

**文档分析结果：**
- 文档类型：${getDocumentTypeDescription(result.analysis.documentType)}
- 标题层级：${result.analysis.headingStructure.levels.join(', ')}
- 内容块数量：${result.analysis.contentBlocks.length}
- 代码块数量：${result.analysis.codeBlocks.length}
- 列表数量：${result.analysis.listStructure.unordered.length + result.analysis.listStructure.ordered.length}

**格式化统计：**
- 原始长度：${result.originalLength} 字符
- 格式化后长度：${result.formattedLength} 字符
- 处理时间：${result.processingTime.toFixed(2)}ms

**格式化内容：**

\`\`\`markdown
${result.formatted}
\`\`\`

点击下方"应用智能排版"按钮可直接将格式化结果应用到编辑器中。`,
      timestamp: new Date()
    }
    
    messages.value.push(formatResultMessage)
    scrollToBottom()
    
    // 存储格式化结果以供后续使用
    formatResultMessage.metadata = { formattedContent: result.formatted }
    
  } catch (error) {
    // 智能格式化失败时，回退到AI格式化
    console.warn('智能格式化失败，回退到AI格式化:', error)
    
    const fallbackMessage: GeminiMessage = {
      id: `fallback_${Date.now()}`,
      role: 'assistant',
      content: '⚠️ 智能格式化遇到问题，正在使用AI助手进行排版...',
      timestamp: new Date()
    }
    
    messages.value.push(fallbackMessage)
    scrollToBottom()
    
    // 移除fallback消息并使用原有的AI格式化
    setTimeout(() => {
      const fallbackIndex = messages.value.findIndex(m => m.id === fallbackMessage.id)
      if (fallbackIndex > -1) {
        messages.value.splice(fallbackIndex, 1)
      }
      
      // 使用原有的AI格式化逻辑
      const documentType = analyzeDocumentType(content)
      const structureAnalysis = analyzeTextStructure(content)
      
      let prompt = `请对以下内容进行专业的Markdown格式排版优化。

文档类型分析：${documentType}
结构特征：${structureAnalysis}

排版要求：
1. **标题层级优化**：根据内容逻辑合理设置H1-H6标题层级
2. **段落结构**：确保段落之间有适当的空行，提升可读性
3. **列表格式**：将适合的内容转换为有序或无序列表
4. **代码格式**：识别代码片段并使用正确的代码块格式
5. **强调标记**：为重要内容添加粗体、斜体等强调标记
6. **表格优化**：如果有表格数据，转换为Markdown表格格式
7. **链接处理**：确保链接格式正确
8. **引用格式**：为引用内容添加合适的引用标记
9. **分隔符**：在章节间添加适当的分隔符
10. **整体美化**：提升文档的视觉层次和专业感

请直接输出优化后的Markdown格式内容，保持原有信息完整性的同时大幅提升格式规范性和可读性。请用简体中文处理所有中文内容。

原始内容：
${content}`

      currentMessage.value = prompt
      sendMessage()
    }, 1000)
  }
}

// 获取文档类型描述
const getDocumentTypeDescription = (type: string): string => {
  switch (type) {
    case 'api-doc':
      return 'API文档'
    case 'tutorial':
      return '教程文档'
    case 'note':
      return '笔记文档'
    case 'general':
      return '通用文档'
    default:
      return '未知类型'
  }
}

// 分析文档类型
const analyzeDocumentType = (content: string): string => {
  const indicators = {
    'API文档': /API|接口|endpoint|request|response|参数|返回值/i,
    '技术教程': /教程|指南|步骤|安装|配置|使用方法|快速开始/i,
    '项目文档': /README|项目|介绍|功能|特性|依赖|license/i,
    '代码注释': /function|class|const|let|var|\/\/|\/\*|\#/,
    '学术论文': /摘要|abstract|关键词|参考文献|conclusion|引言/i,
    '产品说明': /产品|功能|特性|优势|使用|操作|说明/i,
    '会议记录': /会议|讨论|决定|action|todo|下一步/i,
    '技术博客': /博客|分享|经验|总结|心得|技巧/i
  }
  
  const scores = Object.entries(indicators).map(([type, regex]) => ({
    type,
    score: (content.match(regex) || []).length
  }))
  
  const bestMatch = scores.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  )
  
  return bestMatch.score > 0 ? bestMatch.type : '通用文档'
}

// 分析文本结构
const analyzeTextStructure = (content: string): string => {
  const features = []
  
  // 检查现有的Markdown元素
  if (/^#{1,6}\s+/m.test(content)) features.push('已有标题结构')
  if (/^\s*[-*+]\s+/m.test(content)) features.push('包含列表')
  if (/```[\s\S]*?```/.test(content)) features.push('包含代码块')
  if (/\*\*.*?\*\*|\*.*?\*/.test(content)) features.push('有强调标记')
  if (/\[.*?\]\(.*?\)/.test(content)) features.push('包含链接')
  if (/^\s*\|.*\|/m.test(content)) features.push('包含表格')
  if (/^>\s+/m.test(content)) features.push('有引用内容')
  
  // 检查文本特征
  const lines = content.split('\n')
  const nonEmptyLines = lines.filter(line => line.trim())
  const shortLines = nonEmptyLines.filter(line => line.length < 50)
  const longLines = nonEmptyLines.filter(line => line.length > 100)
  
  if (shortLines.length > nonEmptyLines.length * 0.3) features.push('多短段落')
  if (longLines.length > nonEmptyLines.length * 0.3) features.push('长段落较多')
  
  // 检查段落分布
  const emptyLines = lines.filter(line => !line.trim()).length
  if (emptyLines < nonEmptyLines.length * 0.1) features.push('段落密集')
  if (emptyLines > nonEmptyLines.length * 0.3) features.push('段落稀疏')
  
  return features.length > 0 ? features.join(', ') : '纯文本内容'
}

// 检测是否为格式化响应
const isFormattingResponse = (content: string): boolean => {
  // 检测是否包含大量Markdown格式化内容
  const markdownIndicators = [
    /^#{1,6}\s+/m,  // 标题
    /^\s*[-*+]\s+/m,  // 列表
    /```[\s\S]*?```/,  // 代码块
    /\*\*.*?\*\*/,  // 粗体
    /\[.*?\]\(.*?\)/,  // 链接
    /^\s*\|.*\|/m,  // 表格
    /^>\s+/m,  // 引用
    /^\s*---\s*$/m  // 分隔符
  ]
  
  const matchCount = markdownIndicators.filter(regex => regex.test(content)).length
  const contentLength = content.length
  
  // 如果包含3个以上的Markdown元素且内容较长，认为是格式化响应
  return matchCount >= 3 && contentLength > 200
}

// 检测是否为智能格式化响应
const isSmartFormattingResponse = (message: GeminiMessage): boolean => {
  return message.content.includes('智能排版完成') && 
         message.metadata && 
         message.metadata.formattedContent
}

// 应用智能格式化结果
const applySmartFormatting = (message: GeminiMessage) => {
  if (!message.metadata || !message.metadata.formattedContent) {
    console.error('智能格式化内容不存在')
    return
  }

  const formattedContent = message.metadata.formattedContent

  if (props.editorRef) {
    // 获取编辑器模型并替换全部内容
    const model = props.editorRef.getModel()
    if (model) {
      model.setValue(formattedContent)
      props.editorRef.focus()
      
      // 显示应用成功提示
      const successMessage: GeminiMessage = {
        id: `system_${Date.now()}`,
        role: 'assistant',
        content: '✅ 智能排版结果已成功应用到编辑器',
        timestamp: new Date()
      }
      
      messages.value.push(successMessage)
      
      // 3秒后自动删除提示消息
      setTimeout(() => {
        const index = messages.value.findIndex(m => m.id === successMessage.id)
        if (index > -1) {
          messages.value.splice(index, 1)
        }
      }, 3000)
      
      scrollToBottom()
    }
  } else {
    emit('replace-editor-content', formattedContent)
  }
}

// 直接应用格式化结果
const applyFormattingDirectly = (content: string) => {
  // 提取Markdown内容，保留格式
  const formattedContent = extractFormattedContent(content)
  
  if (props.editorRef) {
    // 获取编辑器模型并替换全部内容
    const model = props.editorRef.getModel()
    if (model) {
      model.setValue(formattedContent)
      props.editorRef.focus()
      
      // 显示应用成功提示
      const successMessage: GeminiMessage = {
        id: `system_${Date.now()}`,
        role: 'assistant',
        content: '✅ 格式化内容已应用到编辑器',
        timestamp: new Date()
      }
      
      messages.value.push(successMessage)
      
      // 3秒后自动删除提示消息
      setTimeout(() => {
        const index = messages.value.findIndex(m => m.id === successMessage.id)
        if (index > -1) {
          messages.value.splice(index, 1)
        }
      }, 3000)
      
      scrollToBottom()
    }
  } else {
    emit('replace-editor-content', formattedContent)
  }
}

// 提取格式化内容
const extractFormattedContent = (markdownContent: string): string => {
  // 智能提取格式化后的内容
  // 移除AI回复中的说明性文字，保留实际的格式化内容
  
  let content = markdownContent
  
  // 移除常见的AI回复前缀
  content = content.replace(/^(以下是|这是|我为您|根据要求|经过分析|优化后的内容|格式化后的内容).*?[:：]\s*/gm, '')
  
  // 移除回复结尾的说明
  content = content.replace(/(以上就是|希望这个|这样的格式|如有需要).*$/gm, '')
  
  // 移除多余的空行（保留适当的段落间距）
  content = content.replace(/\n{3,}/g, '\n\n')
  
  // 确保代码块前后有空行
  content = content.replace(/([^\n])\n```/g, '$1\n\n```')
  content = content.replace(/```\n([^\n])/g, '```\n\n$1')
  
  return content.trim()
}

// 文档选择器相关方法
const toggleDocumentPicker = () => {
  showDocumentPicker.value = !showDocumentPicker.value
}

const handleSelectionChange = (context: SelectedContext) => {
  selectedContext.value = context
  hasSelectedContext.value = context.fragments.length > 0
}

const handleUseSelection = (content: string, context: SelectedContext) => {
  selectedContext.value = context
  hasSelectedContext.value = true
  showDocumentPicker.value = false
  
  // 可以选择直接插入到输入框或者显示确认
  const confirmMessage = `已选择 ${context.fragments.length} 个片段作为上下文。这些内容将在下次对话时自动包含。`
  
  // 显示确认消息
  const confirmationMessage: GeminiMessage = {
    id: `context_${Date.now()}`,
    role: 'assistant',
    content: `✅ ${confirmMessage}`,
    timestamp: new Date()
  }
  
  messages.value.push(confirmationMessage)
  
  // 3秒后自动删除确认消息
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === confirmationMessage.id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }, 3000)
  
  scrollToBottom()
}

const clearSelectedContext = () => {
  selectedContext.value = null
  hasSelectedContext.value = false
}

// 中断AI生成
const stopGeneration = () => {
  if (isTyping.value) {
    console.log('用户请求中断AI生成')
    
    // 调用AI服务的中断方法
    geminiAI.abortCurrentStream()
    
    // 立即更新状态
    isTyping.value = false
    
    // 清除错误状态
    lastError.value = ''
    
    // 找到最后一条AI消息并标记为被中断
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      // 如果消息内容为空或很短，则移除这条消息
      if (lastMessage.content.trim().length < 10) {
        messages.value.pop()
      } else {
        // 否则添加中断标记
        lastMessage.content += '\n\n*[回答被用户中断]*'
        lastMessage.metadata = { 
          ...lastMessage.metadata, 
          interrupted: true 
        }
      }
    }
    
    // 显示中断确认消息
    const interruptMessage: GeminiMessage = {
      id: `interrupt_${Date.now()}`,
      role: 'assistant',
      content: '⏹️ 已中断AI回答。您可以继续提问或重新发送上一个问题。',
      timestamp: new Date(),
      metadata: { isSystemMessage: true }
    }
    
    messages.value.push(interruptMessage)
    
    // 3秒后自动删除中断提示消息
    setTimeout(() => {
      const index = messages.value.findIndex(m => m.id === interruptMessage.id)
      if (index > -1) {
        messages.value.splice(index, 1)
      }
    }, 3000)
    
    scrollToBottom()
  }
}

// 修改sendMessage方法以包含选中的上下文
const sendMessageWithContext = async () => {
  if (!currentMessage.value.trim() || isTyping.value || !isConfigured.value) return
  
  lastError.value = ''
  
  // 构建消息内容
  let messageContent = currentMessage.value.trim()
  
  // 如果有选中的上下文，添加到消息中
  if (hasSelectedContext.value && selectedContext.value) {
    const contextContent = selectedContext.value.fragments
      .map(f => f.content)
      .join('\n\n')
    
    messageContent = `**上下文信息：**\n${contextContent}\n\n**用户问题：**\n${messageContent}`
  }
  
  // 添加用户消息
  const userMessage: GeminiMessage = {
    id: `user_${Date.now()}`,
    role: 'user',
    content: currentMessage.value.trim(), // 显示原始用户输入
    timestamp: new Date(),
    metadata: hasSelectedContext.value ? { 
      hasContext: true,
      contextSummary: selectedContext.value?.summary 
    } : undefined
  }
  
  messages.value.push(userMessage)
  currentMessage.value = ''
  isTyping.value = true
  
  // 滚动到底部
  scrollToBottom()
  
  try {
    console.log('开始发送带上下文的消息到 Gemini API')
    
    // 创建助手消息占位符
    const assistantMessage: GeminiMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    
    messages.value.push(assistantMessage)
    
    // 构建发送给API的消息（包含上下文）
    const apiMessages = messages.value.slice(0, -2) // 排除刚添加的用户消息和助手占位符
    apiMessages.push({
      ...userMessage,
      content: messageContent // 使用包含上下文的内容
    })
    
    // 发送流式请求
    await geminiAI.sendStreamMessage(
      apiMessages,
      (chunk) => {
        if (chunk.error) {
          console.error('流式错误:', chunk.error)
          lastError.value = chunk.error
          isTyping.value = false
          return
        }
        
        if (!chunk.finished) {
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += chunk.content
            messages.value = [...messages.value]
          }
          scrollToBottom()
        }
        
        if (chunk.finished) {
          isTyping.value = false
          scrollToBottom()
        }
      }
    )
  } catch (error: any) {
    lastError.value = error.message || '发送消息失败'
    isTyping.value = false
    // 移除占位符消息
    if (messages.value[messages.value.length - 1].content === '') {
      messages.value.pop()
    }
  }
}

// 重新生成被中断的回答
const regenerateResponse = async (interruptedMessage: GeminiMessage) => {
  if (isTyping.value) return
  
  // 找到被中断消息对应的用户消息
  const messageIndex = messages.value.findIndex(m => m.id === interruptedMessage.id)
  if (messageIndex === -1) return
  
  // 找到对应的用户消息（应该在被中断消息之前）
  let userMessage: GeminiMessage | null = null
  for (let i = messageIndex - 1; i >= 0; i--) {
    if (messages.value[i].role === 'user') {
      userMessage = messages.value[i]
      break
    }
  }
  
  if (!userMessage) return
  
  // 移除被中断的消息
  messages.value.splice(messageIndex, 1)
  
  // 重新发送请求
  isTyping.value = true
  lastError.value = ''
  
  try {
    console.log('重新生成被中断的回答')
    
    // 创建新的助手消息占位符
    const assistantMessage: GeminiMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    
    messages.value.push(assistantMessage)
    scrollToBottom()
    
    // 构建消息历史（不包括刚添加的占位符）
    const apiMessages = messages.value.slice(0, -1)
    
    // 发送流式请求
    await geminiAI.sendStreamMessage(
      apiMessages,
      (chunk) => {
        if (chunk.error) {
          console.error('重新生成流式错误:', chunk.error)
          lastError.value = chunk.error
          isTyping.value = false
          return
        }
        
        if (!chunk.finished) {
          const lastMessage = messages.value[messages.value.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content += chunk.content
            messages.value = [...messages.value]
          }
          scrollToBottom()
        }
        
        if (chunk.finished) {
          isTyping.value = false
          scrollToBottom()
        }
      }
    )
  } catch (error: any) {
    lastError.value = error.message || '重新生成失败'
    isTyping.value = false
    // 移除占位符消息
    if (messages.value[messages.value.length - 1].content === '') {
      messages.value.pop()
    }
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  updateGeminiConfig()
})
</script>

<style scoped>
.message-item {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-content {
  word-wrap: break-word;
  white-space: pre-wrap;
}

/* Markdown 样式 */
.message-content :deep(pre) {
  @apply bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm;
}

.message-content :deep(code) {
  @apply bg-gray-200 px-1 py-0.5 rounded text-sm;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3) {
  @apply font-semibold mt-3 mb-2;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  @apply ml-4 mb-2;
}

.message-content :deep(li) {
  @apply mb-1;
}

.message-content :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-3 text-gray-700 italic;
}

.message-content :deep(a) {
  @apply text-blue-600 hover:underline;
}

/* 动画样式 */
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}

/* 打字机光标效果 */
.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  font-weight: normal;
  color: currentColor;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>