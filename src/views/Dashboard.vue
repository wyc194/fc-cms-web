<template>
  <div class="page-container">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">
          {{ getGreeting }}, {{ userStore.user?.nickname || '管理员' }}
        </h2>
        <p class="page-subtitle">这是您今日的业务数据概览</p>
      </div>
      <div class="page-actions">
        <el-button v-if="!showGuide && !isMobile" link type="primary" icon="QuestionFilled" @click="showGuide = true" class="guide-toggle">显示帮助引导</el-button>
        <el-button type="primary" plain icon="Refresh" @click="handleRefresh" :loading="loading">刷新数据</el-button>
      </div>
    </div>

    <!-- 业务新手引导 -->
    <transition name="el-zoom-in-top">
      <div v-if="showGuide" class="onboarding-guide flex-fixed">
        <el-card shadow="never" class="guide-card">
          <div class="guide-content">
            <div class="guide-header">
              <div class="title-area">
                <el-icon class="guide-icon"><MagicStick /></el-icon>
                <span class="guide-title">快速开始指南</span>
              </div>
              <el-button link icon="Close" @click="dismissGuide" />
            </div>
            <div class="guide-steps">
              <div class="guide-step">
                <div class="step-num">1</div>
                <div class="step-info">
                  <div class="step-title">完善基础设置</div>
                  <div class="step-desc">进入“系统管理”配置站点名称与SEO信息</div>
                </div>
              </div>
              <div class="guide-step">
                <div class="step-num">2</div>
                <div class="step-info">
                  <div class="step-title">上传素材资源</div>
                  <div class="step-desc">在“媒体中心”批量上传文章所需的图片与视频</div>
                </div>
              </div>
              <div class="guide-step">
                <div class="step-num">3</div>
                <div class="step-info">
                  <div class="step-title">发布首篇文章</div>
                  <div class="step-desc">通过“内容管理”开始您的创作之旅</div>
                </div>
              </div>
            </div>
            <div class="guide-footer">
              <el-button type="primary" size="small" @click="handleAction('new-article')">立即去创作</el-button>
              <el-button size="small" @click="dismissGuide">我知道了，不再提示</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </transition>

    <div class="page-main-scroll">
      <el-row :gutter="isMobile ? 12 : 20" class="stat-row flex-fixed">
        <el-col :xs="12" :sm="12" :md="6" v-for="item in statistics" :key="item.title">
          <el-card shadow="never" class="stat-card" :class="{ 'mobile-stat-card': isMobile }">
            <div class="stat-content">
              <div class="stat-info">
                <span class="stat-label">{{ item.title }}</span>
                <div class="stat-value-wrapper">
                  <span class="stat-value">{{ item.count }}</span>
                  <span class="stat-unit" v-if="item.unit">{{ item.unit }}</span>
                </div>
              </div>
              <div class="stat-icon" :class="item.color">
                <el-icon :size="24">
                  <component :is="item.icon" />
                </el-icon>
              </div>
            </div>
            <div class="stat-footer">
              <span class="trend" :class="item.trend > 0 ? 'up' : 'down'">
                <el-icon><component :is="item.trend > 0 ? 'CaretTop' : 'CaretBottom'" /></el-icon>
                {{ Math.abs(item.trend) }}%
              </span>
              <span class="footer-text">较上月同期</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="0" class="content-row flex-fixed">
        <el-col :xs="24" :lg="16">
          <el-card shadow="never" class="list-card">
            <template #header>
              <div class="card-header">
                <div class="header-title">
                  <el-icon><List /></el-icon>
                  <span>{{ userStore.isSuperAdmin ? '最近加入租户' : '最近发布文章' }}</span>
                </div>
                <el-button link type="primary" @click="handleViewAll">查看全部</el-button>
              </div>
            </template>
            <el-table :data="recentData" style="width: 100%" class="recent-table" v-loading="loading">
              <template v-if="userStore.isSuperAdmin">
                <el-table-column prop="name" label="租户名称" min-width="150">
                  <template #default="{ row }">
                    <div class="tenant-cell">
                      <el-avatar :size="isMobile ? 20 : 24" :src="row.logo" class="tenant-logo">
                        {{ row.name.charAt(0) }}
                      </el-avatar>
                      <span>{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="domain" label="域名" min-width="120" class-name="hidden-mobile" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small" effect="light">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
              </template>
              <template v-else>
                <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-link type="primary" underline="never" class="table-link">{{ row.title }}</el-link>
                  </template>
                </el-table-column>
                <el-table-column prop="author" label="作者" width="80" class-name="hidden-mobile" />
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '已发布' ? 'success' : 'info'" size="small" effect="light">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
              </template>
              <el-table-column prop="date" label="日期" width="180" class-name="hidden-mobile" />
              <el-table-column label="操作" width="70" align="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="handleRowClick(row)">{{ isMobile ? '看' : '详情' }}</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="8">
          <div class="sidebar-cards">
            <el-card shadow="never" class="quick-actions-card">
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <el-icon><Pointer /></el-icon>
                    <span>快捷操作</span>
                  </div>
                </div>
              </template>
              <div class="quick-actions">
                <div v-for="action in availableActions" :key="action.label" class="action-item" @click="handleAction(action.type)">
                  <div class="action-icon" :class="action.color">
                    <el-icon><component :is="action.icon" /></el-icon>
                  </div>
                  <span class="action-label">{{ action.label }}</span>
                </div>
              </div>
            </el-card>

            <el-card shadow="never" class="status-card" v-if="userStore.isSuperAdmin">
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <el-icon><Monitor /></el-icon>
                    <span>系统状态</span>
                  </div>
                  <el-tag type="success" size="small" effect="dark">运行中</el-tag>
                </div>
              </template>
              <div class="system-status">
                <div class="status-item">
                  <div class="status-label">
                    <span>CPU 使用率</span>
                    <span class="status-value">{{ systemStats.cpu }}%</span>
                  </div>
                  <el-progress :percentage="systemStats.cpu" :stroke-width="8" :show-text="false" />
                </div>
                <div class="status-item">
                  <div class="status-label">
                    <span>内存 使用率</span>
                    <span class="status-value">{{ systemStats.memory }}%</span>
                  </div>
                  <el-progress :percentage="systemStats.memory" :stroke-width="8" color="#e6a23c" :show-text="false" />
                </div>
                <div class="status-item">
                  <div class="status-label">
                    <span>存储 占用</span>
                    <span class="status-value">{{ systemStats.storage }}%</span>
                  </div>
                  <el-progress :percentage="systemStats.storage" :stroke-width="8" color="#67c23a" :show-text="false" />
                </div>
              </div>
            </el-card>

            <el-card shadow="never" class="todo-card flex-auto" v-else>
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <el-icon><Bell /></el-icon>
                    <span>待办事项</span>
                  </div>
                  <el-badge :value="3" class="item" type="danger" />
                </div>
              </template>
              <div class="todo-list">
                <div class="todo-item">
                  <el-checkbox>审核 2 篇待发布文章</el-checkbox>
                  <span class="todo-time">10:30</span>
                </div>
                <div class="todo-item">
                  <el-checkbox>更新 5 月份专题封面</el-checkbox>
                  <span class="todo-time">14:00</span>
                </div>
                <div class="todo-item">
                  <el-checkbox>回复 12 条用户评论</el-checkbox>
                  <span class="todo-time">16:45</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useResponsive } from '@/composables/useResponsive'
