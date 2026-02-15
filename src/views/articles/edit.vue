<template>
  <div class="article-edit-container">
    <div class="sticky-header">
      <el-page-header @back="goBack">
        <template #icon>
          <el-icon><ArrowLeft /></el-icon>
        </template>
        <template #content>
          <div class="header-content">
            <span class="page-title">{{ isEdit ? '编辑文章' : '写文章' }}</span>
            <el-tag v-if="isEdit" size="small" type="info" class="id-tag">ID: {{ $route.params.id }}</el-tag>
          </div>
        </template>
        <template #extra>
          <el-space :size="12">
            <el-button @click="handleSaveDraft" :loading="saveLoading" plain>保存草稿</el-button>
            <el-button type="primary" @click="handlePublish" :loading="publishLoading" class="publish-btn">发布文章</el-button>
          </el-space>
        </template>
      </el-page-header>
    </div>

    <transition name="fade-transform" mode="out-in" appear>
      <el-form 
        ref="formRef"
        :model="form" 
        :rules="rules"
        label-position="top" 
        class="edit-form"
        v-loading="loading"
      >
        <div class="editor-layout" :class="{ 'is-side-hidden': !isSidePanelVisible }">
          <div class="editor-main">
            <el-card class="main-card" shadow="never">
              <el-form-item label="文章标题" prop="title">
                <el-input 
                  v-model="form.title" 
                  placeholder="请输入文章标题" 
                  size="large" 
                  class="title-input"
                />
              </el-form-item>
              <el-form-item label="文章内容" prop="content">
                <div class="editor-wrapper">
                  <md-editor
                    v-model="form.content"
                    height="100%"
                    @on-upload-img="onUploadImg"
                    :toolbars-exclude="['github']"
                    placeholder="开始写作..."
                  />
                </div>
              </el-form-item>
            </el-card>
          </div>
          
          <div v-if="isSidePanelVisible" class="editor-side">
            <div class="side-panel">
              
              <el-card class="info-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <div class="header-title">
                      <el-icon><InfoFilled /></el-icon>
                      <span>文章信息</span>
                    </div>
                  </div>
                </template>
                <div class="info-list">
                  <div class="info-item">
                    <span class="label">文章状态</span>
                    <el-tag :type="form.published ? 'success' : 'info'" size="small">
                      {{ form.published ? '已发布' : '草稿' }}
                    </el-tag>
                  </div>
                  <div class="info-item" v-if="isEdit && articleInfo.updateTime">
                    <span class="label">最后修改</span>
                    <span class="value">{{ formatDate(articleInfo.updateTime) }}</span>
                  </div>
                  <div class="info-item" v-if="isEdit && articleInfo.createTime">
                    <span class="label">创建时间</span>
                    <span class="value">{{ formatDate(articleInfo.createTime) }}</span>
                  </div>
                </div>
              </el-card>

              <el-card class="settings-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <div class="header-title">
                      <el-icon><Setting /></el-icon>
                      <span>发布设置</span>
                    </div>
                    <el-button link type="primary" :icon="Download" @click="handleDownload">导出 MD</el-button>
                  </div>
                </template>
                <el-form-item label="封面图">
                  <div class="thumbnail-upload">
                    <el-upload
                      class="thumbnail-uploader"
                      :show-file-list="false"
                      :http-request="handleThumbnailUpload"
                      :before-upload="beforeThumbnailUpload"
                      accept="image/jpeg,image/png,image/webp"
                    >
                      <img v-if="form.thumbnail" :src="form.thumbnail" class="thumbnail" />
                      <el-icon v-else class="thumbnail-uploader-icon"><Plus /></el-icon>
                    </el-upload>
                    <div class="upload-hint">建议尺寸 374x280px 以上，比例接近 4:3</div>
                    <div v-if="form.thumbnail" class="thumbnail-actions">
                      <el-button link type="danger" @click="form.thumbnail = ''">移除</el-button>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="分类" prop="categoryId">
                  <el-cascader
                    v-model="form.categoryId"
                    :options="categories"
                    :props="{ 
                      value: 'id', 
                      label: 'name', 
                      children: 'children',
                      emitPath: false,
                      checkStrictly: true
                    }"
                    placeholder="选择分类"
                    style="width: 100%"
                    clearable
                    filterable
                  />
                </el-form-item>
                <el-form-item label="标签">
                  <el-select
                    v-model="selectedTagNames"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    placeholder="添加标签"
                    style="width: 100%"
                  >
                    <el-option 
                      v-for="tag in allTags" 
                      :key="tag.id" 
                      :label="tag.name" 
                      :value="tag.name" 
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="文章摘要">
                  <el-input
                    v-model="form.summary"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入文章摘要"
                    resize="none"
                  />
                </el-form-item>
                <el-form-item label="更多设置">
                  <div class="setting-item">
                    <span>置顶文章</span>
                    <el-switch v-model="form.top" />
                  </div>
                </el-form-item>
              </el-card>
            </div>
          </div>
          
          <!-- 侧边栏切换按钮 -->
          <div 
            class="side-panel-toggle" 
            :class="isSidePanelVisible ? 'is-opened' : 'is-closed'"
            @click="isSidePanelVisible = !isSidePanelVisible"
          >
            <el-icon>
              <ArrowRight v-if="isSidePanelVisible" />
              <ArrowLeft v-else />
            </el-icon>
          </div>
        </div>
      </el-form>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineAsyncComponent, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { ArrowLeft, Download, Setting, InfoFilled, Plus, ArrowRight } from '@element-plus/icons-vue'
