<template>
  <div class="search-panel bg-white border-r border-gray-200 flex flex-col">
    <!-- 搜索头部 -->
    <div class="p-4 border-b border-gray-200">
      <div class="relative mb-3">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="搜索文件和内容..."
          class="w-full px-3 py-2 pl-9 bg-gray-50 border border-gray-300 rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          @input="handleSearch"
          @keydown.enter="performSearch"
        />
        <i class="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
      </div>
      
      <!-- 搜索选项 -->
      <div class="flex space-x-2 text-xs">
        <label class="flex items-center space-x-1">
          <input v-model="searchOptions.matchCase" type="checkbox" class="rounded">
          <span>区分大小写</span>
        </label>
        <label class="flex items-center space-x-1">
          <input v-model="searchOptions.wholeWord" type="checkbox" class="rounded">
          <span>全词匹配</span>
        </label>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 搜索状态 -->
      <div v-if="isSearching" class="p-4 text-center text-gray-500">
        <div class="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p class="text-sm">搜索中...</p>
      </div>

      <!-- 无搜索词 -->
      <div v-else-if="!searchQuery.trim()" class="p-4 text-center text-gray-500">
        <i class="ri-search-line text-2xl mb-2"></i>
        <p class="text-sm">输入关键词开始搜索</p>
        <p class="text-xs mt-1 text-gray-400">支持文件名和内容搜索</p>
      </div>

      <!-- 无结果 -->
      <div v-else-if="searchResults.length === 0 && !isSearching" class="p-4 text-center text-gray-500">
        <i class="ri-search-2-line text-2xl mb-2"></i>
        <p class="text-sm">未找到相关结果</p>
        <p class="text-xs mt-1 text-gray-400">尝试修改搜索词或取消过滤选项</p>
      </div>

      <!-- 搜索结果列表 -->
      <div v-else class="p-2">
        <div class="text-xs text-gray-500 mb-2 px-2">
          找到 {{ searchResults.length }} 个结果
        </div>
        
        <div 
          v-for="result in searchResults" 
          :key="result.file.id"
          class="search-result-item mb-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
          @click="$emit('file-select', result.file.id)"
        >
          <!-- 文件信息 -->
          <div class="flex items-center mb-1">
            <i :class="getFileIcon(result.file)" class="mr-2"></i>
            <span class="text-sm font-medium">{{ result.file.name }}</span>
            <span class="ml-auto text-xs text-gray-400">{{ getFilePath(result.file) }}</span>
          </div>
          
          <!-- 匹配内容预览 -->
          <div v-if="result.matches.length > 0" class="space-y-1">
            <div
              v-for="(match, index) in result.matches.slice(0, 3)"
              :key="index"
              class="text-xs text-gray-600 bg-gray-50 p-1 rounded"
            >
              <span class="text-gray-400">第{{ match.line }}行:</span>
              <span v-html="highlightMatch(match.text, searchQuery)"></span>
            </div>
            <div v-if="result.matches.length > 3" class="text-xs text-gray-400">
              还有 {{ result.matches.length - 3 }} 个匹配...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索底部工具 -->
    <div class="p-3 border-t border-gray-200">
      <div class="flex space-x-2">
        <button
          class="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          @click="clearSearch"
        >
          清除搜索
        </button>
        <button
          class="flex-1 px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
          @click="showAdvancedSearch = !showAdvancedSearch"
        >
          {{ showAdvancedSearch ? '简单搜索' : '高级搜索' }}
        </button>
      </div>
    </div>

    <!-- 高级搜索面板 -->
    <div v-if="showAdvancedSearch" class="border-t border-gray-200 p-3 bg-gray-50">
      <div class="space-y-2">
        <div>
          <label class="block text-xs text-gray-600 mb-1">文件类型</label>
          <select v-model="advancedOptions.fileType" class="w-full text-xs border border-gray-300 rounded px-2 py-1">
            <option value="">所有类型</option>
            <option value="file">文件</option>
            <option value="folder">文件夹</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs text-gray-600 mb-1">修改日期</label>
          <select v-model="advancedOptions.dateRange" class="w-full text-xs border border-gray-300 rounded px-2 py-1">
            <option value="">任何时间</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>
        
        <button
          class="w-full px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
          @click="performAdvancedSearch"
        >
          执行高级搜索
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FileEntry } from '@/types'
import { fileSystem } from '@/services/file-system'

// Props
interface Props {
  visible?: boolean
}

withDefaults(defineProps<Props>(), {
  visible: true
})

// Emits
const emit = defineEmits<{
  'file-select': [fileId: string]
  'close': []
}>()

// 搜索状态
const searchQuery = ref('')
const isSearching = ref(false)
const showAdvancedSearch = ref(false)

