import request from '@/utils/request'

export interface DashboardStats {
  // Regular Admin Stats
  articleCount?: number
  publishedCount?: number
  draftCount?: number
  totalViewCount?: number

  // Super Admin Stats
  tenantCount?: number
  activeTenantCount?: number
  packageCount?: number
  totalPlatformArticleCount?: number

  // 通用：待办与通知数据源
  pendingCommentCount?: number
  expiredTenantCount?: number
}

export const dashboardApi = {
  getStats() {
    return request.get<DashboardStats>('/admin/dashboard/stats')
  }
}
