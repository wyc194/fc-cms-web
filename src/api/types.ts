// 租户信息
export interface WebInfo {
  title?: string
  description?: string
  keywords?: string
  authorName?: string
  logo?: string
  favicon?: string
  indexImg?: string
  notFoundImg?: string
  loadingImg?: string
  wxRewardImg?: string
  aliRewardImg?: string
  announcement?: string
  aboutMe?: string
  copyright?: string
  icp?: string
  theme?: string
  generateSitemap?: boolean
}

export interface SocialInfo {
  github?: string
  email?: string
  wechat?: string
  qq?: string
}

export interface CustomCode {
  css?: string
  js?: string
}

export interface LinkItem {
  name: string
  desc?: string
  url: string
}

export interface Tenant {
  id: number
  code: string
  name: string
  domain?: string
  status: 'ACTIVE' | 'DISABLED' | 'PENDING'
  packageId?: number
  packageName?: string
  expireTime?: string
  createTime: string
  updateTime: string
  webInfo?: WebInfo
  socialInfo?: SocialInfo
  customCode?: CustomCode
  links?: Record<string, LinkItem[]>
}

export interface TenantCreateResult {
  tenant: Tenant
  adminUsername: string
  adminPassword: string
}

// 文章信息
export interface Article {
  id: number
  title: string
  content: string
  renderedContent?: string
  summary?: string
  thumbnail?: string
  viewCount: number
  commentCount: number
  likeCount: number
  published: boolean
  top: boolean
  category?: Category
  tags: Tag[]
  createTime: string
  updateTime: string
}

// 标签信息
export interface Tag {
  id: number
  name: string
  articleCount?: number
}

// 分类信息
export interface Category {
  id: number
  parentId?: number
  name: string
  description?: string
  articleCount?: number
  weight?: number
  level?: number
  children?: Category[]
  createTime?: string
  updateTime?: string
}

// 评论信息
export interface Comment {
  id: number
  articleId: number
  articleTitle?: string
  nickname: string
  email: string
  content: string
  parentId?: number
  parentNickname?: string
  ip?: string
  userAgent?: string
  adminReply: boolean
  status: number // 0: PENDING, 1: PUBLISHED, 2: REJECTED
  createTime: string
  replies?: Comment[]
}

// 分页结果
export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// 用户信息
export interface User {
  id: number
  username: string
  nickname: string
  avatar?: string | null
  bio?: string | null
  email: string
  role: string
  tenantId?: number
  tenantCode?: string
  status?: 'ENABLED' | 'DISABLED'
  createTime: string
}

// 登录参数
export interface LoginParams {
  username: string
  password: string
}

// 登录返回结果
export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: User
}

// 套餐信息
export interface Package {
  id: number
  name: string
  maxArticles: number
  maxStorage: number // MB
  customDomainEnabled: boolean
  advancedStatsEnabled: boolean
  price: number
  description?: string | null
}
