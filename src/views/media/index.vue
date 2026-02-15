<template>
  <div class="page-container">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">媒体中心</h2>
        <p class="page-subtitle">管理图片、视频及各类文档素材</p>
      </div>
      <div class="page-actions">
        <el-upload
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          multiple
          @change="handleUpload"
        >
          <el-button type="primary" icon="Upload">上传素材</el-button>
        </el-upload>
      </div>
    </div>

    <div class="page-main-scroll">
      <div class="media-layout flex-auto">
        <!-- 侧边栏：分类与统计 -->
        <div class="media-sidebar flex-fixed" v-if="!isMobile">
          <el-card shadow="never" class="sidebar-card">
            <div class="storage-info">
              <div class="storage-title">存储空间</div>
              <el-progress :percentage="progressPercentage" :format="percentageFormat" :stroke-width="10" />
              <div class="storage-desc">{{ displayUsedSize }} / {{ displayTotalSize }}</div>
            </div>
            
            <el-divider />
            
            <el-menu :default-active="activeCategory" class="media-menu" @select="handleCategorySelect">
              <el-menu-item index="all">
                <el-icon><Picture /></el-icon>
                <span>全部素材</span>
              </el-menu-item>
              <el-menu-item index="image">
                <el-icon><PictureFilled /></el-icon>
                <span>图片</span>
              </el-menu-item>
              <el-menu-item index="video">
                <el-icon><VideoCamera /></el-icon>
                <span>视频</span>
              </el-menu-item>
              <el-menu-item index="audio">
                <el-icon><Headset /></el-icon>
                <span>音频</span>
              </el-menu-item>
              <el-menu-item index="document">
                <el-icon><Document /></el-icon>
                <span>文档</span>
              </el-menu-item>
              <el-menu-item index="trash">
                <el-icon><Delete /></el-icon>
                <span>回收站</span>
              </el-menu-item>
            </el-menu>
          </el-card>
        </div>

        <!-- 移动端分类切换 -->
        <div class="mobile-category-tabs" v-else>
          <el-tabs v-model="activeCategory" @tab-change="handleCategorySelect">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="图片" name="image" />
            <el-tab-pane label="视频" name="video" />
            <el-tab-pane label="音频" name="audio" />
            <el-tab-pane label="文档" name="document" />
            <el-tab-pane label="回收站" name="trash" />
          </el-tabs>
        </div>

        <!-- 主内容区：列表与操作 -->
        <div class="media-content flex-auto">
          <el-card shadow="never" class="table-card content-card flex-auto">
            <div class="filter-container toolbar">
              <div class="toolbar-left">
                <el-checkbox
                  v-if="!isMobile"
                  v-model="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="handleSelectAll"
                  class="mr-16"
                >
                  全选
                </el-checkbox>
                <el-input
                  v-model="searchQuery"
                  :placeholder="isMobile ? '搜索...' : '搜索素材名称...'"
                  prefix-icon="Search"
                  clearable
                  class="search-input"
                  @change="handleSearch"
                  @clear="handleSearch"
                />
                
                <div class="view-mode-switch ml-8" v-if="!isMobile">
                  <el-radio-group v-model="viewMode" size="small">
                    <el-radio-button value="grid"><el-icon :size="16"><Grid /></el-icon></el-radio-button>
                    <el-radio-button value="list"><el-icon :size="16"><Expand /></el-icon></el-radio-button>
                  </el-radio-group>
                </div>
                <el-dropdown trigger="click" @command="handleSortCommand" class="ml-12">
                  <el-button icon="Sort" size="medium" circle />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="newest">按最新时间</el-dropdown-item>
                      <el-dropdown-item command="oldest">按最早时间</el-dropdown-item>
                      <el-dropdown-item command="size">按文件大小</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>

              <div class="toolbar-right">
                <!-- 桌面端批量操作 -->
                <div v-if="selectedItems.length > 0 && !isMobile" class="batch-actions-area">
                  <span class="selected-count">已选 {{ selectedItems.length }} 项</span>
                  <el-button-group class="ml-16">
                    <el-button 
                      v-if="activeCategory === 'trash'" 
                      type="primary" 
                      plain 
                      icon="RefreshLeft"
                      size="medium"
                      @click="handleBatchRestore"
                    >
                      恢复
                    </el-button>
                    <el-button 
                      type="danger" 
                      plain 
                      icon="Delete"
                      size="medium"
                      @click="handleBatchDelete"
                    >
                      {{ activeCategory === 'trash' ? '彻底删除' : '移至回收站' }}
                    </el-button>
                    <el-button 
                      v-if="activeCategory !== 'trash'"
                      icon="Download"
                      size="medium"
                      @click="handleBatchDownload"
                    >
                      下载
                    </el-button>
                  </el-button-group>
                  <el-button link size="medium" @click="selectedItems = []" class="ml-8">取消</el-button>
                </div>
              </div>
            </div>
            
            <div v-if="selectedItems.length > 0" class="mobile-batch-bar" v-show="isMobile">
              <span>已选 {{ selectedItems.length }} 项</span>
              <div class="batch-btns">
                <el-button v-if="activeCategory === 'trash'" size="small" type="primary" plain @click="handleBatchRestore">恢复</el-button>
                <el-button size="small" type="danger" plain @click="handleBatchDelete">{{ activeCategory === 'trash' ? '删除' : '移回' }}</el-button>
                <el-button v-if="activeCategory !== 'trash'" size="small" icon="Download" @click="handleBatchDownload" circle />
                <el-button size="small" @click="selectedItems = []">取消</el-button>
              </div>
            </div>

            <div 
              class="media-grid-container flex-auto" 
              :class="{ 'no-padding': viewMode === 'list' }"
              v-loading="loading"
            >
              <div v-if="paginatedMediaItems.length > 0" class="media-container-inner">
                <!-- 宫格视图 -->
                <div v-if="viewMode === 'grid'" class="media-grid">
                  <transition-group name="list-fade" tag="div" class="el-row" style="margin-left: -8px; margin-right: -8px;">
                    <el-col 
                      v-for="item in paginatedMediaItems" 
                      :key="item.id" 
                      :xs="12" 
                      :sm="8" 
                      :md="6" 
                      :lg="4" 
                      :xl="3"
                      style="padding-left: 8px; padding-right: 8px;"
                    >
                      <div 
                        :class="['media-item-wrapper', { 'is-selected': selectedItems.includes(item.id) }]"
                        @click="toggleSelection(item.id)"
                      >
                        <el-card :body-style="{ padding: '0px' }" class="media-item-card">
                          <div class="media-preview">
                            <el-image
                              :src="item.url"
                              fit="cover"
                              class="media-image"
                              lazy
                              :preview-src-list="getFileType(item.url) === 'image' ? [item.url] : []"
                              preview-teleported
                              @click.stop="getFileType(item.url) !== 'image' && handleDetail(item)"
                            >
                              <template #error>
                                <div class="image-error">
                                  <el-icon><Picture /></el-icon>
                                </div>
                              </template>
                            </el-image>
                            <div class="selection-indicator" v-if="selectedItems.includes(item.id)">
                              <el-icon><Check /></el-icon>
                            </div>
                            <div class="media-type-tag">{{ item.name.split('.').pop()?.toUpperCase() }}</div>
                          </div>
                          <div class="media-info">
                            <div class="media-name" :title="item.name">{{ item.name }}</div>
                            <div class="media-meta">
                              <span>{{ item.size }}</span>
                              <span class="dot">·</span>
                              <span>{{ item.createdAt }}</span>
                            </div>
                            <div class="media-item-actions">
                              <el-dropdown trigger="click" @click.stop>
                                <el-button link size="small" icon="MoreFilled" />
                                <template #dropdown>
                                  <el-dropdown-menu>
                                    <el-dropdown-item icon="View" @click="handleDetail(item)">查看详情</el-dropdown-item>
                                    <template v-if="activeCategory === 'trash'">
                                      <el-dropdown-item icon="RefreshLeft" @click="handleRestore(item)">恢复</el-dropdown-item>
                                      <el-dropdown-item divided icon="Delete" type="danger" @click="handleDelete(item)">彻底删除</el-dropdown-item>
                                    </template>
                                    <template v-else>
                                      <el-dropdown-item icon="Download" @click="handleDownload(item)">下载</el-dropdown-item>
                                      <el-dropdown-item icon="Edit">重命名</el-dropdown-item>
                                      <el-dropdown-item icon="CopyDocument" @click="handleCopyLink(item)">复制链接</el-dropdown-item>
                                      <el-dropdown-item divided icon="Delete" type="danger" @click="handleDelete(item)">移至回收站</el-dropdown-item>
                                    </template>
                                  </el-dropdown-menu>
                                </template>
                              </el-dropdown>
                            </div>
                          </div>
                        </el-card>
                      </div>
                    </el-col>
                  </transition-group>
                </div>

                <!-- 列表视图 -->
                <div v-else class="media-list">
                  <el-table 
                    :data="paginatedMediaItems" 
                    style="width: 100%; height: 100%;"
                    @selection-change="handleTableSelectionChange"
                    ref="mediaTableRef"
                    height="100%"
                  >
                    <el-table-column type="selection" width="55" />
                    <el-table-column label="素材" width="100">
                      <template #default="{ row }">
                        <el-image
                          :src="row.url"
                          fit="cover"
                          style="width: 40px; height: 40px; border-radius: 4px; cursor: pointer;"
                          lazy
                          :preview-src-list="getFileType(row.url) === 'image' ? [row.url] : []"
                          preview-teleported
                          @click.stop="getFileType(row.url) !== 'image' && handleDetail(row)"
                        >
                          <template #error>
                            <div class="image-error-small">
                              <el-icon><Picture /></el-icon>
                            </div>
                          </template>
                        </el-image>
                      </template>
                    </el-table-column>
                    <el-table-column prop="name" label="名称" show-overflow-tooltip />
                    <el-table-column prop="size" label="大小" width="120" />
                    <el-table-column prop="createdAt" label="上传时间" width="180" />
                    <el-table-column label="操作" width="140" fixed="right">
                      <template #default="{ row }">
                        <div class="table-actions">
                          <el-button link size="small" icon="View" @click="handleDetail(row)" />
                          <template v-if="activeCategory === 'trash'">
                            <el-button link size="small" icon="RefreshLeft" @click="handleRestore(row)" />
                            <el-button link size="small" icon="Delete" type="danger" @click="handleDelete(row)" />
                          </template>
                          <template v-else>
                            <el-button link size="small" icon="Download" @click="handleDownload(row)" />
                            <el-dropdown trigger="click">
                              <el-button link size="small" icon="MoreFilled" />
                              <template #dropdown>
                                <el-dropdown-menu>
                                  <el-dropdown-item icon="Edit">重命名</el-dropdown-item>
                                  <el-dropdown-item icon="CopyDocument" @click="handleCopyLink(row)">复制链接</el-dropdown-item>
                                  <el-dropdown-item divided icon="Delete" type="danger" @click="handleDelete(row)">移至回收站</el-dropdown-item>
                                </el-dropdown-menu>
                              </template>
                            </el-dropdown>
                          </template>
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
              
              <el-empty v-else :image-size="200" description="暂无素材数据">
                <template #extra>
                  <el-button type="primary" plain @click="handleTriggerUpload">立即上传</el-button>
                </template>
              </el-empty>
            </div>

            <div class="pagination-container flex-fixed">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                background
                layout="total, sizes, prev, pager, next"
                :total="total"
                :page-sizes="[24, 48, 96]"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 媒体预览弹窗 (模拟 el-image-viewer 风格) -->
    <div v-if="previewVisible" class="el-image-viewer__wrapper media-custom-viewer">
      <div class="el-image-viewer__mask" @click="closePreview"></div>
      
      <!-- 关闭按钮 -->
      <span class="el-image-viewer__btn el-image-viewer__close" @click="closePreview">
        <el-icon><Close /></el-icon>
      </span>

      <!-- 预览画布 -->
      <div class="el-image-viewer__canvas" v-loading="previewLoading" element-loading-background="rgba(0, 0, 0, 0.1)">
        <div class="media-viewer__content" @click.stop v-if="previewItem">
          <!-- 加载失败展示 -->
          <div v-if="previewError" class="preview-unsupported">
            <el-result icon="warning" title="暂不支持预览" sub-title="文件解析失败，请尝试下载后查看">
              <template #extra>
                <el-button type="primary" @click="handleDownload(previewItem)">立即下载</el-button>
              </template>
            </el-result>
          </div>

          <!-- 正常预览内容 -->
          <template v-else>
            <!-- 视频预览 -->
            <div v-if="getFileType(previewItem.url) === 'video'" class="preview-video-container">
              <video :src="previewItem.url" controls autoplay class="preview-video"></video>
            </div>

            <!-- 音频预览 -->
            <div v-else-if="getFileType(previewItem.url) === 'audio'" class="preview-audio-container">
              <audio :src="previewItem.url" controls autoplay class="preview-audio"></audio>
            </div>

            <!-- PDF 预览 -->
            <div v-else-if="getFileType(previewItem.url) === 'pdf'" class="preview-pdf-container">
              <vue-office-pdf 
                :src="previewItem.url" 
                class="office-viewer" 
                @rendered="onOfficeRendered"
                @error="onOfficeError"
              />
            </div>

            <!-- Word 预览 -->
            <div v-else-if="getFileType(previewItem.url) === 'docx'" class="preview-office-container">
              <vue-office-docx 
                :src="previewItem.url" 
                class="office-viewer" 
                @rendered="onOfficeRendered"
                @error="onOfficeError"
              />
            </div>

            <!-- Excel 预览 -->
            <div v-else-if="getFileType(previewItem.url) === 'excel'" class="preview-office-container preview-excel-container">
              <vue-office-excel 
                :key="previewItem.url"
                :src="previewItem.url" 
                class="office-viewer" 
                @rendered="onOfficeRendered"
                @error="onOfficeError"
              />
            </div>

            <!-- PPT 预览 -->
            <div v-else-if="getFileType(previewItem.url) === 'pptx'" class="preview-office-container">
              <vue-office-pptx 
                :src="previewItem.url" 
                class="office-viewer" 
                @rendered="onOfficeRendered"
                @error="onOfficeError"
              />
            </div>

            <!-- 文本预览 -->
            <div v-else-if="getFileType(previewItem.url) === 'text'" class="preview-text-container">
              <pre class="preview-text-content">{{ textContent }}</pre>
            </div>

            <!-- 其他类型 -->
            <div v-else class="preview-unsupported">
              <el-result icon="warning" title="暂不支持预览" sub-title="该文件类型暂无在线预览插件">
                <template #extra>
                  <el-button type="primary" @click="handleDownload(previewItem)">立即下载</el-button>
                </template>
              </el-result>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Upload, Search, Grid, Expand, Picture, PictureFilled, 
  Document, Delete, Check, MoreFilled, Download, Edit, CopyDocument, View,
  VideoCamera, Headset, RefreshLeft, Close, Sort
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mediaApi, formatBytes, type StorageStats } from '@/api/media'
import { useResponsive } from '@/composables/useResponsive'
import { validateFile } from '@/utils/uploadValidator'
// @ts-ignore
import VueOfficeDocx from '@vue-office/docx'
// @ts-ignore
import VueOfficeExcel from '@vue-office/excel'
// @ts-ignore
import VueOfficePdf from '@vue-office/pdf'
// @ts-ignore
import VueOfficePptx from '@vue-office/pptx'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'

