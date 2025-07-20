// 快捷键系统

export interface KeyboardShortcut {
  id: string
  name: string
  description: string
  keys: string[]
  action: () => void | Promise<void>
  when?: () => boolean
  scope?: 'editor' | 'global' | 'sidebar' | 'ai-panel'
}

export interface ShortcutGroup {
  id: string
  name: string
  shortcuts: KeyboardShortcut[]
}

// 快捷键管理器
export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private activeElement: HTMLElement | null = null
  private pressedKeys: Set<string> = new Set()

  constructor() {
    this.bindGlobalListeners()
  }

  // 注册快捷键
  register(shortcut: KeyboardShortcut) {
    this.shortcuts.set(shortcut.id, shortcut)
  }

  // 批量注册快捷键
  registerGroup(group: ShortcutGroup) {
    group.shortcuts.forEach(shortcut => {
      this.register(shortcut)
    })
  }

  // 注销快捷键
  unregister(id: string) {
    this.shortcuts.delete(id)
  }

  // 获取所有快捷键
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  // 按组获取快捷键
  getShortcutGroups(): ShortcutGroup[] {
    const groups: { [key: string]: ShortcutGroup } = {}
    
    this.shortcuts.forEach(shortcut => {
      const scope = shortcut.scope || 'global'
      if (!groups[scope]) {
        groups[scope] = {
          id: scope,
          name: this.getScopeName(scope),
          shortcuts: []
        }
      }
      groups[scope].shortcuts.push(shortcut)
    })

    return Object.values(groups)
  }

  // 检查快捷键是否匹配
  private matchesShortcut(shortcut: KeyboardShortcut, event: KeyboardEvent): boolean {
    const keys = this.getEventKeys(event)
    return this.arraysEqual(keys.sort(), shortcut.keys.sort())
  }

  // 获取事件按键
  private getEventKeys(event: KeyboardEvent): string[] {
    const keys: string[] = []
    
    if (event.ctrlKey || event.metaKey) keys.push('Ctrl')
    if (event.altKey) keys.push('Alt')
    if (event.shiftKey) keys.push('Shift')
    
    if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      keys.push(event.key.toLowerCase())
    }
    
    return keys
  }

  // 比较数组是否相等
  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i])
  }

  // 获取作用域名称
  private getScopeName(scope: string): string {
    const names: { [key: string]: string } = {
      global: '全局',
      editor: '编辑器',
      sidebar: '侧边栏',
      'ai-panel': 'AI 面板'
    }
    return names[scope] || scope
  }

  // 格式化快捷键显示
  formatShortcut(keys: string[]): string {
    return keys
      .map(key => {
        switch (key.toLowerCase()) {
          case 'ctrl': return '⌘'
          case 'alt': return '⌥'
          case 'shift': return '⇧'
          case 'enter': return '↵'
          case 'backspace': return '⌫'
          case 'delete': return '⌦'
          case 'tab': return '⇥'
          case 'escape': return '⎋'
          case 'arrowup': return '↑'
          case 'arrowdown': return '↓'
          case 'arrowleft': return '←'
          case 'arrowright': return '→'
          default: return key.toUpperCase()
        }
      })
      .join(' + ')
  }

  // 绑定全局监听器
  private bindGlobalListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
    document.addEventListener('focusin', this.handleFocusIn.bind(this))
  }

  // 处理按键按下
  private handleKeyDown(event: KeyboardEvent) {
    // 在输入框中时，某些快捷键应该被忽略
    const target = event.target as HTMLElement
    if (this.shouldIgnoreInInput(target, event)) {
      return
    }

    // 查找匹配的快捷键
    for (const shortcut of this.shortcuts.values()) {
      if (this.matchesShortcut(shortcut, event)) {
        // 检查条件
        if (shortcut.when && !shortcut.when()) {
          continue
        }

        // 检查作用域
        if (!this.isInScope(shortcut.scope)) {
          continue
        }

        event.preventDefault()
        event.stopPropagation()
        
        try {
          shortcut.action()
        } catch (error) {
          console.error(`执行快捷键 ${shortcut.id} 时出错:`, error)
        }
        break
      }
    }
  }

  // 处理按键释放
  private handleKeyUp(event: KeyboardEvent) {
    // 清理按键状态
    this.pressedKeys.clear()
  }

  // 处理焦点变化
  private handleFocusIn(event: FocusEvent) {
    this.activeElement = event.target as HTMLElement
  }

  // 判断是否在输入框中应该忽略快捷键
  private shouldIgnoreInInput(target: HTMLElement, event: KeyboardEvent): boolean {
    const tagName = target.tagName.toLowerCase()
    const isInput = ['input', 'textarea'].includes(tagName) || 
                   target.contentEditable === 'true' ||
                   target.classList.contains('monaco-editor')

    if (!isInput) return false

    // 某些快捷键即使在输入框中也应该生效
    const alwaysActiveKeys = ['Ctrl+s', 'Ctrl+n', 'Ctrl+o', 'Ctrl+w', 'F1']
    const currentKeys = this.getEventKeys(event)
    const currentShortcut = currentKeys.sort().join('+')
    
    return !alwaysActiveKeys.some(shortcut => 
      shortcut.toLowerCase().replace(/\+/g, '') === currentShortcut.replace(/\+/g, '')
    )
  }

  // 检查是否在指定作用域
  private isInScope(scope?: string): boolean {
    if (!scope || scope === 'global') return true

    const activeElement = this.activeElement || document.activeElement as HTMLElement
    if (!activeElement) return true

    switch (scope) {
      case 'editor':
        return activeElement.closest('.monaco-editor') !== null
      case 'sidebar':
        return activeElement.closest('.sidebar') !== null || 
               activeElement.closest('[class*="sidebar"]') !== null
      case 'ai-panel':
        return activeElement.closest('.ai-chat-panel') !== null
      default:
        return true
    }
  }

  // 销毁管理器
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    document.removeEventListener('focusin', this.handleFocusIn.bind(this))
    this.shortcuts.clear()
  }
}

