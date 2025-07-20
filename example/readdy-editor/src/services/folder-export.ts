// 文件夹批量导出服务

import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import type { FileEntry } from '@/types'

export interface FolderExportOptions {
  title: string
  fileName: string
  folderName: string
  includeMetadata: boolean
  showToc: boolean
  showSearch: boolean
  collapsible: boolean
}

export interface FolderExportResult {
  success: boolean
  fileName?: string
  data?: Blob
  error?: string
}

export interface DocumentSection {
  id: string
  title: string
  fileName: string
  content: string
  htmlContent: string
  level: number
  children: DocumentSection[]
}

export class FolderExportService {
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

  // 导出文件夹为HTML文档
  async exportToHTML(files: FileEntry[], options: FolderExportOptions): Promise<FolderExportResult> {
    try {
      // 1. 处理和排序文件
      const processedFiles = this.processFiles(files)
      
      // 2. 生成文档结构
      const documentSections = this.generateDocumentStructure(processedFiles)
      
      // 3. 生成目录
      const tableOfContents = this.generateTableOfContents(documentSections, options)
      
      // 4. 生成完整HTML
      const fullHTML = this.generateCompleteHTML(documentSections, tableOfContents, options)
      
      // 5. 创建并下载文件
      const fileName = this.generateFileName(options.fileName)
      const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
      this.downloadBlob(blob, fileName)

      return {
        success: true,
        fileName,
        data: blob
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败'
      }
    }
  }

  // 处理文件列表，排序和预处理
  private processFiles(files: FileEntry[]): FileEntry[] {
    return files
      .filter(file => this.isMarkdownFile(file))
      .sort((a, b) => {
        // 按文件名排序，README 和 index 文件优先
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        
        if (aName.includes('readme') || aName.includes('index')) return -1
        if (bName.includes('readme') || bName.includes('index')) return 1
        
        return aName.localeCompare(bName)
      })
  }

  // 生成文档结构
  private generateDocumentStructure(files: FileEntry[]): DocumentSection[] {
    const sections: DocumentSection[] = []

    files.forEach((file, index) => {
      const htmlContent = this.md.render(file.content || '')
      const title = this.extractTitleFromContent(file.content || '') || 
                   this.formatFileName(file.name)

      const section: DocumentSection = {
        id: `section-${index}`,
        title,
        fileName: file.name,
        content: file.content || '',
        htmlContent: this.processHTMLContent(htmlContent, `section-${index}`),
        level: this.determineLevel(file.name),
        children: []
      }

      sections.push(section)
    })

    return this.buildHierarchy(sections)
  }

  // 构建层次结构
  private buildHierarchy(sections: DocumentSection[]): DocumentSection[] {
    // 简单的平铺结构，可以根据需要实现更复杂的层次关系
    return sections
  }

