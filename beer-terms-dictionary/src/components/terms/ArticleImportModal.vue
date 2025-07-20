<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] flex flex-col">
      <!-- 模态框头部 -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">文章识别导入</h2>
          <p class="text-sm text-gray-600 mt-1">
            使用AI智能识别文章中的啤酒术语并自动分类
          </p>
        </div>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>

      <!-- AI模型选择和设置 -->
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium text-gray-700">AI模型：</label>
            <select 
              v-model="selectedAIProvider" 
              class="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="gemini">Gemini 1.5 Flash</option>
              <option value="kimi">Kimi (Moonshot)</option>
            </select>
            
            <button 
              @click="testAIConnection"
              :disabled="testingConnection"
              class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {{ testingConnection ? '测试中...' : '测试连接' }}
            </button>
            
            <span v-if="connectionStatus !== null" class="text-xs">
              <i :class="connectionStatus ? 'ri-checkbox-circle-line text-green-500' : 'ri-error-warning-line text-red-500'"></i>
              {{ connectionStatus ? '连接正常' : '连接失败' }}
            </span>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-xs text-gray-500">
              支持格式: PDF, Word, Markdown, HTML, TXT
            </div>
            <button 
              @click="loadTestData"
              class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              title="加载测试数据"
            >
              测试数据
            </button>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 左侧：英文原文输入 -->
        <div class="w-1/2 border-r border-gray-200 flex flex-col">
          <div class="p-4 border-b border-gray-200 bg-gray-50">
            <h3 class="font-semibold text-gray-900 mb-2">英文原文</h3>
            <div class="flex space-x-2">
              <button 
                @click="inputMethod = 'type'"
                :class="inputMethod === 'type' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-3 py-1 text-xs rounded hover:opacity-80"
              >
                手动输入
              </button>
              <button 
                @click="inputMethod = 'paste'"
                :class="inputMethod === 'paste' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-3 py-1 text-xs rounded hover:opacity-80"
              >
                粘贴文本
              </button>
              <button 
                @click="inputMethod = 'file'"
                :class="inputMethod === 'file' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-3 py-1 text-xs rounded hover:opacity-80"
              >
                文件上传
              </button>
            </div>
          </div>
          
          <div class="flex-1 p-4">
            <!-- 文件上传模式 -->
            <div v-if="inputMethod === 'file'" class="h-full">
              <div 
                @drop="handleFileDrop($event, 'english')"
                @dragover.prevent
                @dragenter.prevent
                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center h-40 flex flex-col justify-center hover:border-orange-500 transition-colors"
              >
                <i class="ri-upload-cloud-line text-3xl text-gray-400 mb-2"></i>
                <p class="text-gray-600 mb-2">拖拽文件到此处或点击选择</p>
                <input 
                  type="file" 
                  @change="handleFileSelect($event, 'english')"
                  :accept="fileProcessor.getSupportedFileTypes().join(',')"
                  class="hidden"
                  ref="englishFileInput"
                />
                <button 
                  @click="($refs.englishFileInput as HTMLInputElement)?.click()"
                  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  选择文件
                </button>
                <p class="text-xs text-gray-500 mt-2">
                  支持: {{ fileProcessor.getSupportedFileTypes().join(', ') }} (最大{{ fileProcessor.getMaxFileSizeMB() }}MB)
                </p>
              </div>
              
              <!-- 文件处理状态 -->
              <div v-if="englishFileProcessing" class="mt-4 p-3 bg-blue-50 rounded border">
                <div class="flex items-center">
                  <i class="ri-loader-line animate-spin text-blue-500 mr-2"></i>
                  <span class="text-blue-700">正在处理文件...</span>
                </div>
              </div>
              
              <div v-if="englishFileResult" class="mt-4 p-3 rounded border" :class="englishFileResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                <div v-if="englishFileResult.success" class="text-green-700">
                  <i class="ri-checkbox-circle-line mr-1"></i>
                  文件处理成功: {{ englishFileResult.fileName }} ({{ englishFileResult.wordCount }} 词)
                </div>
                <div v-else class="text-red-700">
                  <i class="ri-error-warning-line mr-1"></i>
                  {{ englishFileResult.error }}
                </div>
              </div>
            </div>
            
            <!-- 文本输入/粘贴模式 -->
            <div v-else class="h-full">
              <textarea 
                v-model="englishText"
                :placeholder="inputMethod === 'paste' ? '在此粘贴英文原文...' : '在此输入英文原文...'"
                class="w-full h-full resize-none border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              ></textarea>
            </div>
            
            <!-- 字数统计 -->
            <div class="mt-2 text-xs text-gray-500 text-right">
              {{ getWordCount(englishText) }} 词
            </div>
          </div>
        </div>

        <!-- 右侧：中文翻译输入 -->
        <div class="w-1/2 flex flex-col">
          <div class="p-4 border-b border-gray-200 bg-gray-50">
            <h3 class="font-semibold text-gray-900 mb-2">中文翻译</h3>
            <div class="flex space-x-2">
              <button 
                @click="chineseInputMethod = 'type'"
                :class="chineseInputMethod === 'type' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-3 py-1 text-xs rounded hover:opacity-80"
              >
                手动输入
              </button>
              <button 
                @click="chineseInputMethod = 'paste'"
                :class="chineseInputMethod === 'paste' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-3 py-1 text-xs rounded hover:opacity-80"
              >
                粘贴文本
              </button>
              <button 
                @click="chineseInputMethod = 'file'"
                :class="chineseInputMethod === 'file' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-3 py-1 text-xs rounded hover:opacity-80"
              >
                文件上传
              </button>
            </div>
          </div>
          
          <div class="flex-1 p-4">
            <!-- 文件上传模式 -->
            <div v-if="chineseInputMethod === 'file'" class="h-full">
              <div 
                @drop="handleFileDrop($event, 'chinese')"
                @dragover.prevent
                @dragenter.prevent
                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center h-40 flex flex-col justify-center hover:border-orange-500 transition-colors"
              >
                <i class="ri-upload-cloud-line text-3xl text-gray-400 mb-2"></i>
                <p class="text-gray-600 mb-2">拖拽文件到此处或点击选择</p>
                <input 
                  type="file" 
                  @change="handleFileSelect($event, 'chinese')"
                  :accept="fileProcessor.getSupportedFileTypes().join(',')"
                  class="hidden"
                  ref="chineseFileInput"
                />
                <button 
                  @click="($refs.chineseFileInput as HTMLInputElement)?.click()"
                  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  选择文件
                </button>
                <p class="text-xs text-gray-500 mt-2">
                  支持: {{ fileProcessor.getSupportedFileTypes().join(', ') }} (最大{{ fileProcessor.getMaxFileSizeMB() }}MB)
                </p>
              </div>
              
              <!-- 文件处理状态 -->
              <div v-if="chineseFileProcessing" class="mt-4 p-3 bg-blue-50 rounded border">
                <div class="flex items-center">
                  <i class="ri-loader-line animate-spin text-blue-500 mr-2"></i>
                  <span class="text-blue-700">正在处理文件...</span>
                </div>
              </div>
              
              <div v-if="chineseFileResult" class="mt-4 p-3 rounded border" :class="chineseFileResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                <div v-if="chineseFileResult.success" class="text-green-700">
                  <i class="ri-checkbox-circle-line mr-1"></i>
                  文件处理成功: {{ chineseFileResult.fileName }} ({{ chineseFileResult.wordCount }} 词)
                </div>
                <div v-else class="text-red-700">
                  <i class="ri-error-warning-line mr-1"></i>
                  {{ chineseFileResult.error }}
                </div>
              </div>
            </div>
            
            <!-- 文本输入/粘贴模式 -->
            <div v-else class="h-full">
              <textarea 
                v-model="chineseText"
                :placeholder="chineseInputMethod === 'paste' ? '在此粘贴中文翻译...' : '在此输入中文翻译...'"
                class="w-full h-full resize-none border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              ></textarea>
            </div>
            
            <!-- 字数统计 -->
            <div class="mt-2 text-xs text-gray-500 text-right">
              {{ getWordCount(chineseText) }} 词
            </div>
          </div>
        </div>
      </div>

      <!-- AI处理进度条 -->
      <div v-if="processing" class="px-6 py-4 border-t border-gray-200 bg-blue-50">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-blue-900">
              {{ isChunkedExtraction ? '分块AI分析进度' : 'AI分析进度' }}
              <span v-if="isChunkedExtraction && chunkedProgress" class="ml-2 text-xs text-gray-600">
                ({{ chunkedProgress.state.processedChunks }}/{{ chunkedProgress.state.totalChunks }} 块)
              </span>
            </h4>
            <div class="flex items-center space-x-2">
              <!-- 分块处理控制按钮 -->
              <div v-if="isChunkedExtraction && currentExtractionSession" class="flex space-x-1">
                <button
                  v-if="!extractionPaused"
                  @click="pauseExtraction"
                  class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  title="暂停处理"
                >
                  <i class="ri-pause-line"></i>
                </button>
                <button
                  v-if="extractionPaused"
                  @click="resumeExtraction"
                  class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  title="继续处理"
                >
                  <i class="ri-play-line"></i>
                </button>
                <button
                  @click="abortExtraction"
                  class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="中止处理"
                >
                  <i class="ri-stop-line"></i>
                </button>
              </div>
              <span class="text-xs text-blue-600">{{ Math.round(progressPercentage) }}%</span>
            </div>
          </div>
          
          <!-- 总体进度条 -->
          <div class="w-full bg-blue-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          
          <!-- 当前步骤显示 -->
          <div class="flex items-center text-sm text-blue-800">
            <i class="ri-loader-line animate-spin mr-2" :class="{ 'animate-spin': !extractionPaused }"></i>
            <span>{{ extractionPaused ? '处理已暂停' : currentStepDescription }}</span>
          </div>
          
          <!-- 分块提取详细信息 -->
          <div v-if="isChunkedExtraction && chunkedProgress" class="text-xs text-blue-700 space-y-1">
            <div class="flex justify-between">
              <span>已处理块数:</span>
              <span>{{ chunkedProgress.state.processedChunks }}/{{ chunkedProgress.state.totalChunks }}</span>
            </div>
            <div class="flex justify-between">
              <span>已提取术语:</span>
              <span>{{ chunkedProgress.state.extractedTerms.length }} 个</span>
            </div>
            <div v-if="chunkedProgress.state.failedChunks.length > 0" class="flex justify-between text-red-600">
              <span>失败块数:</span>
              <span>{{ chunkedProgress.state.failedChunks.length }} 个</span>
            </div>
            <div v-if="chunkedProgress.currentChunk" class="text-gray-600">
              <span>当前处理: {{ chunkedProgress.currentChunk.id }}</span>
            </div>
            <div v-if="chunkedProgress.recentTerms && chunkedProgress.recentTerms.length > 0" class="text-green-600">
              <span>最新提取: {{ chunkedProgress.recentTerms.map(t => t.english_term).join(', ') }}</span>
            </div>
          </div>
          
          <!-- 步骤列表 -->
          <div class="space-y-1">
            <div 
              v-for="(step, index) in processingSteps" 
              :key="index"
              class="flex items-center text-xs"
              :class="{
                'text-green-600': step.completed,
                'text-blue-600': step.active,
                'text-gray-500': !step.active && !step.completed
              }"
            >
              <i 
                :class="{
                  'ri-check-line': step.completed,
                  'ri-loader-line animate-spin': step.active,
                  'ri-circle-line': !step.active && !step.completed
                }"
                class="mr-2"
              ></i>
              <span>{{ step.description }}</span>
              <span v-if="step.active && step.detail" class="ml-2 text-gray-500">({{ step.detail }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="p-6 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            <span v-if="!hasContent">请输入或上传英文原文和中文翻译</span>
            <span v-else-if="!connectionStatus">请先测试AI连接</span>
            <span v-else>准备就绪，可以开始AI分析</span>
          </div>
          <div class="flex space-x-3">
            <button 
              @click="closeModal"
              class="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              取消
            </button>
            <button 
              @click="startAIAnalysis"
              :disabled="!canStartAnalysis || processing"
              class="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {{ processing ? '分析中...' : '开始AI分析' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 术语提取预览模态框 -->
    <TermExtractionPreview
      v-model="showExtractionPreview"
      :extracted-terms="extractedTerms"
      :categories="categories"
      :loading="processing"
      @confirm-import="handleTermsImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { aiService, type AIProvider, type ExtractedTerm, type ClassifiedTerm, type ExtractionProgress } from '@/services/aiService'
import { fileProcessor, type FileProcessResult } from '@/services/fileProcessor'
import TermExtractionPreview from './TermExtractionPreview.vue'

interface Props {
  modelValue: boolean
  categories: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'terms-extracted': [terms: ClassifiedTerm[]]
}>()

// 状态管理
const selectedAIProvider = ref<AIProvider>('gemini')
const connectionStatus = ref<boolean | null>(null)
const testingConnection = ref(false)
const processing = ref(false)

// 输入方法
const inputMethod = ref<'type' | 'paste' | 'file'>('type')
const chineseInputMethod = ref<'type' | 'paste' | 'file'>('type')

// 文本内容
const englishText = ref('')
const chineseText = ref('')

// 文件处理
const englishFileProcessing = ref(false)
const chineseFileProcessing = ref(false)
const englishFileResult = ref<FileProcessResult | null>(null)
const chineseFileResult = ref<FileProcessResult | null>(null)

// 术语提取结果
const extractedTerms = ref<ClassifiedTerm[]>([])
const showExtractionPreview = ref(false)

// 分块提取相关状态
const isChunkedExtraction = ref(false)
const currentExtractionSession = ref<string | null>(null)
const chunkedProgress = ref<ExtractionProgress | null>(null)
const extractionPaused = ref(false)

// 文本长度阈值，超过则使用分块提取
const CHUNKED_EXTRACTION_THRESHOLD = 8000

// 进度条状态
const progressPercentage = ref(0)
const currentStepDescription = ref('')
const processingSteps = ref([
  { id: 'extract', description: '提取啤酒术语', completed: false, active: false, detail: '' },
  { id: 'classify', description: '智能分类术语', completed: false, active: false, detail: '' },
  { id: 'validate', description: '验证和规范化', completed: false, active: false, detail: '' },
  { id: 'complete', description: '完成处理', completed: false, active: false, detail: '' }
])

// 进度管理函数
const updateProgress = (stepId: string, progress: number, detail?: string) => {
  const stepIndex = processingSteps.value.findIndex(s => s.id === stepId)
  if (stepIndex !== -1) {
    // 更新当前步骤
    processingSteps.value.forEach((step, index) => {
      step.active = index === stepIndex
      step.completed = index < stepIndex
      if (index === stepIndex && detail) {
        step.detail = detail
      }
    })
    
    // 更新总体进度
    const baseProgress = stepIndex * 25 // 每个步骤25%
    progressPercentage.value = Math.min(baseProgress + (progress * 0.25), 100)
    currentStepDescription.value = processingSteps.value[stepIndex].description
  }
}

const completeStep = (stepId: string) => {
  const stepIndex = processingSteps.value.findIndex(s => s.id === stepId)
  if (stepIndex !== -1) {
    processingSteps.value[stepIndex].completed = true
    processingSteps.value[stepIndex].active = false
    processingSteps.value[stepIndex].detail = ''
  }
}

const resetProgress = () => {
  progressPercentage.value = 0
  currentStepDescription.value = ''
  processingSteps.value.forEach(step => {
    step.completed = false
    step.active = false
    step.detail = ''
  })
}

// 计算属性
const hasContent = computed(() => {
  const englishContent = inputMethod.value === 'file' 
    ? englishFileResult.value?.content || ''
    : englishText.value
  const chineseContent = chineseInputMethod.value === 'file'
    ? chineseFileResult.value?.content || ''
    : chineseText.value
  
  return englishContent.trim().length > 0 && chineseContent.trim().length > 0
})

const canStartAnalysis = computed(() => {
  return hasContent.value && connectionStatus.value === true && !processing.value
})

// 方法
const closeModal = () => {
  resetState()
  emit('update:modelValue', false)
}

const resetState = () => {
  englishText.value = ''
  chineseText.value = ''
  englishFileResult.value = null
  chineseFileResult.value = null
  extractedTerms.value = []
  showExtractionPreview.value = false
  processing.value = false
  connectionStatus.value = null
  resetProgress()
  
  // 清理分块提取状态
  if (currentExtractionSession.value) {
    aiService.cleanupExtraction(currentExtractionSession.value)
  }
  isChunkedExtraction.value = false
  currentExtractionSession.value = null
  chunkedProgress.value = null
  extractionPaused.value = false
}

const testAIConnection = async () => {
  testingConnection.value = true
  try {
    const result = await aiService.testConnection(selectedAIProvider.value)
    connectionStatus.value = result
  } catch (error) {
    connectionStatus.value = false
    console.error('AI连接测试失败:', error)
  } finally {
    testingConnection.value = false
  }
}

const loadTestData = async () => {
  const { testBeerTerms } = await import('@/data/testTerms')
  
  // 将测试数据转换为ClassifiedTerm格式
  const classifiedTerms = testBeerTerms.map(term => ({
    ...term,
    category_name: getCategoryName(term.category_id)
  }))
  
  extractedTerms.value = classifiedTerms
  showExtractionPreview.value = true
  processing.value = false
  resetProgress()
  
  console.log('已加载测试数据:', classifiedTerms.length, '个术语')
}

const getCategoryName = (categoryId: string) => {
  const category = props.categories.find(c => c.id === categoryId)
  return category ? category.name_zh : '其他'
}

const getWordCount = (text: string): number => {
  if (!text.trim()) return 0
  const words = text.trim().split(/\s+/)
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
  return words.length + chineseChars.length
}

const handleFileSelect = async (event: Event, type: 'english' | 'chinese') => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return
  
  const file = target.files[0]
  await processFile(file, type)
}

const handleFileDrop = async (event: DragEvent, type: 'english' | 'chinese') => {
  event.preventDefault()
  
  const files = event.dataTransfer?.files
  if (!files?.length) return
  
  const file = files[0]
  await processFile(file, type)
}

const processFile = async (file: File, type: 'english' | 'chinese') => {
  const validation = fileProcessor.validateFile(file)
  if (!validation.valid) {
    if (type === 'english') {
      englishFileResult.value = {
        content: '',
        fileType: 'txt' as any,
        fileName: file.name,
        wordCount: 0,
        success: false,
        error: validation.error
      }
    } else {
      chineseFileResult.value = {
        content: '',
        fileType: 'txt' as any,
        fileName: file.name,
        wordCount: 0,
        success: false,
        error: validation.error
      }
    }
    return
  }

  if (type === 'english') {
    englishFileProcessing.value = true
    englishFileResult.value = null
  } else {
    chineseFileProcessing.value = true
    chineseFileResult.value = null
  }

  try {
    const result = await fileProcessor.processFile(file)
    
    if (type === 'english') {
      englishFileResult.value = result
      if (result.success) {
        englishText.value = result.content
      }
    } else {
      chineseFileResult.value = result
      if (result.success) {
        chineseText.value = result.content
      }
    }
  } catch (error) {
    const errorResult: FileProcessResult = {
      content: '',
      fileType: 'txt' as any,
      fileName: file.name,
      wordCount: 0,
      success: false,
      error: error instanceof Error ? error.message : '文件处理失败'
    }
    
    if (type === 'english') {
      englishFileResult.value = errorResult
    } else {
      chineseFileResult.value = errorResult
    }
  } finally {
    if (type === 'english') {
      englishFileProcessing.value = false
    } else {
      chineseFileProcessing.value = false
    }
  }
}

const startAIAnalysis = async () => {
  if (!canStartAnalysis.value) return

  processing.value = true
  resetProgress()
  
  try {
    const englishContent = inputMethod.value === 'file' 
      ? englishFileResult.value?.content || ''
      : englishText.value
    const chineseContent = chineseInputMethod.value === 'file'
      ? chineseFileResult.value?.content || ''
      : chineseText.value

    // 检查文本长度决定使用普通提取还是分块提取
    const totalLength = englishContent.length + chineseContent.length
    const shouldUseChunkedExtraction = totalLength > CHUNKED_EXTRACTION_THRESHOLD

    if (shouldUseChunkedExtraction) {
      await startChunkedAIAnalysis(englishContent, chineseContent)
    } else {
      await startSimpleAIAnalysis(englishContent, chineseContent)
    }
    
  } catch (error) {
    console.error('AI分析失败:', error)
    currentStepDescription.value = '分析失败'
    progressPercentage.value = 0
    alert(`AI分析失败: ${error}`)
  } finally {
    if (!isChunkedExtraction.value) {
      setTimeout(() => {
        processing.value = false
        resetProgress()
      }, showExtractionPreview.value ? 1000 : 0)
    }
  }
}

// 简单提取模式（原有逻辑）
const startSimpleAIAnalysis = async (englishContent: string, chineseContent: string) => {
  // 第一步：提取术语
  updateProgress('extract', 0, `使用${selectedAIProvider.value.toUpperCase()}模型`)
  
  const terms = await aiService.extractTerms(
    englishContent,
    chineseContent,
    selectedAIProvider.value
  )

  if (terms.length === 0) {
    throw new Error('未找到相关的啤酒术语')
  }

  completeStep('extract')
  updateProgress('classify', 0, `发现${terms.length}个术语`)

  // 第二步：智能分类
  const classifiedTerms = await aiService.classifyTerms(
    terms,
    selectedAIProvider.value,
    props.categories,
    (current: number, total: number) => {
      const progress = (current / total) * 100
      updateProgress('classify', progress, `已分类 ${current}/${total} 个术语`)
    }
  )

  completeStep('classify')
  updateProgress('validate', 0, '验证分类结果')

  // 模拟验证和规范化过程
  await new Promise(resolve => setTimeout(resolve, 500))
  completeStep('validate')
  
  updateProgress('complete', 0, '准备预览界面')
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 完成所有步骤
  progressPercentage.value = 100
  processingSteps.value.forEach(step => {
    step.completed = true
    step.active = false
  })
  currentStepDescription.value = '分析完成！'

  extractedTerms.value = classifiedTerms
  
  // 延迟一点时间让用户看到完成状态
  setTimeout(() => {
    showExtractionPreview.value = true
  }, 500)
}

// 分块提取模式
const startChunkedAIAnalysis = async (englishContent: string, chineseContent: string) => {
  isChunkedExtraction.value = true
  updateProgress('extract', 0, `文本较长，启用分块处理模式`)
  
  try {
    // 开始分块提取
    const sessionId = await aiService.startChunkedExtraction(
      englishContent,
      chineseContent,
      selectedAIProvider.value,
      {
        chunkSize: 2000,
        maxConcurrency: 2,
        retryAttempts: 3,
        saveInterval: 5000
      },
      (progress: ExtractionProgress) => {
        chunkedProgress.value = progress
        
        // 更新进度条
        const chunkProgress = progress.state.processedChunks / progress.state.totalChunks
        updateProgress('extract', chunkProgress * 100, 
          `处理中 ${progress.state.processedChunks}/${progress.state.totalChunks} 块`)
        
        // 检查是否完成
        if (progress.state.isCompleted) {
          handleChunkedExtractionComplete(progress.state.extractedTerms)
        }
        
        // 检查是否中止
        if (progress.state.isAborted) {
          processing.value = false
          isChunkedExtraction.value = false
          currentExtractionSession.value = null
          currentStepDescription.value = '处理已中止'
        }
        
        // 更新暂停状态
        extractionPaused.value = progress.state.isPaused
      }
    )
    
    currentExtractionSession.value = sessionId
    
  } catch (error) {
    isChunkedExtraction.value = false
    currentExtractionSession.value = null
    throw error
  }
}

// 处理分块提取完成
const handleChunkedExtractionComplete = async (terms: ExtractedTerm[]) => {
  try {
    completeStep('extract')
    updateProgress('classify', 0, `发现${terms.length}个术语，开始分类`)

    // 对提取的术语进行分类
    const classifiedTerms = await aiService.classifyTerms(
      terms,
      selectedAIProvider.value,
      props.categories,
      (current: number, total: number) => {
        const progress = (current / total) * 100
        updateProgress('classify', progress, `已分类 ${current}/${total} 个术语`)
      }
    )

    completeStep('classify')
    updateProgress('validate', 0, '验证分类结果')

    await new Promise(resolve => setTimeout(resolve, 500))
    completeStep('validate')
    
    updateProgress('complete', 0, '准备预览界面')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 完成所有步骤
    progressPercentage.value = 100
    processingSteps.value.forEach(step => {
      step.completed = true
      step.active = false
    })
    currentStepDescription.value = '分块分析完成！'

    extractedTerms.value = classifiedTerms
    
    // 清理分块提取状态
    isChunkedExtraction.value = false
    if (currentExtractionSession.value) {
      aiService.cleanupExtraction(currentExtractionSession.value)
      currentExtractionSession.value = null
    }
    
    // 延迟显示预览
    setTimeout(() => {
      showExtractionPreview.value = true
      processing.value = false
      resetProgress()
    }, 500)
    
  } catch (error) {
    console.error('分块提取后处理失败:', error)
    currentStepDescription.value = '分类处理失败'
    throw error
  }
}

const handleTermsImport = (terms: ClassifiedTerm[]) => {
  emit('terms-extracted', terms)
  showExtractionPreview.value = false
  closeModal()
}

// 分块提取控制函数
const pauseExtraction = () => {
  if (currentExtractionSession.value) {
    const success = aiService.pauseExtraction(currentExtractionSession.value)
    if (success) {
      extractionPaused.value = true
    }
  }
}

const resumeExtraction = () => {
  if (currentExtractionSession.value) {
    extractionPaused.value = false
    // 注意：由于aiService的resumeExtraction目前只返回false，我们需要手动重新开始
    // 在实际应用中，可能需要改进aiService的resumeExtraction方法
    alert('恢复功能正在开发中，请重新开始分析')
  }
}

const abortExtraction = () => {
  if (currentExtractionSession.value) {
    const success = aiService.abortExtraction(currentExtractionSession.value)
    if (success) {
      processing.value = false
      isChunkedExtraction.value = false
      currentExtractionSession.value = null
      chunkedProgress.value = null
      extractionPaused.value = false
      resetProgress()
      currentStepDescription.value = '处理已中止'
    }
  }
}

// 监听AI提供商变化，重置连接状态
watch(selectedAIProvider, () => {
  connectionStatus.value = null
})

// 监听输入方法变化，清空对应内容
watch(inputMethod, () => {
  if (inputMethod.value !== 'file') {
    englishFileResult.value = null
  }
})

watch(chineseInputMethod, () => {
  if (chineseInputMethod.value !== 'file') {
    chineseFileResult.value = null
  }
})
</script>