import request from '@/utils/request'
import type { LoginParams, LoginResult } from './types'

export const authApi = {
  /**
   * 登录
   */
  login(data: LoginParams) {
    return request<LoginResult>({
      url: '/auth/login',
      method: 'post',
      data
    })
  },

  /**
   * 刷新 Token
   */
  refreshToken(refreshToken: string) {
    return request<LoginResult>({
      url: '/auth/refresh',
      method: 'post',
      data: { refreshToken }
    })
  }
}
