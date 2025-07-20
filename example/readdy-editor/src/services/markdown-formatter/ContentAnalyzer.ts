import type { 
  MarkdownAST, 
  MarkdownNode, 
  ContentAnalysis, 
  DocumentType, 
  HeadingStructure, 
  HeadingNode,
  ContentBlock,
  ListStructure,
  ListItem,
  CodeBlock
} from './types'

export class ContentAnalyzer {
  analyze(ast: MarkdownAST): ContentAnalysis {
    return {
      documentType: this.detectDocumentType(ast),
      headingStructure: this.analyzeHeadings(ast),
      contentBlocks: this.classifyBlocks(ast),
      listStructure: this.analyzeLists(ast),
      codeBlocks: this.analyzeCode(ast)
    }
  }

  private detectDocumentType(ast: MarkdownAST): DocumentType {
    const nodes = ast.getNodes()
    const content = nodes.map(node => node.content).join(' ').toLowerCase()

    // API文档特征
    const apiIndicators = [
      /api|endpoint|request|response|参数|返回值|接口/gi,
      /get|post|put|delete|patch/gi,
      /json|xml|http|https|rest/gi,
      /authentication|authorization|token/gi
    ]

    // 教程特征
    const tutorialIndicators = [
      /教程|指南|步骤|安装|配置|使用方法|快速开始|getting started/gi,
      /第一步|第二步|step 1|step 2|首先|然后|最后/gi,
      /如何|怎么|how to|tutorial/gi
    ]

    // 笔记特征
    const noteIndicators = [
      /笔记|notes|记录|总结|summary/gi,
      /要点|重点|关键|important|注意/gi,
      /学习|研究|思考|心得/gi
    ]

    const apiScore = this.calculateMatchScore(content, apiIndicators)
    const tutorialScore = this.calculateMatchScore(content, tutorialIndicators)
    const noteScore = this.calculateMatchScore(content, noteIndicators)

    if (apiScore > tutorialScore && apiScore > noteScore && apiScore > 0) {
      return 'api-doc'
    }
    if (tutorialScore > noteScore && tutorialScore > 0) {
      return 'tutorial'
    }
    if (noteScore > 0) {
      return 'note'
    }

    return 'general'
  }

  private calculateMatchScore(content: string, patterns: RegExp[]): number {
    return patterns.reduce((score, pattern) => {
      const matches = content.match(pattern)
      return score + (matches ? matches.length : 0)
    }, 0)
  }

  private analyzeHeadings(ast: MarkdownAST): HeadingStructure {
    const headingNodes: MarkdownNode[] = []
    const levels: number[] = []
    
    ast.walkNodes((node) => {
      if (node.type === 'heading') {
        headingNodes.push(node)
        levels.push(node.metadata?.level || 1)
      }
    })

    const hierarchy = this.buildHeadingHierarchy(headingNodes)
    const hasProperNesting = this.checkHeadingNesting(levels)

    return {
      levels: [...new Set(levels)].sort(),
      hierarchy,
      hasProperNesting
    }
  }

  private buildHeadingHierarchy(headingNodes: MarkdownNode[]): HeadingNode[] {
    const hierarchy: HeadingNode[] = []
    const stack: HeadingNode[] = []

    for (const node of headingNodes) {
      const level = node.metadata?.level || 1
      const headingNode: HeadingNode = {
        level,
        text: node.content,
        line: node.line,
        children: []
      }

      // 弹出比当前级别高或相等的节点
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop()
      }

      if (stack.length === 0) {
        hierarchy.push(headingNode)
      } else {
        stack[stack.length - 1].children.push(headingNode)
      }

      stack.push(headingNode)
    }

