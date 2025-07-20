<template>
  <div ref="editorContainer" class="w-full flex-1 min-h-0 overflow-hidden"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import monacoDefault from '@/monaco-worker'
import type { EditorConfig } from '@/types'

const monaco = monacoDefault

// Props
interface Props {
  modelValue: string
  language?: string
  config?: Partial<EditorConfig>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: 'markdown',
  readonly: false,
  config: () => ({
    theme: 'light',
    fontSize: 14,
    wordWrap: true,
    minimap: false,
    lineNumbers: true,
  }),
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  cursorChange: [position: monaco.Position]
  selectionChange: [selection: monaco.Selection]
}>()

// 响应式数据
const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let model: monaco.editor.ITextModel | null = null

// 主题配置
const getEditorTheme = () => {
  if (props.config?.theme === 'dark') {
    return 'readdy-dark'
  }
  return 'readdy-light'
}

// 注册自定义主题
const registerCustomThemes = () => {
  // 亮色主题
  monaco.editor.defineTheme('readdy-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
      { token: 'string', foreground: '032f62' },
      { token: 'number', foreground: '005cc5' },
      { token: 'regexp', foreground: '22863a' },
      { token: 'type', foreground: '6f42c1' },
      { token: 'class', foreground: '6f42c1', fontStyle: 'bold' },
      { token: 'function', foreground: '6f42c1' },
      { token: 'variable', foreground: 'e36209' },
      { token: 'constant', foreground: '005cc5', fontStyle: 'bold' },
      { token: 'operator', foreground: 'd73a49' },
      { token: 'delimiter', foreground: '586069' },
      { token: 'tag', foreground: '22863a' },
      { token: 'attribute.name', foreground: '6f42c1' },
      { token: 'attribute.value', foreground: '032f62' },
      // Markdown 特定
      { token: 'strong', foreground: '24292e', fontStyle: 'bold' },
      { token: 'emphasis', foreground: '24292e', fontStyle: 'italic' },
      { token: 'header', foreground: '005cc5', fontStyle: 'bold' },
      { token: 'link', foreground: '0366d6', fontStyle: 'underline' },
      { token: 'code', foreground: 'd73a49', background: 'f6f8fa' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292e',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#0366d625',
      'editor.selectionHighlightBackground': '#ffd33d40',
      'editorCursor.foreground': '#044289',
      'editorLineNumber.foreground': '#1b1f234d',
      'editorLineNumber.activeForeground': '#1b1f23',
      'editorIndentGuide.background': '#d0d7de',
      'editorIndentGuide.activeBackground': '#8c959f',
      'editorBracketMatch.background': '#ffd33d40',
      'editorBracketMatch.border': '#ffd33d',
    }
  })

  // 暗色主题
  monaco.editor.defineTheme('readdy-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'regexp', foreground: '7ee787' },
      { token: 'type', foreground: 'd2a8ff' },
      { token: 'class', foreground: 'd2a8ff', fontStyle: 'bold' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'ffa657' },
      { token: 'constant', foreground: '79c0ff', fontStyle: 'bold' },
      { token: 'operator', foreground: 'ff7b72' },
      { token: 'delimiter', foreground: 'e6edf3' },
      { token: 'tag', foreground: '7ee787' },
      { token: 'attribute.name', foreground: 'd2a8ff' },
      { token: 'attribute.value', foreground: 'a5d6ff' },
      // Markdown 特定
      { token: 'strong', foreground: 'f0f6fc', fontStyle: 'bold' },
      { token: 'emphasis', foreground: 'f0f6fc', fontStyle: 'italic' },
      { token: 'header', foreground: '79c0ff', fontStyle: 'bold' },
      { token: 'link', foreground: '58a6ff', fontStyle: 'underline' },
      { token: 'code', foreground: 'ff7b72', background: '161b22' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#e6edf3',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editor.selectionHighlightBackground': '#ffd33d40',
      'editorCursor.foreground': '#79c0ff',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#e6edf3',
      'editorIndentGuide.background': '#21262d',
      'editorIndentGuide.activeBackground': '#30363d',
      'editorBracketMatch.background': '#ffd33d40',
      'editorBracketMatch.border': '#ffd33d',
    }
  })
}