  // 从内容中提取标题
  private extractTitleFromContent(content: string): string | null {
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('# ')) {
        return trimmedLine.substring(2).trim()
      }
    }
    return null
  }

  // 格式化文件名为标题
  private formatFileName(fileName: string): string {
    return fileName
      .replace(/\.(md|markdown)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  // 确定文档层级
  private determineLevel(fileName: string): number {
    const name = fileName.toLowerCase()
    if (name.includes('readme') || name.includes('index')) return 1
    if (name.includes('getting-started') || name.includes('overview')) return 2
    return 3
  }

  // 处理HTML内容，添加锚点等
  private processHTMLContent(html: string, sectionId: string): string {
    // 为标题添加锚点
    return html.replace(
      /<h([1-6])([^>]*)>(.*?)<\/h[1-6]>/g,
      (match, level, attrs, content) => {
        const anchorId = this.generateAnchorId(content)
        return `<h${level} id="${anchorId}"${attrs}>${content}</h${level}>`
      }
    )
  }

  // 生成锚点ID
  private generateAnchorId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // 生成目录
  private generateTableOfContents(sections: DocumentSection[], options: FolderExportOptions): string {
    if (!options.showToc) return ''

    let toc = '<nav class="toc">\n'
    
    if (options.showSearch) {
      toc += `
        <div class="search-container">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="搜索文档..." 
            class="search-input"
          />
          <i class="ri-search-line search-icon"></i>
        </div>
      `
    }

    toc += '<ul class="toc-list">\n'
    
    sections.forEach(section => {
      const collapseClass = options.collapsible ? 'collapsible' : ''
      toc += `
        <li class="toc-item ${collapseClass}">
          <a href="#${section.id}" class="toc-link" data-section="${section.id}">
            <i class="ri-file-text-line toc-icon"></i>
            <span class="toc-title">${section.title}</span>
          </a>
        </li>
      `
    })
    
    toc += '</ul>\n</nav>'
    
    return toc
  }

  // 生成完整HTML文档
  private generateCompleteHTML(
    sections: DocumentSection[], 
    tableOfContents: string, 
    options: FolderExportOptions
  ): string {
    const styles = this.generateStyles(options)
    const scripts = this.generateScripts(options)
    const metadata = options.includeMetadata ? this.generateMetadata(options) : ''

    const content = sections.map(section => `
      <section id="${section.id}" class="document-section" data-file="${section.fileName}">
        <div class="section-header">
          <h1 class="section-title">${section.title}</h1>
          <div class="section-meta">
            <span class="file-name">${section.fileName}</span>
          </div>
        </div>
        <div class="section-content">
          ${section.htmlContent}
        </div>
      </section>
    `).join('\n')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css">
  <style>${styles}</style>
</head>
<body>
  <div class="documentation-container">
    <!-- 顶部导航 -->
    <header class="doc-header">
      <div class="header-content">
        <h1 class="doc-title">${options.title}</h1>
        <div class="header-actions">
          <button id="toggleSidebar" class="btn-icon" title="切换侧边栏">
            <i class="ri-menu-line"></i>
          </button>
          <button id="toggleTheme" class="btn-icon" title="切换主题">
            <i class="ri-moon-line"></i>
          </button>
        </div>
      </div>
    </header>

    <div class="doc-layout">
      <!-- 左侧导航 -->
      <aside class="doc-sidebar" id="sidebar">
        ${tableOfContents}
      </aside>

      <!-- 主要内容 -->
      <main class="doc-content">
        ${metadata}
        ${content}
      </main>
    </div>
  </div>

  <script>${scripts}</script>
</body>
</html>`
  }

  // 生成样式
  private generateStyles(options: FolderExportOptions): string {
    return `
      :root {
        --primary-color: #3b82f6;
        --text-color: #1f2937;
        --text-secondary: #6b7280;
        --bg-color: #ffffff;
        --bg-secondary: #f9fafb;
        --border-color: #e5e7eb;
        --sidebar-width: 280px;
        --header-height: 60px;
      }

      [data-theme="dark"] {
        --text-color: #f9fafb;
        --text-secondary: #d1d5db;
        --bg-color: #111827;
        --bg-secondary: #1f2937;
        --border-color: #374151;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background: var(--bg-color);
      }

      .documentation-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
      }

      /* 头部样式 */
      .doc-header {
        height: var(--header-height);
        background: var(--bg-color);
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        padding: 0 1.5rem;
      }

      .doc-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-color);
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn-icon {
        padding: 0.5rem;
        border: none;
        background: none;
        color: var(--text-secondary);
        cursor: pointer;
        border-radius: 0.375rem;
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: var(--bg-secondary);
        color: var(--text-color);
      }

      /* 布局 */
      .doc-layout {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      /* 侧边栏 */
      .doc-sidebar {
        width: var(--sidebar-width);
        background: var(--bg-secondary);
        border-right: 1px solid var(--border-color);
        overflow-y: auto;
        transition: transform 0.3s ease;
      }

      .doc-sidebar.hidden {
        transform: translateX(-100%);
      }

      /* 搜索 */
      .search-container {
        position: relative;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .search-input {
        width: 100%;
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        background: var(--bg-color);
        color: var(--text-color);
        font-size: 0.875rem;
      }

      .search-icon {
        position: absolute;
        right: 1.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        pointer-events: none;
      }

      /* 目录 */
      .toc {
        padding: 1rem 0;
      }

      .toc-list {
        list-style: none;
      }

      .toc-item {
        margin: 0.25rem 0;
      }

      .toc-link {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        color: var(--text-secondary);
        text-decoration: none;
        border-radius: 0.375rem;
        margin: 0 0.5rem;
        transition: all 0.2s;
      }

      .toc-link:hover,
      .toc-link.active {
        background: var(--primary-color);
        color: white;
      }

      .toc-icon {
        margin-right: 0.5rem;
        font-size: 1rem;
      }

      .toc-title {
        font-size: 0.875rem;
        font-weight: 500;
      }

      /* 主要内容 */
      .doc-content {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
      }

      /* 文档节 */
      .document-section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--border-color);
      }

      .document-section:last-child {
        border-bottom: none;
      }

      .section-header {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .section-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--text-color);
        margin-bottom: 0.5rem;
      }

      .section-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .file-name {
        font-size: 0.875rem;
        color: var(--text-secondary);
        background: var(--bg-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Consolas', monospace;
      }

      /* Markdown 内容样式 */
      .section-content h1,
      .section-content h2,
      .section-content h3,
      .section-content h4,
      .section-content h5,
      .section-content h6 {
        margin: 1.5rem 0 0.75rem 0;
        font-weight: 600;
        line-height: 1.25;
        color: var(--text-color);
      }

      .section-content h1 { font-size: 1.5rem; }
      .section-content h2 { font-size: 1.25rem; }
      .section-content h3 { font-size: 1.125rem; }
      .section-content h4 { font-size: 1rem; }

      .section-content p {
        margin: 0.75rem 0;
        line-height: 1.7;
      }

      .section-content pre {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1rem;
        overflow-x: auto;
        margin: 1rem 0;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 0.875rem;
      }

      .section-content code {
        background: var(--bg-secondary);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 0.875rem;
      }

      .section-content pre code {
        background: none;
        padding: 0;
        border-radius: 0;
      }

      .section-content blockquote {
        border-left: 4px solid var(--primary-color);
        padding-left: 1rem;
        margin: 1rem 0;
        color: var(--text-secondary);
        font-style: italic;
      }

      .section-content ul,
      .section-content ol {
        margin: 0.75rem 0;
        padding-left: 1.5rem;
      }

      .section-content li {
        margin: 0.25rem 0;
      }

      .section-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
      }

      .section-content th,
      .section-content td {
        border: 1px solid var(--border-color);
        padding: 0.5rem;
        text-align: left;
      }

      .section-content th {
        background: var(--bg-secondary);
        font-weight: 600;
      }

      .section-content a {
        color: var(--primary-color);
        text-decoration: none;
      }

      .section-content a:hover {
        text-decoration: underline;
      }

      .section-content img {
        max-width: 100%;
        height: auto;
        margin: 1rem 0;
        border-radius: 0.5rem;
      }

      /* 元数据 */
      .document-metadata {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 2rem;
      }

      .metadata-title {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--text-color);
      }

      .metadata-item {
        display: flex;
        gap: 0.5rem;
        margin: 0.25rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      /* 响应式 */
      @media (max-width: 768px) {
        .doc-sidebar {
          position: fixed;
          top: var(--header-height);
          left: 0;
          height: calc(100vh - var(--header-height));
          z-index: 50;
          transform: translateX(-100%);
        }

        .doc-sidebar.visible {
          transform: translateX(0);
        }

        .doc-content {
          padding: 1rem;
        }

        .section-title {
          font-size: 1.5rem;
        }
      }

      /* 高亮样式 */
      .search-highlight {
        background: yellow;
        padding: 0.125rem 0;
      }
    `
  }

  // 生成脚本
  private generateScripts(options: FolderExportOptions): string {
    return `
      // 主题切换
      const themeToggle = document.getElementById('toggleTheme');
      const body = document.body;
      
      themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
        
        localStorage.setItem('theme', newTheme);
      });

      // 加载保存的主题
      const savedTheme = localStorage.getItem('theme') || 'light';
      body.setAttribute('data-theme', savedTheme);
      const themeIcon = themeToggle.querySelector('i');
      themeIcon.className = savedTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';

      // 侧边栏切换
      const sidebarToggle = document.getElementById('toggleSidebar');
      const sidebar = document.getElementById('sidebar');
      
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('visible');
      });

      // 目录导航
      const tocLinks = document.querySelectorAll('.toc-link');
      const sections = document.querySelectorAll('.document-section');

      tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const target = document.getElementById(targetId);
          
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            
            // 更新活动状态
            tocLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      });

      ${options.showSearch ? this.generateSearchScript() : ''}

      // 滚动高亮当前章节
      let ticking = false;
      const updateActiveSection = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const scrollPos = window.scrollY + 100;
            
            for (let i = sections.length - 1; i >= 0; i--) {
              const section = sections[i];
              if (section.offsetTop <= scrollPos) {
                tocLinks.forEach(l => l.classList.remove('active'));
                const activeLink = document.querySelector(\`[href="#\${section.id}"]\`);
                if (activeLink) activeLink.classList.add('active');
                break;
              }
            }
            ticking = false;
          });
        }
        ticking = true;
      };

      window.addEventListener('scroll', updateActiveSection);
      updateActiveSection(); // 初始调用
    `
  }

  // 生成搜索脚本
  private generateSearchScript(): string {
    return `
      // 搜索功能
      const searchInput = document.getElementById('searchInput');
      let searchTimeout;

      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = e.target.value.toLowerCase().trim();
          
          // 清除之前的高亮
          document.querySelectorAll('.search-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
          });

          if (query.length < 2) return;

          // 搜索并高亮
          sections.forEach(section => {
            const content = section.querySelector('.section-content');
            const walker = document.createTreeWalker(
              content,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );

            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
              textNodes.push(node);
            }

            textNodes.forEach(textNode => {
              if (textNode.textContent.toLowerCase().includes(query)) {
                const text = textNode.textContent;
                const regex = new RegExp(\`(\${query})\`, 'gi');
                const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
                
                const wrapper = document.createElement('span');
                wrapper.innerHTML = highlightedText;
                textNode.parentNode.replaceChild(wrapper, textNode);
              }
            });
          });
        }, 300);
      });
    `
  }

  // 生成元数据
  private generateMetadata(options: FolderExportOptions): string {
    const now = new Date()
    return `
      <div class="document-metadata">
        <h4 class="metadata-title">文档信息</h4>
        <div class="metadata-item">
          <strong>标题:</strong> ${options.title}
        </div>
        <div class="metadata-item">
          <strong>文件夹:</strong> ${options.folderName}
        </div>
        <div class="metadata-item">
          <strong>生成时间:</strong> ${now.toLocaleString('zh-CN')}
        </div>
        <div class="metadata-item">
          <strong>生成工具:</strong> Readdy Editor
        </div>
      </div>
    `
  }

  // 判断是否为 Markdown 文件
  private isMarkdownFile(file: FileEntry): boolean {
    const name = file.name.toLowerCase()
    return name.endsWith('.md') || name.endsWith('.markdown')
  }

  // 生成文件名
  private generateFileName(customName: string): string {
    const timestamp = new Date().toISOString().slice(0, 10)
    const fileName = customName || `documentation-${timestamp}`
    return fileName.includes('.') ? fileName : `${fileName}.html`
  }

  // 下载文件
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
}