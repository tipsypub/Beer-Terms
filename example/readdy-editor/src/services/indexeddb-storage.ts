import Dexie, { type Table } from 'dexie'
import type { FileEntry, Project } from '@/types'
import type { StorageService } from './storage'

// IndexedDB 数据库接口定义
interface ProjectDB extends Omit<Project, 'files'> {
  id: string
}

interface FileDB extends FileEntry {
  projectId: string
}

// Dexie 数据库类
class ReadyDatabase extends Dexie {
  projects!: Table<ProjectDB>
  files!: Table<FileDB>

  constructor() {
    super('ReadyAIEditor')
    
    this.version(1).stores({
      projects: 'id, name, description, createdAt, updatedAt',
      files: 'id, projectId, name, type, parentId, createdAt, updatedAt, size, [projectId+id]'
    })
  }
}

// IndexedDB 存储服务实现
export class IndexedDBStorageService implements StorageService {
  private db: ReadyDatabase

  constructor() {
    this.db = new ReadyDatabase()
  }

  // 项目管理
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId()
    const now = new Date()
    
    const newProject: ProjectDB = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now
    }

    await this.db.projects.add(newProject)
    return id
  }

  async getProjects(): Promise<Project[]> {
    const projects = await this.db.projects.orderBy('updatedAt').reverse().toArray()
    
    // 为每个项目加载文件列表
    const projectsWithFiles = await Promise.all(
      projects.map(async (project) => {
        const files = await this.getFiles(project.id)
        return {
          ...project,
          files
        }
      })
    )

    return projectsWithFiles
  }

  async getProject(id: string): Promise<Project | null> {
    const project = await this.db.projects.get(id)
    if (!project) return null

    const files = await this.getFiles(id)
    return {
      ...project,
      files
    }
  }

  async updateProject(id: string, project: Partial<Project>): Promise<void> {
    const updateData = {
      ...project,
      updatedAt: new Date()
    }
    
    await this.db.projects.update(id, updateData)
  }

  async deleteProject(id: string): Promise<void> {
    // 开启事务，同时删除项目和相关文件
    await this.db.transaction('rw', this.db.projects, this.db.files, async () => {
      await this.db.projects.delete(id)
      await this.db.files.where('projectId').equals(id).delete()
    })
  }

  // 文件操作
  async saveFile(
    projectId: string,
    file: Omit<FileEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = this.generateId()
    const now = new Date()
    
    const newFile: FileDB = {
      ...file,
      id,
      projectId,
      createdAt: now,
      updatedAt: now,
      size: file.content.length
    }

    await this.db.files.add(newFile)
    
    // 更新项目的修改时间
    await this.updateProject(projectId, {})
    
    return id
  }

  async getFile(projectId: string, fileId: string): Promise<FileEntry | null> {
    const file = await this.db.files
      .where({ projectId, id: fileId })
      .first()
    
    if (!file) return null

    // 移除 projectId 字段，返回 FileEntry 格式
    const { projectId: _, ...fileEntry } = file
    return fileEntry
  }

  async getFiles(projectId: string): Promise<FileEntry[]> {
    const files = await this.db.files
      .where('projectId')
      .equals(projectId)
      .toArray()
    
    files.sort((a, b) => a.name.localeCompare(b.name))

    // 移除 projectId 字段，返回 FileEntry[] 格式  
    return files.map(({ projectId, ...file }) => file)
  }

  async updateFile(projectId: string, fileId: string, file: Partial<FileEntry>): Promise<void> {
    const updateData = {
      ...file,
      updatedAt: new Date(),
      size: file.content ? file.content.length : undefined
    }

    await this.db.files.update(fileId, updateData)
    
    // 更新项目的修改时间
    await this.updateProject(projectId, {})
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    await this.db.files.delete(fileId)
    
    // 更新项目的修改时间
    await this.updateProject(projectId, {})
  }

  // 搜索功能
  async searchFiles(projectId: string, query: string): Promise<FileEntry[]> {
    const queryLower = query.toLowerCase()
    
    const files = await this.db.files
      .where('projectId')
      .equals(projectId)
      .filter(file => 
        file.name.toLowerCase().includes(queryLower) ||
        file.content.toLowerCase().includes(queryLower)
      )
      .toArray()

    // 移除 projectId 字段，返回 FileEntry[] 格式  
    return files.map(({ projectId, ...file }) => file)
  }

  // 高级搜索功能
  async searchFilesAdvanced(projectId: string, options: {
    nameQuery?: string
    contentQuery?: string
    fileType?: string
    modifiedAfter?: Date
    modifiedBefore?: Date
  }): Promise<FileEntry[]> {
    let collection = this.db.files.where('projectId').equals(projectId)

    const files = await collection.filter(file => {
      let match = true

      if (options.nameQuery) {
        match = match && file.name.toLowerCase().includes(options.nameQuery.toLowerCase())
      }

      if (options.contentQuery) {
        match = match && file.content.toLowerCase().includes(options.contentQuery.toLowerCase())
      }

      if (options.fileType) {
        match = match && file.type === options.fileType
      }

      if (options.modifiedAfter) {
        match = match && file.updatedAt >= options.modifiedAfter
      }

      if (options.modifiedBefore) {
        match = match && file.updatedAt <= options.modifiedBefore
      }

      return match
    }).toArray()

    // 移除 projectId 字段，返回 FileEntry[] 格式  
    return files.map(({ projectId, ...file }) => file)
  }

  // 统计信息
  async getProjectStats(projectId: string): Promise<{
    totalFiles: number
    totalSize: number
    lastModified: Date | null
  }> {
    const files = await this.db.files.where('projectId').equals(projectId).toArray()
    
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
      lastModified: files.length > 0 
        ? new Date(Math.max(...files.map(f => f.updatedAt.getTime())))
        : null
    }
  }

  // 批量操作
  async bulkUpdateFiles(
    projectId: string,
    updateList: Array<{ fileId: string; updates: Partial<FileEntry> }>
  ): Promise<void> {
    await this.db.transaction('rw', this.db.files, async () => {
      for (const { fileId, updates } of updateList) {
        await this.updateFile(projectId, fileId, updates)
      }
    })
  }

  async bulkDeleteFiles(projectId: string, fileIds: string[]): Promise<void> {
    await this.db.transaction('rw', this.db.files, async () => {
      await this.db.files.bulkDelete(fileIds)
    })
    
    // 更新项目的修改时间
    await this.updateProject(projectId, {})
  }

  // 数据库管理
  async clearDatabase(): Promise<void> {
    await this.db.transaction('rw', this.db.projects, this.db.files, async () => {
      await this.db.projects.clear()
      await this.db.files.clear()
    })
  }

  async exportProject(projectId: string): Promise<{
    project: Project
    files: FileEntry[]
  }> {
    const project = await this.getProject(projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    const files = await this.getFiles(projectId)
    
    return { project, files }
  }

  async importProject(data: {
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
    files: Omit<FileEntry, 'id' | 'createdAt' | 'updatedAt'>[]
  }): Promise<string> {
    const projectId = await this.createProject(data.project)
    
    // 批量导入文件
    await this.db.transaction('rw', this.db.files, async () => {
      for (const file of data.files) {
        await this.saveFile(projectId, file)
      }
    })

    return projectId
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

// 创建单例实例
export const indexedDBStorage = new IndexedDBStorageService()