// Monaco Editor配置
const getEditorOptions = (): monaco.editor.IStandaloneEditorConstructionOptions => ({
  language: props.language,
  theme: getEditorTheme(),
  fontSize: props.config?.fontSize || 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
  fontLigatures: true,
  minimap: { enabled: props.config?.minimap || false },
  lineNumbers: props.config?.lineNumbers ? 'on' : 'off',
  readOnly: props.readonly,
  automaticLayout: true,
  scrollBeyondLastLine: true,
  folding: true,
  renderLineHighlight: 'line',
  selectOnLineNumbers: false,
  roundedSelection: false,
  cursorStyle: 'line',
  contextmenu: true,
  mouseWheelZoom: true,
  smoothScrolling: true,
  cursorSmoothCaretAnimation: 'on',
  renderWhitespace: 'selection',
  fixedOverflowWidgets: true,
  padding: { top: 16, bottom: 16 },
  scrollbar: {
    verticalScrollbarSize: 12,
    horizontalScrollbarSize: 12,
    alwaysConsumeMouseWheel: false,
    vertical: 'auto',
    horizontal: 'auto',
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false,
  },
  // 增强语法高亮和智能功能
  selectionHighlight: true,
  occurrencesHighlight: 'singleFile',
  wordBasedSuggestions: 'currentDocument',
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  },
  parameterHints: {
    enabled: true,
  },
  hover: {
    enabled: true,
    delay: 500,
  },
  // 智能完成设置
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
  wordBasedSuggestionsOnlySameLanguage: true,
  suggestOnTriggerCharacters: true,
  wordWrap: props.config?.wordWrap ? 'on' : 'off',
  bracketPairColorization: {
    enabled: true,
  },
  guides: {
    bracketPairs: true,
    bracketPairsHorizontal: true,
    highlightActiveBracketPair: true,
    indentation: true,
  },
  suggest: {
    showKeywords: true,
    showSnippets: true,
    showWords: true,
    showMethods: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showStructs: true,
    showInterfaces: true,
    showModules: true,
    showProperties: true,
    showEvents: true,
    showOperators: true,
    showUnits: true,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showColors: true,
    showFiles: true,
    showReferences: true,
    showFolders: true,
    showTypeParameters: true,
  },
})

// 初始化编辑器
const initEditor = async () => {
  if (!editorContainer.value) return

  try {
    // 注册自定义主题
    registerCustomThemes()
    
    // 创建文本模型
    model = monaco.editor.createModel(props.modelValue, props.language)
    
    // 创建编辑器实例
    editor = monaco.editor.create(editorContainer.value, {
      model,
      ...getEditorOptions(),
    })

    // 监听内容变化
    model.onDidChangeContent(() => {
      const value = model?.getValue() || ''
      emit('update:modelValue', value)
      emit('change', value)
    })

    // 监听光标位置变化
    editor.onDidChangeCursorPosition((e) => {
      emit('cursorChange', e.position)
    })

    // 监听选择变化
    editor.onDidChangeCursorSelection((e) => {
      emit('selectionChange', e.selection)
    })

    // 设置Markdown语言特性
    if (props.language === 'markdown') {
      setupMarkdownFeatures()
    }

    // 禁用语言服务的智能功能
    try {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      })
      
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      })
    } catch (e) {
      // TypeScript 语言服务可能未加载，忽略错误
    }

    console.log('Monaco Editor initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
  }
}

// 设置Markdown语言特性
const setupMarkdownFeatures = () => {
  if (!editor) return

  // 配置Markdown语言
  monaco.languages.setLanguageConfiguration('markdown', {
    brackets: [
      ['[', ']'],
      ['(', ')'],
      ['{', '}'],
    ],
    autoClosingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '*', close: '*' },
      { open: '**', close: '**' },
      { open: '`', close: '`' },
      { open: '```', close: '```' },
    ],
    surroundingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '{', close: '}' },
      { open: '*', close: '*' },
      { open: '**', close: '**' },
      { open: '`', close: '`' },
    ],
  })

  // 添加自定义快捷键
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
    wrapSelection('**', '**')
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
    wrapSelection('*', '*')
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
    wrapSelection('[', '](url)')
  })
}

