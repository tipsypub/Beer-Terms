// 文件类型定义
export interface FileEntry {
  id: string
  name: string
  content: string
  type: 'file' | 'folder'
  parentId?: string
  createdAt: Date
  updatedAt: Date
  size?: number
  order?: number // 文件排序顺序
}

// 项目类型定义
export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  files: FileEntry[]
}

// 文件树节点
export interface FileTreeNode extends FileEntry {
  children?: FileTreeNode[]
}

// 文件夹类型定义
export interface FolderEntry {
  id: string
  name: string
  path: string
  parentId?: string
  children?: FolderEntry[]
  fileCount?: number
}

// 重新导出AI类型
export * from './ai'

// 编辑器配置
export interface EditorConfig {
  theme: 'light' | 'dark'
  fontSize: number
  fontFamily?: string
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  tabSize?: number
  scrollSensitivity?: number
}

// 应用设置
export interface AppSettings {
  theme: 'light' | 'dark'
  language?: string
  editor: EditorConfig
  autoSave: boolean
  autoSaveInterval: number
}
