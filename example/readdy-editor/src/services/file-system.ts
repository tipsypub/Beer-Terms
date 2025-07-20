import { ref, computed } from 'vue'
import type { FileEntry, Project } from '@/types'
import { storageService } from './storage'

// 文件系统操作结果
export interface FileSystemResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 文件系统状态管理
export class FileSystemService {
  private currentProject = ref<Project | null>(null)
  private files = ref<FileEntry[]>([])
  private currentFile = ref<FileEntry | null>(null)
  private isDirty = ref(false)

  // 计算属性
  get project() {
    return this.currentProject.value
  }

  get allFiles() {
    console.log('💾 FileSystem allFiles getter 被调用, 文件数量:', this.files.value.length)
    return this.files.value
  }

  get activeFile() {
    return this.currentFile.value
  }

  get isFileDirty() {
    return this.isDirty.value
  }

  // 文件树结构
  get fileTree() {
    return computed(() => {
      const buildTree = (parentId?: string): FileEntry[] => {
        return this.files.value
          .filter(file => file.parentId === parentId)
          .sort((a, b) => {
            // 文件夹优先，然后按名称排序
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1
            }
            return a.name.localeCompare(b.name)
          })
          .map(file => ({
            ...file,
            children: file.type === 'folder' ? buildTree(file.id) : []
          }))
      }
      return buildTree()
    })
  }

  // 项目管理
  async loadProject(projectId: string): Promise<FileSystemResult<Project>> {
    try {
      const project = await storageService.getProject(projectId)
      if (!project) {
        return { success: false, error: '项目不存在' }
      }

      this.currentProject.value = project
      this.files.value = project.files || []
      this.currentFile.value = null
      this.isDirty.value = false

      return { success: true, data: project }
    } catch (error) {
      return { success: false, error: `加载项目失败: ${error}` }
    }
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<FileSystemResult<string>> {
    try {
      const projectId = await storageService.createProject(project)
      await this.loadProject(projectId)
      return { success: true, data: projectId }
    } catch (error) {
      return { success: false, error: `创建项目失败: ${error}` }
    }
  }

  // 文件操作
  async createFile(name: string, parentId?: string, content: string = ''): Promise<FileSystemResult<FileEntry>> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      // 检查同名文件
      const existingFile = this.files.value.find(f => 
        f.name === name && f.parentId === parentId
      )
      if (existingFile) {
        return { success: false, error: '文件名已存在' }
      }

      // 计算新文件的order值（在同级文件的最后）
      const siblingFiles = this.files.value.filter(f => f.parentId === parentId)
      const maxOrder = siblingFiles.length > 0 ? Math.max(...siblingFiles.map(f => f.order || 0)) : 0
      const newOrder = maxOrder + 1

      const fileId = await storageService.saveFile(this.currentProject.value.id, {
        name,
        content,
        type: 'file',
        parentId,
        size: content.length,
        order: newOrder
      })

      const newFile: FileEntry = {
        id: fileId,
        name,
        content,
        type: 'file',
        parentId,
        size: content.length,
        order: newOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.files.value.push(newFile)
      return { success: true, data: newFile }
    } catch (error) {
      return { success: false, error: `创建文件失败: ${error}` }
    }
  }

  async createFolder(name: string, parentId?: string): Promise<FileSystemResult<FileEntry>> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      // 检查同名文件夹
      const existingFolder = this.files.value.find(f => 
        f.name === name && f.parentId === parentId && f.type === 'folder'
      )
      if (existingFolder) {
        return { success: false, error: '文件夹名已存在' }
      }

      // 计算新文件夹的order值（在同级文件的最后）
      const siblingFiles = this.files.value.filter(f => f.parentId === parentId)
      const maxOrder = siblingFiles.length > 0 ? Math.max(...siblingFiles.map(f => f.order || 0)) : 0
      const newOrder = maxOrder + 1

      const folderId = await storageService.saveFile(this.currentProject.value.id, {
        name,
        content: '',
        type: 'folder',
        parentId,
        size: 0,
        order: newOrder
      })

      const newFolder: FileEntry = {
        id: folderId,
        name,
        content: '',
        type: 'folder',
        parentId,
        size: 0,
        order: newOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.files.value.push(newFolder)
      return { success: true, data: newFolder }
    } catch (error) {
      return { success: false, error: `创建文件夹失败: ${error}` }
    }
  }

  async deleteFile(fileId: string): Promise<FileSystemResult> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      const file = this.files.value.find(f => f.id === fileId)
      if (!file) {
        return { success: false, error: '文件不存在' }
      }

      // 如果是文件夹，递归删除所有子文件
      if (file.type === 'folder') {
        const childFiles = this.getChildrenRecursive(fileId)
        for (const child of childFiles) {
          await storageService.deleteFile(this.currentProject.value.id, child.id)
        }
      }

      await storageService.deleteFile(this.currentProject.value.id, fileId)
      
      // 从内存中移除
      this.files.value = this.files.value.filter(f => {
        if (f.id === fileId) return false
        if (file.type === 'folder' && this.isChildOf(f.id, fileId)) return false
        return true
      })

      // 如果删除的是当前文件，清空编辑器
      if (this.currentFile.value?.id === fileId) {
        this.currentFile.value = null
        this.isDirty.value = false
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `删除文件失败: ${error}` }
    }
  }

  async renameFile(fileId: string, newName: string): Promise<FileSystemResult> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      const file = this.files.value.find(f => f.id === fileId)
      if (!file) {
        return { success: false, error: '文件不存在' }
      }

      // 检查同名文件
      const existingFile = this.files.value.find(f => 
        f.name === newName && f.parentId === file.parentId && f.id !== fileId
      )
      if (existingFile) {
        return { success: false, error: '文件名已存在' }
      }

      await storageService.updateFile(this.currentProject.value.id, fileId, {
        name: newName
      })

      // 更新内存中的文件
      const index = this.files.value.findIndex(f => f.id === fileId)
      if (index !== -1) {
        this.files.value[index] = { ...this.files.value[index], name: newName }
      }

      // 如果是当前文件，同步更新
      if (this.currentFile.value?.id === fileId) {
        this.currentFile.value = { ...this.currentFile.value, name: newName }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `重命名失败: ${error}` }
    }
  }

  async saveFile(fileId: string, content: string): Promise<FileSystemResult> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      await storageService.updateFile(this.currentProject.value.id, fileId, {
        content,
        size: content.length,
        updatedAt: new Date()
      })

      // 更新内存中的文件
      const index = this.files.value.findIndex(f => f.id === fileId)
      if (index !== -1) {
        this.files.value[index] = { 
          ...this.files.value[index], 
          content, 
          size: content.length,
          updatedAt: new Date()
        }
      }

      // 如果是当前文件，同步更新
      if (this.currentFile.value?.id === fileId) {
        this.currentFile.value = { 
          ...this.currentFile.value, 
          content, 
          size: content.length,
          updatedAt: new Date()
        }
        this.isDirty.value = false
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: `保存文件失败: ${error}` }
    }
  }

  async openFile(fileId: string): Promise<FileSystemResult<FileEntry>> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      const file = await storageService.getFile(this.currentProject.value.id, fileId)
      if (!file) {
        return { success: false, error: '文件不存在' }
      }

      this.currentFile.value = file
      this.isDirty.value = false
      
      return { success: true, data: file }
    } catch (error) {
      return { success: false, error: `打开文件失败: ${error}` }
    }
  }

  // 移动文件/文件夹（支持排序）
  async moveFile(fileId: string, newParentId?: string, position?: 'before' | 'after', targetFileId?: string): Promise<FileSystemResult<FileEntry>> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      const file = this.files.value.find(f => f.id === fileId)
      if (!file) {
        return { success: false, error: '文件不存在' }
      }

      // 检查是否移动到自己的子目录（防止循环）
      if (newParentId && file.type === 'folder' && this.isChildOf(newParentId, fileId)) {
        return { success: false, error: '不能移动到自己的子目录' }
      }

      // 检查目标位置是否有同名文件
      const existingFile = this.files.value.find(f => 
        f.name === file.name && f.parentId === newParentId && f.id !== fileId
      )
      if (existingFile) {
        return { success: false, error: '目标位置已存在同名文件' }
      }

      console.log('💾 FileSystem 开始更新存储...')
      
      // 计算新的排序顺序
      let newOrder: number | undefined
      if (position && targetFileId) {
        const targetFile = this.files.value.find(f => f.id === targetFileId)
        const siblingFiles = this.files.value.filter(f => f.parentId === newParentId && f.id !== fileId)
        
        if (targetFile) {
          // 重新计算所有同级文件的order
          const sortedSiblings = siblingFiles.sort((a, b) => (a.order || 0) - (b.order || 0))
          const targetIndex = sortedSiblings.findIndex(f => f.id === targetFileId)
          
          if (position === 'before') {
            newOrder = targetIndex > 0 ? sortedSiblings[targetIndex - 1].order || 0 : 0
          } else {
            newOrder = (targetFile.order || 0) + 1
          }
          
          // 更新后续文件的order
          for (let i = targetIndex + (position === 'after' ? 1 : 0); i < sortedSiblings.length; i++) {
            const updateIndex = this.files.value.findIndex(f => f.id === sortedSiblings[i].id)
            if (updateIndex !== -1) {
              this.files.value[updateIndex] = {
                ...this.files.value[updateIndex],
                order: (newOrder || 0) + i + 1
              }
            }
          }
          
          console.log('💾 排序操作:', { position, targetFileId, newOrder })
        }
      }

      await storageService.updateFile(this.currentProject.value.id, fileId, {
        parentId: newParentId,
        order: newOrder,
        updatedAt: new Date()
      })
      console.log('💾 存储更新完成')

      // 更新内存中的文件 - 使用Vue响应式更新方式
      const index = this.files.value.findIndex(f => f.id === fileId)
      console.log('💾 文件在数组中的索引:', index)
      console.log('💾 更新前的files数组长度:', this.files.value.length)
      
      if (index !== -1) {
        const oldFile = { ...this.files.value[index] }
        
        // 创建新的文件对象
        const updatedFile = { 
          ...this.files.value[index], 
          parentId: newParentId,
          order: newOrder,
          updatedAt: new Date()
        }
        
        // 使用splice来确保Vue能检测到变化
        this.files.value.splice(index, 1, updatedFile)
        
        console.log('💾 文件更新:', {
          before: { id: oldFile.id, name: oldFile.name, parentId: oldFile.parentId, order: oldFile.order },
          after: { id: updatedFile.id, name: updatedFile.name, parentId: updatedFile.parentId, order: updatedFile.order }
        })
      } else {
        console.error('💾 找不到要更新的文件索引')
      }

      console.log('💾 更新后的files数组长度:', this.files.value.length)
      console.log('💾 所有文件的parentId状态:', this.files.value.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })))

      // 返回更新后的文件
      const updatedFile = this.files.value[index]
      console.log('💾 返回的更新文件:', updatedFile)
      return { success: true, data: updatedFile }
    } catch (error) {
      return { success: false, error: `移动文件失败: ${error}` }
    }
  }

  // 复制文件
  async copyFile(fileId: string, newParentId?: string, newName?: string): Promise<FileSystemResult<FileEntry>> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      const file = this.files.value.find(f => f.id === fileId)
      if (!file) {
        return { success: false, error: '文件不存在' }
      }

      const copyName = newName || `${file.name}_copy`
      
      if (file.type === 'file') {
        return await this.createFile(copyName, newParentId, file.content)
      } else {
        // 复制文件夹（递归复制所有子文件）
        const folderResult = await this.createFolder(copyName, newParentId)
        if (!folderResult.success || !folderResult.data) {
          return folderResult
        }

        const children = this.getChildren(fileId)
        for (const child of children) {
          await this.copyFile(child.id, folderResult.data.id)
        }

        return folderResult
      }
    } catch (error) {
      return { success: false, error: `复制文件失败: ${error}` }
    }
  }

  // 搜索文件
  async searchFiles(query: string): Promise<FileSystemResult<FileEntry[]>> {
    if (!this.currentProject.value) {
      return { success: false, error: '未选择项目' }
    }

    try {
      const results = await storageService.searchFiles(this.currentProject.value.id, query)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: `搜索失败: ${error}` }
    }
  }

  // 工具方法
  private getChildren(parentId: string): FileEntry[] {
    return this.files.value.filter(f => f.parentId === parentId)
  }

  private getChildrenRecursive(parentId: string): FileEntry[] {
    const children = this.getChildren(parentId)
    const result = [...children]
    
    for (const child of children) {
      if (child.type === 'folder') {
        result.push(...this.getChildrenRecursive(child.id))
      }
    }
    
    return result
  }

  private isChildOf(childId: string, parentId: string): boolean {
    const child = this.files.value.find(f => f.id === childId)
    if (!child || !child.parentId) return false
    
    if (child.parentId === parentId) return true
    
    return this.isChildOf(child.parentId, parentId)
  }

  // 获取文件路径
  getFilePath(fileId: string): string {
    const file = this.files.value.find(f => f.id === fileId)
    if (!file) return ''

    if (!file.parentId) return file.name

    const parentPath = this.getFilePath(file.parentId)
    return parentPath ? `${parentPath}/${file.name}` : file.name
  }

  // 设置文件为脏状态
  setFileDirty(dirty: boolean = true) {
    this.isDirty.value = dirty
  }

  // 获取项目统计信息
  getProjectStats() {
    const totalFiles = this.files.value.filter(f => f.type === 'file').length
    const totalFolders = this.files.value.filter(f => f.type === 'folder').length
    const totalSize = this.files.value.reduce((sum, f) => sum + (f.size || 0), 0)
    
    return {
      totalFiles,
      totalFolders,
      totalSize,
      lastModified: this.files.value.length > 0 
        ? new Date(Math.max(...this.files.value.map(f => f.updatedAt.getTime())))
        : null
    }
  }
}

// 创建全局文件系统实例
export const fileSystem = new FileSystemService()