// 搜索选项
const searchOptions = ref({
  matchCase: false,
  wholeWord: false
})

// 高级搜索选项
const advancedOptions = ref({
  fileType: '',
  dateRange: '',
  minSize: '',
  maxSize: ''
})

// 搜索结果
interface SearchMatch {
  line: number
  text: string
  column: number
}

interface SearchResult {
  file: FileEntry
  matches: SearchMatch[]
  score: number
}

const searchResults = ref<SearchResult[]>([])

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true

  try {
    const result = await fileSystem.searchFiles(searchQuery.value)
    
    if (result.success && result.data) {
      // 处理搜索结果，添加匹配详情
      searchResults.value = result.data.map(file => {
        const matches = findMatches(file.content, searchQuery.value)
        return {
          file,
          matches,
          score: calculateScore(file, matches)
        }
      }).sort((a, b) => b.score - a.score)
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 高级搜索
const performAdvancedSearch = async () => {
  // 构建高级搜索条件
  const options: any = {}
  
  if (advancedOptions.value.fileType) {
    options.fileType = advancedOptions.value.fileType
  }
  
  if (advancedOptions.value.dateRange) {
    const now = new Date()
    switch (advancedOptions.value.dateRange) {
      case 'today':
        options.modifiedAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        options.modifiedAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        options.modifiedAfter = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }
  }
  
  // 执行高级搜索（如果实现了高级搜索接口）
  await performSearch()
}

// 查找文本匹配
const findMatches = (content: string, query: string): SearchMatch[] => {
  const matches: SearchMatch[] = []
  const lines = content.split('\n')
  
  const searchTerm = searchOptions.value.matchCase ? query : query.toLowerCase()
  
  lines.forEach((line, lineIndex) => {
    const searchLine = searchOptions.value.matchCase ? line : line.toLowerCase()
    
    if (searchOptions.value.wholeWord) {
      const regex = new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, 'g')
      let match
      while ((match = regex.exec(searchLine)) !== null) {
        matches.push({
          line: lineIndex + 1,
          text: line,
          column: match.index + 1
        })
      }
    } else {
      let index = searchLine.indexOf(searchTerm)
      while (index !== -1) {
        matches.push({
          line: lineIndex + 1,
          text: line,
          column: index + 1
        })
        index = searchLine.indexOf(searchTerm, index + 1)
      }
    }
  })
  
  return matches
}

// 计算搜索分数
const calculateScore = (file: FileEntry, matches: SearchMatch[]): number => {
  let score = 0
  
  // 文件名匹配加分
  const fileName = searchOptions.value.matchCase ? file.name : file.name.toLowerCase()
  const query = searchOptions.value.matchCase ? searchQuery.value : searchQuery.value.toLowerCase()
  
  if (fileName.includes(query)) {
    score += 100
  }
  
  // 匹配数量加分
  score += matches.length * 10
  
  // 文件类型加分
  if (file.type === 'file') {
    score += 5
  }
  
  return score
}

// 高亮匹配文本
const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text
  
  const searchTerm = searchOptions.value.matchCase ? query : query.toLowerCase()
  const searchText = searchOptions.value.matchCase ? text : text.toLowerCase()
  
  let result = text
  if (searchOptions.value.wholeWord) {
    const regex = new RegExp(`\\b(${escapeRegExp(query)})\\b`, searchOptions.value.matchCase ? 'g' : 'gi')
    result = text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  } else {
    const index = searchText.indexOf(searchTerm)
    if (index !== -1) {
      const original = text.substring(index, index + query.length)
      result = text.replace(original, `<mark class="bg-yellow-200">${original}</mark>`)
    }
  }
  
  return result
}

// 工具函数
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getFileIcon = (file: FileEntry): string => {
  if (file.type === 'folder') {
    return 'ri-folder-fill text-primary'
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'ri-markdown-fill text-blue-500'
    case 'js':
    case 'ts':
      return 'ri-javascript-fill text-yellow-500'
    case 'vue':
      return 'ri-vuejs-fill text-green-500'
    case 'json':
      return 'ri-braces-fill text-orange-500'
    default:
      return 'ri-file-text-line text-gray-500'
  }
}

const getFilePath = (file: FileEntry): string => {
  return fileSystem.getFilePath(file.id)
}

// 事件处理
const handleSearch = () => {
  // 防抖搜索
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(performSearch, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showAdvancedSearch.value = false
}

// 防抖定时器
let searchTimeout: any
</script>

<style scoped>
.search-result-item {
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background-color: rgba(74, 144, 226, 0.05);
}

mark {
  padding: 1px 2px;
  border-radius: 2px;
}
</style>