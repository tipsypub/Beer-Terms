import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// 支持的文件类型
export type SupportedFileType = 'pdf' | 'docx' | 'doc' | 'md' | 'html' | 'txt'

// 文件处理结果接口
export interface FileProcessResult {
  content: string
  fileType: SupportedFileType
  fileName: string
  wordCount: number
  success: boolean
  error?: string
}

class FileProcessor {
  private maxFileSize = 10 * 1024 * 1024 // 10MB限制

  /**
   * 处理上传的文件
   */
  async processFile(file: File): Promise<FileProcessResult> {
    const result: FileProcessResult = {
      content: '',
      fileType: this.getFileType(file.name),
      fileName: file.name,
      wordCount: 0,
      success: false
    }

    try {
      // 检查文件大小
      if (file.size > this.maxFileSize) {
        throw new Error(`文件大小超过限制 (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`)
      }

      // 检查文件类型
      if (!this.isSupportedFile(file.name)) {
        throw new Error('不支持的文件格式')
      }

      // 根据文件类型处理
      result.content = await this.extractTextFromFile(file, result.fileType)
      result.wordCount = this.countWords(result.content)
      result.success = true

      return result
    } catch (error) {
      result.error = error instanceof Error ? error.message : '文件处理失败'
      return result
    }
  }

  /**
   * 从文件中提取文本内容
   */
  private async extractTextFromFile(file: File, fileType: SupportedFileType): Promise<string> {
    switch (fileType) {
      case 'pdf':
        return await this.extractFromPDF(file)
      case 'docx':
      case 'doc':
        return await this.extractFromWord(file)
      case 'md':
        return await this.extractFromMarkdown(file)
      case 'html':
        return await this.extractFromHTML(file)
      case 'txt':
        return await this.extractFromText(file)
      default:
        throw new Error(`不支持的文件类型: ${fileType}`)
    }
  }

  /**
   * PDF文件处理
   */
  private async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // 设置PDF.js worker路径
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''

      // 逐页提取文本
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += pageText + '\n'
      }

      return this.cleanText(fullText)
    } catch (error) {
      console.error('PDF处理失败:', error)
      throw new Error('PDF文件解析失败')
    }
  }

  /**
   * Word文档处理
   */
  private async extractFromWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      
      if (result.messages.length > 0) {
        console.warn('Word文档处理警告:', result.messages)
      }

      return this.cleanText(result.value)
    } catch (error) {
      console.error('Word文档处理失败:', error)
      throw new Error('Word文档解析失败')
    }
  }

  /**
   * Markdown文件处理
   */
  private async extractFromMarkdown(file: File): Promise<string> {
    try {
      const text = await file.text()
      // 简单的Markdown清理：移除标记符号但保留内容
      const cleaned = text
        .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
        .replace(/`(.*?)`/g, '$1') // 移除行内代码标记
        .replace(/```[\s\S]*?```/g, '') // 移除代码块
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接但保留文本
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // 移除图片但保留alt文本

      return this.cleanText(cleaned)
    } catch (error) {
      console.error('Markdown文件处理失败:', error)
      throw new Error('Markdown文件解析失败')
    }
  }

  /**
   * HTML文件处理
   */
  private async extractFromHTML(file: File): Promise<string> {
    try {
      const html = await file.text()
      
      // 创建临时DOM元素来解析HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // 移除script和style元素
      const scripts = doc.querySelectorAll('script, style')
      scripts.forEach(el => el.remove())
      
      // 提取文本内容
      const text = doc.body?.textContent || doc.textContent || ''
      
      return this.cleanText(text)
    } catch (error) {
      console.error('HTML文件处理失败:', error)
      throw new Error('HTML文件解析失败')
    }
  }

  /**
   * 纯文本文件处理
   */
  private async extractFromText(file: File): Promise<string> {
    try {
      const text = await file.text()
      return this.cleanText(text)
    } catch (error) {
      console.error('文本文件处理失败:', error)
      throw new Error('文本文件读取失败')
    }
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/\n\s*\n/g, '\n') // 合并多个换行
      .trim()
  }

  /**
   * 统计词数
   */
  private countWords(text: string): number {
    if (!text.trim()) return 0
    
    // 简单的词数统计（中英文混合）
    const words = text.trim().split(/\s+/)
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
    
    return words.length + chineseChars.length
  }

  /**
   * 获取文件类型
   */
  private getFileType(fileName: string): SupportedFileType {
    const extension = fileName.toLowerCase().split('.').pop()
    
    switch (extension) {
      case 'pdf':
        return 'pdf'
      case 'docx':
        return 'docx'
      case 'doc':
        return 'doc'
      case 'md':
      case 'markdown':
        return 'md'
      case 'html':
      case 'htm':
        return 'html'
      case 'txt':
        return 'txt'
      default:
        return 'txt' // 默认作为文本处理
    }
  }

  /**
   * 检查是否为支持的文件类型
   */
  private isSupportedFile(fileName: string): boolean {
    const supportedExtensions = ['pdf', 'docx', 'doc', 'md', 'markdown', 'html', 'htm', 'txt']
    const extension = fileName.toLowerCase().split('.').pop()
    return supportedExtensions.includes(extension || '')
  }

  /**
   * 获取支持的文件类型列表
   */
  getSupportedFileTypes(): string[] {
    return ['.pdf', '.docx', '.doc', '.md', '.html', '.txt']
  }

  /**
   * 获取文件大小限制（MB）
   */
  getMaxFileSizeMB(): number {
    return Math.round(this.maxFileSize / 1024 / 1024)
  }

  /**
   * 验证文件
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: '请选择文件' }
    }

    if (file.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `文件大小超过限制 (${this.getMaxFileSizeMB()}MB)` 
      }
    }

    if (!this.isSupportedFile(file.name)) {
      return { 
        valid: false, 
        error: `不支持的文件格式，支持: ${this.getSupportedFileTypes().join(', ')}` 
      }
    }

    return { valid: true }
  }
}

// 导出单例实例
export const fileProcessor = new FileProcessor()

// 导出类型和服务
export { FileProcessor }
export default fileProcessor