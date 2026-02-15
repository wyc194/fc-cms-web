<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>
    </div>
    
    <transition name="fade-transform" mode="out-in" appear>
      <div class="login-content">
        <div class="login-brand">
          <div class="logo-wrapper">
            <el-icon :size="40" color="white"><Monitor /></el-icon>
          </div>
          <h1>FreeCity CMS</h1>
          <p>现代化的多租户内容管理系统</p>
        </div>

        <el-card class="login-card" shadow="always">
          <div class="login-header">
            <h2>欢迎回来</h2>
            <p>请登录您的账号以继续</p>
          </div>

          <el-form 
            ref="loginFormRef" 
            :model="loginForm" 
            :rules="loginRules" 
            label-position="top"
            size="large"
          >
            <el-form-item prop="username" label="用户名">
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入用户名" 
                :prefix-icon="UserIcon"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item prop="password" label="密码">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码" 
                :prefix-icon="Lock"
                show-password 
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            
            <div class="login-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <el-link type="primary" :underline="false" @click="handleForgotPassword">忘记密码？</el-link>
            </div>

            <el-button 
              type="primary" 
              class="login-button" 
              :loading="loading" 
              :disabled="lockoutRemaining > 0"
              @click="handleLogin"
            >
              {{ lockoutRemaining > 0 ? `锁定中 (${lockoutRemaining}s)` : '登 录' }}
            </el-button>
          </el-form>

          <transition name="el-fade-in">
            <div v-if="lockoutRemaining > 0" class="lockout-notice">
              <el-icon class="lock-icon"><Lock /></el-icon>
              <p>由于尝试次数过多，您的账号已暂时锁定。请于 {{ lockoutRemaining }} 秒后重试，或联系系统管理员。</p>
            </div>
          </transition>

          <div class="login-footer">
            <p>还没有账号？ <el-link type="primary" :underline="false" @click="handleApplyTenant">立即申请租户</el-link></p>
          </div>

          <div class="login-tips" v-if="!lockoutRemaining">
            <el-divider>
              <span class="divider-text">登录遇到问题？</span>
            </el-divider>
            <ul class="tips-list">
              <li>默认管理员账号为 <code>admin</code></li>
              <li>如忘记密码，请联系您的上级管理员重置</li>
              <li>确保浏览器已启用 Cookie 和本地存储</li>
            </ul>
          </div>
        </el-card>
        
        <div class="login-copyright">
          &copy; 2026 FreeCity. All rights reserved.
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User as UserIcon, Lock, Monitor } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { authApi } from '@/api/auth'
import type { User } from '@/api/types'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)
const lockoutRemaining = ref(0) // 前端锁定剩余秒数

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度不能少于3位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
})

// 检查前端锁定状态
const checkLockout = () => {
  const lockTime = localStorage.getItem('login_lock_until')
  if (lockTime) {
    const remaining = Math.ceil((parseInt(lockTime) - Date.now()) / 1000)
    if (remaining > 0) {
      lockoutRemaining.value = remaining
      const timer = setInterval(() => {
        lockoutRemaining.value--
        if (lockoutRemaining.value <= 0) {
          clearInterval(timer)
          localStorage.removeItem('login_lock_until')
        }
      }, 1000)
    } else {
      localStorage.removeItem('login_lock_until')
    }
  }
}

onMounted(() => {
  checkLockout()
  const savedUsername = localStorage.getItem('remembered_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    rememberMe.value = true
  }
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  // 检查前端锁定
  if (lockoutRemaining.value > 0) {
    ElMessage.warning(`操作过于频繁，请在 ${lockoutRemaining.value} 秒后再试`)
    return
  }
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await authApi.login({
          username: loginForm.username,
          password: loginForm.password
        })
        
        // 登录成功，清除前端锁定计数
        localStorage.removeItem('login_fail_count')
        localStorage.removeItem('login_lock_until')
        
        // 处理“记住我”
        if (rememberMe.value) {
          localStorage.setItem('remembered_username', loginForm.username)
        } else {
          localStorage.removeItem('remembered_username')
        }
        
        // 保存用户信息和 Token
        userStore.setUser(res.user)
        userStore.setTokens(res.accessToken, res.refreshToken)
        
        // 如果是租户管理员，保存租户 ID 到本地，用于请求拦截器
        if (res.user.tenantId) {
          localStorage.setItem('tenantId', res.user.tenantId.toString())
        } else {
          localStorage.removeItem('tenantId')
        }
        
        ElMessage.success({
          message: `欢迎回来，${res.user.nickname}`,
          type: 'success',
          duration: 2000
        })
        
        router.push('/')
      } catch (error: any) {
        console.error('登录失败:', error)
        // 处理前端锁定逻辑
        const failCount = parseInt(localStorage.getItem('login_fail_count') || '0') + 1
        localStorage.setItem('login_fail_count', failCount.toString())
        
        if (failCount >= 3) {
          const lockUntil = Date.now() + 5 * 60 * 1000 // 锁定 5 分钟
          localStorage.setItem('login_lock_until', lockUntil.toString())
          localStorage.removeItem('login_fail_count')
          checkLockout()
        }
      } finally {
        loading.value = false
      }
    }
  })
}

const handleForgotPassword = () => {
  ElMessageBox.alert(
    '请联系系统管理员或发送邮件至 admin@freecity.com 重置您的密码。',
    '找回密码',
    {
      confirmButtonText: '知道了',
      type: 'info'
    }
  )
}

const handleApplyTenant = () => {
  ElMessageBox.alert(
    '暂不支持在线申请租户，请直接联系商务经理：138-xxxx-xxxx。',
    '申请租户',
    {
      confirmButtonText: '知道了',
      type: 'info'
    }
  )
}
</script>

<style scoped>
.login-container {
  min-height: 600px;
  min-width: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: auto;
  background-color: #f8fafc;
  padding: 2px 0;
}

.login-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  opacity: 0.4;
}

.bg-shape-1 {
  width: 500px;
  height: 500px;
  background: var(--el-color-primary-light-3);
  top: -250px;
  right: -100px;
}

.bg-shape-2 {
  width: 400px;
  height: 400px;
  background: #60a5fa;
  bottom: -150px;
  left: -100px;
}

.bg-shape-3 {
  width: 300px;
  height: 300px;
  background: #c084fc;
  top: 40%;
  left: 30%;
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-brand {
  text-align: center;
  margin-bottom: 25px;
}

.logo-wrapper {
  width: 64px;
  height: 64px;
  background: var(--el-color-primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
}

.login-brand h1 {
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.login-brand p {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.login-card {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 5px;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
}

.login-header p {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.lockout-notice {
  margin-top: 20px;
  padding: 12px;
  background-color: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-color-danger);
  font-size: 13px;
  line-height: 1.5;
}

.lock-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.login-tips {
  margin-top: 32px;
}

.divider-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: normal;
}

.tips-list {
  padding-left: 18px;
  margin: 12px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tips-list li {
  margin-bottom: 6px;
}

.tips-list code {
  background: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 4px;
  color: var(--el-color-primary);
}

.login-copyright {
  margin-top: 25px;
  color: #94a3b8;
  font-size: 12px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 4px 15px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
  padding-bottom: 4px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .login-container {
    padding: 20px 0;
  }
  .login-content {
    padding: 15px;
  }
  .login-card {
    border-radius: 12px;
  }
}

@media (max-height: 700px) {
  .login-brand { margin-bottom: 20px; }
  .login-brand h1 { font-size: 24px; }
  .logo-wrapper { width: 60px; height: 60px; margin-bottom: 15px; }
  .login-copyright { margin-top: 20px; }
}
</style>
