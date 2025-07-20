<template>
  <div 
    ref="previewContainer"
    class="flex-1 overflow-auto p-6"
    @scroll="handleScroll"
  >
    <div 
      v-if="renderedContent"
      class="prose prose-lg max-w-none"
      v-html="renderedContent"
    ></div>
    <div 
      v-else-if="!content.trim()"
      class="flex items-center justify-center h-full text-gray-500"
    >
      <div class="text-center">
        <i class="ri-file-text-line text-4xl mb-4"></i>
        <p class="text-lg">开始编写，预览将在这里显示</p>
        <p class="text-sm mt-2">支持完整的 Markdown 语法</p>
      </div>
    </div>
    <div 
      v-else
      class="flex items-center justify-center h-full text-gray-500"
    >
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>正在渲染预览...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

// Props
interface Props {
  content: string
  syncScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  syncScroll: false,
})

// Emits
const emit = defineEmits<{
  scroll: [scrollInfo: { scrollTop: number; scrollHeight: number; clientHeight: number }]
}>()

// 响应式数据
const previewContainer = ref<HTMLElement>()
const renderedContent = ref('')

// Markdown-it 实例
let md: MarkdownIt

// 初始化 Markdown-it
const initMarkdownIt = () => {
  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
        } catch (__) {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    },
  })
  
  // 暂时移除第三方插件，使用内置功能
  // 后续可以在插件稳定后再添加
  console.log('Markdown-it 已初始化，使用核心功能')

  // 配置自定义规则
  setupCustomRules()
}

// 设置自定义渲染规则
const setupCustomRules = () => {
  // 自定义链接渲染（添加target="_blank"）
  const defaultLinkRenderer = md.renderer.rules.link_open || 
    ((tokens: any, idx: any, options: any, _env: any, self: any) => self.renderToken(tokens, idx, options))

  md.renderer.rules.link_open = (tokens: any, idx: any, options: any, _env: any, self: any) => {
    const token = tokens[idx]
    const href = token.attrGet('href')
    
    if (href && (href.startsWith('http') || href.startsWith('https'))) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    }
    
    return defaultLinkRenderer(tokens, idx, options, _env, self)
  }

  // 自定义表格渲染
  md.renderer.rules.table_open = () => 
    '<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200">'
  
  md.renderer.rules.table_close = () => '</table></div>'

  // 自定义代码块渲染
  md.renderer.rules.fence = (tokens: any, idx: any) => {
    const token = tokens[idx]
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
    const langName = info ? info.split(/\s+/g)[0] : ''
    
    let langClass = ''
    if (langName && hljs.getLanguage(langName)) {
      langClass = ` language-${langName}`
    }

    const highlighted = hljs.highlightAuto(token.content).value

    return `<div class="code-block">
      <div class="code-header">
        <span class="language-name">${langName || 'text'}</span>
        <button class="copy-btn" onclick="copyCode(this)" title="复制代码">
          <i class="ri-file-copy-line"></i>
        </button>
      </div>
      <pre class="hljs${langClass}"><code>${highlighted}</code></pre>
    </div>`
  }

  // 自定义任务列表
  md.renderer.rules.list_item_open = (tokens: any, idx: any) => {
    const next = tokens[idx + 1]
    
    if (next && next.type === 'paragraph_open') {
      const paragraph = tokens[idx + 2]
      if (paragraph && paragraph.content.match(/^\[[ x]\]/)) {
        const checked = paragraph.content.startsWith('[x]')
        return `<li class="task-list-item">
          <input type="checkbox" ${checked ? 'checked' : ''} disabled class="task-list-checkbox">
          <span class="task-list-content">`
      }
    }
    
    return '<li>'
  }

  md.renderer.rules.list_item_close = () => '</li>'
}

// 渲染 Markdown
const renderMarkdown = async (content: string): Promise<string> => {
  if (!content.trim()) return ''
  
  try {
    let rendered = md.render(content)
    
    // 处理任务列表
    rendered = rendered.replace(/\[[ x]\]/g, '')
    
    // 添加自定义类名
    rendered = rendered.replace(/<blockquote>/g, '<blockquote class="border-l-4 border-primary pl-4 italic">')
    rendered = rendered.replace(/<h([1-6])>/g, '<h$1 class="heading-$1">')
    
    return rendered
  } catch (error: any) {
    console.error('Markdown rendering error:', error)
    return `<div class="error-message">
      <p>渲染错误: ${error.message}</p>
      <pre class="mt-2 text-sm">${content}</pre>
    </div>`
  }
}

