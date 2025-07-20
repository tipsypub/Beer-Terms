// 文件导出服务

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

export type ExportFormat = 'md' | 'html' | 'pdf' | 'docx' | 'txt'

export interface ExportOptions {
  format: ExportFormat
  fileName?: string
  includeMetadata?: boolean
  customStyles?: string
  pageSize?: 'A4' | 'Letter' | 'A3'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export interface ExportResult {
  success: boolean
  fileName?: string
  data?: Blob | string
  error?: string
}

export class FileExportService {
  private md: MarkdownIt

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code class="hljs language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`
          } catch (__) {}
        }
        return `<pre class="hljs"><code>${this.md.utils.escapeHtml(str)}</code></pre>`
      }
    })
  }

  // 导出文件的主方法
  async exportFile(content: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const fileName = this.generateFileName(options.fileName, options.format)
      
      switch (options.format) {
        case 'md':
          return this.exportMarkdown(content, fileName, options)
        case 'html':
          return this.exportHTML(content, fileName, options)
        case 'pdf':
          return this.exportPDF(content, fileName, options)
        case 'docx':
          return this.exportDOCX(content, fileName, options)
        case 'txt':
          return this.exportText(content, fileName, options)
        default:
          return {
            success: false,
            error: `不支持的导出格式: ${options.format}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败'
      }
    }
  }

  // 导出Markdown格式
  private async exportMarkdown(content: string, fileName: string, options: ExportOptions): Promise<ExportResult> {
    let exportContent = content

    if (options.includeMetadata) {
      const metadata = this.generateMetadata()
      exportContent = `${metadata}\n\n${content}`
    }

    const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8' })
    this.downloadBlob(blob, fileName)

    return {
      success: true,
      fileName,
      data: blob
    }
  }

  // 导出HTML格式
  private async exportHTML(content: string, fileName: string, options: ExportOptions): Promise<ExportResult> {
    const htmlContent = this.md.render(content)
    const fullHTML = this.generateHTMLDocument(htmlContent, options)

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
    this.downloadBlob(blob, fileName)

    return {
      success: true,
      fileName,
      data: blob
    }
  }

  // 导出PDF格式 (使用浏览器打印功能)
  private async exportPDF(content: string, fileName: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const htmlContent = this.md.render(content)
      const printHTML = this.generatePrintHTML(htmlContent, options)
      
      // 创建新窗口进行打印
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('无法打开打印窗口，请检查浏览器弹窗设置')
      }

      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // 等待内容加载完成后打印
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      return {
        success: true,
        fileName: fileName.replace('.pdf', '.html'), // 实际生成的是可打印的HTML
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF导出失败'
      }
    }
  }

  // 导出DOCX格式 (转换为富文本HTML)
  private async exportDOCX(content: string, fileName: string, options: ExportOptions): Promise<ExportResult> {
    try {
      const htmlContent = this.md.render(content)
      const docHTML = this.generateDocumentHTML(htmlContent, options)
      
      // 创建Word兼容的HTML文档
      const wordHTML = `
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <title>${fileName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>90</w:Zoom>
      <w:DoNotPromptForConvert/>
      <w:DoNotShowRevisions/>
      <w:DoNotPrintRevisions/>
      <w:DoNotShowComments/>
      <w:DoNotShowInsertionsAndDeletions/>
      <w:DoNotShowPropertyChanges/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; }
    h1 { font-size: 18pt; font-weight: bold; margin: 12pt 0; }
    h2 { font-size: 16pt; font-weight: bold; margin: 10pt 0; }
    h3 { font-size: 14pt; font-weight: bold; margin: 8pt 0; }
    p { margin: 6pt 0; }
    pre { background: #f5f5f5; padding: 8pt; margin: 6pt 0; font-family: 'Courier New', monospace; }
    code { background: #f5f5f5; padding: 2pt; font-family: 'Courier New', monospace; }
    blockquote { margin: 6pt 20pt; padding-left: 10pt; border-left: 3pt solid #ccc; }
    table { border-collapse: collapse; width: 100%; margin: 6pt 0; }
    th, td { border: 1pt solid #000; padding: 4pt; }
    th { background: #f0f0f0; font-weight: bold; }
  </style>
</head>
<body>
${docHTML}
</body>
</html>`

      const blob = new Blob([wordHTML], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      this.downloadBlob(blob, fileName.replace('.docx', '.doc'))

      return {
        success: true,
        fileName: fileName.replace('.docx', '.doc'),
        data: blob
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DOCX导出失败'
      }
    }
  }

  // 导出纯文本格式
  private async exportText(content: string, fileName: string, options: ExportOptions): Promise<ExportResult> {
    // 将Markdown转换为纯文本
    const plainText = this.markdownToPlainText(content)
    
    let exportContent = plainText
    if (options.includeMetadata) {
      const metadata = this.generateTextMetadata()
      exportContent = `${metadata}\n\n${plainText}`
    }

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' })
    this.downloadBlob(blob, fileName)

    return {
      success: true,
      fileName,
      data: blob
    }
  }

  // 生成文件名
  private generateFileName(customName?: string, format: ExportFormat = 'md'): string {
    if (customName) {
      return customName.includes('.') ? customName : `${customName}.${format}`
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    return `document-${timestamp}.${format}`
  }

  // 生成HTML文档
  private generateHTMLDocument(content: string, options: ExportOptions): string {
    const styles = this.getHTMLStyles(options)
    const metadata = options.includeMetadata ? this.generateHTMLMetadata() : ''
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>导出文档</title>
  <style>${styles}</style>
  ${options.customStyles ? `<style>${options.customStyles}</style>` : ''}
</head>
<body>
  ${metadata}
  <div class="content">
    ${content}
  </div>
</body>
</html>`
  }

  // 生成打印专用HTML
  private generatePrintHTML(content: string, options: ExportOptions): string {
    const printStyles = this.getPrintStyles(options)
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>打印文档</title>
  <style>
    ${printStyles}
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-content">
    ${content}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.close();
      }, 1000);
    }
  </script>
</body>
</html>`
  }

  // 生成Word兼容HTML
  private generateDocumentHTML(content: string, options: ExportOptions): string {
    // 清理HTML，使其更兼容Word
    return content
      .replace(/<pre[^>]*><code[^>]*>/g, '<pre>')
      .replace(/<\/code><\/pre>/g, '</pre>')
      .replace(/<code[^>]*>/g, '<span style="font-family: Courier New; background: #f5f5f5; padding: 2pt;">')
      .replace(/<\/code>/g, '</span>')
  }

  // 获取HTML样式
  private getHTMLStyles(options: ExportOptions): string {
    return `
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: #fff;
      }
      .content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.25;
      }
      h1 { font-size: 2em; color: #1a1a1a; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
      h2 { font-size: 1.5em; color: #2a2a2a; }
      h3 { font-size: 1.25em; color: #3a3a3a; }
      p { margin-bottom: 1em; }
      pre {
        background: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 85%;
        line-height: 1.45;
      }
      code {
        background: #f6f8fa;
        border-radius: 3px;
        font-size: 85%;
        margin: 0;
        padding: 0.2em 0.4em;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      }
      pre code {
        background: transparent;
        border: none;
        padding: 0;
      }
      blockquote {
        margin: 0 0 1em 0;
        padding: 0 1em;
        color: #6a737d;
        border-left: 4px solid #dfe2e5;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid #dfe2e5;
        padding: 6px 13px;
        text-align: left;
      }
      th {
        background: #f6f8fa;
        font-weight: 600;
      }
      ul, ol {
        margin: 0 0 1em 0;
        padding-left: 2em;
      }
      li {
        margin-bottom: 0.5em;
      }
      a {
        color: #0366d6;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      .metadata {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 1rem;
        margin-bottom: 2rem;
        font-size: 0.9em;
        color: #6c757d;
      }
    `
  }

  // 获取打印样式
  private getPrintStyles(options: ExportOptions): string {
    const margins = options.margins || { top: 20, bottom: 20, left: 20, right: 20 }
    const pageSize = options.pageSize || 'A4'
    const orientation = options.orientation || 'portrait'
    
    return `
      @page {
        size: ${pageSize} ${orientation};
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
      }
      .print-content {
        width: 100%;
      }
      h1, h2, h3, h4, h5, h6 {
        break-after: avoid;
        margin-top: 1em;
        margin-bottom: 0.5em;
      }
      h1 { font-size: 18pt; }
      h2 { font-size: 16pt; }
      h3 { font-size: 14pt; }
      h4 { font-size: 12pt; }
      p { margin-bottom: 0.5em; }
      pre, code {
        font-family: 'Courier New', monospace;
        font-size: 10pt;
      }
      pre {
        break-inside: avoid;
        background: #f5f5f5;
        border: 1pt solid #ccc;
        padding: 8pt;
        margin: 6pt 0;
      }
      table {
        break-inside: avoid;
        border-collapse: collapse;
        width: 100%;
        margin: 6pt 0;
      }
      th, td {
        border: 1pt solid #000;
        padding: 4pt;
        font-size: 10pt;
      }
      th {
        background: #f0f0f0;
      }
      blockquote {
        margin: 6pt 20pt;
        padding-left: 10pt;
        border-left: 3pt solid #ccc;
      }
      img {
        max-width: 100%;
        break-inside: avoid;
      }
    `
  }

  // 生成元数据
  private generateMetadata(): string {
    const now = new Date()
    return `---
title: 导出文档
author: Readdy Editor
date: ${now.toISOString().split('T')[0]}
created: ${now.toISOString()}
---`
  }

  // 生成HTML元数据
  private generateHTMLMetadata(): string {
    const now = new Date()
    return `
<div class="metadata">
  <h4>文档信息</h4>
  <p><strong>导出时间:</strong> ${now.toLocaleString('zh-CN')}</p>
  <p><strong>生成工具:</strong> Readdy Editor</p>
</div>`
  }

  // 生成文本元数据
  private generateTextMetadata(): string {
    const now = new Date()
    return `文档信息
导出时间: ${now.toLocaleString('zh-CN')}
生成工具: Readdy Editor
${'='.repeat(50)}`
  }

  // Markdown转纯文本
  private markdownToPlainText(markdown: string): string {
    return markdown
      .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体
      .replace(/\*([^*]+)\*/g, '$1') // 移除斜体
      .replace(/~~([^~]+)~~/g, '$1') // 移除删除线
      .replace(/`([^`]+)`/g, '$1') // 移除行内代码
      .replace(/```[\s\S]*?```/g, (match) => {
        // 保留代码块内容，移除标记
        return match.replace(/```(\w+)?\n?/g, '').replace(/```$/g, '')
      })
      .replace(/^\s*[-*+]\s+/gm, '• ') // 转换无序列表
      .replace(/^\s*\d+\.\s+/gm, '• ') // 转换有序列表
      .replace(/^\s*>\s*/gm, '> ') // 保持引用格式
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片: $1]') // 转换图片
      .replace(/\n{3,}/g, '\n\n') // 清理多余空行
      .trim()
  }

  // 下载Blob文件
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 获取支持的导出格式
  getSupportedFormats(): Array<{
    value: ExportFormat
    label: string
    description: string
    icon: string
  }> {
    return [
      {
        value: 'md',
        label: 'Markdown',
        description: '保持原始Markdown格式',
        icon: 'ri-markdown-line'
      },
      {
        value: 'html',
        label: 'HTML',
        description: '网页格式，支持样式',
        icon: 'ri-html5-line'
      },
      {
        value: 'pdf',
        label: 'PDF',
        description: '可打印的PDF文档',
        icon: 'ri-file-pdf-line'
      },
      {
        value: 'docx',
        label: 'Word文档',
        description: 'Microsoft Word兼容格式',
        icon: 'ri-file-word-line'
      },
      {
        value: 'txt',
        label: '纯文本',
        description: '去除格式的纯文本',
        icon: 'ri-file-text-line'
      }
    ]
  }
}