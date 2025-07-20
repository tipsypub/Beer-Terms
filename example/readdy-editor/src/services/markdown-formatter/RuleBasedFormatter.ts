import type { 
  MarkdownAST, 
  MarkdownNode, 
  ContentAnalysis, 
  FormattingRule, 
  DocumentType,
  FormattingConfig
} from './types'

// 基础格式化规则抽象类
export abstract class BaseFormattingRule implements FormattingRule {
  abstract name: string
  abstract priority: number

  abstract apply(ast: MarkdownAST, analysis: ContentAnalysis): MarkdownAST
  
  canApply(analysis: ContentAnalysis): boolean {
    return true // 默认所有规则都可以应用
  }

  protected addSpacingBefore(node: MarkdownNode, lines: number = 1): void {
    if (!node.metadata) node.metadata = {}
    node.metadata.spacingBefore = lines
  }

  protected addSpacingAfter(node: MarkdownNode, lines: number = 1): void {
    if (!node.metadata) node.metadata = {}
    node.metadata.spacingAfter = lines
  }

  protected normalizeContent(content: string): string {
    return content.trim().replace(/\s+/g, ' ')
  }
}

// 标题间距规则
export class HeadingSpacingRule extends BaseFormattingRule {
  name = 'HeadingSpacingRule'
  priority = 100

  apply(ast: MarkdownAST, analysis: ContentAnalysis): MarkdownAST {
    ast.walkNodes((node, index, siblings) => {
      if (node.type === 'heading') {
        this.formatHeading(node, index, siblings)
      }
    })
    return ast
  }

  private formatHeading(node: MarkdownNode, index: number, siblings: MarkdownNode[]): void {
    const level = node.metadata?.level || 1
    
    // 确保标题前后有空行
    if (index > 0) {
      this.addSpacingBefore(node, level === 1 ? 2 : 1)
    }
    
    if (index < (siblings?.length || 0) - 1) {
      this.addSpacingAfter(node, 1)
    }

    // 标题文本规范化
    node.content = this.normalizeHeadingText(node.content)
  }

  private normalizeHeadingText(text: string): string {
    return text.trim()
      .replace(/^#+\s*/, '') // 移除开头的 # 符号
      .replace(/\s+/g, ' ') // 规范化空格
  }
}

// 列表格式化规则
export class ListFormattingRule extends BaseFormattingRule {
  name = 'ListFormattingRule'
  priority = 90

  apply(ast: MarkdownAST, analysis: ContentAnalysis): MarkdownAST {
    ast.walkNodes((node) => {
      if (node.type === 'bullet_list' || node.type === 'ordered_list') {
        this.formatList(node, analysis)
      }
    })
    return ast
  }

  private formatList(node: MarkdownNode, analysis: ContentAnalysis): void {
    const isOrdered = node.type === 'ordered_list'
    
    // 确保列表前后有空行
    this.addSpacingBefore(node, 1)
    this.addSpacingAfter(node, 1)

    // 格式化列表项
    if (node.children) {
      node.children.forEach((child, index) => {
        if (child.type === 'list_item') {
          this.formatListItem(child, index, isOrdered, analysis)
        }
      })
    }
  }

  private formatListItem(
    node: MarkdownNode, 
    index: number, 
    isOrdered: boolean, 
    analysis: ContentAnalysis
  ): void {
    // 统一列表标记
    if (isOrdered) {
      node.metadata = { ...node.metadata, marker: `${index + 1}.` }
    } else {
      // 根据文档类型选择合适的标记
      const marker = this.selectUnorderedMarker(analysis.documentType)
      node.metadata = { ...node.metadata, marker }
    }

    // 规范化列表项内容
    node.content = this.normalizeContent(node.content)
  }

  private selectUnorderedMarker(docType: DocumentType): string {
    switch (docType) {
      case 'api-doc':
        return '-' // API文档使用连字符
      case 'tutorial':
        return '-' // 教程使用连字符
      case 'note':
        return '*' // 笔记使用星号
      default:
        return '-' // 默认使用连字符
    }
  }
}

// 代码块格式化规则
export class CodeBlockRule extends BaseFormattingRule {
  name = 'CodeBlockRule'
  priority = 80

