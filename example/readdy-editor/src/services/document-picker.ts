// 文档选择器服务

export interface DocumentFragment {
  id: string
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'table' | 'quote' | 'custom'
  title: string
  content: string
  startLine: number
  endLine: number
  level?: number // 对于标题
  selected: boolean
  preview: string // 内容预览
}

export interface SelectedContext {
  fragments: DocumentFragment[]
  totalLength: number
  summary: string
}

export class DocumentPickerService {
  private content: string = ''
  private fragments: DocumentFragment[] = []

  // 解析文档内容为可选择的片段
  parseDocument(content: string): DocumentFragment[] {
    this.content = content
    this.fragments = []
    
    const lines = content.split('\n')
    let currentId = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) continue
      
      // 检测标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const title = headingMatch[2]
        
        // 找到标题对应的内容范围
        const { endLine, content: sectionContent } = this.extractSectionContent(lines, i, level)
        
        this.fragments.push({
          id: `heading-${currentId++}`,
          type: 'heading',
          title: `${'#'.repeat(level)} ${title}`,
          content: sectionContent,
          startLine: i + 1,
          endLine: endLine + 1,
          level,
          selected: false,
          preview: this.generatePreview(sectionContent)
        })
        
        i = endLine
        continue
      }
      
      // 检测代码块
      if (line.startsWith('```')) {
        const { endLine, content: codeContent } = this.extractCodeBlock(lines, i)
        const language = line.substring(3).trim() || 'text'
        
        this.fragments.push({
          id: `code-${currentId++}`,
          type: 'code',
          title: `代码块 (${language})`,
          content: codeContent,
          startLine: i + 1,
          endLine: endLine + 1,
          selected: false,
          preview: this.generatePreview(codeContent)
        })
        
        i = endLine
        continue
      }
      
      // 检测引用块
      if (line.startsWith('>')) {
        const { endLine, content: quoteContent } = this.extractQuoteBlock(lines, i)
        
        this.fragments.push({
          id: `quote-${currentId++}`,
          type: 'quote',
          title: '引用块',
          content: quoteContent,
          startLine: i + 1,
          endLine: endLine + 1,
          selected: false,
          preview: this.generatePreview(quoteContent)
        })
        
        i = endLine
        continue
      }
      
      // 检测列表
      if (line.match(/^(\s*[-*+]|\s*\d+\.)\s+/)) {
        const { endLine, content: listContent } = this.extractListBlock(lines, i)
        
        this.fragments.push({
          id: `list-${currentId++}`,
          type: 'list',
          title: '列表',
          content: listContent,
          startLine: i + 1,
          endLine: endLine + 1,
          selected: false,
          preview: this.generatePreview(listContent)
        })
        
        i = endLine
        continue
      }
      
      // 检测表格
      if (line.includes('|') && line.split('|').length >= 3) {
        const { endLine, content: tableContent } = this.extractTableBlock(lines, i)
        
        this.fragments.push({
          id: `table-${currentId++}`,
          type: 'table',
          title: '表格',
          content: tableContent,
          startLine: i + 1,
          endLine: endLine + 1,
          selected: false,
          preview: this.generatePreview(tableContent)
        })
        
        i = endLine
        continue
      }
      
      // 普通段落
      const { endLine, content: paragraphContent } = this.extractParagraph(lines, i)
      
      if (paragraphContent.trim()) {
        this.fragments.push({
          id: `paragraph-${currentId++}`,
          type: 'paragraph',
          title: '段落',
          content: paragraphContent,
          startLine: i + 1,
          endLine: endLine + 1,
          selected: false,
          preview: this.generatePreview(paragraphContent)
        })
        
        i = endLine
      }
    }
    
    return this.fragments
  }

  // 提取标题对应的章节内容
  private extractSectionContent(lines: string[], startIndex: number, currentLevel: number): { endLine: number, content: string } {
    const sectionLines = [lines[startIndex]]
    let i = startIndex + 1
    
    while (i < lines.length) {
      const line = lines[i].trim()
      
      // 遇到同级或更高级标题时停止
      const headingMatch = line.match(/^(#{1,6})\s+/)
      if (headingMatch && headingMatch[1].length <= currentLevel) {
        break
      }
      
      sectionLines.push(lines[i])
      i++
    }
    
    return {
      endLine: i - 1,
      content: sectionLines.join('\n')
    }
  }

  // 提取代码块
  private extractCodeBlock(lines: string[], startIndex: number): { endLine: number, content: string } {
    const codeLines = [lines[startIndex]]
    let i = startIndex + 1
    
    while (i < lines.length) {
      codeLines.push(lines[i])
      if (lines[i].trim().startsWith('```')) {
        break
      }
      i++
    }
    
    return {
      endLine: i,
      content: codeLines.join('\n')
    }
  }

  // 提取引用块
  private extractQuoteBlock(lines: string[], startIndex: number): { endLine: number, content: string } {
    const quoteLines = []
    let i = startIndex
    
    while (i < lines.length && (lines[i].trim().startsWith('>') || lines[i].trim() === '')) {
      quoteLines.push(lines[i])
      i++
    }
    
    return {
      endLine: i - 1,
      content: quoteLines.join('\n')
    }
  }

  // 提取列表块
  private extractListBlock(lines: string[], startIndex: number): { endLine: number, content: string } {
    const listLines = []
    let i = startIndex
    
    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // 空行或列表项或缩进内容
      if (!trimmed || 
          trimmed.match(/^(\s*[-*+]|\s*\d+\.)\s+/) || 
          (line.startsWith('  ') || line.startsWith('\t'))) {
        listLines.push(line)
        i++
      } else {
        break
      }
    }
    
    return {
      endLine: i - 1,
      content: listLines.join('\n')
    }
  }

  // 提取表格块
  private extractTableBlock(lines: string[], startIndex: number): { endLine: number, content: string } {
    const tableLines = []
    let i = startIndex
    
    while (i < lines.length && lines[i].includes('|')) {
      tableLines.push(lines[i])
      i++
    }
    
    return {
      endLine: i - 1,
      content: tableLines.join('\n')
    }
  }

  // 提取段落
  private extractParagraph(lines: string[], startIndex: number): { endLine: number, content: string } {
    const paragraphLines = []
    let i = startIndex
    
    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // 空行或特殊格式标记表示段落结束
      if (!trimmed || 
          trimmed.match(/^#{1,6}\s+/) ||
          trimmed.startsWith('```') ||
          trimmed.startsWith('>') ||
          trimmed.match(/^(\s*[-*+]|\s*\d+\.)\s+/) ||
          trimmed.includes('|')) {
        break
      }
      
      paragraphLines.push(line)
      i++
    }
    
    return {
      endLine: i - 1,
      content: paragraphLines.join('\n')
    }
  }

  // 生成内容预览
  private generatePreview(content: string, maxLength: number = 100): string {
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/```[\s\S]*?```/g, '[代码]') // 替换代码块
      .replace(/^\s*>\s*/gm, '') // 移除引用标记
      .replace(/^\s*[-*+]\s*/gm, '• ') // 替换列表标记
      .replace(/^\s*\d+\.\s*/gm, '• ') // 替换数字列表标记
      .replace(/\|/g, ' ') // 移除表格分隔符
      .replace(/\n\s*\n/g, ' ') // 替换多个换行为空格
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim()
    
    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...'
      : cleanContent
  }

  // 切换片段选择状态
  toggleFragment(id: string): DocumentFragment | null {
    const fragment = this.fragments.find(f => f.id === id)
    if (fragment) {
      fragment.selected = !fragment.selected
      return fragment
    }
    return null
  }

  // 获取选中的上下文
  getSelectedContext(): SelectedContext {
    const selectedFragments = this.fragments.filter(f => f.selected)
    const totalLength = selectedFragments.reduce((sum, f) => sum + f.content.length, 0)
    
    let summary = ''
    if (selectedFragments.length === 0) {
      summary = '未选择任何内容'
    } else if (selectedFragments.length === 1) {
      summary = `已选择 1 个${this.getTypeLabel(selectedFragments[0].type)}`
    } else {
      const typeCount = selectedFragments.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const typeSummary = Object.entries(typeCount)
        .map(([type, count]) => `${count}个${this.getTypeLabel(type)}`)
        .join(', ')
      
      summary = `已选择 ${selectedFragments.length} 项内容: ${typeSummary}`
    }
    
    return {
      fragments: selectedFragments,
      totalLength,
      summary
    }
  }

  // 获取类型标签
  private getTypeLabel(type: string): string {
    const labels = {
      heading: '标题',
      paragraph: '段落',
      list: '列表',
      code: '代码块',
      table: '表格',
      quote: '引用',
      custom: '自定义'
    }
    return labels[type as keyof typeof labels] || '未知'
  }

  // 清空所有选择
  clearSelection(): void {
    this.fragments.forEach(f => f.selected = false)
  }

  // 全选
  selectAll(): void {
    this.fragments.forEach(f => f.selected = true)
  }

  // 根据类型选择
  selectByType(type: DocumentFragment['type']): void {
    this.fragments.forEach(f => {
      if (f.type === type) {
        f.selected = true
      }
    })
  }

  // 获取所有片段
  getFragments(): DocumentFragment[] {
    return this.fragments
  }

  // 导出选中内容
  exportSelectedContent(): string {
    const selectedFragments = this.fragments.filter(f => f.selected)
    return selectedFragments.map(f => f.content).join('\n\n')
  }
}