interface MediaItem {
  id: string
  name: string
  url: string
  size: string
  createdAt: string
  type: string
  deleted?: boolean
}

const { isMobile } = useResponsive()
const loading = ref(false)
const searchQuery = ref('')
const viewMode = ref('grid')
const sortOrder = ref('newest')
const activeCategory = ref('all')
const selectedItems = ref<string[]>([])
const mediaItems = ref<MediaItem[]>([])
const mediaTableRef = ref()
const previewVisible = ref(false)
const previewItem = ref<MediaItem | null>(null)
const textContent = ref('')
const previewLoading = ref(false)
const previewError = ref(false)

const closePreview = () => {
  previewVisible.value = false
  previewError.value = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && previewVisible.value) {
    closePreview()
  }
}

watch(previewVisible, (val) => {
  if (val) {
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

const fetchTextContent = async (url: string) => {
  previewLoading.value = true
  previewError.value = false
  textContent.value = ''
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('网络响应错误')
    textContent.value = await response.text()
  } catch (error) {
    console.error('获取文本内容失败:', error)
    previewError.value = true
    textContent.value = '加载失败: ' + (error instanceof Error ? error.message : String(error))
  } finally {
    previewLoading.value = false
  }
}

const onOfficeRendered = () => {
  previewLoading.value = false
  previewError.value = false
}

const onOfficeError = (err: any) => {
  previewLoading.value = false
  previewError.value = true
  console.error('文档渲染失败:', err)
}

const getFileType = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  if (['docx', 'doc'].includes(ext)) return 'docx'
  if (['xlsx', 'xls'].includes(ext)) return 'excel'
  if (['pptx', 'ppt'].includes(ext)) return 'pptx'
  if (['txt', 'json', 'md', 'js', 'css', 'html', 'log', 'java', 'py', 'php', 'sql', 'xml'].includes(ext)) return 'text'
  return 'other'
}

const handleTableSelectionChange = (selection: MediaItem[]) => {
  selectedItems.value = selection.map(item => item.id)
}
const total = ref(0)
const storageStats = ref<StorageStats>({
  usedSize: 0,
  totalSize: 0,
  percentage: 0
})

const displayUsedSize = computed(() => formatBytes(storageStats.value.usedSize))
const displayTotalSize = computed(() => formatBytes(storageStats.value.totalSize))

const progressPercentage = computed(() => {
  return Math.min(100, storageStats.value.percentage)
})

const percentageFormat = () => {
  const p = storageStats.value.percentage
  if (storageStats.value.usedSize > 0 && p < 1) {
    return '<1%'
  }
  return `${Math.round(p)}%`
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(24)

const fetchStorageStats = async () => {
  try {
    storageStats.value = await mediaApi.getStorageStats()
  } catch (error) {
    console.error('获取存储统计失败:', error)
  }
}

const fetchMediaItems = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value - 1,
      size: pageSize.value,
      name: searchQuery.value
    }
    
    // 处理分类和回收站
    if (activeCategory.value === 'trash') {
      params.deleted = true
    } else if (activeCategory.value !== 'all') {
      params.type = activeCategory.value
      params.deleted = false
    } else {
      params.deleted = false
    }
    
    // 处理排序
    if (sortOrder.value === 'newest') {
      params.sort = 'createTime,desc'
    } else if (sortOrder.value === 'oldest') {
      params.sort = 'createTime,asc'
    } else if (sortOrder.value === 'size') {
      params.sort = 'size,desc'
    }
    
    const data = await mediaApi.getMediaItems(params)
    mediaItems.value = data.items
    total.value = data.total
  } catch (error) {
    ElMessage.error('获取媒体列表失败')
  } finally {
    loading.value = false
  }
}

