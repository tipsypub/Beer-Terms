<template>
  <AppLayout
    :files="files"
    :recent-files="recentFiles"
    :current-file="currentFile"
    :is-dirty="isFileDirty"
    :cursor-position="cursorPosition"
    :selection="selection"
    :word-count="wordCount"
    :editor-mode="editorMode"
    :editor-ref="editorContainer?.getEditor?.()"
    @new-file="handleNewFile"
    @save-file="handleSaveFile"
    @model-change="handleModelChange"
    @open-settings="handleOpenSettings"
    @file-select="handleFileSelect"
    @folder-select="handleFolderSelect"
    @create-folder="handleCreateFolder"
    @file-rename="handleFileRename"
    @file-delete="handleFileDelete"
    @file-move="handleFileMove"
    @reset-zoom="handleResetZoom"
  >
    <template #editor>
      <EditorContainer
        ref="editorContainer"
        :current-file="currentFile"
        :config="editorConfig"
        @content-change="handleContentChange"
        @file-dirty="handleFileDirty"
        @cursor-change="handleCursorChange"
        @selection-change="handleSelectionChange"
        @save="handleSave"
        @open-file="handleOpenFile"
        @export-file="handleExportFile"
      />
    </template>
  </AppLayout>

  <!-- 设置面板 -->
  <SettingsPanel 
    v-if="showSettings" 
    @close="showSettings = false"
    @settings-changed="handleSettingsChanged"
  />

  <!-- 导出文件模态框 -->
  <FileExportModal
    :show="showExportModal"
    :content="currentFile?.content || ''"
    @close="showExportModal = false"
    @export-success="handleExportSuccess"
    @export-error="handleExportError"
    @open-folder-export="handleOpenFolderExport"
  />

  <!-- 文件夹导出模态框 -->
  <FolderExportModal
    :show="showFolderExportModal"
    :folders="folderStructure"
    :files="files"
    @close="showFolderExportModal = false"
    @export-success="handleExportSuccess"
    @export-error="handleExportError"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AppLayout from './components/Layout/AppLayout.vue'
import EditorContainer from './components/Editor/EditorContainer.vue'
import SettingsPanel from './components/Settings/SettingsPanel.vue'
import FileExportModal from './components/Export/FileExportModal.vue'
import FolderExportModal from './components/Export/FolderExportModal.vue'
import type { FileEntry, FolderEntry, EditorConfig, AppSettings } from './types'
import { fileSystem } from './services/file-system'
import { storageService } from './services/storage'
import { initializeDefaultShortcuts, keyboardManager } from './services/keyboard-shortcuts'

// 响应式数据 - 现在从文件系统获取
const editorContainer = ref<InstanceType<typeof EditorContainer>>()
const recentFiles = ref<FileEntry[]>([])
const showSettings = ref(false)
const showExportModal = ref(false)
const showFolderExportModal = ref(false)

// 从文件系统获取状态
const currentFile = computed(() => fileSystem.activeFile)
const isFileDirty = computed(() => fileSystem.isFileDirty) 
const files = computed(() => {
  const allFiles = fileSystem.allFiles
  console.log('🚀 App.vue files 计算属性:', allFiles.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })))
  return allFiles
})
const selectedFolderId = ref<string | null>(null) // 当前选中的文件夹ID
const cursorPosition = ref<any>(null)
const selection = ref<any>(null)
const wordCount = ref(0)
const editorMode = ref('编辑')

