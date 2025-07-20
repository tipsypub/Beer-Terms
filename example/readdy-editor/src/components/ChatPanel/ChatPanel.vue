<template>
  <aside class="w-full h-full bg-white border-l border-gray-200 flex flex-col">
    <!-- AI助手头部 -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-2">
          <div
            class="w-8 h-8 bg-gradient-to-br from-ai to-primary rounded-full flex items-center justify-center"
          >
            <i class="ri-robot-fill text-white"></i>
          </div>
          <div>
            <h3 class="font-medium">AI 写作助手</h3>
            <p class="text-xs text-gray-500">{{ currentModel }} • {{ connectionStatus }}</p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100"
            @click="clearChat"
          >
            <i class="ri-refresh-line text-sm"></i>
          </button>
          <button
            class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100"
            @click="$emit('open-ai-settings')"
          >
            <i class="ri-settings-3-line text-sm"></i>
          </button>
        </div>
      </div>

      <!-- 快捷操作按钮 -->
      <div class="flex flex-wrap gap-2">
        <button
          class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100"
          @click="sendQuickAction('continue')"
        >
          ✨ 续写内容
        </button>
        <button
          class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs hover:bg-green-100"
          @click="sendQuickAction('improve')"
        >
          🔧 优化文本
        </button>
        <button
          class="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs hover:bg-purple-100"
          @click="sendQuickAction('brainstorm')"
        >
          💡 生成想法
        </button>
      </div>
    </div>

    <!-- 对话内容区 -->
    <div ref="chatContent" class="flex-1 overflow-y-auto p-4 flex flex-col space-y-3">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="message-bubble ai-message">
        <div class="flex items-start space-x-2">
          <div
            class="w-6 h-6 bg-gradient-to-br from-ai to-primary rounded-full flex items-center justify-center flex-shrink-0"
          >
            <i class="ri-robot-fill text-white text-xs"></i>
          </div>
          <div>
            <p class="text-sm">你好！我是你的 AI 写作助手。我可以帮你：</p>
            <ul class="text-sm mt-2 space-y-1">
              <li>• 生成和续写内容</li>
              <li>• 优化文本表达</li>
              <li>• 检查语法错误</li>
              <li>• 翻译多种语言</li>
              <li>• 生成代码和表格</li>
            </ul>
            <p class="text-sm mt-2 text-gray-600">有什么需要帮助的吗？</p>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
        @copy="copyToClipboard"
        @insert="insertToEditor"
      />

      <!-- 打字指示器 -->
      <div v-if="isTyping" class="message-bubble ai-message">
        <div class="flex items-start space-x-2">
          <div
            class="w-6 h-6 bg-gradient-to-br from-ai to-primary rounded-full flex items-center justify-center flex-shrink-0"
          >
            <i class="ri-robot-fill text-white text-xs"></i>
          </div>
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-4 border-t border-gray-200">
      <!-- Token 使用情况 -->
      <div class="flex text-xs text-gray-500 mb-2 justify-between">
        <span>今日用量: {{ tokenUsage.today }} tokens</span>
        <span>估算成本: ¥{{ tokenUsage.cost.toFixed(2) }}</span>
      </div>

      <!-- 输入框 -->
      <div class="relative">
        <textarea
          v-model="inputText"
          placeholder="描述你的需求，例如：帮我写一个函数..."
          class="w-full px-3 py-2 pr-10 border border-gray-300 rounded resize-none h-20 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          @keydown.ctrl.enter="sendMessage"
          @keydown.shift.enter.prevent="inputText += '\n'"
          @input="updateCharCount"
        />
        <button
          :disabled="!inputText.trim() || isTyping"
          class="absolute right-2 bottom-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="sendMessage"
        >
          <i class="ri-send-plane-fill"></i>
        </button>
      </div>

      <!-- 输入提示 -->
      <div class="flex justify-between text-xs text-gray-500 mt-1">
        <span>Shift + Enter 换行 • Ctrl + Enter 发送</span>
        <span>{{ charCount }}/2000</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { ChatMessage as ChatMessageType } from '@/types'
import ChatMessage from './ChatMessage.vue'

// Props
interface Props {
  currentModel?: string
  connectionStatus?: string
}

withDefaults(defineProps<Props>(), {
  currentModel: 'GPT-3.5 Turbo',
  connectionStatus: '在线',
})

// Emits
const emit = defineEmits<{
  'send-message': [message: string]
  'open-ai-settings': []
  'insert-to-editor': [text: string]
}>()

// 响应式数据
const inputText = ref('')
const messages = ref<ChatMessageType[]>([])
const isTyping = ref(false)
const chatContent = ref<HTMLElement>()

// Token 使用统计
const tokenUsage = ref({
  today: 1234,
  cost: 0.12,
})

// 字符计数
const charCount = computed(() => inputText.value.length)

// 方法
const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  // 添加用户消息
  const userMessage: ChatMessageType = {
    id: Date.now().toString(),
    content: text,
    role: 'user',
    timestamp: new Date(),
  }
  messages.value.push(userMessage)

  // 清空输入
  inputText.value = ''

  // 滚动到底部
  scrollToBottom()

  // 显示打字指示器
  isTyping.value = true

  // 触发发送事件
  emit('send-message', text)

  // 模拟AI响应（实际应该从父组件接收）
  setTimeout(() => {
    const aiMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      content: `这是对 "${text}" 的AI回复示例。在实际应用中，这里会调用相应的AI服务API。`,
      role: 'assistant',
      timestamp: new Date(),
    }
    messages.value.push(aiMessage)
    isTyping.value = false
    scrollToBottom()
  }, 2000)
}

const sendQuickAction = (action: string) => {
  const prompts = {
    continue: '请续写当前文档的内容',
    improve: '请优化当前选中的文本',
    brainstorm: '请根据当前内容生成一些创意想法',
  }

  inputText.value = prompts[action as keyof typeof prompts] || ''
  sendMessage()
}

const clearChat = () => {
  if (confirm('确定要清空聊天记录吗？')) {
    messages.value = []
  }
}

const updateCharCount = () => {
  // 字符计数已通过computed实现
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight
    }
  })
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    console.log('已复制到剪贴板')
    // 这里可以添加toast提示
  })
}

const insertToEditor = (text: string) => {
  emit('insert-to-editor', text)
}

// 添加AI响应消息的方法（供父组件调用）
const addAIMessage = (content: string) => {
  const aiMessage: ChatMessageType = {
    id: Date.now().toString(),
    content,
    role: 'assistant',
    timestamp: new Date(),
  }
  messages.value.push(aiMessage)
  isTyping.value = false
  scrollToBottom()
}

// 暴露方法供父组件使用
defineExpose({
  addAIMessage,
})
</script>

<style scoped>
.message-bubble {
  max-width: 85%;
  border-radius: 12px;
  padding: 12px 16px;
  position: relative;
  word-wrap: break-word;
}

.ai-message {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.user-message {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #93c5fd;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  color: #1e40af;
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  background-color: #4a90e2;
  border-radius: 50%;
  display: inline-block;
  margin: 0 2px;
  opacity: 0.6;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}
</style>
