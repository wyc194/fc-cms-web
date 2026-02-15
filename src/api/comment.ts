import request from '@/utils/request'
import type { Comment, PageResult } from './types'

export const commentApi = {
  // 获取评论列表 (管理端)
  getComments(params: { 
    page?: number; 
    size?: number; 
    articleId?: number;
    keyword?: string;
    status?: number;
  }) {
    if (params.articleId) {
      return request.get<PageResult<Comment>>(`/comments/admin/article/${params.articleId}`, { params })
    }
    return request.get<PageResult<Comment>>('/comments/admin/all', { params })
  },

  // 审核评论 (支持批量)
  auditComments(ids: number[], status: number) {
    return request.put('/comments/admin/status', ids, { params: { status } })
  },

  // 删除评论 (支持批量)
  deleteComments(ids: number[]) {
    return request.delete('/comments/admin', { data: ids })
  },

  // 回复评论 (支持批量)
  replyComments(ids: number[], content: string) {
    return request.post('/comments/admin/reply', ids, { params: { content } })
  }
}
