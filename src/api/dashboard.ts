import request from '@/utils/request'

export interface DashboardStats {
  // Regular Admin Stats
  articleCount?: number
  publishedCount?: number
  draftCount?: number
  todayViewCount?: number

  // Super Admin Stats
  tenantCount?: number
  activeTenantCount?: number
  packageCount?: number
  totalPlatformArticleCount?: number
}

export const dashboardApi = {
  getStats() {
    return request.get<DashboardStats>('/admin/dashboard/stats')
  }
}
