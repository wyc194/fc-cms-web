import type { Tenant } from '@/api/types'
import type { DashboardStats } from '@/api/dashboard'

/** 待办项：由真实数据推导，count 为 0 的项不展示 */
export interface TodoItem {
  key: string
  label: string
  count: number
  to: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/** 统计已到期租户数（expireTime 早于当前时间） */
export function countExpiredTenants(tenants: Tenant[], now: Date = new Date()): number {
  return tenants.filter(t => {
    if (!t.expireTime) return false
    const expire = new Date(t.expireTime)
    return !Number.isNaN(expire.getTime()) && expire.getTime() < now.getTime()
  }).length
}

/** 统计配置了域名的租户数（域名非空） */
export function countTenantsWithDomain(tenants: Tenant[]): number {
  return tenants.filter(t => Boolean(t.domain && t.domain.trim())).length
}

/** 是否即将到期（默认 30 天内且尚未到期） */
export function isExpiringSoon(expireTime: string | undefined, days = 30, now: Date = new Date()): boolean {
  if (!expireTime) return false
  const expire = new Date(expireTime)
  if (Number.isNaN(expire.getTime())) return false
  const diff = expire.getTime() - now.getTime()
  return diff > 0 && diff <= days * DAY_MS
}

/**
 * 由真实数据构建待办事项。
 * 超级管理员关注租户到期；内容管理员关注评论审核与草稿。
 */
export function buildTodoItems(opts: {
  isSuperAdmin: boolean
  stats?: DashboardStats
  tenants?: Tenant[]
  now?: Date
}): TodoItem[] {
  const { isSuperAdmin, stats, tenants, now = new Date() } = opts
  const items: TodoItem[] = []

  const pending = stats?.pendingCommentCount ?? 0
  if (pending > 0) {
    items.push({ key: 'pending-comments', label: `审核 ${pending} 条待审评论`, count: pending, to: '/comments' })
  }

  if (isSuperAdmin) {
    const expired = stats?.expiredTenantCount ?? countExpiredTenants(tenants ?? [], now)
    if (expired > 0) {
      items.push({ key: 'expired-tenants', label: `${expired} 个租户已到期`, count: expired, to: '/tenants' })
    }
    const expiring = (tenants ?? []).filter(t => isExpiringSoon(t.expireTime, 30, now)).length
    if (expiring > 0) {
      items.push({ key: 'expiring-tenants', label: `${expiring} 个租户 30 天内到期`, count: expiring, to: '/tenants' })
    }
  } else {
    const drafts = stats?.draftCount ?? 0
    if (drafts > 0) {
      items.push({ key: 'drafts', label: `完善 ${drafts} 篇草稿`, count: drafts, to: '/articles' })
    }
  }

  return items
}