// 生成文件夹结构
const folderStructure = computed(() => {
  const folders: FolderEntry[] = []
  const folderMap = new Map<string, FolderEntry>()

  // 首先创建所有明确类型为folder的文件夹
  files.value.forEach(file => {
    if (file.type === 'folder') {
      const folder: FolderEntry = {
        id: file.id,
        name: file.name,
        path: file.name,
        parentId: file.parentId,
        children: [],
        fileCount: 0
      }
      folderMap.set(file.id, folder)
      folders.push(folder)
    }
  })

  // 从文件的parentId推断文件夹结构（如果没有明确的folder类型文件）
  const parentIds = new Set<string>()
  files.value.forEach(file => {
    if (file.parentId && !folderMap.has(file.parentId)) {
      parentIds.add(file.parentId)
    }
  })

  // 为推断的文件夹创建虚拟文件夹
  parentIds.forEach(parentId => {
    // 尝试找到对应的文件夹文件，或者创建虚拟文件夹
    const folderFile = files.value.find(f => f.id === parentId)
    if (folderFile) {
      const folder: FolderEntry = {
        id: folderFile.id,
        name: folderFile.name || `文件夹-${parentId}`,
        path: folderFile.name || `folder-${parentId}`,
        parentId: folderFile.parentId,
        children: [],
        fileCount: 0
      }
      folderMap.set(parentId, folder)
      folders.push(folder)
    } else {
      // 创建虚拟文件夹
      const folder: FolderEntry = {
        id: parentId,
        name: `文件夹-${parentId.slice(0, 8)}`,
        path: `folder-${parentId}`,
        children: [],
        fileCount: 0
      }
      folderMap.set(parentId, folder)
      folders.push(folder)
    }
  })

  // 计算每个文件夹的文件数量
  folderMap.forEach(folder => {
    folder.fileCount = files.value.filter(file => 
      file.parentId === folder.id && file.type === 'file'
    ).length
  })

  // 构建层次结构
  const rootFolders: FolderEntry[] = []
  folders.forEach(folder => {
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(folder)
      }
    } else {
      rootFolders.push(folder)
    }
  })


  return rootFolders
})

// 编辑器配置
const editorConfig = ref<EditorConfig>({
  theme: 'light',
  fontSize: 14,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
})

// 事件处理
const handleNewFile = async () => {
  console.log('handleNewFile called') // 调试日志
  
  // 检查当前文件是否需要保存
  if (fileSystem.isFileDirty && fileSystem.activeFile) {
    const shouldSave = confirm('当前文件有未保存的更改，是否保存？')
    if (shouldSave) {
      await handleSave()
    }
  }

  // 使用文件系统创建新文件
  const result = await fileSystem.createFile(
    '未命名文件.md',
    selectedFolderId.value || undefined,
    '# 新建文档\n\n开始编写你的内容...'
  )

  if (result.success && result.data) {
    // 打开新创建的文件
    await fileSystem.openFile(result.data.id)
    fileSystem.setFileDirty(true)
    console.log('创建新文件完成', result.data)
  } else {
    console.error('创建文件失败:', result.error)
    alert(result.error || '创建文件失败')
  }
}

const handleSaveFile = async () => {
  await handleSave()
}

const handleSave = async () => {
  console.log('handleSave called') // 调试日志
  if (!fileSystem.activeFile || !editorContainer.value) {
    console.log('currentFile 或 editorContainer 不存在')
    return
  }

  try {
    const content = editorContainer.value.getContent()
    console.log('获取到的内容长度:', content?.length)
    
    const result = await fileSystem.saveFile(fileSystem.activeFile.id, content)
    
    if (result.success) {
      console.log('文件已保存')
    } else {
      console.error('保存文件失败:', result.error)
      alert(result.error || '保存文件失败，请重试')
    }
  } catch (error) {
    console.error('保存文件失败:', error)
    alert('保存文件失败，请重试')
  }
}

// handleUndo 和 handleRedo 已移动到 EditorContainer 中处理

const handleModelChange = (model: string) => {
  console.log('切换AI模型:', model)
}

const handleOpenSettings = () => {
  showSettings.value = true
}

const handleSettingsChanged = (newSettings: AppSettings) => {
  // 更新编辑器配置
  editorConfig.value = { ...editorConfig.value, ...newSettings.editor }
  
  // 应用主题设置
  if (newSettings.theme) {
    document.documentElement.setAttribute('data-theme', newSettings.theme)
  }
  
  console.log('设置已更新:', newSettings)
}

const handleFileSelect = async (fileId: string) => {
  const file = files.value.find(f => f.id === fileId)
  if (file && file.type === 'file') {
    const result = await fileSystem.openFile(fileId)
    if (result.success) {
      selectedFolderId.value = null // 清除文件夹选择
      editorMode.value = '编辑'
      wordCount.value = file.content.length
      console.log('选择文件:', file.name)
    } else {
      console.error('打开文件失败:', result.error)
      alert(result.error || '打开文件失败')
    }
  }
}

const handleFolderSelect = (folderId: string) => {
  selectedFolderId.value = folderId
  // 文件选择现在由文件系统管理，不需要手动清除
  console.log('选择文件夹:', folderId)
}

const handleCreateFolder = async () => {
  console.log('handleCreateFolder called')
  
  const result = await fileSystem.createFolder(
    '新建文件夹',
    selectedFolderId.value || undefined
  )

  if (result.success) {
    console.log('创建新文件夹完成', result.data)
  } else {
    console.error('创建文件夹失败:', result.error)
    alert(result.error || '创建文件夹失败')
  }
}

