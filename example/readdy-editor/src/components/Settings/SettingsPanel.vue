<template>
  <div class="settings-panel fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="close">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">设置</h2>
        <button 
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          @click="close"
        >
          <i class="ri-close-line text-gray-500"></i>
        </button>
      </div>

      <div class="flex h-full">
        <!-- 侧边栏 -->
        <div class="w-64 bg-gray-50 border-r border-gray-200">
          <nav class="p-4">
            <ul class="space-y-1">
              <li v-for="section in sections" :key="section.id">
                <button
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  :class="activeSection === section.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'"
                  @click="activeSection = section.id"
                >
                  <i :class="section.icon" class="mr-2"></i>
                  {{ section.name }}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <!-- 主内容区 -->
        <div class="flex-1 overflow-y-auto">
          <!-- 通用设置 -->
          <div v-if="activeSection === 'general'" class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">通用设置</h3>
            
            <div class="space-y-6">
              <!-- 主题设置 -->
              <div class="setting-group">
                <label class="setting-label">主题</label>
                <select v-model="settings.theme" class="setting-select">
                  <option value="light">浅色主题</option>
                  <option value="dark">深色主题</option>
                  <option value="auto">跟随系统</option>
                </select>
                <p class="setting-description">选择界面主题颜色</p>
              </div>

              <!-- 语言设置 -->
              <div class="setting-group">
                <label class="setting-label">界面语言</label>
                <select v-model="settings.language" class="setting-select">
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
                <p class="setting-description">设置界面显示语言</p>
              </div>

              <!-- 自动保存 -->
              <div class="setting-group">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="setting-label">自动保存</label>
                    <p class="setting-description">编辑时自动保存文档</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input 
                      v-model="settings.autoSave" 
                      type="checkbox" 
                      class="sr-only peer"
                    >
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <!-- 自动保存间隔 -->
              <div v-if="settings.autoSave" class="setting-group">
                <label class="setting-label">自动保存间隔</label>
                <div class="flex items-center space-x-2">
                  <input 
                    v-model.number="settings.autoSaveInterval" 
                    type="range" 
                    min="1" 
                    max="60" 
                    class="flex-1"
                  >
                  <span class="text-sm text-gray-600 w-12">{{ settings.autoSaveInterval }}秒</span>
                </div>
                <p class="setting-description">设置自动保存的时间间隔</p>
              </div>
            </div>
          </div>

          <!-- 编辑器设置 -->
          <div v-if="activeSection === 'editor'" class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">编辑器设置</h3>
            
            <div class="space-y-6">
              <!-- 字体大小 -->
              <div class="setting-group">
                <label class="setting-label">字体大小</label>
                <div class="flex items-center space-x-2">
                  <input 
                    v-model.number="settings.editor.fontSize" 
                    type="range" 
                    min="10" 
                    max="24" 
                    class="flex-1"
                  >
                  <span class="text-sm text-gray-600 w-8">{{ settings.editor.fontSize }}</span>
                </div>
                <p class="setting-description">设置编辑器字体大小</p>
              </div>

              <!-- 字体系列 -->
              <div class="setting-group">
                <label class="setting-label">字体</label>
                <select v-model="settings.editor.fontFamily" class="setting-select">
                  <option value="'JetBrains Mono', 'Fira Code', monospace">JetBrains Mono</option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="'SF Mono', 'Monaco', monospace">SF Mono</option>
                  <option value="'Consolas', monospace">Consolas</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
                <p class="setting-description">选择编辑器字体</p>
              </div>

              <!-- 自动换行 -->
              <div class="setting-group">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="setting-label">自动换行</label>
                    <p class="setting-description">长行自动换行显示</p>
                  </div>
                  <label class="toggle">
                    <input v-model="settings.editor.wordWrap" type="checkbox">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <!-- 显示行号 -->
              <div class="setting-group">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="setting-label">显示行号</label>
                    <p class="setting-description">在编辑器左侧显示行号</p>
                  </div>
                  <label class="toggle">
                    <input v-model="settings.editor.lineNumbers" type="checkbox">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <!-- 显示小地图 -->
              <div class="setting-group">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="setting-label">显示小地图</label>
                    <p class="setting-description">在编辑器右侧显示代码缩略图</p>
                  </div>
                  <label class="toggle">
                    <input v-model="settings.editor.minimap" type="checkbox">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <!-- 制表符大小 -->
              <div class="setting-group">
                <label class="setting-label">制表符大小</label>
                <select v-model.number="settings.editor.tabSize" class="setting-select">
                  <option :value="2">2 空格</option>
                  <option :value="4">4 空格</option>
                  <option :value="8">8 空格</option>
                </select>
                <p class="setting-description">设置制表符对应的空格数</p>
              </div>

              <!-- 滚动敏感度 -->
              <div class="setting-group">
                <label class="setting-label">滚动敏感度</label>
                <div class="flex items-center space-x-2">
                  <input 
                    v-model.number="settings.editor.scrollSensitivity" 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.1" 
                    class="flex-1"
                  >
                  <span class="text-sm text-gray-600 w-8">{{ settings.editor.scrollSensitivity.toFixed(1) }}</span>
                </div>
                <p class="setting-description">调整编辑器滚动速度</p>
              </div>
            </div>
          </div>

          <!-- 快捷键设置 -->
          <div v-if="activeSection === 'shortcuts'" class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">快捷键设置</h3>
            
            <div class="space-y-4">
              <div v-for="group in shortcutGroups" :key="group.id" class="setting-group">
                <h4 class="font-medium text-gray-900 mb-3">{{ group.name }}</h4>
                <div class="space-y-2">
                  <div 
                    v-for="shortcut in group.shortcuts" 
                    :key="shortcut.id"
                    class="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-200"
                  >
                    <div>
                      <div class="font-medium text-sm">{{ shortcut.name }}</div>
                      <div class="text-xs text-gray-500">{{ shortcut.description }}</div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <kbd class="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                        {{ formatShortcut(shortcut.keys) }}
                      </kbd>
                      <button 
                        class="text-xs text-primary hover:text-primary/80"
                        @click="editShortcut(shortcut)"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据管理 -->
          <div v-if="activeSection === 'data'" class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">数据管理</h3>
            
            <div class="space-y-6">
              <!-- 存储信息 -->
              <div class="setting-group">
                <label class="setting-label">存储信息</label>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">项目数量:</span>
                      <span class="font-medium ml-2">{{ storageInfo.projectCount }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">文件数量:</span>
                      <span class="font-medium ml-2">{{ storageInfo.fileCount }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">存储大小:</span>
                      <span class="font-medium ml-2">{{ storageInfo.size }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">最后更新:</span>
                      <span class="font-medium ml-2">{{ storageInfo.lastUpdate }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 数据导出 -->
              <div class="setting-group">
                <label class="setting-label">数据导出</label>
                <div class="flex space-x-3">
                  <button class="btn-secondary" @click="exportData">
                    <i class="ri-download-line mr-2"></i>
                    导出所有数据
                  </button>
                  <button class="btn-secondary" @click="exportSettings">
                    <i class="ri-settings-line mr-2"></i>
                    导出设置
                  </button>
                </div>
                <p class="setting-description">导出项目数据和设置到本地文件</p>
              </div>

              <!-- 数据导入 -->
              <div class="setting-group">
                <label class="setting-label">数据导入</label>
                <div class="flex space-x-3">
                  <input 
                    ref="importFileInput" 
                    type="file" 
                    accept=".json" 
                    class="hidden" 
                    @change="handleImportFile"
                  >
                  <button class="btn-secondary" @click="selectImportFile">
                    <i class="ri-upload-line mr-2"></i>
                    导入数据
                  </button>
                </div>
                <p class="setting-description">从本地文件导入项目数据</p>
              </div>

              <!-- 清空数据 -->
              <div class="setting-group">
                <label class="setting-label text-red-600">清空数据</label>
                <button class="btn-danger" @click="confirmClearData">
                  <i class="ri-delete-bin-line mr-2"></i>
                  清空所有数据
                </button>
                <p class="setting-description text-red-600">⚠️ 此操作将删除所有项目和文件，无法恢复</p>
              </div>
            </div>
          </div>

          <!-- 关于 -->
          <div v-if="activeSection === 'about'" class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">关于</h3>
            
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-gradient-to-br from-primary to-ai rounded-lg flex items-center justify-center mx-auto mb-4">
                <i class="ri-quill-pen-fill text-white text-2xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Readdy AI Editor</h2>
              <p class="text-gray-600 mb-4">智能化 Markdown 编辑器</p>
              <p class="text-sm text-gray-500 mb-6">版本 1.0.0</p>
              
              <div class="max-w-md mx-auto text-sm text-gray-600 space-y-2">
                <p>基于 Vue 3 + TypeScript + Monaco Editor 构建</p>
                <p>集成多种 AI 模型，提供智能写作辅助</p>
                <p>支持本地存储和云端同步</p>
              </div>

              <div class="mt-8 flex justify-center space-x-4">
                <a href="#" class="text-primary hover:text-primary/80">
                  <i class="ri-github-fill text-xl"></i>
                </a>
                <a href="#" class="text-primary hover:text-primary/80">
                  <i class="ri-twitter-fill text-xl"></i>
                </a>
                <a href="#" class="text-primary hover:text-primary/80">
                  <i class="ri-mail-fill text-xl"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button class="btn-secondary" @click="resetToDefault">
          <i class="ri-refresh-line mr-2"></i>
          恢复默认设置
        </button>
        <div class="flex space-x-3">
          <button class="btn-secondary" @click="close">取消</button>
          <button class="btn-primary" @click="save">
            <i class="ri-save-line mr-2"></i>
            保存设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { AppSettings } from '@/types'
import { storageService } from '@/services/storage'
import { keyboardManager } from '@/services/keyboard-shortcuts'

// Props & Emits
const emit = defineEmits<{
  close: []
  'settings-changed': [settings: AppSettings]
}>()

// 响应式数据
const activeSection = ref('general')
const importFileInput = ref<HTMLInputElement>()

// 设置数据
const settings = ref<AppSettings>({
  theme: 'light',
  language: 'zh-CN',
  autoSave: true,
  autoSaveInterval: 10,
  editor: {
    theme: 'light',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    wordWrap: true,
    lineNumbers: true,
    minimap: false,
    tabSize: 2,
    scrollSensitivity: 1.0
  }
})

// 存储信息
const storageInfo = ref({
  projectCount: 0,
  fileCount: 0,
  size: '0 KB',
  lastUpdate: '未知'
})

// 侧边栏菜单
const sections = [
  { id: 'general', name: '通用', icon: 'ri-settings-line' },
  { id: 'editor', name: '编辑器', icon: 'ri-code-line' },
  { id: 'shortcuts', name: '快捷键', icon: 'ri-keyboard-line' },
  { id: 'data', name: '数据管理', icon: 'ri-database-line' },
  { id: 'about', name: '关于', icon: 'ri-information-line' }
]

// 快捷键分组
const shortcutGroups = computed(() => {
  return keyboardManager.getShortcutGroups()
})

// 方法
const close = () => {
  emit('close')
}

const save = async () => {
  try {
    // 保存设置到 localStorage
    localStorage.setItem('app-settings', JSON.stringify(settings.value))
    
    // 触发设置变更事件
    emit('settings-changed', settings.value)
    
    // 显示保存成功提示
    showNotification('设置已保存', 'success')
    
    close()
  } catch (error) {
    console.error('保存设置失败:', error)
    showNotification('保存设置失败', 'error')
  }
}

const resetToDefault = () => {
  if (confirm('确定要恢复所有设置到默认值吗？')) {
    settings.value = {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      autoSaveInterval: 10,
      editor: {
        theme: 'light',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        wordWrap: true,
        lineNumbers: true,
        minimap: false,
        tabSize: 2,
        scrollSensitivity: 1.0
      }
    }
    showNotification('设置已恢复默认值', 'success')
  }
}

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      settings.value = { ...settings.value, ...parsed }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const loadStorageInfo = async () => {
  try {
    const projects = await storageService.getProjects()
    let totalFiles = 0
    let totalSize = 0
    let lastUpdate = new Date(0)

    projects.forEach(project => {
      totalFiles += project.files?.length || 0
      if (project.updatedAt > lastUpdate) {
        lastUpdate = project.updatedAt
      }
      
      // 估算大小
      const projectSize = JSON.stringify(project).length
      totalSize += projectSize
    })

    storageInfo.value = {
      projectCount: projects.length,
      fileCount: totalFiles,
      size: formatBytes(totalSize),
      lastUpdate: lastUpdate.getTime() > 0 ? lastUpdate.toLocaleString() : '未知'
    }
  } catch (error) {
    console.error('加载存储信息失败:', error)
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatShortcut = (keys: string[]): string => {
  return keyboardManager.formatShortcut(keys)
}

const editShortcut = (shortcut: any) => {
  // TODO: 实现快捷键编辑功能
  showNotification('快捷键编辑功能开发中', 'info')
}

const exportData = async () => {
  try {
    const projects = await storageService.getProjects()
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      projects,
      settings: settings.value
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `readdy-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    showNotification('数据导出成功', 'success')
  } catch (error) {
    console.error('导出数据失败:', error)
    showNotification('导出数据失败', 'error')
  }
}

const exportSettings = () => {
  try {
    const blob = new Blob([JSON.stringify(settings.value, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `readdy-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    showNotification('设置导出成功', 'success')
  } catch (error) {
    console.error('导出设置失败:', error)
    showNotification('导出设置失败', 'error')
  }
}

const selectImportFile = () => {
  importFileInput.value?.click()
}

const handleImportFile = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    if (data.settings) {
      settings.value = { ...settings.value, ...data.settings }
      showNotification('设置导入成功', 'success')
    }
    
    if (data.projects && Array.isArray(data.projects)) {
      // TODO: 实现项目数据导入
      showNotification('项目数据导入功能开发中', 'info')
    }
  } catch (error) {
    console.error('导入文件失败:', error)
    showNotification('导入文件失败，请检查文件格式', 'error')
  }
}

const confirmClearData = () => {
  if (confirm('确定要清空所有数据吗？此操作无法恢复！')) {
    if (confirm('请再次确认，这将删除所有项目和文件！')) {
      clearAllData()
    }
  }
}

const clearAllData = async () => {
  try {
    await storageService.clearDatabase?.()
    localStorage.clear()
    showNotification('数据已清空', 'success')
    
    // 刷新页面
    setTimeout(() => {
      location.reload()
    }, 1000)
  } catch (error) {
    console.error('清空数据失败:', error)
    showNotification('清空数据失败', 'error')
  }
}

const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
  // TODO: 实现通知系统
  console.log(`[${type.toUpperCase()}] ${message}`)
}

// 生命周期
onMounted(() => {
  loadSettings()
  loadStorageInfo()
})
</script>

<style scoped>
.setting-group {
  @apply border-b border-gray-100 pb-4 last:border-b-0;
}

.setting-label {
  @apply block text-sm font-medium text-gray-900 mb-1;
}

.setting-description {
  @apply text-xs text-gray-500 mt-1;
}

.setting-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary;
}

.btn-primary {
  @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center text-sm;
}

.btn-secondary {
  @apply px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm;
}

.btn-danger {
  @apply px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm;
}

/* 开关样式 */
.toggle {
  @apply relative inline-block w-11 h-6;
}

.toggle input {
  @apply opacity-0 w-0 h-0;
}

.slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300;
}

.slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300;
}

input:checked + .slider {
  @apply bg-primary;
}

input:checked + .slider:before {
  @apply transform translate-x-5;
}
</style>