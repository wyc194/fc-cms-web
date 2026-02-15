import { defineStore } from 'pinia'
import type { User } from '@/api/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    accessToken: localStorage.getItem('access_token') || '',
    refreshToken: localStorage.getItem('refresh_token') || ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    token: (state) => state.accessToken,
    role: (state) => state.user?.role || 'viewer',
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