const handleFileRename = async (data: { fileId: string; newName: string }) => {
  console.log('handleFileRename called', data)
  
  const result = await fileSystem.renameFile(data.fileId, data.newName)
  if (result.success) {
    console.log('文件重命名完成:', data.newName)
  } else {
    console.error('重命名失败:', result.error)
    alert(result.error || '重命名失败')
  }
}

const handleFileDelete = async (fileId: string) => {
  console.log('handleFileDelete called', fileId)
  
  const result = await fileSystem.deleteFile(fileId)
  if (result.success) {
    console.log('文件删除完成')
  } else {
    console.error('删除失败:', result.error)
    alert(result.error || '删除失败')
  }
}

const handleFileMove = async (data: { fileId: string; targetParentId: string | null; position?: 'before' | 'after'; targetFileId?: string }) => {
  console.log('🚀 App.vue handleFileMove 收到事件:', data)
  
  // 检查移动前的文件状态
  const beforeFile = fileSystem.allFiles.find(f => f.id === data.fileId)
  console.log('🚀 移动前文件状态:', beforeFile)
  
  try {
    console.log('🚀 调用 fileSystem.moveFile...')
    const result = await fileSystem.moveFile(
      data.fileId, 
      data.targetParentId || undefined, 
      data.position, 
      data.targetFileId
    )
    console.log('🚀 fileSystem.moveFile 返回结果:', result)
    
    if (result.success && result.data) {
      console.log('✅ 文件移动成功:', result.data.name)
      console.log('✅ 新的父目录:', result.data.parentId || '根目录')
      
      // 检查移动后的文件状态
      const afterFile = fileSystem.allFiles.find(f => f.id === data.fileId)
      console.log('✅ 移动后文件状态:', afterFile)
      console.log('✅ 所有文件列表:')
      fileSystem.allFiles.forEach(f => {
        console.log(`  - ${f.name} (id: ${f.id}, parentId: ${f.parentId || 'ROOT'}, type: ${f.type})`)
      })
      
      // 文件系统会自动更新状态，UI会响应式更新
    } else {
      console.error('❌ 文件移动失败:', result.error)
      alert(result.error || '文件移动失败')
    }
  } catch (error) {
    console.error('❌ 文件移动异常:', error)
    alert('文件移动时出现异常，请重试')
  }
}

const handleContentChange = (content: string) => {
  // 更新字数统计
  wordCount.value = content.length
  
  // 文件修改时间现在由文件系统管理
}

const handleFileDirty = (dirty: boolean) => {
  fileSystem.setFileDirty(dirty)
}

const handleCursorChange = (position: any) => {
  cursorPosition.value = position
}

const handleSelectionChange = (sel: any) => {
  selection.value = sel
}

const handleResetZoom = () => {
  // 重置编辑器缩放
  const editor = editorContainer.value?.getEditor?.()
  if (editor) {
    editor.trigger('keyboard', 'editor.action.fontZoomReset', null)
  }
}

const handleOpenFile = () => {
  // 创建一个虚拟的文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md,.txt,.js,.ts,.vue,.json,.css,.html'
  
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        
        // 通过文件系统创建新文件
        const result = await fileSystem.createFile(file.name, undefined, content || '')
        if (result.success && result.data) {
          await fileSystem.openFile(result.data.id)
          wordCount.value = content?.length || 0
          console.log('文件已打开:', result.data.name)
        }
      }
      reader.readAsText(file)
    }
  }
  
  input.click()
}

// 导出文件处理
const handleExportFile = () => {
  showExportModal.value = true
}

const handleExportSuccess = (fileName: string) => {
  console.log('文件导出成功:', fileName)
  // 可以在这里添加成功通知
}

const handleExportError = (error: string) => {
  console.error('文件导出失败:', error)
  // 可以在这里添加错误通知
}

const handleOpenFolderExport = () => {
  showExportModal.value = false
  showFolderExportModal.value = true
}

