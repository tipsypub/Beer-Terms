class MarkdownSplitter {
    constructor() {
        this.englishContent = '';
        this.chineseContent = '';
        this.results = [];
    }

    /**
     * 设置要分割的内容
     */
    setContent(englishContent, chineseContent) {
        this.englishContent = englishContent;
        this.chineseContent = chineseContent;
    }

    /**
     * 按标题分割
     */
    splitByHeading() {
        const englishSections = this.extractSectionsByHeading(this.englishContent);
        const chineseSections = this.extractSectionsByHeading(this.chineseContent);
        
        // 确保两种语言的段落数量一致
        const minSections = Math.min(englishSections.length, chineseSections.length);
        
        const results = [];
        for (let i = 0; i < minSections; i++) {
            results.push({
                index: i + 1,
                english: englishSections[i],
                chinese: chineseSections[i],
                title: this.extractTitle(englishSections[i]) || `Section ${i + 1}`
            });
        }
        
        this.results = results;
        return results;
    }

    /**
     * 按段落数量分割
     */
    splitByParagraphs(paragraphsPerFile = 5) {
        const englishParagraphs = this.extractParagraphs(this.englishContent);
        const chineseParagraphs = this.extractParagraphs(this.chineseContent);
        
        const results = [];
        const totalParagraphs = Math.min(englishParagraphs.length, chineseParagraphs.length);
        
        for (let i = 0; i < totalParagraphs; i += paragraphsPerFile) {
            const endIndex = Math.min(i + paragraphsPerFile, totalParagraphs);
            
            const englishSection = englishParagraphs.slice(i, endIndex).join('\n\n');
            const chineseSection = chineseParagraphs.slice(i, endIndex).join('\n\n');
            
            results.push({
                index: Math.floor(i / paragraphsPerFile) + 1,
                english: englishSection,
                chinese: chineseSection,
                title: `Paragraphs ${i + 1}-${endIndex}`
            });
        }
        
        this.results = results;
        return results;
    }

    /**
     * 按行数分割
     */
    splitByLines(linesPerFile = 100) {
        const englishLines = this.englishContent.split('\n');
        const chineseLines = this.chineseContent.split('\n');
        
        const results = [];
        const totalLines = Math.min(englishLines.length, chineseLines.length);
        
        for (let i = 0; i < totalLines; i += linesPerFile) {
            const endIndex = Math.min(i + linesPerFile, totalLines);
            
            const englishSection = englishLines.slice(i, endIndex).join('\n');
            const chineseSection = chineseLines.slice(i, endIndex).join('\n');
            
            results.push({
                index: Math.floor(i / linesPerFile) + 1,
                english: englishSection,
                chinese: chineseSection,
                title: `Lines ${i + 1}-${endIndex}`
            });
        }
        
        this.results = results;
        return results;
    }

    /**
     * 按标题提取段落
     */
    extractSectionsByHeading(content) {
        // 匹配 # ## ### 等标题
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const sections = [];
        let lastIndex = 0;
        let match;

        while ((match = headingRegex.exec(content)) !== null) {
            if (lastIndex > 0) {
                // 添加上一个段落
                const sectionContent = content.substring(lastIndex, match.index).trim();
                if (sectionContent) {
                    sections.push(sectionContent);
                }
            }
            lastIndex = match.index;
        }

        // 添加最后一个段落
        if (lastIndex < content.length) {
            const sectionContent = content.substring(lastIndex).trim();
            if (sectionContent) {
                sections.push(sectionContent);
            }
        }

        // 如果没有找到标题，就将整个内容作为一个段落
        if (sections.length === 0) {
            sections.push(content.trim());
        }

        return sections;
    }

    /**
     * 提取段落
     */
    extractParagraphs(content) {
        // 按双换行分割段落，过滤掉空段落
        return content.split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }

    /**
     * 提取标题
     */
    extractTitle(content) {
        const titleMatch = content.match(/^(#{1,6})\s+(.+)$/m);
        if (titleMatch) {
            return titleMatch[2].trim();
        }
        
        // 如果没有标题，取第一行作为标题
        const firstLine = content.split('\n')[0].trim();
        return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }

    /**
     * 生成文件名
     */
    generateFileName(prefix, index, language, title) {
        // 清理标题，移除特殊字符
        const cleanTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        const shortTitle = cleanTitle.length > 20 ? cleanTitle.substring(0, 20) : cleanTitle;
        
        return `${prefix}_${String(index).padStart(2, '0')}_${language}_${shortTitle}.md`;
    }

    /**
     * 获取分割结果
     */
    getResults() {
        return this.results;
    }

    /**
     * 生成文件内容
     */
    generateFileContent(section, language) {
        const timestamp = new Date().toISOString();
        const header = `<!-- Generated by MD-DV Splitter at ${timestamp} -->\n<!-- Language: ${language} -->\n<!-- Section: ${section.title} -->\n\n`;
        
        return header + section[language];
    }

    /**
     * 计算分割统计信息
     */
    getStatistics() {
        if (this.results.length === 0) return null;

        const stats = {
            totalSections: this.results.length,
            totalFiles: this.results.length * 2, // 英文+中文
            englishStats: {
                totalChars: 0,
                totalLines: 0,
                avgCharsPerSection: 0,
                avgLinesPerSection: 0
            },
            chineseStats: {
                totalChars: 0,
                totalLines: 0,
                avgCharsPerSection: 0,
                avgLinesPerSection: 0
            }
        };

        this.results.forEach(section => {
            // 英文统计
            stats.englishStats.totalChars += section.english.length;
            stats.englishStats.totalLines += section.english.split('\n').length;
            
            // 中文统计
            stats.chineseStats.totalChars += section.chinese.length;
            stats.chineseStats.totalLines += section.chinese.split('\n').length;
        });

        // 计算平均值
        stats.englishStats.avgCharsPerSection = Math.round(stats.englishStats.totalChars / this.results.length);
        stats.englishStats.avgLinesPerSection = Math.round(stats.englishStats.totalLines / this.results.length);
        stats.chineseStats.avgCharsPerSection = Math.round(stats.chineseStats.totalChars / this.results.length);
        stats.chineseStats.avgLinesPerSection = Math.round(stats.chineseStats.totalLines / this.results.length);

        return stats;
    }
}

// 导出为全局变量
window.MarkdownSplitter = MarkdownSplitter;