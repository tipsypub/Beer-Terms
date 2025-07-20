// 智能Markdown排版器类型定义

// 文档类型
export type DocumentType = 'api-doc' | 'tutorial' | 'note' | 'general'

// 内容分析结果
export interface ContentAnalysis {
  documentType: DocumentType
  headingStructure: HeadingStructure
  contentBlocks: ContentBlock[]
  listStructure: ListStructure
  codeBlocks: CodeBlock[]
}

// 标题结构
export interface HeadingStructure {
  levels: number[]
  hierarchy: HeadingNode[]
  hasProperNesting: boolean
}

// 标题节点
export interface HeadingNode {
  level: number
  text: string
  line: number
  children: HeadingNode[]
}

// 内容块
export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'table' | 'blockquote'
  content: string
  line: number
  metadata?: Record<string, any>
}

// 列表结构
export interface ListStructure {
  unordered: ListItem[]
  ordered: ListItem[]
  nested: boolean
  consistent: boolean
}

// 列表项
export interface ListItem {
  content: string
  level: number
  line: number
  marker: string
}

// 代码块
export interface CodeBlock {
  content: string
  language?: string
  line: number
  isInline: boolean
}

// Markdown AST节点
export interface MarkdownNode {
  type: string
  content: string
  line: number
  children?: MarkdownNode[]
  metadata?: Record<string, any>
}

// Markdown AST
export interface MarkdownAST {
  nodes: MarkdownNode[]
  addNode(node: MarkdownNode): void
  getNodes(): MarkdownNode[]
  getNodeByPosition(position: number): MarkdownNode | null
  walkNodes(callback: (node: MarkdownNode, index?: number, siblings?: MarkdownNode[]) => void): void
  toString(): string
}

// 格式化规则接口
export interface FormattingRule {
  name: string
  priority: number
  apply(ast: MarkdownAST, analysis: ContentAnalysis): MarkdownAST
  canApply(analysis: ContentAnalysis): boolean
}

// 变更检测
export interface Change {
  type: 'added' | 'removed' | 'modified'
  position: number
  content: string
  oldContent?: string
}

// 格式化配置
export interface FormattingConfig {
  enableIncrementalFormatting: boolean
  preserveOriginalStructure: boolean
  enableCodeFormatting: boolean
  customRules: string[]
  documentTypeOverride?: DocumentType
}