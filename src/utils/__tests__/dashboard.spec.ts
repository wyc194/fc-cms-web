import { describe, expect, it } from 'vitest'
import type { Tenant } from '@/api/types'
import { buildTodoItems, countExpiredTenants, countTenantsWithDomain, isExpiringSoon } from '@/utils/dashboard'

const NOW = new Date('2026-11-12T12:00:00+08:00')

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 1,
    code: 'blog',
    name: '测试站点',
    status: 'ACTIVE',
    createTime: '2026-01-01T00:00:00',
    updateTime: '2026-01-01T00:00:00',
    ...overrides
  }
}

describe('countExpiredTenants', () => {
  it('只统计 expireTime 早于当前时间的租户', () => {
    const tenants = [
      makeTenant({ id: 1, expireTime: '2026-11-01T00:00:00' }),
      makeTenant({ id: 2, expireTime: '2026-12-01T00:00:00' }),
      makeTenant({ id: 3 })
    ]
    expect(countExpiredTenants(tenants, NOW)).toBe(1)
  })

  it('忽略非法日期字符串', () => {
    const tenants = [makeTenant({ expireTime: 'not-a-date' })]
    expect(countExpiredTenants(tenants, NOW)).toBe(0)
  })

  it('空列表返回 0', () => {
    expect(countExpiredTenants([], NOW)).toBe(0)
  })
})

describe('countTenantsWithDomain', () => {
  it('只统计配置了非空域名的租户', () => {
    const tenants = [
      makeTenant({ id: 1, domain: 'a.example.com' }),
      makeTenant({ id: 2, domain: '   ' }),
      makeTenant({ id: 3 })
    ]
    expect(countTenantsWithDomain(tenants)).toBe(1)
  })
})

describe('isExpiringSoon', () => {
  it('30 天内到期返回 true', () => {
    expect(isExpiringSoon('2026-11-20T00:00:00', 30, NOW)).toBe(true)
  })

  it('超过 30 天返回 false', () => {
    expect(isExpiringSoon('2027-01-20T00:00:00', 30, NOW)).toBe(false)
  })

  it('已经到期返回 false（由 expired 统计负责）', () => {
    expect(isExpiringSoon('2026-10-01T00:00:00', 30, NOW)).toBe(false)
  })

  it('无到期时间返回 false', () => {
    expect(isExpiringSoon(undefined, 30, NOW)).toBe(false)
  })
})

describe('buildTodoItems', () => {
  it('内容管理员：待审评论与草稿都计入', () => {
    const items = buildTodoItems({
      isSuperAdmin: false,
      stats: { pendingCommentCount: 3, draftCount: 2 },
      now: NOW
    })
    expect(items.map(i => i.key)).toEqual(['pending-comments', 'drafts'])
    expect(items[0]!.label).toContain('3')
    expect(items[1]!.to).toBe('/articles')
  })

  it('内容管理员：数量为 0 的项不展示', () => {
    const items = buildTodoItems({
      isSuperAdmin: false,
      stats: { pendingCommentCount: 0, draftCount: 0 },
      now: NOW
    })
    expect(items).toEqual([])
  })

  it('超级管理员：展示已到期与即将到期租户', () => {
    const items = buildTodoItems({
      isSuperAdmin: true,
      stats: { pendingCommentCount: 1, expiredTenantCount: 2 },
      tenants: [
        makeTenant({ id: 1, expireTime: '2026-11-20T00:00:00' })
      ],
      now: NOW
    })
    expect(items.map(i => i.key)).toEqual(['pending-comments', 'expired-tenants', 'expiring-tenants'])
    expect(items[1]!.count).toBe(2)
    expect(items[2]!.count).toBe(1)
  })

  it('超级管理员：统计缺省时用租户列表兜底计算已到期', () => {
    const items = buildTodoItems({
      isSuperAdmin: true,
      stats: {},
      tenants: [makeTenant({ expireTime: '2026-01-01T00:00:00' })],
      now: NOW
    })
    expect(items.map(i => i.key)).toEqual(['expired-tenants'])
  })
})