// 计算渲染内容
const updateRenderedContent = async () => {
  renderedContent.value = await renderMarkdown(props.content)
  
  // 等待DOM更新后添加复制功能
  await nextTick()
  addCopyCodeFunction()
}

// 添加代码复制功能
const addCopyCodeFunction = () => {
  // 在全局添加复制代码函数
  (window as any).copyCode = (button: HTMLElement) => {
    const codeBlock = button.closest('.code-block')
    if (!codeBlock) return
    
    const code = codeBlock.querySelector('code')
    if (!code) return
    
    const text = code.textContent || ''
    
    navigator.clipboard.writeText(text).then(() => {
      const icon = button.querySelector('i')
      if (icon) {
        icon.className = 'ri-check-line'
        setTimeout(() => {
          icon.className = 'ri-file-copy-line'
        }, 2000)
      }
    }).catch(err => {
      console.error('复制失败:', err)
    })
  }
}

// 处理滚动事件
const handleScroll = () => {
  if (!previewContainer.value || !props.syncScroll) return
  
  const { scrollTop, scrollHeight, clientHeight } = previewContainer.value
  emit('scroll', { scrollTop, scrollHeight, clientHeight })
}

// 外部滚动同步
const syncScrollTo = (percentage: number) => {
  if (!previewContainer.value) return
  
  const { scrollHeight, clientHeight } = previewContainer.value
  const maxScroll = scrollHeight - clientHeight
  const scrollTop = maxScroll * percentage
  
  previewContainer.value.scrollTop = scrollTop
}

// 监听内容变化
watch(
  () => props.content,
  () => {
    updateRenderedContent()
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  initMarkdownIt()
  updateRenderedContent()
})

// 暴露方法
defineExpose({
  syncScrollTo,
})
</script>

<style scoped>
/* 预览容器样式 */
.prose {
  @apply text-gray-900;
}

/* 标题样式 */
:deep(.heading-1) {
  @apply text-3xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-200 pb-2;
}

:deep(.heading-2) {
  @apply text-2xl font-semibold mt-6 mb-3 text-gray-800;
}

:deep(.heading-3) {
  @apply text-xl font-medium mt-4 mb-2 text-gray-800;
}

:deep(.heading-4) {
  @apply text-lg font-medium mt-3 mb-2 text-gray-700;
}

:deep(.heading-5) {
  @apply text-base font-medium mt-2 mb-1 text-gray-700;
}

:deep(.heading-6) {
  @apply text-sm font-medium mt-2 mb-1 text-gray-600;
}

/* 代码块样式 */
:deep(.code-block) {
  @apply relative rounded-lg overflow-hidden my-4 bg-gray-50 border border-gray-200;
}

:deep(.code-header) {
  @apply flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200 text-sm;
}

:deep(.language-name) {
  @apply font-medium text-gray-600;
}

:deep(.copy-btn) {
  @apply px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors;
}

:deep(.hljs) {
  @apply p-4 bg-gray-50 overflow-x-auto;
}

/* 任务列表样式 */
:deep(.task-list-item) {
  @apply flex items-start space-x-2 list-none;
}

:deep(.task-list-checkbox) {
  @apply mt-1 rounded border-gray-300 text-primary focus:ring-primary;
}

:deep(.task-list-content) {
  @apply flex-1;
}

/* 表格样式 */
:deep(table) {
  @apply w-full border-collapse border border-gray-300;
}

:deep(th) {
  @apply bg-gray-50 px-4 py-2 text-left font-medium text-gray-900 border border-gray-300;
}

:deep(td) {
  @apply px-4 py-2 border border-gray-300;
}

/* 引用块样式 */
:deep(blockquote) {
  @apply my-4 pl-4 border-l-4 border-primary bg-blue-50 py-2 italic text-gray-700;
}

/* 错误消息样式 */
:deep(.error-message) {
  @apply p-4 bg-red-50 border border-red-200 rounded-lg text-red-700;
}
</style>