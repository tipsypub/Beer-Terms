// 全局变量
let fileProcessor = new FileProcessor();

// DOM 元素
const englishFileInput = document.getElementById('englishFile');
const chineseFileInput = document.getElementById('chineseFile');
const englishFileInfo = document.getElementById('englishFileInfo');
const chineseFileInfo = document.getElementById('chineseFileInfo');
const englishFileName = document.getElementById('englishFileName');
const chineseFileName = document.getElementById('chineseFileName');
const englishFileSize = document.getElementById('englishFileSize');
const chineseFileSize = document.getElementById('chineseFileSize');
const splitMethodSelect = document.getElementById('splitMethod');
const paragraphCountDiv = document.getElementById('paragraphCountDiv');
const lineCountDiv = document.getElementById('lineCountDiv');
const paragraphCountInput = document.getElementById('paragraphCount');
const lineCountInput = document.getElementById('lineCount');
const filePrefixInput = document.getElementById('filePrefix');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusArea = document.getElementById('statusArea');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const resultArea = document.getElementById('resultArea');
const resultGrid = document.getElementById('resultGrid');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateSplitMethodUI();
});

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // 文件输入事件
    englishFileInput.addEventListener('change', handleEnglishFileSelect);
    chineseFileInput.addEventListener('change', handleChineseFileSelect);
    
    // 拖拽事件
    setupDropZone(englishFileInput.parentElement, handleEnglishFileDrop);
    setupDropZone(chineseFileInput.parentElement, handleChineseFileDrop);
    
    // 分割方式改变事件
    splitMethodSelect.addEventListener('change', updateSplitMethodUI);
    
    // 输入验证事件
    [paragraphCountInput, lineCountInput, filePrefixInput].forEach(input => {
        input.addEventListener('input', updateProcessButton);
    });
}

/**
 * 处理英文文件选择
 */
function handleEnglishFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        setEnglishFile(file);
    }
}

/**
 * 处理中文文件选择
 */
function handleChineseFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        setChineseFile(file);
    }
}

/**
 * 处理英文文件拖拽
 */
function handleEnglishFileDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        setEnglishFile(files[0]);
    }
}

/**
 * 处理中文文件拖拽
 */
function handleChineseFileDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        setChineseFile(files[0]);
    }
}

/**
 * 设置英文文件
 */
function setEnglishFile(file) {
    if (!file.name.match(/\.(md|markdown)$/i)) {
        alert('请选择Markdown文件（.md或.markdown）');
        return;
    }
    
    englishFileName.textContent = file.name;
    englishFileSize.textContent = `(${formatFileSize(file.size)})`;
    englishFileInfo.classList.remove('hidden');
    
    fileProcessor.englishFile = file;
    updateProcessButton();
}

/**
 * 设置中文文件
 */
function setChineseFile(file) {
    if (!file.name.match(/\.(md|markdown)$/i)) {
        alert('请选择Markdown文件（.md或.markdown）');
        return;
    }
    
    chineseFileName.textContent = file.name;
    chineseFileSize.textContent = `(${formatFileSize(file.size)})`;
    chineseFileInfo.classList.remove('hidden');
    
    fileProcessor.chineseFile = file;
    updateProcessButton();
}

/**
 * 设置拖拽区域
 */
function setupDropZone(element, dropHandler) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('border-blue-400', 'bg-blue-50');
    });
    
    element.addEventListener('dragleave', (e) => {
        e.preventDefault();
        element.classList.remove('border-blue-400', 'bg-blue-50');
    });
    
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('border-blue-400', 'bg-blue-50');
        dropHandler(e);
    });
}

/**
 * 更新分割方式UI
 */
function updateSplitMethodUI() {
    const method = splitMethodSelect.value;
    
    // 隐藏所有可选项
    paragraphCountDiv.classList.add('hidden');
    lineCountDiv.classList.add('hidden');
    
    // 显示对应的选项
    if (method === 'paragraph') {
        paragraphCountDiv.classList.remove('hidden');
    } else if (method === 'lines') {
        lineCountDiv.classList.remove('hidden');
    }
    
    updateProcessButton();
}

/**
 * 更新处理按钮状态
 */
function updateProcessButton() {
    const errors = fileProcessor.validateFiles();
    const hasValidInput = validateInputs();
    
    processBtn.disabled = errors.length > 0 || !hasValidInput;
}

/**
 * 验证输入
 */
function validateInputs() {
    const method = splitMethodSelect.value;
    const prefix = filePrefixInput.value.trim();
    
    if (!prefix) return false;
    
    if (method === 'paragraph') {
        const count = parseInt(paragraphCountInput.value);
        return count > 0 && count <= 50;
    } else if (method === 'lines') {
        const count = parseInt(lineCountInput.value);
        return count >= 10 && count <= 1000;
    }
    
    return true;
}

/**
 * 处理文件分割
 */
