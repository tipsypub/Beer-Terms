// 拖拽服务

export interface DragData {
  type: 'file' | 'folder'
  id: string
  name: string
  parentId?: string
}

export interface DropTarget {
  type: 'folder' | 'root' | 'before' | 'after'
  id?: string
  name?: string
  insertPosition?: 'before' | 'after' // 用于排序时的插入位置
}

export interface DragDropEvent {
  source: DragData
  target: DropTarget
}

export class DragDropService {
  private dragData: DragData | null = null
  private dragElement: HTMLElement | null = null
  private dropIndicator: HTMLElement | null = null

  // 开始拖拽
  startDrag(data: DragData, element: HTMLElement): void {
    this.dragData = data
    this.dragElement = element
    
    // 添加拖拽样式
    element.classList.add('dragging')
    element.style.opacity = '0.5'
    
    // 创建拖拽指示器
    this.createDropIndicator()
    
    console.log('开始拖拽:', data)
  }

  // 结束拖拽
  endDrag(): void {
    if (this.dragElement) {
      this.dragElement.classList.remove('dragging')
      this.dragElement.style.opacity = ''
    }
    
    this.removeDropIndicator()
    this.dragData = null
    this.dragElement = null
    
    console.log('结束拖拽')
  }

  // 获取当前拖拽数据
  getDragData(): DragData | null {
    return this.dragData
  }

  // 检查是否可以放置
  canDrop(target: DropTarget): boolean {
    console.log('🔍 canDrop 检查:', { dragData: this.dragData, target })
    
    if (!this.dragData) {
      console.log('🔍 canDrop false - 无拖拽数据')
      return false
    }

    // 不能拖拽到自己上
    if (this.dragData.id === target.id) {
      console.log('🔍 canDrop false - 拖拽到自己')
      return false
    }

    // 不能将文件夹拖拽到其子文件夹中（防止循环引用）
    if (this.dragData.type === 'folder' && target.type === 'folder') {
      const isDescendant = this.isDescendant(this.dragData.id, target.id!)
      console.log('🔍 canDrop 文件夹检查 isDescendant:', isDescendant)
      return !isDescendant
    }

    console.log('🔍 canDrop true - 可以放置')
    return true
  }

  // 检查是否为子文件夹
  private isDescendant(parentId: string, childId: string): boolean {
    // 这里需要从文件系统获取完整的文件夹层次结构
    // 暂时简化处理
    return false
  }

  // 创建拖拽指示器
  private createDropIndicator(): void {
    this.dropIndicator = document.createElement('div')
    this.dropIndicator.className = 'drop-indicator'
    this.dropIndicator.style.cssText = `
      position: absolute;
      height: 2px;
      background: #3b82f6;
      border-radius: 1px;
      pointer-events: none;
      z-index: 1000;
      display: none;
    `
    document.body.appendChild(this.dropIndicator)
  }

  // 移除拖拽指示器
  private removeDropIndicator(): void {
    if (this.dropIndicator) {
      document.body.removeChild(this.dropIndicator)
      this.dropIndicator = null
    }
  }

  // 显示放置指示器
  showDropIndicator(element: HTMLElement, position: 'before' | 'after' | 'inside'): void {
    if (!this.dropIndicator) return

    const rect = element.getBoundingClientRect()
    
    if (position === 'before') {
      this.dropIndicator.style.left = `${rect.left}px`
      this.dropIndicator.style.top = `${rect.top - 1}px`
      this.dropIndicator.style.width = `${rect.width}px`
      this.dropIndicator.style.display = 'block'
    } else if (position === 'after') {
      this.dropIndicator.style.left = `${rect.left}px`
      this.dropIndicator.style.top = `${rect.bottom - 1}px`
      this.dropIndicator.style.width = `${rect.width}px`
      this.dropIndicator.style.display = 'block'
    } else if (position === 'inside') {
      // 为文件夹内部放置显示不同的指示器
      element.classList.add('drop-target-inside')
    }
  }

  // 隐藏放置指示器
  hideDropIndicator(): void {
    if (this.dropIndicator) {
      this.dropIndicator.style.display = 'none'
    }
    
    // 移除所有内部放置指示器
    document.querySelectorAll('.drop-target-inside').forEach(el => {
      el.classList.remove('drop-target-inside')
    })
  }

  // 处理拖拽悬停
  handleDragOver(event: globalThis.DragEvent, target: DropTarget, element: HTMLElement): boolean {
    console.log('🔧 DragDropService handleDragOver 开始')
    event.preventDefault()
    
    const canDrop = this.canDrop(target)
    console.log('🔧 handleDragOver canDrop:', canDrop)
    
    if (!canDrop) {
      this.hideDropIndicator()
      console.log('🔧 handleDragOver 不能放置，设置 dropEffect = none')
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none'
      }
      return false
    }

    // 显示合适的放置指示器
    if (target.type === 'folder') {
      console.log('🔧 显示文件夹内部放置指示器')
      this.showDropIndicator(element, 'inside')
    } else if (target.type === 'before' || target.type === 'after') {
      // 显示排序放置指示器
      console.log('🔧 显示排序放置指示器:', target.type)
      this.showDropIndicator(element, target.type as 'before' | 'after')
    } else {
      // 根据鼠标位置决定是 before 还是 after
      const rect = element.getBoundingClientRect()
      const mouseY = event.clientY
      const elementMiddle = rect.top + rect.height / 2
      
      if (mouseY < elementMiddle) {
        this.showDropIndicator(element, 'before')
      } else {
        this.showDropIndicator(element, 'after')
      }
    }

    console.log('🔧 handleDragOver 设置 dropEffect = move')
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    return true
  }

  // 处理放置
  handleDrop(event: globalThis.DragEvent, target: DropTarget): DragDropEvent | null {
    console.log('🔧 DragDropService handleDrop 开始')
    console.log('🔧 当前拖拽数据:', this.dragData)
    console.log('🔧 目标:', target)
    
    event.preventDefault()
    this.hideDropIndicator()
    
    if (!this.dragData) {
      console.log('❌ 没有拖拽数据')
      return null
    }
    
    if (!this.canDrop(target)) {
      console.log('❌ 不能放置到此目标')
      return null
    }

    const dragEvent: DragDropEvent = {
      source: this.dragData,
      target
    }

    console.log('✅ 放置操作成功:', dragEvent)
    return dragEvent
  }
}

// 全局拖拽服务实例
export const dragDropService = new DragDropService()