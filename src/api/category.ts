import request from '@/utils/request'
import type { Category, Tag } from './types'

export const categoryApi = {
  // 获取分类列表
  getCategories() {
    return request.get<Category[]>('/admin/categories')
  },

  // 获取分类树
  getCategoryTree() {
    return request.get<Category[]>('/admin/categories/tree')
  },

  // 保存/创建分类
  saveCategory(data: Partial<Category>) {
    if (data.id) {
      return request.put<Category>('/admin/categories', data)
    }
    return request.post<Category>('/admin/categories', data)
  },

  // 删除分类
  deleteCategory(id: number) {
    return request.delete(`/admin/categories/${id}`)
  }
}

export const tagApi = {
  // 获取标签列表
  getTags() {
    return request.get<Tag[]>('/admin/tags')
  },

  // 保存/创建标签
  saveTag(data: Partial<Tag>) {
    if (data.id) {
      return request.put<Tag>('/admin/tags', data)
    }
    return request.post<Tag>('/admin/tags', data)
  },

  // 删除标签
  deleteTag(id: number) {
    return request.delete(`/admin/tags/${id}`)
  }
}