async function processFiles() {
    const errors = fileProcessor.validateFiles();
    if (errors.length > 0) {
        alert('错误：\n' + errors.join('\n'));
        return;
    }
    
    // 显示状态区域
    showStatus('正在读取文件...', 0);
    resultArea.classList.add('hidden');
    downloadBtn.disabled = true;
    
    // 获取选项
    const splitMethod = splitMethodSelect.value;
    const options = {
        filePrefix: filePrefixInput.value.trim() || 'section'
    };
    
    if (splitMethod === 'paragraph') {
        options.paragraphCount = parseInt(paragraphCountInput.value);
    } else if (splitMethod === 'lines') {
        options.lineCount = parseInt(lineCountInput.value);
    }
    
    try {
        // 处理文件
        showStatus('正在分割文件...', 25);
        
        const result = await fileProcessor.processFiles(splitMethod, options);
        
        if (result.success) {
            showStatus('分割完成！', 100);
            displayResults(result.results, result.statistics);
            downloadBtn.disabled = false;
            
            // 隐藏状态区域
            setTimeout(() => {
                statusArea.classList.add('hidden');
            }, 2000);
        } else {
            showError('分割失败：' + result.error);
        }
        
    } catch (error) {
        console.error('处理失败:', error);
        showError('处理失败：' + error.message);
    }
}

/**
 * 显示状态
 */
function showStatus(message, progress) {
    statusArea.classList.remove('hidden');
    statusText.textContent = message;
    progressBar.style.width = progress + '%';
    
    if (progress === 100) {
        statusIcon.innerHTML = '<i class="ri-check-line text-green-500"></i>';
    } else {
        statusIcon.innerHTML = '<i class="ri-loader-line animate-spin text-blue-500"></i>';
    }
}

/**
 * 显示错误
 */
function showError(message) {
    statusArea.classList.remove('hidden');
    statusText.textContent = message;
    statusIcon.innerHTML = '<i class="ri-error-warning-line text-red-500"></i>';
    progressBar.style.width = '0%';
}

/**
 * 显示结果
 */
function displayResults(results, statistics) {
    resultArea.classList.remove('hidden');
    resultGrid.innerHTML = '';
    
    // 显示统计信息
    const statsCard = createStatisticsCard(statistics);
    resultGrid.appendChild(statsCard);
    
    // 显示文件卡片
    results.forEach((section, index) => {
        const card = createResultCard(section, index);
        resultGrid.appendChild(card);
    });
}

/**
 * 创建统计信息卡片
 */
function createStatisticsCard(stats) {
    const card = document.createElement('div');
    card.className = 'col-span-full bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200';
    
    card.innerHTML = `
        <h3 class="text-lg font-semibold mb-4 text-gray-800">
            <i class="ri-bar-chart-line mr-2"></i>分割统计
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">${stats.totalSections}</div>
                <div class="text-gray-600">分割段落</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-green-600">${stats.totalFiles}</div>
                <div class="text-gray-600">生成文件</div>
            </div>
            <div class="text-center">
                <div class="text-lg font-bold text-purple-600">${formatFileSize(stats.englishStats.totalChars)}</div>
                <div class="text-gray-600">英文总量</div>
            </div>
            <div class="text-center">
                <div class="text-lg font-bold text-orange-600">${formatFileSize(stats.chineseStats.totalChars)}</div>
                <div class="text-gray-600">中文总量</div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * 创建结果卡片
 */
function createResultCard(section, index) {
    const card = document.createElement('div');
    card.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
    
    const englishPreview = section.english.substring(0, 100) + (section.english.length > 100 ? '...' : '');
    const chinesePreview = section.chinese.substring(0, 100) + (section.chinese.length > 100 ? '...' : '');
    
    card.innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2 truncate" title="${section.title}">
            ${section.index}. ${section.title}
        </h4>
        
        <div class="space-y-3 text-sm">
            <div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-blue-600 font-medium">英文文件</span>
                    <span class="text-gray-400">${formatFileSize(new Blob([section.english]).size)}</span>
                </div>
                <div class="bg-blue-50 p-2 rounded text-xs text-gray-600 max-h-16 overflow-hidden">
                    ${englishPreview}
                </div>
            </div>
            
            <div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-green-600 font-medium">中文文件</span>
                    <span class="text-gray-400">${formatFileSize(new Blob([section.chinese]).size)}</span>
                </div>
                <div class="bg-green-50 p-2 rounded text-xs text-gray-600 max-h-16 overflow-hidden">
                    ${chinesePreview}
                </div>
            </div>
        </div>
        
        <div class="flex space-x-2 mt-4">
            <button onclick="downloadSection(${index}, 'english')" 
                    class="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
                <i class="ri-download-line mr-1"></i>下载英文
            </button>
            <button onclick="downloadSection(${index}, 'chinese')" 
                    class="flex-1 px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                <i class="ri-download-line mr-1"></i>下载中文
            </button>
        </div>
    `;
    
    return card;
}

/**
 * 下载单个段落文件
 */
function downloadSection(index, language) {
    const files = fileProcessor.getGeneratedFiles();
    const filePair = files[index];
    
    if (filePair) {
        const fileData = filePair[language];
        fileProcessor.downloadFile(fileData.filename, fileData.content);
    }
}

/**
 * 下载所有文件
 */
function downloadAll() {
    const zipName = `${filePrefixInput.value || 'section'}_split_${new Date().toISOString().slice(0, 10)}.zip`;
    fileProcessor.downloadAllAsZip(zipName);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}