import { dashboardApi, type DashboardStats } from '@/api/dashboard'
import { articleApi } from '@/api/article'
import { tenantApi } from '@/api/tenant'
import { ElMessage } from 'element-plus'
import { 
  OfficeBuilding, 
  Box, 
  Document, 
  View, 
  Edit, 
  CaretTop,
  CaretBottom,
  List, 
  Pointer,
  EditPen,
  Plus,
  Setting,
  Picture,
  Monitor,
  Bell,
  Refresh,
  User,
  Collection,
  QuestionFilled,
  MagicStick,
  Close
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const { isMobile } = useResponsive()
const loading = ref(false)
const showGuide = ref(localStorage.getItem('dashboard_guide_dismissed') !== 'true')

const dismissGuide = () => {
  showGuide.value = false
  localStorage.setItem('dashboard_guide_dismissed', 'true')
}
const stats = ref<DashboardStats>({})
const recentArticles = ref<any[]>([])
const recentTenants = ref<any[]>([])

const systemStats = ref({
  cpu: 15,
  memory: 42,
  storage: 28
})

// 模拟系统状态动态更新
const updateSystemStats = () => {
  systemStats.value.cpu = Math.floor(Math.random() * 20) + 10
  systemStats.value.memory = Math.floor(Math.random() * 10) + 40
}

const getGreeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 17) return '下午好'
  if (hour < 19) return '傍晚好'
  return '晚上好'
})

interface StatisticItem {
  title: string
  count: number | string
  unit?: string
  icon: any
  color: string
  trend: number
}

const statistics = computed<StatisticItem[]>(() => {
  if (userStore.isSuperAdmin) {
    return [
      { title: '总租户数', count: stats.value.tenantCount || 0, icon: OfficeBuilding, color: 'primary', trend: 12 },
      { title: '活跃租户', count: stats.value.activeTenantCount || 0, icon: User, color: 'success', trend: 8 },
      { title: '套餐种类', count: stats.value.packageCount || 0, icon: Box, color: 'warning', trend: 0 },
      { title: '平台文章', count: stats.value.totalPlatformArticleCount || 0, icon: Collection, color: 'info', trend: 15 }
    ]
  } else {
    return [
      { title: '文章总数', count: stats.value.articleCount || 0, icon: Document, color: 'primary', trend: 24 },
      { title: '已发布', count: stats.value.publishedCount || 0, icon: Edit, color: 'success', trend: 18 },
      { title: '草稿箱', count: stats.value.draftCount || 0, icon: EditPen, color: 'warning', trend: -5 },
      { title: '今日浏览', count: stats.value.todayViewCount || 0, unit: '次', icon: View, color: 'info', trend: 32 }
    ]
  }
})