// 快捷键事件处理
const setupShortcutHandlers = () => {
  // 文件操作
  document.addEventListener('shortcut:new-file', handleNewFile)
  document.addEventListener('shortcut:save-file', handleSaveFile)
  document.addEventListener('shortcut:open-file', handleOpenFile)
  
  // 导航
  document.addEventListener('shortcut:toggle-sidebar', () => {
    // 通过AppLayout处理
    const layout = document.querySelector('.h-screen')
    if (layout) {
      const event = new CustomEvent('toggle-sidebar')
      layout.dispatchEvent(event)
    }
  })
  
  document.addEventListener('shortcut:toggle-ai-panel', () => {
    // 通过AppLayout处理
    const layout = document.querySelector('.h-screen')
    if (layout) {
      const event = new CustomEvent('toggle-ai-panel')
      layout.dispatchEvent(event)
    }
  })
  
  // 编辑器操作
  document.addEventListener('shortcut:focus-editor', () => {
    editorContainer.value?.focus?.()
  })
  
  document.addEventListener('shortcut:reset-zoom', handleResetZoom)
  
  // 其他快捷键可以在相应组件中处理
}

// 生命周期
onMounted(async () => {
  console.log('Readdy AI 编辑器 MVP 已加载')
  
  // 初始化快捷键系统
  initializeDefaultShortcuts()
  setupShortcutHandlers()
  
  try {
    // 首先尝试加载已有项目
    const projects = await storageService.getProjects()
    
    if (projects && projects.length > 0) {
      // 加载最近的项目
      const latestProject = projects[0]
      const loadResult = await fileSystem.loadProject(latestProject.id)
      
      if (loadResult.success) {
        console.log('已加载现有项目:', latestProject.name)
        
        // 如果有文件，打开最近修改的文件
        if (latestProject.files && latestProject.files.length > 0) {
          const latestFile = latestProject.files.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0]
          
          await fileSystem.openFile(latestFile.id)
          wordCount.value = latestFile.content.length
        }
        return
      }
    }
    
    // 如果没有现有项目，创建默认项目和文件
    console.log('创建默认项目和文件')
    const defaultContent = `# 🚀 快速开始指南

欢迎使用 **Readdy AI** 编辑器！这是一个智能化的 Markdown 编辑器，集成了多种 AI 模型来提升你的写作体验。

## ✨ 主要特性

- **AI 驱动写作**: 支持 GPT-4、Gemini、Claude 等多种 AI 模型
- **实时预览**: 所见即所得的编辑体验  
- **智能文件管理**: 本地存储 + 云端同步
- **协作友好**: 支持版本控制和多人协作

## 🛠️ 快速配置

### 1. 配置 AI 服务
在右上角选择你偏好的 AI 模型，并配置相应的 API 密钥：

- **OpenAI**: \`sk-your-api-key\`
- **Google Gemini**: \`your-gemini-key\`
- **Anthropic Claude**: \`sk-ant-your-key\`
- **百度文心一言**: API Key + Secret Key

### 2. 开始使用
1. 创建新文档或打开现有文档
2. 在右侧 AI 助手中描述你的需求
3. AI 会实时生成内容到编辑器中

## 📝 写作技巧

### Markdown 语法支持
- **粗体文本**: \`**文本**\`
- *斜体文本*: \`*文本*\`
- [链接](https://example.com): \`[链接文本](URL)\`
- 代码块: 使用三个反引号包围

### AI 助手使用
- 直接询问: "帮我写一个关于 Vue.js 的介绍"
- 改进文本: "优化这段文字的表达"
- 代码生成: "写一个 Python 排序算法"

### 🚀 快捷键

本编辑器支持丰富的快捷键操作，提升编辑效率：

#### 文件操作
- **Ctrl+N**: 新建文件
- **Ctrl+S**: 保存文件  
- **Ctrl+O**: 打开文件

#### 导航
- **Ctrl+B**: 切换侧边栏
- **Ctrl+Shift+A**: 切换AI面板
- **Ctrl+E**: 聚焦编辑器

#### 视图
- **Ctrl+加号**: 放大字体
- **Ctrl+减号**: 缩小字体
- **Ctrl+0**: 重置字体大小

开始你的创作吧! 🎉`

    const projectResult = await fileSystem.createProject({
      name: '我的项目',
      description: '默认项目',
      files: []
    })

    if (projectResult.success) {
      // 创建一个测试文件夹
      const folderResult = await fileSystem.createFolder('文档', undefined)
      console.log('创建测试文件夹结果:', folderResult)
      
      const fileResult = await fileSystem.createFile('快速开始.md', undefined, defaultContent)
      if (fileResult.success && fileResult.data) {
        await fileSystem.openFile(fileResult.data.id)
        wordCount.value = defaultContent.length
      }
    }
  } catch (error) {
    console.error('初始化应用失败:', error)
  }
})

// 清理
onUnmounted(() => {
  keyboardManager.destroy()
})
</script>