const handleCategorySelect = (key: string) => {
  activeCategory.value = key
  currentPage.value = 1
  selectedItems.value = []
  fetchMediaItems()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchMediaItems()
}

watch(sortOrder, () => {
  currentPage.value = 1
  fetchMediaItems()
})

watch(viewMode, (newMode) => {
  if (newMode === 'list' && selectedItems.value.length > 0) {
    // 等待表格渲染后同步选中状态
    setTimeout(() => {
      if (mediaTableRef.value) {
        mediaItems.value.forEach(item => {
          if (selectedItems.value.includes(item.id)) {
            mediaTableRef.value.toggleRowSelection(item, true)
          }
        })
      }
    }, 0)
  }
})

onMounted(() => {
  fetchMediaItems()
  fetchStorageStats()
})

const filteredMediaItems = computed(() => {
  // 后端已经过滤了名称，这里直接返回
  return mediaItems.value
})

const paginatedMediaItems = computed(() => {
  // 后端分页，直接返回
  return mediaItems.value
})

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchMediaItems()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchMediaItems()
}

// 全选逻辑
const isAllSelected = computed({
  get: () => mediaItems.value.length > 0 && selectedItems.value.length === mediaItems.value.length,
  set: (val) => {
    if (val) {
      selectedItems.value = mediaItems.value.map(item => item.id)
    } else {
      selectedItems.value = []
    }
  }
})