import { articleApi } from '@/api/article'
import { categoryApi, tagApi } from '@/api/category'
import { mediaApi } from '@/api/media'
import type { Article, Category, Tag } from '@/api/types'
import 'md-editor-v3/lib/style.css'
import dayjs from 'dayjs'

const MdEditor = defineAsyncComponent(() => 
  import('md-editor-v3').then(m => m.MdEditor)
)

const route = useRoute()
const router = useRouter()
const isEdit = ref(false)
const loading = ref(false)
const saveLoading = ref(false)
const publishLoading = ref(false)
const isSidePanelVisible = ref(true)
const formRef = ref<FormInstance>()
const categories = ref<Category[]>([])
const allTags = ref<Tag[]>([])
const selectedTagNames = ref<string[]>([])
const articleInfo = ref<Partial<Article>>({})

const form = reactive({
  id: undefined as number | undefined,
  title: '',
  content: '',
  categoryId: undefined as number | undefined,
  summary: '',
  thumbnail: '',
  published: false,
  top: false
})

// --- 自动保存本地缓存逻辑 ---
const CACHE_KEY_PREFIX = 'article_edit_cache_'
const getCacheKey = () => `${CACHE_KEY_PREFIX}${route.params.id || 'new'}`

// 保存到缓存
const saveToCache = () => {
  if (!form.title && !form.content) return
  const cacheData = {
    title: form.title,
    content: form.content,
    categoryId: form.categoryId,
    summary: form.summary,
    thumbnail: form.thumbnail,
    selectedTagNames: selectedTagNames.value,
    timestamp: Date.now()
  }
  localStorage.setItem(getCacheKey(), JSON.stringify(cacheData))
}

// 清除缓存
const clearCache = () => {
  localStorage.removeItem(getCacheKey())
}

// 检查并恢复缓存
const checkAndRestoreCache = () => {
  const cached = localStorage.getItem(getCacheKey())
  if (cached) {
    try {
      const data = JSON.parse(cached)
      const cacheTime = dayjs(data.timestamp).format('YYYY-MM-DD HH:mm:ss')
      
      ElMessageBox.confirm(
        `检测到本地有 ${cacheTime} 自动保存的内容，是否恢复？`,
        '恢复提示',
        {
          confirmButtonText: '恢复内容',
          cancelButtonText: '放弃',
          type: 'info'
        }
      ).then(() => {
        form.title = data.title || form.title
        form.content = data.content || form.content
        form.categoryId = data.categoryId || form.categoryId
        form.summary = data.summary || form.summary
        form.thumbnail = data.thumbnail || form.thumbnail
        selectedTagNames.value = data.selectedTagNames || selectedTagNames.value
        ElMessage.success('已恢复缓存内容')
      }).catch(() => {
        clearCache() // 用户放弃则清除该缓存
      })
    } catch (e) {
      console.error('解析缓存失败', e)
    }
  }
}

