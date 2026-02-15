import request from '@/utils/request'
import type { User } from './types'

export interface ProfileDto {
  nickname: string
  email: string
  avatar?: string | null
  bio?: string | null
}

export interface PasswordUpdateDto {
  oldPassword: string
  newPassword: string
}

export const userApi = {
  // 获取成员列表
  getUsers() {
    return request.get<User[]>('/admin/users')
  },

  // 获取成员详情
  getUser(id: number) {
    return request.get<User>(`/admin/users/${id}`)
  },

  // 创建成员
  createUser(data: Partial<User>) {
    return request.post<User>('/admin/users', data)
  },

  // 更新成员
  updateUser(id: number, data: Partial<User>) {
    return request.put<User>('/admin/users', { ...data, id })
  },

  // 删除成员
  deleteUser(id: number) {
    return request.delete(`/admin/users/${id}`)
  },

  // 获取个人资料
  getProfile() {
    return request.get<User>('/admin/profile')
  },

  // 更新个人资料
  updateProfile(data: ProfileDto) {
    return request.put<User>('/admin/profile', data)
  },

  // 修改密码
  updatePassword(data: PasswordUpdateDto) {
    return request.put('/admin/profile/password', data)
  },

  // 注销账号
  deleteAccount() {
    return request.delete('/admin/profile')
  }
}