const isIndeterminate = computed(() => {
  return selectedItems.value.length > 0 && selectedItems.value.length < mediaItems.value.length
})

const handleSelectAll = (val: any) => {
  isAllSelected.value = !!val
}

const handleTriggerUpload = () => {
  const uploadInput = document.querySelector('.el-upload__input') as HTMLInputElement
  if (uploadInput) uploadInput.click()
}

const handleUpload = async (file: any) => {
  // 1. 前端安全校验
  const validation = await validateFile(file.raw, {
    maxSizeMB: 50, // 媒体文件允许大一点
    checkMagicNumber: true
  })
  
  if (!validation.valid) {
    ElMessage.error(validation.message)
    return
  }

  loading.value = true
  try {
    await mediaApi.uploadMedia(file.raw)
    ElMessage.success('素材上传成功')
    await fetchMediaItems()
    await fetchStorageStats()
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    loading.value = false
  }
}

const toggleSelection = (id: string) => {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

const handleSortCommand = (command: string) => {
  sortOrder.value = command
}

const handleDetail = (item: MediaItem) => {
  if (getFileType(item.url) === 'image') {
    // 图片类直接触发原生预览（如果不是通过 el-image 触发的）
    // 这里我们可以不做处理，因为 el-image 的预览列表会自动处理
    return
  }
  previewItem.value = item
  previewVisible.value = true
  previewLoading.value = true // 开启预览加载状态
  
  const type = getFileType(item.url)
  // 如果是文本类型，获取内容
  if (type === 'text') {
    fetchTextContent(item.url)
  } else if (['pdf', 'docx', 'excel', 'pptx'].includes(type)) {
    // Office 系列通过 rendered 事件关闭 Loading
  } else if (['video', 'audio'].includes(type)) {
    // 音视频简单处理，0.5s 后关闭 Loading
    setTimeout(() => {
      previewLoading.value = false
    }, 500)
  } else {
    previewLoading.value = false
  }
}

const handleRestore = async (item: MediaItem) => {
  try {
    await mediaApi.restoreMediaItem(item.id)
    ElMessage.success('已恢复素材')
    fetchMediaItems()
    fetchStorageStats()
  } catch (error) {
    ElMessage.error('恢复失败')
  }
}

const handleBatchRestore = async () => {
  try {
    for (const id of selectedItems.value) {
      await mediaApi.restoreMediaItem(id)
    }
    ElMessage.success('已批量恢复素材')
    selectedItems.value = []
    fetchMediaItems()
    fetchStorageStats()
  } catch (error) {
    ElMessage.error('批量恢复失败')
  }
}

const handleEmptyTrash = () => {
  ElMessageBox.confirm('确定要清空回收站吗？此操作将永久删除所有文件且不可恢复！', '警告', {
    confirmButtonText: '确定清空',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      await mediaApi.emptyTrash()
      ElMessage.success('回收站已清空')
      fetchMediaItems()
      fetchStorageStats()
    } catch (error) {
      ElMessage.error('清空失败')
    } finally {
      loading.value = false
    }
  })
}

