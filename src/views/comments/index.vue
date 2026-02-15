<template>
  <div class="page-container comments-management-page">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">评论管理</h2>
        <p class="page-subtitle">审核和管理读者的评论回复</p>
      </div>
      <div class="page-actions">
        <template v-if="selectedIds.length > 0">
          <el-button type="success" plain icon="Check" @click="handleBatchAudit(1)">通过 ({{ selectedIds.length }})</el-button>
          <el-button type="warning" plain icon="Close" @click="handleBatchAudit(2)">拒绝 ({{ selectedIds.length }})</el-button>
          <el-button type="primary" plain icon="ChatDotRound" @click="handleBatchReply">回复 ({{ selectedIds.length }})</el-button>
          <el-button type="danger" plain icon="Delete" @click="handleBatchDelete">删除 ({{ selectedIds.length }})</el-button>
        </template>
      </div>
    </div>

    <div class="page-main-scroll" v-loading="loading">
      <div class="filter-container flex-fixed">
        <el-form :inline="true" :model="queryForm" class="search-form">
          <el-form-item label="评论搜索" class="search-item">
            <el-input 
              v-model="queryForm.keyword" 
              placeholder="昵称/邮箱/内容" 
              clearable 
              prefix-icon="Search"
              class="search-input"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态" class="search-item">
            <el-select v-model="queryForm.status" placeholder="全部" clearable class="status-select">
              <el-option label="待审核" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="已拒绝" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item class="search-actions">
            <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-card shadow="never" class="table-card flex-auto">
        <el-table 
          :data="comments" 
          height="100%"
          style="width: 100%" 
          class="custom-table"
          @selection-change="handleSelectionChange"
        >
          <template #empty>
            <el-empty description="暂无评论数据" :image-size="100" />
          </template>
          
          <el-table-column type="selection" width="55" />
          
          <el-table-column prop="nickname" label="评论者" width="150">
            <template #default="{ row }">
              <div class="comment-user-info">
                <span class="nickname">{{ row.nickname }}</span>
                <div class="email text-secondary">{{ row.email }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="content" label="内容" min-width="250">
            <template #default="{ row }">
              <div class="comment-content-cell">
                <div class="comment-text">{{ row.content }}</div>
                <div v-if="row.parentNickname" class="reply-info text-secondary">
                  回复 @{{ row.parentNickname }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="时间" width="160">
            <template #default="{ row }">
              <span class="time-text">{{ formatDateTime(row.createTime) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right" align="right">
            <template #default="{ row }">
              <el-button 
                v-if="row.status === 0" 
                link 
                type="success" 
                @click="handleAudit(row, 1)"
              >通过</el-button>
              <el-button 
                v-if="row.status === 0" 
                link 
                type="warning" 
                @click="handleAudit(row, 2)"
              >拒绝</el-button>
              <el-button link type="primary" @click="handleReply(row)">回复</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container flex-fixed">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 回复对话框 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评论"
      width="500px"
      append-to-body
    >
      <el-form :model="replyForm" label-position="top">
        <el-form-item label="回复内容" required>
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { commentApi } from '@/api/comment'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Comment } from '@/api/types'

const comments = ref<Comment[]>([])
const loading = ref(false)
const submitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref<number[]>([])

const queryForm = reactive({
  keyword: '',
  status: null as number | null
})

const replyDialogVisible = ref(false)
const isBatchReply = ref(false)
const replyForm = reactive({
  articleId: 0,
  parentId: 0,
  content: '',
  nickname: '博主',
  email: '',
  adminReply: true
})

const handleSelectionChange = (val: Comment[]) => {
  selectedIds.value = val.map(item => item.id)
}

const fetchComments = async () => {
  loading.value = true
  try {
    const res = await commentApi.getComments({
      page: currentPage.value,
      size: pageSize.value,
      keyword: queryForm.keyword,
      status: queryForm.status ?? undefined
    })
    comments.value = res.content
    total.value = res.totalElements
  } catch (error) {
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchComments()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.status = null
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchComments()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchComments()
}

const getStatusType = (status: number) => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'success'
    case 2: return 'danger'
    default: return ''
  }
}

const getStatusLabel = (status: number) => {
  switch (status) {
    case 0: return '待审核'
    case 1: return '已通过'
    case 2: return '已拒绝'
    default: return '未知'
  }
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const handleAudit = async (row: Comment, status: number) => {
  const action = status === 1 ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确定要${action}该评论吗？`, '提示', {
      type: status === 1 ? 'success' : 'warning'
    })
    await commentApi.auditComments([row.id], status)
    ElMessage.success(`操作成功`)
    fetchComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleReply = (row: Comment) => {
  isBatchReply.value = false
  replyForm.articleId = row.articleId
  replyForm.parentId = row.id
  replyForm.content = ''
  replyDialogVisible.value = true
}

const handleBatchReply = () => {
  isBatchReply.value = true
  replyForm.content = ''
  replyDialogVisible.value = true
}

const submitReply = async () => {
  if (!replyForm.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  submitting.value = true
  try {
    const ids = isBatchReply.value ? selectedIds.value : [replyForm.parentId]
    await commentApi.replyComments(ids, replyForm.content)
    ElMessage.success(isBatchReply.value ? '批量回复成功' : '回复成功')
    replyDialogVisible.value = false
    fetchComments()
  } catch (error) {
    ElMessage.error(isBatchReply.value ? '批量回复失败' : '回复失败')
  } finally {
    submitting.value = false
  }
}

const handleBatchAudit = async (status: number) => {
  const action = status === 1 ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确定要批量${action}选中的 ${selectedIds.value.length} 条评论吗？`, '提示', {
      type: status === 1 ? 'success' : 'warning'
    })
    await commentApi.auditComments(selectedIds.value, status)
    ElMessage.success(`批量操作成功`)
    fetchComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量操作失败')
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要批量删除选中的 ${selectedIds.value.length} 条评论吗？删除后不可恢复！`, '警告', {
      type: 'warning'
    })
    await commentApi.deleteComments(selectedIds.value)
    ElMessage.success('批量删除成功')
    fetchComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

const handleDelete = async (row: Comment) => {
  try {
    await ElMessageBox.confirm('确定要删除该评论吗？删除后不可恢复！', '警告', {
      type: 'warning'
    })
    await commentApi.deleteComments([row.id])
    ElMessage.success('删除成功')
    fetchComments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comments-management-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.comment-user-info {
  display: flex;
  flex-direction: column;
}
.comment-user-info .nickname {
  font-weight: bold;
}
.comment-user-info .email {
  font-size: 12px;
}
.comment-text {
  word-break: break-all;
  white-space: pre-wrap;
}
.reply-info {
  font-size: 12px;
  margin-top: 4px;
}
.text-secondary {
  color: #909399;
}
</style>
