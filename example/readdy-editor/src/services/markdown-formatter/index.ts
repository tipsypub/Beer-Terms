// 智能Markdown格式化器入口文件

import { SmartMarkdownFormatter } from './SmartMarkdownFormatter'
import type { FormattingConfig } from './types'
export { SmartMarkdownFormatter }
export { MarkdownParser } from './MarkdownParser'
export { ContentAnalyzer } from './ContentAnalyzer'
export { 
  RuleBasedFormatter,
  BaseFormattingRule,
  HeadingSpacingRule,
  ListFormattingRule,
  CodeBlockRule,
  TableFormattingRule,
  BlockquoteRule
} from './RuleBasedFormatter'

export type {
  DocumentType,
  ContentAnalysis,
  HeadingStructure,
  HeadingNode,
  ContentBlock,
  ListStructure,
  ListItem,
  CodeBlock,
  MarkdownNode,
  MarkdownAST,
  FormattingRule,
  Change,
  FormattingConfig
} from './types'

export type { FormatResult } from './SmartMarkdownFormatter'

// 创建默认实例
export const createSmartFormatter = (config?: Partial<FormattingConfig>) => {
  return new SmartMarkdownFormatter(config)
}

// 便捷方法
export const formatMarkdown = async (content: string, config?: Partial<FormattingConfig>) => {
  const formatter = new SmartMarkdownFormatter(config)
  const result = await formatter.formatDocument(content)
  return result.formatted
}

export const quickFormatMarkdown = async (content: string) => {
  const formatter = new SmartMarkdownFormatter()
  return await formatter.quickFormat(content)
}

export const analyzeMarkdown = async (content: string) => {
  const formatter = new SmartMarkdownFormatter()
  return await formatter.analyzeDocument(content)
}