const handleDelete = (item: MediaItem) => {
  const isTrash = activeCategory.value === 'trash'
  const message = isTrash ? `确定要永久删除素材 "${item.name}" 吗？此操作不可撤销！` : `确定要将素材 "${item.name}" 移至回收站吗？`
  
  ElMessageBox.confirm(message, '提示', {
    type: 'warning',
    confirmButtonClass: isTrash ? 'el-button--danger' : ''
  }).then(async () => {
    loading.value = true
    try {
      if (isTrash) {
        await mediaApi.permanentDeleteMediaItem(item.id)
      } else {
        await mediaApi.deleteMediaItem(item.id)
      }
      ElMessage.success(isTrash ? '已永久删除' : '已移至回收站')
      await fetchMediaItems()
      await fetchStorageStats()
      selectedItems.value = selectedItems.value.filter(id => id !== item.id)
    } catch (error) {
      ElMessage.error('操作失败')
    } finally {
      loading.value = false
    }
  })
}

const handleBatchDelete = () => {
  const isTrash = activeCategory.value === 'trash'
  const message = isTrash ? `确定要永久删除选中的 ${selectedItems.value.length} 个素材吗？此操作不可撤销！` : `确定要将选中的 ${selectedItems.value.length} 个素材移至回收站吗？`
  
  ElMessageBox.confirm(message, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      for (const id of selectedItems.value) {
        if (isTrash) {
          await mediaApi.permanentDeleteMediaItem(id)
        } else {
          await mediaApi.deleteMediaItem(id)
        }
      }
      ElMessage.success(isTrash ? '批量永久删除成功' : '批量移至回收站成功')
      await fetchMediaItems()
      await fetchStorageStats()
      selectedItems.value = []
    } catch (error) {
      ElMessage.error('操作失败')
    } finally {
      loading.value = false
    }
  })
}

