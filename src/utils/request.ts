import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// NProgress 配置
NProgress.configure({ 
  showSpinner: false,
  easing: 'ease',
  speed: 500
})

/**
 * 后端统一返回结构
 */
export interface Result<T = any> {
  code: number
  message: string
  data: T
}

// 扩展 Axios 模块类型，使请求方法直接返回 data 字段的类型
declare module 'axios' {
  export interface AxiosInstance {
    <T = any>(config: AxiosRequestConfig): Promise<T>
    request<T = any>(config: AxiosRequestConfig): Promise<T>
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
    head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  }
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 5000
})

// 并发请求计数，用于 NProgress 进度条管理
let requestCount = 0

function startLoading() {
  if (requestCount === 0) {
    NProgress.start()
  }
  requestCount++
}

function stopLoading() {
  requestCount--
  if (requestCount <= 0) {
    NProgress.done()
    requestCount = 0 // 重置以防万一
  }
}

// 标记是否正在跳转登录，防止多个 401 导致多次弹窗
let isRelogging = false
// 标记是否正在刷新 token
let isRefreshing = false
// 存储因 token 过期导致失败的请求队列
let requestsQueue: any[] = []

/**
 * 递归将对象中的空字符串转换为 null
 */
function convertEmptyStringsToNull(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string') {
    return obj === '' ? null : obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertEmptyStringsToNull(item))
  }
  
  if (typeof obj === 'object') {
    // 排除 FormData, Blob, File 等特殊对象
    if (obj instanceof FormData || obj instanceof Blob || obj instanceof File || obj instanceof Date) {
      return obj
    }

    // 处理普通对象
    const newObj: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertEmptyStringsToNull(obj[key])
      }
    }
    return newObj
  }
  
  return obj
}

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    startLoading()
    // 从 localStorage 获取租户 ID
    const tenantId = localStorage.getItem('tenantId')
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    }
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 统一处理请求参数中的空字符串
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = convertEmptyStringsToNull(config.data)
    }
    
    if (config.params && typeof config.params === 'object') {
      config.params = convertEmptyStringsToNull(config.params)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    stopLoading()
    const res = response.data
    
    // 兼容不同的后端返回结构
    // 如果 code 是 401，视为登录失效
    if (res.code === 401) {
      const config = response.config
      return handleTokenExpired(config)
    }

    // 这里可以根据后端的业务状态码进行处理
    if (res.code !== 200 && res.code !== 0) {
      ElMessage.error(res.message || '系统错误')
      return Promise.reject(new Error(res.message || '系统错误'))
    }
    return res.data
  },
  async (error) => {
    stopLoading()
    if (error.response) {
      const { status, config } = error.response
      
      if (status === 401) {
        return handleTokenExpired(config)
      }
      
      if (status === 403) {
        const msg = error.response.data?.message || '权限不足，无法访问'
        ElMessage.error(msg)
        return Promise.reject(new Error(msg))
      }

      // 处理其他 HTTP 错误
      const message = error.response.data?.message || error.message || '网络错误'
      ElMessage.error(message)
    } else {
      // 处理超时或断网
      if (error.message.includes('timeout')) {
        ElMessage.error('请求超时，请检查网络环境')
      } else if (error.message.includes('Network Error')) {
        ElMessage.error('网络连接异常，请确保后端服务已启动')
      } else {
        ElMessage.error(error.message || '未知网络错误')
      }
    }
    return Promise.reject(error)
  }
)

/**
 * 处理 Token 过期
 */
async function handleTokenExpired(config: any) {
  const userStore = useUserStore()
  const refreshToken = localStorage.getItem('refresh_token')

  if (!refreshToken) {
    handleUnauthorized()
    return Promise.reject(new Error('登录已过期'))
  }

  if (!isRefreshing) {
    isRefreshing = true
    try {
      // 这里的请求需要使用原生的 axios 实例，避免触发拦截器死循环
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`, {
        refreshToken
      })
      
      // 注意：由于使用的是原生 axios，返回的 res.data 才是后端返回的 Result 对象
      // 所以需要从 res.data.data 中获取真正的 Token 数据
      if (res.data && res.data.code === 200) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data
        userStore.setTokens(newAccessToken, newRefreshToken)
        
        // 刷新成功，重新执行队列中的请求
        requestsQueue.forEach((cb) => cb(newAccessToken))
        requestsQueue = []
        
        // 重新执行当前请求
        config.headers['Authorization'] = `Bearer ${newAccessToken}`
        return service(config)
      } else {
        throw new Error(res.data?.message || 'Token 刷新失败')
      }
    } catch (err) {
      // 刷新失败，强制退出
      handleUnauthorized()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  } else {
    // 正在刷新中，将请求加入队列
    return new Promise((resolve) => {
      requestsQueue.push((token: string) => {
        config.headers['Authorization'] = `Bearer ${token}`
        resolve(service(config))
      })
    })
  }
}

/**
 * 处理 401 未授权
 */
function handleUnauthorized() {
  if (isRelogging) return
  isRelogging = true
  
  const userStore = useUserStore()
  
  ElMessageBox.confirm('登录状态已失效，您可以留在当前页面，或重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    window.location.href = '/login'
  }).catch(() => {
    isRelogging = false
  })
}

export default service