// 自动保存定时器
let autoSaveTimer: number | null = null
const startAutoSave = () => {
  autoSaveTimer = window.setInterval(() => {
    saveToCache()
  }, 30000) // 每 30 秒强制保存一次
}

// 监听内容变化，停顿 3 秒后保存
let debounceTimer: number | null = null
watch(
  () => [form.title, form.content],
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      saveToCache()
    }, 3000)
  }
)

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  if (debounceTimer) clearTimeout(debounceTimer)
})

// --- 上传相关函数 ---

/**
 * 封面图上传前的校验
 */
async function beforeThumbnailUpload(file: File) {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJpgOrPng) {
    ElMessage.error('封面图只能是 JPG/PNG/WEBP 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('封面图大小不能超过 2MB!')
    return false
  }

  // 检查像素尺寸和比例
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        
        // 1. 基础尺寸检查
        const isSizeValid = img.width >= 374 && img.height >= 280
        
        // 2. 宽高比检查 (目标 1.33)
        const ratio = img.width / img.height
        const isRatioValid = ratio >= 0.8 && ratio <= 2.2 // 允许从近正方形到超宽屏
        
        if (!isSizeValid) {
          ElMessage.error(`图片尺寸过小（当前 ${img.width}x${img.height}），建议至少 374x280px`)
          reject(new Error('size invalid'))
        } else if (!isRatioValid) {
          ElMessage.error('图片比例不合适，建议使用 4:3 或 3:2 的横屏图片以避免过度裁剪')
          reject(new Error('ratio invalid'))
        } else {
          resolve(true)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('image load error'))
      }
    })
  } catch (error) {
    return false
  }
}

/**
 * 处理封面图上传
 */
async function handleThumbnailUpload(options: UploadRequestOptions) {
  try {
    const res = await mediaApi.uploadMedia(options.file)
    form.thumbnail = res.url
  } catch (error) {
    ElMessage.error('封面图上传失败')
  }
}

/**
 * MD编辑器内部图片上传
 */
async function onUploadImg(files: File[], callback: (urls: string[]) => void) {
  try {
    const res = await Promise.all(
      files.map((file) => mediaApi.uploadMedia(file))
    )
    callback(res.map(item => item.url))
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
})

onMounted(async () => {
  // 加载分类和标签
  try {
    const [catTree, tagList] = await Promise.all([
      categoryApi.getCategoryTree(),
      tagApi.getTags()
    ])
    categories.value = catTree
    allTags.value = tagList
  } catch (error) {
    ElMessage.error('获取分类标签失败')
  }

  const id = route.params.id as string
  if (id && id !== 'new') {
    isEdit.value = true
    loading.value = true
    try {
      const article = await articleApi.getArticle(Number(id))
      if (article) {
        articleInfo.value = article
        Object.assign(form, {
          id: article.id,
          title: article.title,
          content: article.content,
          categoryId: article.category?.id,
          summary: article.summary || '',
          thumbnail: article.thumbnail || '',
          published: article.published,
          top: article.top
        })
        selectedTagNames.value = article.tags.map(t => t.name)
        
        // 加载完远程数据后，检查是否有更及时的本地缓存
        checkAndRestoreCache()
      }
    } catch (error) {
      ElMessage.error('获取文章详情失败')
    } finally {
      loading.value = false
    }
  } else {
    // 新建文章，直接检查缓存
    checkAndRestoreCache()
  }

  // 启动自动保存
  startAutoSave()
})