const handleBatchDownload = () => {
  if (selectedItems.value.length === 0) return
  ElMessage.success(`正在准备下载 ${selectedItems.value.length} 个文件...`)
  selectedItems.value.forEach(id => {
    const item = mediaItems.value.find(i => i.id === id)
    if (item) handleDownload(item)
  })
}

const handleDownload = (item: MediaItem) => {
  const link = document.createElement('a')
  link.href = item.url
  link.download = item.name
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleCopyLink = (item: MediaItem) => {
  const fullUrl = window.location.origin + item.url
  navigator.clipboard.writeText(fullUrl).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.media-layout {
  display: flex;
  gap: 0;
  overflow: hidden;
  flex: 1;
  min-height: 450px; /* 保证最小可见高度，防止窗口过小时内容消失 */
}

.media-sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
}

.sidebar-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-card :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.media-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.content-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  border: none;
}

.content-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0;
}

.storage-info {
  padding: 8px;
}

.storage-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.storage-desc {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.media-menu {
  border-right: none;
}

.media-menu :deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.media-menu :deep(.el-menu-item.is-active) {
  background-color: var(--el-color-primary-light-9);
}

.toolbar {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.media-grid-container {
  padding: 20px;
  background-color: #f8fafc;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* 响应式样式 */
.mobile-category-tabs {
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
}

.mobile-batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fef2f2;
  border-bottom: 1px solid #fee2e2;
  font-size: 13px;
  color: #ef4444;
}

.batch-btns {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .media-layout {
    flex-direction: column;
    min-height: auto;
  }
  
  .toolbar {
    padding: 12px 16px;
  }
  
  .search-input {
    width: 140px !important;
  }
  
  .media-grid-container {
    padding: 12px;
  }
  
  .media-preview {
    height: 100px !important;
  }
  
  .media-name {
    font-size: 12px !important;
  }
  
  .media-meta {
    font-size: 10px !important;
  }
}

.media-grid-container {
  min-height: 0; /* 允许在 flex 容器中缩小 */
}

.media-grid-container.no-padding {
  padding: 0 !important;
  background-color: #ffffff;
  overflow: hidden; /* 列表模式下禁用容器滚动，由表格自身处理滚动以固定表头 */
}

.media-container-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.media-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px; /* 保证列表在极小窗口下也有滚动空间 */
}

.media-list :deep(.el-table) {
  border-radius: 0;
}

.media-list :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.table-actions :deep(.el-button) {
  margin: 0;
  padding: 4px;
}

.table-actions :deep(.el-icon) {
  font-size: 14px;
}

.table-actions :deep(.el-dropdown) {
  margin-left: 0;
}

:deep(.el-image-viewer__canvas) {
  transform: scale(0.8);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.search-input {
  width: 240px;
  margin-right: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-actions-area {
  display: flex;
  align-items: center;
  background-color: var(--el-color-danger-light-9);
  padding: 1px 12px 0;
  border-radius: 6px;
  border: 1px solid var(--el-color-danger-light-8);
}

.selected-count {
  font-size: 13px;
  color: var(--el-color-danger);
  font-weight: 500;
}

.ml-8 {
  margin-left: 8px;
}

.ml-12 {
  margin-left: 12px;
}

.ml-16 {
  margin-left: 16px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.media-item-wrapper {
  margin-bottom: 16px;
  transition: all 0.3s;
  cursor: pointer;
}

.media-item-card {
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
}

.media-item-wrapper:hover .media-item-card {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}

.media-item-wrapper.is-selected .media-item-card {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.media-preview {
  position: relative;
  aspect-ratio: 1;
  background-color: #f8fafc;
  overflow: hidden;
}

.media-image {
  width: 100%;
  height: 100%;
}

.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background-color: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.media-type-tag {
  position: absolute;
  bottom: 8px;
  left: 8px;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 10px;
  border-radius: 4px;
  text-transform: uppercase;
}

.media-info {
  padding: 10px;
  position: relative;
}

.media-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-meta {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
}

.media-meta .dot {
  margin: 0 4px;
}

.media-item-actions {
  position: absolute;
  right: 4px;
  bottom: 8px;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  color: #cbd5e1;
  font-size: 24px;
}

.image-error-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  color: #cbd5e1;
  font-size: 16px;
}

.mr-16 {
  margin-right: 16px;
}

/* 列表动画 */
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.3s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 自定义预览查看器 (模拟 el-image-viewer) */
.media-custom-viewer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
}

.media-custom-viewer .el-image-viewer__mask {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0.5;
  background: #000;
}

.media-custom-viewer .el-image-viewer__canvas {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}

.media-viewer__content {
  width: 90%;
  height: 90%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.preview-video-container {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
}

.preview-audio-container {
  padding: 40px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.preview-audio {
  width: 90%;
}

.preview-pdf-container,
.preview-office-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.office-viewer {
  width: 100%;
  height: 100%;
}

/* 修复 PPTX 预览容器不铺满的问题 */
:deep(.pptx-preview-wrapper) {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
}

.preview-text-container {
  width: 100%;
  height: 100%;
  padding: 24px;
  overflow: auto;
  background: #fdfdfd;
}

.preview-text-content {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: #333;
}

.preview-unsupported {
  padding: 40px;
}
</style>
