<template>
  <div class="flex-1 flex flex-col bg-white min-h-0">
    <!-- 编辑器工具栏 -->
    <EditorToolbar
      :current-file="currentFile"
      :is-dirty="isDirty"
      :config="editorConfig"
      @format="handleFormat"
      @config-change="handleConfigChange"
      @save="handleSave"
      @undo="handleUndo"
      @redo="handleRedo"
      @open-file="() => emit('open-file')"
      @export-file="() => emit('export-file')"
    />

    <!-- Tab 切换 -->
    <div class="border-b border-gray-200">
      <div class="flex px-4">
        <button 
          :class="[
            'px-4 py-2 text-sm font-medium relative',
            activeTab === 'edit' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-gray-500 hover:text-gray-700'
          ]"
          @click="switchToEdit"
        >
          编辑
          <span v-if="isDirty" class="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></span>
        </button>
        <button 
          :class="[
            'px-4 py-2 text-sm font-medium',
            activeTab === 'preview' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-gray-500 hover:text-gray-700'
          ]"
          @click="switchToPreview"
        >
          预览
        </button>
        <button 
          :class="[
            'px-4 py-2 text-sm font-medium',
            activeTab === 'split' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-gray-500 hover:text-gray-700'
          ]"
          @click="switchToSplit"
        >
          分屏
        </button>
      </div>
    </div>

    <!-- 编辑器和预览区域 -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- 编辑器面板 -->
      <div 
        v-show="activeTab === 'edit' || activeTab === 'split'" 
        :class="[
          'flex flex-col min-h-0 overflow-hidden bg-white',
          activeTab === 'split' ? 'w-1/2 border-r border-gray-200' : 'flex-1'
        ]"
      >
        <MonacoEditor
          ref="monacoEditor"
          v-model="editorContent"
          :language="currentLanguage"
          :config="editorConfig"
          :readonly="readonly"
          @change="handleContentChange"
          @cursor-change="handleCursorChange"
          @selection-change="handleSelectionChange"
        />
      </div>

      <!-- 预览面板 -->
      <div 
        v-show="activeTab === 'preview' || activeTab === 'split'"
        :class="[
          'flex flex-col min-h-0 overflow-hidden bg-gray-50',
          activeTab === 'split' ? 'w-1/2' : 'flex-1'
        ]"
      >
        <MarkdownPreview
          ref="markdownPreview"
          :content="editorContent"
          :sync-scroll="activeTab === 'split'"
          @scroll="handlePreviewScroll"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MonacoEditor from './MonacoEditor.vue'
import EditorToolbar from './EditorToolbar.vue'
import MarkdownPreview from './MarkdownPreview.vue'
import type { FileEntry, EditorConfig } from '@/types'
import * as monaco from 'monaco-editor'

// Props
interface Props {
  currentFile?: FileEntry | null
  readonly?: boolean
  config?: Partial<EditorConfig>
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({}),
})

// Emits
const emit = defineEmits<{
  'content-change': [content: string]
  'file-dirty': [isDirty: boolean]
  'cursor-change': [position: any]
  'selection-change': [selection: any]
  save: []
  'open-file': []
  'export-file': []
}>()

// 响应式数据
const activeTab = ref<'edit' | 'preview' | 'split'>('edit')
const editorContent = ref('')
const isDirty = ref(false)
const cursorPosition = ref<monaco.Position | null>(null)
const selection = ref<monaco.Selection | null>(null)
const monacoEditor = ref<InstanceType<typeof MonacoEditor>>()

// 编辑器配置
const editorConfig = ref<EditorConfig>({
  theme: 'light',
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  ...props.config,
})

// 计算属性
const currentLanguage = computed(() => {
  if (!props.currentFile?.name) return 'markdown'
  
  const ext = props.currentFile.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'markdown'
    case 'js':
      return 'javascript'
    case 'ts':
      return 'typescript'
    case 'vue':
      return 'html' // Vue SFC需要特殊处理
    case 'json':
      return 'json'
    case 'css':
      return 'css'
    case 'html':
      return 'html'
    default:
      return 'plaintext'
  }
})

const wordCount = computed(() => {
  return editorContent.value.length
})

// 方法
const handleContentChange = (content: string) => {
  const hasChanged = content !== (props.currentFile?.content || '')
  isDirty.value = hasChanged
  emit('content-change', content)
  emit('file-dirty', hasChanged)
}

const handleCursorChange = (position: monaco.Position) => {
  cursorPosition.value = position
  emit('cursor-change', position)
}

const handleSelectionChange = (sel: monaco.Selection) => {
  selection.value = sel
  emit('selection-change', sel)
}

