import MarkdownIt from 'markdown-it'
import type { MarkdownAST, MarkdownNode } from './types'

// 实现 MarkdownAST 类
class MarkdownASTImpl implements MarkdownAST {
  public nodes: MarkdownNode[] = []

  addNode(node: MarkdownNode): void {
    this.nodes.push(node)
  }

  getNodes(): MarkdownNode[] {
    return this.nodes
  }

  getNodeByPosition(position: number): MarkdownNode | null {
    return this.nodes.find(node => node.line === position) || null
  }

  walkNodes(callback: (node: MarkdownNode, index?: number, siblings?: MarkdownNode[]) => void): void {
    const walk = (nodes: MarkdownNode[]) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        callback(node, i, nodes)
        if (node.children) {
          walk(node.children)
        }
      }
    }
    walk(this.nodes)
  }

  toString(): string {
    return this.nodes.map(node => this.nodeToString(node)).join('\n')
  }

  private nodeToString(node: MarkdownNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.metadata?.level || 1
        return `${'#'.repeat(level)} ${node.content}`
      case 'paragraph':
        return node.content
      case 'list_item':
        const marker = node.metadata?.marker || '-'
        const indent = '  '.repeat((node.metadata?.level || 0))
        return `${indent}${marker} ${node.content}`
      case 'code_block':
        const language = node.metadata?.language || ''
        return `\`\`\`${language}\n${node.content}\n\`\`\``
      case 'blockquote':
        return `> ${node.content}`
      case 'table':
        return node.content // 表格内容已经格式化
      default:
        return node.content
    }
  }
}

// Markdown解析器
export class MarkdownParser {
  private md: MarkdownIt

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: false
    })
  }

  parse(content: string): MarkdownAST {
    const tokens = this.md.parse(content, {})
    return this.buildAST(tokens, content)
  }

  private buildAST(tokens: any[], content: string): MarkdownAST {
    const ast = new MarkdownASTImpl()
    const lines = content.split('\n')
    let currentLine = 0

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const node = this.createNode(token, tokens, i, lines, currentLine)
      
      if (node) {
        ast.addNode(node)
        currentLine = node.line + this.getNodeLineSpan(node)
      }
    }

    return ast
  }

  private createNode(
    token: any, 
    tokens: any[], 
    index: number, 
    lines: string[], 
    currentLine: number
  ): MarkdownNode | null {
    const line = this.findTokenLine(token, lines, currentLine)

    switch (token.type) {
      case 'heading_open':
        return this.createHeadingNode(token, tokens, index, line)
      
      case 'paragraph_open':
        return this.createParagraphNode(token, tokens, index, line)
      
      case 'bullet_list_open':
      case 'ordered_list_open':
        return this.createListNode(token, tokens, index, line)
      
      case 'code_block':
      case 'fence':
        return this.createCodeBlockNode(token, line)
      
      case 'blockquote_open':
        return this.createBlockquoteNode(token, tokens, index, line)
      
      case 'table_open':
        return this.createTableNode(token, tokens, index, line)
      
      default:
        return null
    }
  }

  private createHeadingNode(token: any, tokens: any[], index: number, line: number): MarkdownNode {
    const level = parseInt(token.tag.slice(1)) // h1 -> 1, h2 -> 2, etc.
    const contentToken = tokens[index + 1]
    const content = contentToken?.content || ''

    return {
      type: 'heading',
      content,
      line,
      metadata: { level }
    }
  }

  private createParagraphNode(token: any, tokens: any[], index: number, line: number): MarkdownNode {
    const contentToken = tokens[index + 1]
    const content = contentToken?.content || ''

    return {
      type: 'paragraph',
      content,
      line
    }
  }

  private createListNode(token: any, tokens: any[], index: number, line: number): MarkdownNode {
    const isOrdered = token.type === 'ordered_list_open'
    const items: MarkdownNode[] = []
    let i = index + 1

    while (i < tokens.length && tokens[i].type !== `${isOrdered ? 'ordered' : 'bullet'}_list_close`) {
      if (tokens[i].type === 'list_item_open') {
        const itemContent = this.extractListItemContent(tokens, i)
        items.push({
          type: 'list_item',
          content: itemContent,
          line: line + items.length,
          metadata: { 
            marker: isOrdered ? '1.' : '-',
            level: token.level || 0
          }
        })
      }
      i++
    }

    return {
      type: isOrdered ? 'ordered_list' : 'bullet_list',
      content: items.map(item => item.content).join('\n'),
      line,
      children: items,
      metadata: { isOrdered }
    }
  }

  private createCodeBlockNode(token: any, line: number): MarkdownNode {
    return {
      type: 'code_block',
      content: token.content || '',
      line,
      metadata: { 
        language: token.info || '',
        isInline: false
      }
    }
  }

  private createBlockquoteNode(token: any, tokens: any[], index: number, line: number): MarkdownNode {
    const content = this.extractBlockquoteContent(tokens, index)
    
    return {
      type: 'blockquote',
      content,
      line
    }
  }

  private createTableNode(token: any, tokens: any[], index: number, line: number): MarkdownNode {
    const content = this.extractTableContent(tokens, index)
    
    return {
      type: 'table',
      content,
      line
    }
  }

  private extractListItemContent(tokens: any[], startIndex: number): string {
    let content = ''
    let i = startIndex + 1

    while (i < tokens.length && tokens[i].type !== 'list_item_close') {
      if (tokens[i].type === 'paragraph_open') {
        const textToken = tokens[i + 1]
        if (textToken && textToken.type === 'inline') {
          content += textToken.content
        }
        i += 2 // Skip paragraph_open and inline tokens
      } else if (tokens[i].type === 'inline') {
        content += tokens[i].content
      }
      i++
    }

    return content.trim()
  }

  private extractBlockquoteContent(tokens: any[], startIndex: number): string {
    let content = ''
    let i = startIndex + 1

    while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
      if (tokens[i].type === 'paragraph_open') {
        const textToken = tokens[i + 1]
        if (textToken && textToken.type === 'inline') {
          content += textToken.content
        }
        i += 2
      } else if (tokens[i].type === 'inline') {
        content += tokens[i].content
      }
      i++
    }

    return content.trim()
  }

  private extractTableContent(tokens: any[], startIndex: number): string {
    let content = ''
    let i = startIndex + 1

    while (i < tokens.length && tokens[i].type !== 'table_close') {
      if (tokens[i].type === 'inline') {
        content += tokens[i].content
      }
      i++
    }

    return content.trim()
  }

  private findTokenLine(token: any, lines: string[], currentLine: number): number {
    if (token.map && token.map[0] !== undefined) {
      return token.map[0]
    }
    return currentLine
  }

  private getNodeLineSpan(node: MarkdownNode): number {
    const contentLines = node.content.split('\n').length
    return Math.max(1, contentLines)
  }
}