const recentData = computed(() => {
  if (userStore.isSuperAdmin) {
    return recentTenants.value.map(t => ({
      name: t.name,
      domain: t.domain,
      status: t.status === 'ACTIVE' ? '正常' : '禁用',
      date: t.createTime,
      logo: t.logo
    }))
  } else {
    return recentArticles.value.map(a => ({
      title: a.title,
      author: a.authorName || '管理员',
      status: a.published ? '已发布' : '草稿',
      date: a.createTime
    }))
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await dashboardApi.getStats()
    stats.value = res

    if (userStore.isSuperAdmin) {
      const tenantsRes = await tenantApi.getTenants()
      recentTenants.value = tenantsRes.slice(0, 6)
    } else {
      const articlesRes = await articleApi.getArticles({ page: 0, size: 6 })
      recentArticles.value = articlesRes.content || []
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const availableActions = computed(() => {
  if (userStore.isSuperAdmin) {
    return [
      { label: '新增租户', type: 'new-tenant', icon: Plus, color: 'success' },
      { label: '套餐管理', type: 'packages', icon: Box, color: 'primary' },
      { label: '系统监控', type: 'status', icon: Monitor, color: 'warning' }
    ]
  }
  
  return [
    { label: '写文章', type: 'new-article', icon: EditPen, color: 'primary' },
    { label: '上传资源', type: 'media', icon: Picture, color: 'info' },
    { label: '系统设置', type: 'settings', icon: Setting, color: 'warning' }
  ]
})

const handleRefresh = () => {
  updateSystemStats()
  fetchData()
}

const handleViewAll = () => {
  if (userStore.isSuperAdmin) {
    router.push('/tenants')
  } else {
    router.push('/articles')
  }
}

const handleRowClick = (row: any) => {
  ElMessage.info(`查看详情: ${row.name || row.title}`)
}

const handleAction = (type: string) => {
  switch (type) {
    case 'new-article':
      router.push('/articles/edit/new')
      break
    case 'new-tenant':
    case 'packages':
      router.push(type === 'new-tenant' ? '/tenants' : '/packages')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'media':
      router.push('/media')
      break
    case 'status':
      ElMessage.info('系统监控功能开发中...')
      break
  }
}
</script>

<style scoped>
.page-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.guide-toggle {
  margin-right: 12px;
  font-size: 13px;
}

.onboarding-guide {
  margin-bottom: 20px;
}

.guide-card {
  border: 1px dashed var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guide-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.guide-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .guide-steps {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.guide-step {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}

.step-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.guide-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.stat-row {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid #f1f5f9;
  background-color: #fff;
}

.stat-card {
  height: 100%;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  box-shadow: none;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.stat-unit {
  font-size: 14px;
  color: #64748b;
  margin-left: 4px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.primary { background-color: #eef2ff; color: #4f46e5; }
.stat-icon.success { background-color: #f0fdf4; color: #22c55e; }
.stat-icon.warning { background-color: #fffbeb; color: #f59e0b; }
.stat-icon.info { background-color: #f8fafc; color: #64748b; }

.stat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .hidden-mobile {
    display: none !important;
  }
  
  .stat-row {
    margin-bottom: 12px !important;
  }
  
  .stat-card {
    margin-bottom: 12px;
  }
  
  .mobile-stat-card :deep(.el-card__body) {
    padding: 12px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
  }
  
  .stat-icon :deep(.el-icon) {
    font-size: 18px;
  }
  
  .stat-footer {
    font-size: 11px;
    margin-top: 8px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .page-subtitle {
    font-size: 12px;
  }
}

.trend {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  gap: 2px;
}

.trend.up { color: #22c55e; }
.trend.down { color: #ef4444; }

.footer-text {
  font-size: 12px;
  color: #94a3b8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.list-card {
  height: 100%;
  border: none;
  border-radius: 0;
  border-right: 1px solid #f1f5f9;
}

.tenant-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-cards {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.quick-actions-card, .status-card, .todo-card {
  border: none;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid #f1f5f9;
}

.quick-actions-card:last-child, .status-card:last-child, .todo-card:last-child {
  border-bottom: none;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.2s;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
}

.action-item:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
  border-color: #e2e8f0;
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.action-icon.primary { background-color: #eef2ff; color: #4f46e5; }
.action-icon.success { background-color: #f0fdf4; color: #22c55e; }
.action-icon.warning { background-color: #fffbeb; color: #f59e0b; }
.action-icon.info { background-color: #f8fafc; color: #64748b; }

.action-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.system-status, .todo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  margin-bottom: 20px;
}

.status-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.status-value {
  font-weight: 600;
  color: #1e293b;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.todo-item:hover {
  background-color: #f8fafc;
}

.todo-time {
  font-size: 12px;
  color: #94a3b8;
}

.list-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.recent-table {
  border-radius: 0;
}

:deep(.el-checkbox__label) {
  font-size: 13px;
  color: #475569;
}

@media (max-width: 768px) {
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
