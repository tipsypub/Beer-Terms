import { MarkdownParser } from './MarkdownParser'
import { ContentAnalyzer } from './ContentAnalyzer'
import { RuleBasedFormatter } from './RuleBasedFormatter'
import type { FormattingConfig, ContentAnalysis, MarkdownAST } from './types'

export interface FormatResult {
  formatted: string
  analysis: ContentAnalysis
  originalLength: number
  formattedLength: number
  processingTime: number
}

export class SmartMarkdownFormatter {
  private parser: MarkdownParser
  private analyzer: ContentAnalyzer
  private formatter: RuleBasedFormatter
  private config: FormattingConfig

  constructor(config: Partial<FormattingConfig> = {}) {
    this.config = {
      enableIncrementalFormatting: true,
      preserveOriginalStructure: false,
      enableCodeFormatting: true,
      customRules: [],
      ...config
    }

    this.parser = new MarkdownParser()
    this.analyzer = new ContentAnalyzer()
    this.formatter = new RuleBasedFormatter(this.config)
  }

  async formatDocument(content: string): Promise<FormatResult> {
    const startTime = performance.now()
    
    try {
      // 1. 解析文档结构
      const ast = this.parser.parse(content)
      
      // 2. 分析内容特征
      const analysis = this.analyzer.analyze(ast)
      
      // 3. 应用格式化规则
      const formatted = this.formatter.format(ast, analysis)
      
      const endTime = performance.now()
      
      return {
        formatted,
        analysis,
        originalLength: content.length,
        formattedLength: formatted.length,
        processingTime: endTime - startTime
      }
    } catch (error) {
      console.error('Smart markdown formatting failed:', error)
      throw new Error(`格式化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 快速格式化方法 - 只应用基本规则
  async quickFormat(content: string): Promise<string> {
    try {
      // 使用简化的配置进行快速格式化
      const quickConfig = {
        ...this.config,
        enableIncrementalFormatting: false,
        customRules: ['HeadingSpacingRule', 'ListFormattingRule', 'CodeBlockRule']
      }

      const quickFormatter = new RuleBasedFormatter(quickConfig)
      const ast = this.parser.parse(content)
      const analysis = this.analyzer.analyze(ast)
      
      return quickFormatter.format(ast, analysis)
    } catch (error) {
      console.error('Quick markdown formatting failed:', error)
      return content // 返回原始内容作为fallback
    }
  }

  // 分析文档而不格式化
  async analyzeDocument(content: string): Promise<ContentAnalysis> {
    try {
      const ast = this.parser.parse(content)
      return this.analyzer.analyze(ast)
    } catch (error) {
      console.error('Document analysis failed:', error)
      throw new Error(`文档分析失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 预览格式化结果
  async previewFormatting(content: string): Promise<{
    original: string
    formatted: string
    changes: string[]
    analysis: ContentAnalysis
  }> {
    try {
      const result = await this.formatDocument(content)
      const changes = this.detectChanges(content, result.formatted)
      
      return {
        original: content,
        formatted: result.formatted,
        changes,
        analysis: result.analysis
      }
    } catch (error) {
      console.error('Preview formatting failed:', error)
      throw new Error(`预览格式化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 检测格式化变化
  private detectChanges(original: string, formatted: string): string[] {
    const changes: string[] = []
    
    if (original.length !== formatted.length) {
      changes.push(`内容长度变化: ${original.length} → ${formatted.length}`)
    }

    // 检测标题变化
    const originalHeadings = this.extractHeadings(original)
    const formattedHeadings = this.extractHeadings(formatted)
    
    if (originalHeadings.length !== formattedHeadings.length) {
      changes.push(`标题数量变化: ${originalHeadings.length} → ${formattedHeadings.length}`)
    }

    // 检测列表变化
    const originalLists = this.extractLists(original)
    const formattedLists = this.extractLists(formatted)
    
    if (originalLists.length !== formattedLists.length) {
      changes.push(`列表数量变化: ${originalLists.length} → ${formattedLists.length}`)
    }

    // 检测代码块变化
    const originalCodeBlocks = this.extractCodeBlocks(original)
    const formattedCodeBlocks = this.extractCodeBlocks(formatted)
    
    if (originalCodeBlocks.length !== formattedCodeBlocks.length) {
      changes.push(`代码块数量变化: ${originalCodeBlocks.length} → ${formattedCodeBlocks.length}`)
    }

    // 检测空行变化
    const originalEmptyLines = (original.match(/\n\s*\n/g) || []).length
    const formattedEmptyLines = (formatted.match(/\n\s*\n/g) || []).length
    
    if (originalEmptyLines !== formattedEmptyLines) {
      changes.push(`空行数量变化: ${originalEmptyLines} → ${formattedEmptyLines}`)
    }

    if (changes.length === 0) {
      changes.push('未检测到明显变化')
    }

    return changes
  }

  private extractHeadings(content: string): string[] {
    const matches = content.match(/^#{1,6}\s+.+$/gm)
    return matches || []
  }

  private extractLists(content: string): string[] {
    const matches = content.match(/^\s*[-*+]\s+.+$/gm)
    return matches || []
  }

  private extractCodeBlocks(content: string): string[] {
    const matches = content.match(/```[\s\S]*?```/g)
    return matches || []
  }

  // 验证格式化结果
  validateFormatting(original: string, formatted: string): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 验证是否为有效的 Markdown
      const ast = this.parser.parse(formatted)
      
      // 检查是否有严重的结构问题
      if (ast.getNodes().length === 0) {
        errors.push('格式化结果为空')
      }

      // 检查内容长度变化是否过大
      const lengthDiff = Math.abs(formatted.length - original.length)
      const lengthChangeRatio = lengthDiff / original.length
      
      if (lengthChangeRatio > 0.5) {
        warnings.push(`内容长度变化较大: ${(lengthChangeRatio * 100).toFixed(1)}%`)
      }

      // 检查是否保留了关键内容
      const originalWords = this.extractWords(original)
      const formattedWords = this.extractWords(formatted)
      
      const missingWords = originalWords.filter(word => 
        !formattedWords.includes(word) && word.length > 3
      )

      if (missingWords.length > 0) {
        warnings.push(`可能丢失的内容: ${missingWords.slice(0, 5).join(', ')}`)
      }

    } catch (error) {
      errors.push(`格式化验证失败: ${error instanceof Error ? error.message : String(error)}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private extractWords(content: string): string[] {
    return content
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.toLowerCase())
  }

  // 更新配置
  updateConfig(newConfig: Partial<FormattingConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.formatter = new RuleBasedFormatter(this.config)
  }

  // 获取当前配置
  getConfig(): FormattingConfig {
    return { ...this.config }
  }

  // 重置为默认配置
  resetConfig(): void {
    this.config = {
      enableIncrementalFormatting: true,
      preserveOriginalStructure: false,
      enableCodeFormatting: true,
      customRules: []
    }
    this.formatter = new RuleBasedFormatter(this.config)
  }
}