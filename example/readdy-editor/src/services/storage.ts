import type { FileEntry, Project } from '@/types'

// 存储服务抽象接口
export interface StorageService {
  // 项目管理
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  getProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  updateProject(id: string, project: Partial<Project>): Promise<void>
  deleteProject(id: string): Promise<void>

  // 文件操作
  saveFile(
    projectId: string,
    file: Omit<FileEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string>
  getFile(projectId: string, fileId: string): Promise<FileEntry | null>
  getFiles(projectId: string): Promise<FileEntry[]>
  updateFile(projectId: string, fileId: string, file: Partial<FileEntry>): Promise<void>
  deleteFile(projectId: string, fileId: string): Promise<void>

  // 搜索
  searchFiles(projectId: string, query: string): Promise<FileEntry[]>

  // 数据库管理
  clearDatabase?(): Promise<void>
}

// 本地存储实现（临时，后续会用IndexedDB替换）
class LocalStorageService implements StorageService {
  private readonly PROJECTS_KEY = 'readdy_projects'
  private readonly FILES_KEY = 'readdy_files'

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId()
    const now = new Date()
    const newProject: Project = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now,
      files: [],
    }

    const projects = await this.getProjects()
    projects.push(newProject)
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects))
    return id
  }

  async getProjects(): Promise<Project[]> {
    const data = localStorage.getItem(this.PROJECTS_KEY)
    return data ? JSON.parse(data) : []
  }

  async getProject(id: string): Promise<Project | null> {
    const projects = await this.getProjects()
    return projects.find((p) => p.id === id) || null
  }

  async updateProject(id: string, project: Partial<Project>): Promise<void> {
    const projects = await this.getProjects()
    const index = projects.findIndex((p) => p.id === id)
    if (index !== -1) {
      projects[index] = { ...projects[index], ...project, updatedAt: new Date() }
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects))
    }
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects()
    const filtered = projects.filter((p) => p.id !== id)
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(filtered))
    // 同时删除相关文件
    localStorage.removeItem(`${this.FILES_KEY}_${id}`)
  }

  async saveFile(
    projectId: string,
    file: Omit<FileEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = this.generateId()
    const now = new Date()
    const newFile: FileEntry = {
      ...file,
      id,
      createdAt: now,
      updatedAt: now,
    }

    const files = await this.getFiles(projectId)
    files.push(newFile)
    localStorage.setItem(`${this.FILES_KEY}_${projectId}`, JSON.stringify(files))
    return id
  }

  async getFile(projectId: string, fileId: string): Promise<FileEntry | null> {
    const files = await this.getFiles(projectId)
    return files.find((f) => f.id === fileId) || null
  }

  async getFiles(projectId: string): Promise<FileEntry[]> {
    const data = localStorage.getItem(`${this.FILES_KEY}_${projectId}`)
    return data ? JSON.parse(data) : []
  }

  async updateFile(projectId: string, fileId: string, file: Partial<FileEntry>): Promise<void> {
    const files = await this.getFiles(projectId)
    const index = files.findIndex((f) => f.id === fileId)
    if (index !== -1) {
      files[index] = { ...files[index], ...file, updatedAt: new Date() }
      localStorage.setItem(`${this.FILES_KEY}_${projectId}`, JSON.stringify(files))
    }
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const files = await this.getFiles(projectId)
    const filtered = files.filter((f) => f.id !== fileId)
    localStorage.setItem(`${this.FILES_KEY}_${projectId}`, JSON.stringify(filtered))
  }

  async searchFiles(projectId: string, query: string): Promise<FileEntry[]> {
    const files = await this.getFiles(projectId)
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.content.toLowerCase().includes(query.toLowerCase())
    )
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

import { IndexedDBStorageService } from './indexeddb-storage'

// 存储配置
export const STORAGE_CONFIG = {
  // 设置为 true 使用 IndexedDB，false 使用 LocalStorage
  useIndexedDB: true,
  // 数据库名称
  dbName: 'ReadyAIEditor',
  // 数据库版本
  dbVersion: 1
}

// 创建存储服务实例
function createStorageService(): StorageService {
  if (STORAGE_CONFIG.useIndexedDB) {
    try {
      return new IndexedDBStorageService()
    } catch (error) {
      console.warn('IndexedDB 不可用，回退到 LocalStorage:', error)
      return new LocalStorageService()
    }
  }
  return new LocalStorageService()
}

// 导出默认存储服务实例
export const storageService = createStorageService()

// 导出类型和实现，供其他地方使用
export { LocalStorageService, IndexedDBStorageService }