const handleFormat = (type: string) => {
  if (!monacoEditor.value) return

  const editor = monacoEditor.value.getEditor()
  if (!editor) return

  switch (type) {
    case 'bold':
      monacoEditor.value.wrapSelection('**', '**')
      break
    case 'italic':
      monacoEditor.value.wrapSelection('*', '*')
      break
    case 'link':
      monacoEditor.value.wrapSelection('[', '](url)')
      break
    case 'code':
      const selectedText = monacoEditor.value.getSelectedText()
      if (selectedText.includes('\n')) {
        monacoEditor.value.wrapSelection('```\n', '\n```')
      } else {
        monacoEditor.value.wrapSelection('`', '`')
      }
      break
    case 'heading':
      insertAtLineStart('# ')
      break
    case 'list':
      insertAtLineStart('- ')
      break
    case 'quote':
      insertAtLineStart('> ')
      break
  }
}

const insertAtLineStart = (prefix: string) => {
  if (!monacoEditor.value) return

  const editor = monacoEditor.value.getEditor()
  if (!editor) return

  const position = editor.getPosition()
  if (!position) return

  const model = editor.getModel()
  if (!model) return

  const lineContent = model.getLineContent(position.lineNumber)
  const newContent = lineContent.startsWith(prefix) 
    ? lineContent.substring(prefix.length)
    : prefix + lineContent

  editor.executeEdits('insert-prefix', [
    {
      range: new monaco.Range(
        position.lineNumber,
        1,
        position.lineNumber,
        lineContent.length + 1
      ),
      text: newContent,
    },
  ])

  editor.focus()
}

const handleConfigChange = (key: keyof EditorConfig, value: any) => {
  editorConfig.value = { ...editorConfig.value, [key]: value }
}

const switchToEdit = () => {
  activeTab.value = 'edit'
  // 延迟触发编辑器重新布局
  nextTick(() => {
    setTimeout(() => {
      if (monacoEditor.value && typeof monacoEditor.value.layout === 'function') {
        monacoEditor.value.layout()
      }
    }, 100)
  })
}

const switchToPreview = () => {
  activeTab.value = 'preview'
  // 通过父组件更新编辑器模式
}

const switchToSplit = () => {
  activeTab.value = 'split'
  // 延迟触发编辑器重新布局，等待CSS过渡完成
  nextTick(() => {
    setTimeout(() => {
      if (monacoEditor.value && typeof monacoEditor.value.layout === 'function') {
        monacoEditor.value.layout()
      }
    }, 300)
  })
}

const handlePreviewScroll = () => {
  // 实现预览和编辑器的滚动同步
  // 这里可以根据需要实现同步逻辑
}

// 外部方法
const insertText = (text: string) => {
  monacoEditor.value?.insertText(text)
}

const getSelectedText = (): string => {
  return monacoEditor.value?.getSelectedText() || ''
}

const replaceSelectedText = (text: string) => {
  monacoEditor.value?.replaceSelectedText(text)
}

const focus = () => {
  monacoEditor.value?.getEditor()?.focus()
}

const handleSave = () => {
  console.log('EditorContainer save called') // 调试日志
  isDirty.value = false
  emit('save')
}

const save = () => {
  handleSave()
}

const handleUndo = () => {
  console.log('撤销按钮被点击')
  const editor = monacoEditor.value?.getEditor()
  if (editor) {
    editor.focus()
    editor.trigger('editor', 'undo', null)
    console.log('执行撤销操作')
  } else {
    console.log('编辑器实例不存在')
  }
}

const handleRedo = () => {
  console.log('重做按钮被点击')
  const editor = monacoEditor.value?.getEditor()
  if (editor) {
    editor.focus()
    editor.trigger('editor', 'redo', null)
    console.log('执行重做操作')
  } else {
    console.log('编辑器实例不存在')
  }
}

// 监听文件变化
watch(
  () => props.currentFile,
  (newFile) => {
    if (newFile) {
      editorContent.value = newFile.content
      isDirty.value = false
    } else {
      editorContent.value = ''
      isDirty.value = false
    }
  },
  { immediate: true }
)

watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      editorConfig.value = { ...editorConfig.value, ...newConfig }
    }
  },
  { deep: true }
)

// 暴露方法供父组件使用
defineExpose({
  insertText,
  getSelectedText,
  replaceSelectedText,
  focus,
  save: handleSave,
  getContent: () => editorContent.value,
  isDirty: () => isDirty.value,
  getEditor: () => monacoEditor.value?.getEditor(),
})
</script>

<style scoped>
/* Tab指示器样式 */
.tab-indicator {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #4A90E2;
}

/* 确保分屏模式下的正确布局 */
.flex-1 {
  flex: 1 1 0%;
  min-width: 0;
}

.w-1\/2 {
  width: 50%;
  min-width: 0;
}

/* 确保编辑器和预览面板的高度正确 */
.min-h-0 {
  min-height: 0;
}

.overflow-hidden {
  overflow: hidden;
}
</style>