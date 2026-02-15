import request from '@/utils/request'
import type { Article, PageResult } from './types'

export const articleApi = {
  // 获取文章列表
  getArticles(params?: { 
    page?: number; 
    size?: number; 
    categoryId?: number; 
    tagId?: number;
    title?: string;
    published?: boolean;
  }) {
    if (params?.categoryId) {
      return request.get<PageResult<Article>>(`/admin/articles/category/${params.categoryId}`, { params })
    }
    if (params?.tagId) {
      return request.get<PageResult<Article>>(`/admin/articles/tag/${params.tagId}`, { params })
    }
    return request.get<PageResult<Article>>('/admin/articles', { params })
  },

  // 获取文章详情
  getArticle(id: number) {
    return request.get<Article>(`/admin/articles/${id}`)
  },

  // 保存/创建文章
  saveArticle(data: Partial<Article>) {
    if (data.id) {
      return request.put<Article>('/admin/articles', data)
    }
    return request.post<Article>('/admin/articles', data)
  },

  // 删除文章
  deleteArticle(id: number) {
    return request.delete(`/admin/articles/${id}`)
  },

  // 增加阅读量
  incrementViewCount(id: number) {
    return request.patch(`/admin/articles/${id}/view`)
  }
}