const goBack = () => {
  router.push('/articles')
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

// 导出带有 Frontmatter 的 Markdown
const handleDownload = () => {
  const frontmatter = [
    '---',
    `title: ${form.title}`,
    `date: ${new Date().toISOString()}`,
    `categories: [${form.categoryId}]`,
    `tags: [${selectedTagNames.value.join(', ')}]`,
    `summary: ${form.summary}`,
    '---',
    '',
    form.content
  ].join('\n')

  const blob = new Blob([frontmatter], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${form.title || 'untitled'}.md`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功，可直接用于其他博客系统')
}

const handleSaveDraft = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 如果是已发布的文章存为草稿，需要提示
      if (isEdit.value && form.published) {
        try {
          await ElMessageBox.confirm(
            '该文章已发布过，保存草稿将导致下线，确认保存？',
            '提示',
            {
              confirmButtonText: '确认保存',
              cancelButtonText: '取消',
              type: 'warning',
            }
          )
        } catch {
          return
        }
      }

      saveLoading.value = true
      try {
        const result = await saveArticle(false)
        ElMessage.success('草稿已保存')
        clearCache() // 保存成功后清除缓存
        
        // 更新本地状态
        if (result) {
          articleInfo.value = result
          form.published = result.published
          form.id = result.id
          isEdit.value = true
        }

        if (!isEdit.value) {
          router.push('/articles')
        }
      } catch (error) {
        ElMessage.error('保存失败')
      } finally {
        saveLoading.value = false
      }
    }
  })
}

const handlePublish = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      publishLoading.value = true
      try {
        const result = await saveArticle(true)
        ElMessage.success('文章发布成功')
        clearCache() // 发布成功后清除缓存
        
        // 更新本地状态
        if (result) {
          articleInfo.value = result
          form.published = result.published
          form.id = result.id
          isEdit.value = true
        }

        router.push('/articles')
      } catch (error) {
        ElMessage.error('发布失败')
      } finally {
        publishLoading.value = false
      }
    }
  })
}

const saveArticle = async (published: boolean) => {
  // 自动生成摘要（如果为空）
  if (!form.summary && form.content) {
    // 简单提取前 150 个字符作为摘要，移除 markdown 语法
    const plainText = form.content
      .replace(/[#*`~>]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .substring(0, 150)
      .trim()
    form.summary = plainText + (plainText.length >= 150 ? '...' : '')
  }

  const data: Partial<Article> = {
    ...form,
    published,
    category: form.categoryId ? { id: form.categoryId } as Category : undefined,
    tags: selectedTagNames.value.map(name => {
      const existing = allTags.value.find(t => t.name === name)
      return existing ? { id: existing.id, name: existing.name } : { name } as Tag
    })
  }
  
  return await articleApi.saveArticle(data)
}
</script>

<style scoped>
/* --- 基础布局 --- */
.article-edit-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  overflow-x: auto;
  overflow-y: hidden; /* 明确禁止外层垂直滚动 */
}

.sticky-header {
  flex-shrink: 0; /* 确保头部不被压缩 */
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  padding: 8px 16px;
  border-bottom: 1px solid #f1f5f9;
  min-width: 100%;
  box-sizing: border-box;
}

.edit-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 允许表单区域内部垂直滚动 */
}

.editor-layout {
  display: flex;
  flex: 1 0 auto;
  position: relative; /* 为收缩按钮提供定位基准 */
  min-width: 880px; /* 默认显示侧边栏时的最小宽度 */
  min-height: 520px; /* 设定最小高度，确保内容区域不会塌陷 */
}

.editor-layout.is-side-hidden {
  min-width: 600px; /* 隐藏侧边栏时的最小宽度 */
}

/* --- 编辑器主区域 --- */
.editor-main {
  flex: 1;
  min-width: 600px;
  display: flex;
  flex-direction: column;
}

.main-card {
  border: none;
  border-radius: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 12px 0 12px;
}

