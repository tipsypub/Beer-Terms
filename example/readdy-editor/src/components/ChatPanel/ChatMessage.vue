<template>
  <div :class="['message-bubble', message.role === 'user' ? 'user-message' : 'ai-message']">
    <div v-if="message.role === 'assistant'" class="flex items-start space-x-2">
      <div
        class="w-6 h-6 bg-gradient-to-br from-ai to-primary rounded-full flex items-center justify-center flex-shrink-0"
      >
        <i class="ri-robot-fill text-white text-xs"></i>
      </div>
      <div class="flex-1">
        <div class="text-sm" v-html="formattedContent"></div>
        <div class="flex space-x-2 mt-2">
          <button
            class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
            @click="$emit('insert', message.content)"
          >
            插入到编辑器
          </button>
          <button
            class="px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs hover:bg-gray-100"
            @click="$emit('copy', message.content)"
          >
            复制
          </button>
        </div>
        <div v-if="message.model" class="text-xs text-gray-500 mt-1">
          {{ message.model }} • {{ formatTime(message.timestamp) }}
        </div>
      </div>
    </div>
    <div v-else>
      <div class="text-sm">{{ message.content }}</div>
      <div class="text-xs text-blue-600 mt-1 text-right">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '@/types'

// Props
interface Props {
  message: ChatMessage
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  copy: [text: string]
  insert: [text: string]
}>()

// 格式化消息内容（支持简单的Markdown）
const formattedContent = computed(() => {
  let content = props.message.content

  // 简单的Markdown转换
  content = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>') // 行内代码
    .replace(/\n/g, '<br>') // 换行

  return content
})

// 格式化时间
const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()

  if (diff < 60000) {
    // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) {
    // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return timestamp.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}
</script>

<style scoped>
.message-bubble {
  max-width: 85%;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
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
</style>
