import { defineStore } from 'pinia'
import type { User } from '@/api/types'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    accessToken: localStorage.getItem('access_token') || '',
    refreshToken: localStorage.getItem('refresh_token') || ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    token: (state) => state.accessToken,
    role: (state) => state.user?.role ?? 'VIEWER',
    isSuperAdmin: (state) => state.user?.role?.toUpperCase() === 'SUPER_ADMIN'
  },
  actions: {
    setUser(user: User) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    setTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
    },
    logout() {
      // 通知服务端撤销令牌（尽力而为：无论成败都清理本地状态）。
      // 必须用原生 axios，避免走拦截器——携带已失效令牌会触发 401→刷新→登出 的循环
      if (this.refreshToken) {
        const refreshToken = this.refreshToken
        const accessToken = this.accessToken
        axios
          .post('/api/auth/logout', { refreshToken }, { headers: { Authorization: `Bearer ${accessToken}` } })
          .catch(() => {})
      }
      this.user = null
      this.accessToken = ''
      this.refreshToken = ''
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('tenantId')
    }
  }
})
