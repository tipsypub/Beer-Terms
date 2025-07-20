class FileProcessor {
    constructor() {
        this.englishFile = null;
        this.chineseFile = null;
        this.splitter = new MarkdownSplitter();
        this.generatedFiles = [];
    }

    /**
     * 设置文件
     */
    setFiles(englishFile, chineseFile) {
        this.englishFile = englishFile;
        this.chineseFile = chineseFile;
    }

    /**
     * 读取文件内容
     */
    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 处理文件分割
     */
    async processFiles(splitMethod, options = {}) {
        try {
            // 读取文件内容
            const englishContent = await this.readFileContent(this.englishFile);
            const chineseContent = await this.readFileContent(this.chineseFile);

            // 设置内容到分割器
            this.splitter.setContent(englishContent, chineseContent);

            // 根据方法分割
            let results;
            switch (splitMethod) {
                case 'heading':
                    results = this.splitter.splitByHeading();
                    break;
                case 'paragraph':
                    results = this.splitter.splitByParagraphs(options.paragraphCount || 5);
                    break;
                case 'lines':
                    results = this.splitter.splitByLines(options.lineCount || 100);
                    break;
                default:
                    throw new Error('未知的分割方法');
            }

            // 生成文件
            this.generateFiles(results, options.filePrefix || 'section');

            return {
                success: true,
                results,
                statistics: this.splitter.getStatistics(),
                files: this.generatedFiles
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成文件对象
     */
    generateFiles(results, prefix) {
        this.generatedFiles = [];

        results.forEach((section, index) => {
            // 英文文件
            const englishFileName = this.splitter.generateFileName(prefix, section.index, 'en', section.title);
            const englishContent = this.splitter.generateFileContent(section, 'english');
            
            // 中文文件
            const chineseFileName = this.splitter.generateFileName(prefix, section.index, 'zh', section.title);
            const chineseContent = this.splitter.generateFileContent(section, 'chinese');

            this.generatedFiles.push({
                type: 'pair',
                index: section.index,
                title: section.title,
                english: {
                    filename: englishFileName,
                    content: englishContent,
                    size: new Blob([englishContent]).size
                },
                chinese: {
                    filename: chineseFileName,
                    content: chineseContent,
                    size: new Blob([chineseContent]).size
                }
            });
        });
    }

    /**
     * 下载单个文件
     */
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 下载所有文件（打包为ZIP）
     */
    async downloadAllAsZip(zipName = 'markdown_split_files.zip') {
        if (typeof JSZip === 'undefined') {
            // 如果没有JSZip，则逐个下载
            this.downloadAllIndividually();
            return;
        }

        const zip = new JSZip();
        
        this.generatedFiles.forEach(filePair => {
            zip.file(filePair.english.filename, filePair.english.content);
            zip.file(filePair.chinese.filename, filePair.chinese.content);
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = zipName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('ZIP生成失败:', error);
            this.downloadAllIndividually();
        }
    }

    /**
     * 逐个下载所有文件
     */
    downloadAllIndividually() {
        this.generatedFiles.forEach((filePair, index) => {
            setTimeout(() => {
                this.downloadFile(filePair.english.filename, filePair.english.content);
            }, index * 200);
            
            setTimeout(() => {
                this.downloadFile(filePair.chinese.filename, filePair.chinese.content);
            }, index * 200 + 100);
        });
    }

    /**
     * 获取生成的文件列表
     */
    getGeneratedFiles() {
        return this.generatedFiles;
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 验证文件
     */
    validateFiles() {
        const errors = [];
        
        if (!this.englishFile) {
            errors.push('请选择英文Markdown文件');
        } else if (!this.englishFile.name.match(/\.(md|markdown)$/i)) {
            errors.push('英文文件必须是Markdown格式（.md或.markdown）');
        }
        
        if (!this.chineseFile) {
            errors.push('请选择中文Markdown文件');
        } else if (!this.chineseFile.name.match(/\.(md|markdown)$/i)) {
            errors.push('中文文件必须是Markdown格式（.md或.markdown）');
        }
        
        return errors;
    }
}

// 导出为全局变量
window.FileProcessor = FileProcessor;