/* 撑满编辑器高度的关键样式 */
.main-card :deep(.el-form) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-card :deep(.el-form-item:last-child) {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

.main-card :deep(.el-form-item:last-child .el-form-item__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.editor-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* --- 侧边栏 --- */
.editor-side {
  width: 280px;
  flex-shrink: 0;
  /* 取消 sticky，使其跟随父级 editor-layout 整体滚动 */
  height: calc(100vh - 64px - 48.8px - 7px); /* 保持原高度计算设置 */
  min-height: 520px; /* 新增：设定侧边栏最小高度，与 editor-layout 保持一致，防止挤压 */
  transition: transform 0.3s, opacity 0.3s;
  display: flex;
  flex-direction: column;
  position: relative; /* 重要：为内部的收缩按钮提供定位基准 */
}

.side-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-left: 1px solid #f1f5f9;
  background-color: #fcfcfc;
  position: relative;
  overflow: hidden; /* 内部卡片超出时仍保持侧边栏整洁 */
}

.info-card, .settings-card {
  border: none;
  border-radius: 0;
}

.info-card {
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.settings-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.info-card :deep(.el-card__body) {
  padding: 12px;
}

.settings-card :deep(.el-card__header),
.info-card :deep(.el-card__header) {
  padding: 12px 16px !important;
}

/* --- 组件细节 --- */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.id-tag {
  font-family: monospace;
  font-weight: normal;
  margin-left: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.header-title .el-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-item .label { color: #64748b; }
.info-item .value { color: #1e293b; font-weight: 500; }

.thumbnail-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumbnail-uploader {
  width: 248px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  overflow: hidden;
  transition: all 0.3s;
}

.thumbnail-uploader:hover {
  border-color: var(--el-color-primary);
  background-color: #f0f7ff;
}

.upload-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
  text-align: center;
}

.thumbnail-uploader-icon {
  font-size: 24px;
  color: #8c939d;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-actions {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0; /* 取消 padding */
  background-color: #f8fafc;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  gap: 12px; /* 增加一定间隔 */
}

/* --- Element Plus 覆盖 --- */
:deep(.el-form-item) {
  margin-bottom: 10px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  border-radius: 8px;
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8) inset;
}

.title-input :deep(.el-input__inner) {
  font-weight: 600;
  font-size: 16px;
}

:deep(.md-editor) {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  /* 基础高度：基于视口的计算高度，防止无限增高 */
  /* 280px 是预留给 页面头部 + 文章标题 + 间距 的高度 */
  height: calc(100vh - 64px - 48.8px - 12px - 70px - 10px - 22px - 8px - 7px) !important;
  min-height: 400px;
}

/* 修复：全屏模式下（浏览器全屏或屏幕全屏）高度必须铺满视口 */
:deep(.md-editor.md-editor-fullscreen),
:deep(.md-editor:fullscreen) {
  height: 100vh !important;
  border-radius: 0;
  border: none;
  z-index: 3000; /* 确保在全屏时层级足够高 */
}

/* 重写编辑器底部状态栏样式 */
:deep(.md-editor-footer) {
  background-color: #fcfcfc;
  border-top: 1px solid #e2e8f0;
  height: 30px;
}

:deep(.md-editor-footer-item) {
  font-size: 14px;
  color: #94a3b8;
}

/* 重写编辑器复选框样式 (现代化风格) */
:deep(.md-editor-checkbox) {
  width: 14px;
  height: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 2px;
  background-color: #fff;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: pointer;
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.md-editor-checkbox-checked) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

:deep(.md-editor-checkbox-checked::after) {
  content: "";
  width: 4px;
  height: 8px;
  border: 2px solid #fff;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg) translate(-1px, -1px);
  position: absolute;
}

:deep(.md-editor-checkbox:hover) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
}

/* --- 交互组件 --- */
.side-panel-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%); /* 修复：添加垂直居中位移，防止触发垂直滚动条 */
  width: 10px; /* 修复：恢复正常宽度，防止内部图标溢出导致水平滚动条 */
  height: 48px;
  background: #f5faff;
  border: 1px solid var(--el-color-primary-light-5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2000;
  color: var(--el-color-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -2px 0 10px rgba(64, 158, 255, 0.2);
  border-right: none;
  border-radius: 12px 0 0 12px;
  overflow: hidden; /* 修复：防止内部元素溢出触发滚动条 */
}

/* 侧边栏打开时：按钮位于侧边栏左边缘 */
.side-panel-toggle.is-opened {
  right: 280px;
}

/* 侧边栏关闭时：按钮位于页面最右边缘 */
.side-panel-toggle.is-closed {
  right: 0;
}

.side-panel-toggle:hover {
  color: #fff;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  box-shadow: -4px 0 15px rgba(64, 158, 255, 0.4);
  width: 12px; /* 略微增加宽度反馈 */
}

.side-panel-toggle:hover .el-icon {
  transform: scale(1.2);
}

/* --- 动画 --- */
.fade-transform-enter-active, .fade-transform-leave-active {
  transition: all 0.3s ease;
}
.fade-transform-enter-from { opacity: 0; transform: translateY(20px); }
.fade-transform-leave-to { opacity: 0; transform: translateY(-20px); }
</style>