  apply(ast: MarkdownAST, analysis: ContentAnalysis): MarkdownAST {
    ast.walkNodes((node) => {
      if (node.type === 'code_block') {
        this.formatCodeBlock(node)
      }
    })
    return ast
  }

  private formatCodeBlock(node: MarkdownNode): void {
    // 确保代码块前后有空行
    this.addSpacingBefore(node, 1)
    this.addSpacingAfter(node, 1)

    // 自动检测语言
    if (!node.metadata?.language) {
      const detectedLanguage = this.detectLanguage(node.content)
      if (detectedLanguage) {
        node.metadata = { ...node.metadata, language: detectedLanguage }
      }
    }

    // 规范化代码内容
    node.content = this.normalizeCodeContent(node.content)
  }

  private detectLanguage(content: string): string | null {
    const patterns = {
      'javascript': [
        /function\s+\w+\s*\(/,
        /const\s+\w+\s*=/,
        /=>\s*{/,
        /require\s*\(/,
        /import\s+.*from/
      ],
      'typescript': [
        /interface\s+\w+/,
        /type\s+\w+\s*=/,
        /:\s*(string|number|boolean)/,
        /export\s+(interface|type|class)/
      ],
      'python': [
        /def\s+\w+\s*\(/,
        /class\s+\w+/,
        /import\s+\w+/,
        /from\s+\w+\s+import/,
        /if\s+__name__\s*==\s*['""]__main__['""]:/
      ],
      'java': [
        /public\s+(class|interface)/,
        /private\s+\w+/,
        /System\.out\.println/,
        /@Override/
      ],
      'css': [
        /\.[a-zA-Z][\w-]*\s*{/,
        /#[a-zA-Z][\w-]*\s*{/,
        /[a-zA-Z-]+\s*:\s*[^;]+;/
      ],
      'html': [
        /<[a-zA-Z][^>]*>/,
        /<\/[a-zA-Z][^>]*>/,
        /<!DOCTYPE/i
      ]
    }

    for (const [language, langPatterns] of Object.entries(patterns)) {
      const matchCount = langPatterns.filter(pattern => pattern.test(content)).length
      if (matchCount >= 2) {
        return language
      }
    }

    return null
  }

  private normalizeCodeContent(content: string): string {
    // 移除首尾空行
    const lines = content.split('\n')
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift()
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop()
    }
    
    return lines.join('\n')
  }
}

// 表格格式化规则
export class TableFormattingRule extends BaseFormattingRule {
  name = 'TableFormattingRule'
  priority = 70

  apply(ast: MarkdownAST, analysis: ContentAnalysis): MarkdownAST {
    ast.walkNodes((node) => {
      if (node.type === 'table') {
        this.formatTable(node)
      }
    })
    return ast
  }

  private formatTable(node: MarkdownNode): void {
    // 确保表格前后有空行
    this.addSpacingBefore(node, 1)
    this.addSpacingAfter(node, 1)

    // 格式化表格内容
    node.content = this.normalizeTableContent(node.content)
  }

  private normalizeTableContent(content: string): string {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return content

    // 解析表格行
    const rows = lines.map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
    )

    if (rows.length === 0) return content

    // 计算每列的最大宽度
    const maxColumns = Math.max(...rows.map(row => row.length))
    const columnWidths = new Array(maxColumns).fill(0)

    rows.forEach(row => {
      row.forEach((cell, index) => {
        columnWidths[index] = Math.max(columnWidths[index], cell.length)
      })
    })

    // 格式化表格
    const formattedRows = rows.map((row, rowIndex) => {
      const formattedCells = row.map((cell, cellIndex) => 
        cell.padEnd(columnWidths[cellIndex])
      )
      return `| ${formattedCells.join(' | ')} |`
    })

    // 添加分隔符行
    if (formattedRows.length > 1) {
      const separatorCells = columnWidths.map(width => '-'.repeat(width))
      const separator = `| ${separatorCells.join(' | ')} |`
      formattedRows.splice(1, 0, separator)
    }

    return formattedRows.join('\n')
  }
}

// 引用格式化规则
export class BlockquoteRule extends BaseFormattingRule {
  name = 'BlockquoteRule'
  priority = 60

  apply(ast: MarkdownAST, analysis: ContentAnalysis): MarkdownAST {
    ast.walkNodes((node) => {
      if (node.type === 'blockquote') {
        this.formatBlockquote(node)
      }
    })
    return ast
  }

  private formatBlockquote(node: MarkdownNode): void {
    // 确保引用前后有空行
    this.addSpacingBefore(node, 1)
    this.addSpacingAfter(node, 1)

    // 规范化引用内容
    node.content = this.normalizeBlockquoteContent(node.content)
  }

  private normalizeBlockquoteContent(content: string): string {
    const lines = content.split('\n')
    return lines
      .map(line => line.trim().replace(/^>\s*/, '').trim())
      .filter(line => line !== '')
      .join('\n')
  }
}

// 规则化格式器主类
export class RuleBasedFormatter {
  private rules: FormattingRule[] = []
  private config: FormattingConfig

  constructor(config: Partial<FormattingConfig> = {}) {
    this.config = {
      enableIncrementalFormatting: true,
      preserveOriginalStructure: false,
      enableCodeFormatting: true,
      customRules: [],
      ...config
    }

    this.initializeDefaultRules()
  }

  private initializeDefaultRules(): void {
    this.rules = [
      new HeadingSpacingRule(),
      new ListFormattingRule(),
      new CodeBlockRule(),
      new TableFormattingRule(),
      new BlockquoteRule()
    ].sort((a, b) => b.priority - a.priority) // 按优先级排序
  }

  format(ast: MarkdownAST, analysis: ContentAnalysis): string {
    const applicableRules = this.selectRules(analysis.documentType)
    
    let formattedAST = ast
    for (const rule of applicableRules) {
      if (rule.canApply(analysis)) {
        formattedAST = rule.apply(formattedAST, analysis)
      }
    }

    return this.astToString(formattedAST)
  }

  private selectRules(docType: DocumentType): FormattingRule[] {
    const commonRules = this.rules.filter(rule => 
      !this.config.customRules.length || 
      this.config.customRules.includes(rule.name)
    )

    // 根据文档类型添加特定规则
    switch (docType) {
      case 'api-doc':
        return [...commonRules, ...this.getAPIDocRules()]
      case 'tutorial':
        return [...commonRules, ...this.getTutorialRules()]
      default:
        return commonRules
    }
  }

  private getAPIDocRules(): FormattingRule[] {
    // API文档特定规则可以在这里添加
    return []
  }

  private getTutorialRules(): FormattingRule[] {
    // 教程文档特定规则可以在这里添加
    return []
  }

  private astToString(ast: MarkdownAST): string {
    const nodes = ast.getNodes()
    const result: string[] = []

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const spacingBefore = node.metadata?.spacingBefore || 0
      const spacingAfter = node.metadata?.spacingAfter || 0

      // 添加前置空行
      if (spacingBefore > 0 && result.length > 0) {
        result.push(...new Array(spacingBefore).fill(''))
      }

      // 添加节点内容
      result.push(this.nodeToString(node))

      // 添加后置空行
      if (spacingAfter > 0 && i < nodes.length - 1) {
        result.push(...new Array(spacingAfter).fill(''))
      }
    }

    // 清理多余的空行
    return this.cleanupEmptyLines(result.join('\n'))
  }

  private nodeToString(node: MarkdownNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.metadata?.level || 1
        return `${'#'.repeat(level)} ${node.content}`
      
      case 'paragraph':
        return node.content
      
      case 'bullet_list':
      case 'ordered_list':
        return this.listToString(node)
      
      case 'code_block':
        const language = node.metadata?.language || ''
        return `\`\`\`${language}\n${node.content}\n\`\`\``
      
      case 'blockquote':
        return node.content.split('\n').map(line => `> ${line}`).join('\n')
      
      case 'table':
        return node.content
      
      default:
        return node.content
    }
  }

  private listToString(node: MarkdownNode): string {
    if (!node.children) return node.content

    return node.children.map((child, index) => {
      const marker = child.metadata?.marker || '-'
      const level = child.metadata?.level || 0
      const indent = '  '.repeat(level)
      return `${indent}${marker} ${child.content}`
    }).join('\n')
  }

  private cleanupEmptyLines(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // 将连续的3个以上空行替换为2个空行
      .trim() // 移除首尾空行
  }

  addCustomRule(rule: FormattingRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName)
  }
}