// 全局快捷键管理器实例
export const keyboardManager = new KeyboardShortcutManager()

// 默认快捷键配置
export const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    id: 'file',
    name: '文件操作',
    shortcuts: [
      {
        id: 'new-file',
        name: '新建文件',
        description: '创建一个新的文档文件',
        keys: ['ctrl', 'n'],
        action: () => {
          const event = new CustomEvent('shortcut:new-file')
          document.dispatchEvent(event)
        },
        scope: 'global'
      },
      {
        id: 'save-file',
        name: '保存文件',
        description: '保存当前编辑的文件',
        keys: ['ctrl', 's'],
        action: () => {
          const event = new CustomEvent('shortcut:save-file')
          document.dispatchEvent(event)
        },
        scope: 'global'
      },
      {
        id: 'open-file',
        name: '打开文件',
        description: '打开文件选择器',
        keys: ['ctrl', 'o'],
        action: () => {
          const event = new CustomEvent('shortcut:open-file')
          document.dispatchEvent(event)
        },
        scope: 'global'
      }
    ]
  },
  {
    id: 'editor',
    name: '编辑器',
    shortcuts: [
      {
        id: 'toggle-preview',
        name: '切换预览',
        description: '显示/隐藏 Markdown 预览',
        keys: ['ctrl', 'shift', 'p'],
        action: () => {
          const event = new CustomEvent('shortcut:toggle-preview')
          document.dispatchEvent(event)
        },
        scope: 'editor'
      },
      {
        id: 'focus-editor',
        name: '聚焦编辑器',
        description: '将焦点移到编辑器',
        keys: ['ctrl', 'e'],
        action: () => {
          const event = new CustomEvent('shortcut:focus-editor')
          document.dispatchEvent(event)
        },
        scope: 'global'
      },
      {
        id: 'find-replace',
        name: '查找替换',
        description: '打开查找替换面板',
        keys: ['ctrl', 'f'],
        action: () => {
          const event = new CustomEvent('shortcut:find-replace')
          document.dispatchEvent(event)
        },
        scope: 'editor'
      },
      {
        id: 'command-palette',
        name: '命令面板',
        description: '打开编辑器命令面板',
        keys: ['f1'],
        action: () => {
          const event = new CustomEvent('shortcut:command-palette')
          document.dispatchEvent(event)
        },
        scope: 'editor'
      }
    ]
  },
  {
    id: 'navigation',
    name: '导航',
    shortcuts: [
      {
        id: 'toggle-sidebar',
        name: '切换侧边栏',
        description: '显示/隐藏文件侧边栏',
        keys: ['ctrl', 'b'],
        action: () => {
          const event = new CustomEvent('shortcut:toggle-sidebar')
          document.dispatchEvent(event)
        },
        scope: 'global'
      },
      {
        id: 'toggle-ai-panel',
        name: '切换AI面板',
        description: '显示/隐藏AI助手面板',
        keys: ['ctrl', 'shift', 'a'],
        action: () => {
          const event = new CustomEvent('shortcut:toggle-ai-panel')
          document.dispatchEvent(event)
        },
        scope: 'global'
      },
      {
        id: 'search-files',
        name: '搜索文件',
        description: '打开文件搜索面板',
        keys: ['ctrl', 'shift', 'f'],
        action: () => {
          const event = new CustomEvent('shortcut:search-files')
          document.dispatchEvent(event)
        },
        scope: 'global'
      }
    ]
  },
  {
    id: 'ai',
    name: 'AI 助手',
    shortcuts: [
      {
        id: 'send-ai-message',
        name: '发送AI消息',
        description: '发送消息给AI助手',
        keys: ['enter'],
        action: () => {
          const event = new CustomEvent('shortcut:send-ai-message')
          document.dispatchEvent(event)
        },
        scope: 'ai-panel',
        when: () => {
          // 只有在AI面板的输入框中且有内容时才生效
          const activeElement = document.activeElement as HTMLElement
          return activeElement?.matches('textarea[placeholder*="输入消息"]') && 
                 (activeElement as HTMLTextAreaElement).value.trim().length > 0
        }
      },
      {
        id: 'clear-ai-chat',
        name: '清空AI对话',
        description: '清空当前AI对话记录',
        keys: ['ctrl', 'shift', 'delete'],
        action: () => {
          const event = new CustomEvent('shortcut:clear-ai-chat')
          document.dispatchEvent(event)
        },
        scope: 'ai-panel'
      }
    ]
  },
  {
    id: 'view',
    name: '视图',
    shortcuts: [
      {
        id: 'zoom-in',
        name: '放大',
        description: '增大编辑器字体',
        keys: ['ctrl', '='],
        action: () => {
          const event = new CustomEvent('shortcut:zoom-in')
          document.dispatchEvent(event)
        },
        scope: 'editor'
      },
      {
        id: 'zoom-out',
        name: '缩小',
        description: '减小编辑器字体',
        keys: ['ctrl', '-'],
        action: () => {
          const event = new CustomEvent('shortcut:zoom-out')
          document.dispatchEvent(event)
        },
        scope: 'editor'
      },
      {
        id: 'reset-zoom',
        name: '重置缩放',
        description: '重置编辑器字体大小',
        keys: ['ctrl', '0'],
        action: () => {
          const event = new CustomEvent('shortcut:reset-zoom')
          document.dispatchEvent(event)
        },
        scope: 'editor'
      }
    ]
  }
]

// 初始化默认快捷键
export function initializeDefaultShortcuts() {
  DEFAULT_SHORTCUTS.forEach(group => {
    keyboardManager.registerGroup(group)
  })
}