    return hierarchy
  }

  private checkHeadingNesting(levels: number[]): boolean {
    if (levels.length <= 1) return true

    for (let i = 1; i < levels.length; i++) {
      const currentLevel = levels[i]
      const previousLevel = levels[i - 1]
      
      // 检查是否跳级太多（如从 h1 直接到 h4）
      if (currentLevel - previousLevel > 1) {
        return false
      }
    }

    return true
  }

  private classifyBlocks(ast: MarkdownAST): ContentBlock[] {
    const blocks: ContentBlock[] = []

    ast.walkNodes((node) => {
      const block: ContentBlock = {
        type: this.mapNodeTypeToBlockType(node.type),
        content: node.content,
        line: node.line,
        metadata: node.metadata
      }
      blocks.push(block)
    })

    return blocks
  }

  private mapNodeTypeToBlockType(nodeType: string): ContentBlock['type'] {
    switch (nodeType) {
      case 'heading':
        return 'heading'
      case 'bullet_list':
      case 'ordered_list':
        return 'list'
      case 'code_block':
        return 'code'
      case 'table':
        return 'table'
      case 'blockquote':
        return 'blockquote'
      default:
        return 'paragraph'
    }
  }

  private analyzeLists(ast: MarkdownAST): ListStructure {
    const unordered: ListItem[] = []
    const ordered: ListItem[] = []
    let nested = false
    let consistent = true
    const markers = new Set<string>()

    ast.walkNodes((node) => {
      if (node.type === 'bullet_list' || node.type === 'ordered_list') {
        const isOrdered = node.type === 'ordered_list'
        
        if (node.children) {
          for (const child of node.children) {
            if (child.type === 'list_item') {
              const marker = child.metadata?.marker || (isOrdered ? '1.' : '-')
              markers.add(marker)
              
              const listItem: ListItem = {
                content: child.content,
                level: child.metadata?.level || 0,
                line: child.line,
                marker
              }

              if (listItem.level > 0) {
                nested = true
              }

              if (isOrdered) {
                ordered.push(listItem)
              } else {
                unordered.push(listItem)
              }
            }
          }
        }
      }
    })

    // 检查标记一致性
    const unorderedMarkers = new Set<string>()
    const orderedMarkers = new Set<string>()
    
    unordered.forEach(item => {
      if (!item.marker.match(/\d+\./)) {
        unorderedMarkers.add(item.marker)
      }
    })
    
    ordered.forEach(item => {
      if (item.marker.match(/\d+\./)) {
        orderedMarkers.add(item.marker.replace(/\d+/, '1'))
      }
    })

    consistent = unorderedMarkers.size <= 1 && orderedMarkers.size <= 1

    return {
      unordered,
      ordered,
      nested,
      consistent
    }
  }

  private analyzeCode(ast: MarkdownAST): CodeBlock[] {
    const codeBlocks: CodeBlock[] = []

    ast.walkNodes((node) => {
      if (node.type === 'code_block') {
        const codeBlock: CodeBlock = {
          content: node.content,
          language: node.metadata?.language,
          line: node.line,
          isInline: node.metadata?.isInline || false
        }
        codeBlocks.push(codeBlock)
      }
    })

    return codeBlocks
  }

  // 辅助方法：检查文档特定结构
  hasAPIStructure(ast: MarkdownAST): boolean {
    const nodes = ast.getNodes()
    const content = nodes.map(node => node.content).join(' ')
    
    // 检查是否有API相关的结构模式
    const apiPatterns = [
      /endpoints?/i,
      /parameters?.*response/i,
      /request.*response/i,
      /status.*code/i,
      /api.*reference/i
    ]

    return apiPatterns.some(pattern => pattern.test(content))
  }

  hasTutorialStructure(ast: MarkdownAST): boolean {
    const headings = ast.getNodes()
      .filter(node => node.type === 'heading')
      .map(node => node.content.toLowerCase())

    // 检查是否有教程相关的标题模式
    const tutorialPatterns = [
      /安装|installation/,
      /配置|configuration/,
      /开始|getting.*started/,
      /示例|example/,
      /步骤|step/
    ]

    return tutorialPatterns.some(pattern => 
      headings.some(heading => pattern.test(heading))
    )
  }

  hasNoteStructure(ast: MarkdownAST): boolean {
    const nodes = ast.getNodes()
    
    // 检查是否有笔记相关的结构特征
    const noteFeatures = [
      nodes.some(node => node.type === 'blockquote'),
      nodes.some(node => node.type === 'bullet_list'),
      nodes.some(node => node.content.includes('重要') || node.content.includes('注意')),
      nodes.filter(node => node.type === 'heading').length > 2
    ]

    return noteFeatures.filter(Boolean).length >= 2
  }
}