// 包装选中文本
const wrapSelection = (prefix: string, suffix: string) => {
  if (!editor) return

  const selection = editor.getSelection()
  if (!selection) return

  const model = editor.getModel()
  if (!model) return

  const selectedText = model.getValueInRange(selection)
  const wrappedText = `${prefix}${selectedText}${suffix}`

  editor.executeEdits('wrap-selection', [
    {
      range: selection,
      text: wrappedText,
    },
  ])

  // 调整光标位置
  const newPosition = new monaco.Position(
    selection.endLineNumber,
    selection.endColumn + prefix.length + suffix.length
  )
  editor.setPosition(newPosition)
  editor.focus()
}

// 更新编辑器内容
const updateContent = (newValue: string) => {
  if (!model || model.getValue() === newValue) return
  
  const position = editor?.getPosition()
  model.setValue(newValue)
  
  // 恢复光标位置
  if (position && editor) {
    editor.setPosition(position)
  }
}

// 更新编辑器配置
const updateConfig = () => {
  if (!editor) return
  
  editor.updateOptions(getEditorOptions())
}

// 获取编辑器实例（供父组件使用）
const getEditor = () => editor
const getModel = () => model

// 插入文本到光标位置
const insertText = (text: string) => {
  if (!editor) return

  const position = editor.getPosition()
  if (!position) return

  editor.executeEdits('insert-text', [
    {
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      ),
      text,
    },
  ])

  editor.focus()
}

// 获取选中文本
const getSelectedText = (): string => {
  if (!editor) return ''

  const selection = editor.getSelection()
  if (!selection) return ''

  const model = editor.getModel()
  if (!model) return ''

  return model.getValueInRange(selection)
}

// 替换选中文本
const replaceSelectedText = (text: string) => {
  if (!editor) return

  const selection = editor.getSelection()
  if (!selection) return

  editor.executeEdits('replace-selection', [
    {
      range: selection,
      text,
    },
  ])

  editor.focus()
}

// 监听props变化
watch(
  () => props.modelValue,
  (newValue) => {
    updateContent(newValue)
  }
)

watch(
  () => props.config,
  () => {
    updateConfig()
  },
  { deep: true }
)

watch(
  () => props.language,
  (newLanguage) => {
    if (!model) return
    monaco.editor.setModelLanguage(model, newLanguage)
  }
)

// 处理窗口大小变化
const handleResize = () => {
  if (editor) {
    editor.layout()
  }
}

// 设置ResizeObserver来监听容器大小变化
let resizeObserver: ResizeObserver | null = null

const setupResizeObserver = () => {
  if (!editorContainer.value) return

  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  
  resizeObserver.observe(editorContainer.value)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initEditor()
  setupResizeObserver()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  
  window.removeEventListener('resize', handleResize)
  
  if (model) {
    model.dispose()
  }
  if (editor) {
    editor.dispose()
  }
})

// 暴露方法供父组件使用
defineExpose({
  getEditor,
  getModel,
  insertText,
  getSelectedText,
  replaceSelectedText,
  wrapSelection,
  layout: handleResize,
})
</script>

<style scoped>
/* Monaco Editor容器样式 */
:deep(.monaco-editor) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  border-radius: 0;
}

:deep(.monaco-editor .margin) {
  background-color: transparent;
}

:deep(.monaco-editor .monaco-editor-background) {
  background-color: transparent;
}

:deep(.monaco-editor .overflow-guard) {
  border-radius: 0;
}

/* 修复选择文本时的样式问题 */
:deep(.monaco-editor .view-overlays .current-line) {
  background: rgba(74, 144, 226, 0.05) !important;
  border: none !important;
}

:deep(.monaco-editor .selected-text) {
  background-color: rgba(74, 144, 226, 0.15) !important;
}

:deep(.monaco-editor .monaco-editor-background) {
  background-color: #ffffff !important;
}

:deep(.monaco-editor .margin) {
  background-color: #ffffff !important;
}

/* 确保编辑器正确填充容器 */
:deep(.monaco-editor .monaco-scrollable-element) {
  height: 100% !important;
}
</style>