// import type { Tenant, Article, User, Package } from './types'
// 
// export const mockPackages: Package[] = [
//   { id: '1', name: '免费版', maxArticles: 50, maxStorage: 100, allowCustomDomain: false, price: 0 },
//   { id: '2', name: '专业版', maxArticles: 500, maxStorage: 1024, allowCustomDomain: true, price: 99 },
//   { id: '3', name: '企业版', maxArticles: 9999, maxStorage: 10240, allowCustomDomain: true, price: 299 }
// ]
// 
// export const mockTenants: Tenant[] = [
//   { id: 't1', name: '极客技术博客', domain: 'geek.freecity.com', status: 'ACTIVE', packageId: '2', expireTime: '2026-12-31', createdAt: '2025-01-01' },
//   { id: 't2', name: '生活随笔', domain: 'life.freecity.com', status: 'ACTIVE', packageId: '1', expireTime: '2026-06-30', createdAt: '2025-02-15' },
//   { id: 't3', name: '前端之旅', domain: 'fe.freecity.com', status: 'DISABLED', packageId: '2', expireTime: '2025-12-31', createdAt: '2025-03-10' }
// ]
// 
// export const mockArticles: Article[] = [
//   {
//     id: 'a1',
//     title: 'Vue 3 + TS 多租户架构实战',
//     content: '这是文章内容...',
//     authorId: 'u1',
//     authorName: 'Admin',
//     categoryId: 'c1',
//     categoryName: '技术',
//     tags: ['Vue3', 'TS'],
//     status: 'published',
//     tenantId: 't1',
//     publishTime: '2026-01-18',
//     createdAt: '2026-01-18',
//     updatedAt: '2026-01-18'
//   },
//   {
//     id: 'a2',
//     title: '如何优化 Vite 构建速度',
//     content: '优化指南...',
//     authorId: 'u2',
//     authorName: '小张',
//     categoryId: 'c1',
//     categoryName: '技术',
//     tags: ['Vite'],
//     status: 'published',
//     tenantId: 't1',
//     publishTime: '2026-01-17',
//     createdAt: '2026-01-17',
//     updatedAt: '2026-01-17'
//   },
//   {
//     id: 'a3',
//     title: '我的 2025 年度总结',
//     content: '回首过去...',
//     authorId: 'u2',
//     authorName: '小张',
//     categoryId: 'c2',
//     categoryName: '生活',
//     tags: ['总结'],
//     status: 'draft',
//     tenantId: 't1',
//     publishTime: '',
//     createdAt: '2026-01-15',
//     updatedAt: '2026-01-15'
//   }
// ]
