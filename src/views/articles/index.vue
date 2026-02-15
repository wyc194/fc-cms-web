<template>
  <div class="page-container articles-management-page">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">文章管理</h2>
        <p class="page-subtitle">管理您的博客文章、草稿和分类</p>
      </div>

      <div class="page-actions">
        <el-button type="primary" icon="Plus" @click="handleCreate">写文章</el-button>
        <el-upload
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          accept=".md"
          @change="handleImport"
        >
          <el-button icon="Download">导入 MD</el-button>
        </el-upload>
        <el-button v-if="selectedIds.length > 0" type="danger" plain icon="Delete" @click="handleBatchDelete">
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <div class="page-main-scroll" v-loading="loading">
      <div class="filter-container flex-fixed">
        <el-form :inline="true" :model="queryForm" class="search-form">
          <el-form-item label="文章搜索" class="search-item">
            <el-input 
              v-model="queryForm.title" 
              placeholder="标题关键词" 
              clearable 
              prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="发布状态" class="search-item">
            <el-select v-model="queryForm.status" placeholder="全部" clearable class="status-select">
              <el-option label="已发布" value="published">
                <div class="status-option">
                  <span class="status-dot success"></span>
                  <span>已发布</span>
                </div>
              </el-option>
              <el-option label="草稿" value="draft">
                <div class="status-option">
                  <span class="status-dot info"></span>
                  <span>草稿</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item class="search-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-card shadow="never" class="table-card flex-auto">
        <el-table 
          :data="articles" 
          height="100%"
          style="width: 100%" 
          @selection-change="handleSelectionChange"
          class="custom-table"
        >
          <el-table-column type="selection" width="40" />
          <template #empty>
            <el-empty description="暂无文章数据" :image-size="100" />
          </template>
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="article-title-cell">
                <span class="article-title-text">{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category.name" label="分类" width="120" class-name="hidden-mobile">
            <template #default="{ row }">
              <el-tag v-if="row.category" size="small" type="warning" effect="light">{{ row.category.name }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="标签" min-width="120" show-overflow-tooltip class-name="hidden-mobile">
            <template #default="{ row }">
              <div class="article-tags">
                <el-tag v-for="tag in row.tags" :key="tag.id" size="small" effect="plain" class="tag-item">
                  {{ tag.name }}
                </el-tag>
                <span v-if="!row.tags || row.tags.length === 0">-</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="published" label="状态" width="100">
            <template #default="{ row }">
              <el-tooltip :content="row.published ? '点击下线' : '点击发布'" placement="top">
                <el-switch
                  v-model="row.published"
                  :active-value="true"
                  :inactive-value="false"
                  inline-prompt
                  active-text="已发布"
                  inactive-text="草稿"
                  :loading="row.statusLoading"
                  @change="(val: string | number | boolean) => handleStatusChange(row, val as boolean)"
                  style="--el-switch-on-color: #13ce66; --el-switch-off-color: #909399"
                />
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="时间" width="120" class-name="hidden-mobile">
            <template #default="{ row }">
              <span class="time-text">{{ row.createTime ? new Date(row.createTime).toLocaleDateString() : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-divider direction="vertical" class="hidden-mobile" />
              <el-button link type="danger" @click="handleDelete(row)" class="hidden-mobile">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container flex-fixed">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
            :total="totalArticles"
            :small="isMobile"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { articleApi } from '@/api/article'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Download, Delete, Refresh } from '@element-plus/icons-vue'
import type { Article, Tag } from '@/api/types'
import { useResponsive } from '@/composables/useResponsive'
import { validateFile } from '@/utils/uploadValidator'

const router = useRouter()
const { isMobile } = useResponsive()
const articles = ref<Article[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalArticles = ref(0)

const queryForm = reactive({
  title: '',
  status: '' // 'published' | 'draft' | ''
})

const fetchArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value, // 后端 Spring Data JPA 分页配置了从 1 开始
      size: pageSize.value,
      title: queryForm.title || undefined,
      published: queryForm.status === 'published' ? true : (queryForm.status === 'draft' ? false : undefined)
    }
    const res = await articleApi.getArticles(params)
    articles.value = res.content
    totalArticles.value = res.totalElements
  } catch (error) {
    ElMessage.error('获取文章列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchArticles()
})

const handleStatusChange = async (row: Article & { statusLoading?: boolean }, val: boolean) => {
  row.statusLoading = true
  try {
    await articleApi.saveArticle({
      id: row.id,
      published: val
    })
    ElMessage.success(`文章已${val ? '发布' : '设为草稿'}`)
  } catch (error) {
    row.published = !val
    ElMessage.error('操作失败')
  } finally {
    row.statusLoading = false
  }
}

const handleSelectionChange = (selection: Article[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.length} 篇文章吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    loading.value = true
    try {
      // 循环删除，后端暂不支持批量删除接口
      await Promise.all(selectedIds.value.map(id => articleApi.deleteArticle(id)))
      ElMessage.success('批量删除成功')
      await fetchArticles()
      selectedIds.value = []
    } catch (error) {
      ElMessage.error('部分文章删除失败')
    } finally {
      loading.value = false
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchArticles()
}

const resetQuery = () => {
  queryForm.title = ''
  queryForm.status = ''
  currentPage.value = 1
  fetchArticles()
}

const handleCreate = () => {
  router.push('/articles/edit/new')
}

const handleEdit = (row: Article) => {
  router.push(`/articles/edit/${row.id}`)
}

const handleDelete = (row: Article) => {
  ElMessageBox.confirm(
    `确定要删除文章《${row.title}》吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    loading.value = true
    try {
      await articleApi.deleteArticle(row.id)
      ElMessage.success('删除成功')
      await fetchArticles()
    } catch (error) {
      ElMessage.error('删除失败')
    } finally {
      loading.value = false
    }
  })
}

const handleImport = async (file: any) => {
  // 1. 校验 MD 文件
  const validation = await validateFile(file.raw, {
    maxSizeMB: 5,
    allowedExtensions: ['md'],
    checkMagicNumber: true
  })
  
  if (!validation.valid) {
    ElMessage.error(validation.message)
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    const content = e.target?.result as string
    let title = file.name.replace('.md', '')
    let body = content
    let tags: string[] = []
    
    // 简单的 Frontmatter 解析
    if (content.startsWith('---')) {
      const parts = content.split('---')
      if (parts.length >= 3) {
        const headerText = parts[1] || ''
        body = parts.slice(2).join('---').trim()
        
        // 解析标题
        const titleMatch = headerText.match(/title:\s*(.*)/)
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(/['\"]/g, '').trim()
        }
        
        // 解析标签
        const tagsMatch = headerText.match(/tags:\s*\[(.*)\]/)
        if (tagsMatch && tagsMatch[1]) {
          tags = tagsMatch[1].split(',').map(t => t.trim())
        }
      }
    }
    
    loading.value = true
    try {
      await articleApi.saveArticle({
        title,
        content: body,
        tags: tags.map(name => ({ name } as Tag)), // 转换为 Tag 格式
        published: false
      })
      ElMessage.success(`成功导入文章：${title}`)
      await fetchArticles()
    } catch (error) {
      ElMessage.error('导入文章失败')
    } finally {
      loading.value = false
    }
  }
  reader.readAsText(file.raw)
}

// 监听分页变化
import { watch } from 'vue'
watch([currentPage, pageSize], () => {
  fetchArticles()
})
</script>

<style scoped>
.table-card {
  min-height: 400px;
}

.custom-table {
  min-height: 300px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.success { background-color: #22c55e; }
.status-dot.info { background-color: #94a3b8; }

.article-title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0;
}

.article-title-text {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  transition: color 0.2s;
}

.article-title-cell:hover .article-title-text {
  color: var(--el-color-primary);
}

.article-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-item {
  border-radius: 4px;
  font-weight: 500;
}

.time-text {
  font-size: 13px;
  color: #64748b;
  font-family: monospace;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f1f5f9;
}

:deep(.el-table__row) {
  cursor: pointer;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .hidden-mobile {
    display: none !important;
  }
  
  .search-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .search-item {
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    width: 100%;
  }
  
  .search-input, .status-select {
    width: 100% !important;
  }
  
  .search-actions {
    margin-right: 0 !important;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
