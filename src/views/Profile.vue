<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-info">
        <h2 class="page-title">个人中心</h2>
        <p class="page-subtitle">管理个人信息、安全设置及偏好</p>
      </div>
    </div>

    <div class="page-main-scroll">
      <el-row :gutter="0" class="full-height-row">
        <el-col :lg="8" :md="24" class="sidebar-col">
          <el-card shadow="never" class="user-info-card">
            <div class="profile-header-bg"></div>
            <div class="user-avatar-wrapper">
              <el-avatar 
                :size="100" 
                class="profile-avatar"
                :src="userStore.user?.avatar"
              >
                {{ userStore.user?.nickname?.charAt(0) || 'A' }}
              </el-avatar>
              <div class="avatar-edit">
                <el-icon><Camera /></el-icon>
              </div>
            </div>
            <div class="user-details">
              <h3 class="user-name">{{ profileData?.nickname || userStore.user?.nickname }}</h3>
              <el-tag size="small" effect="plain" class="role-tag">
                {{ (profileData?.role || userStore.user?.role)?.toUpperCase() === 'SUPER_ADMIN' ? '超级管理员' : '租户管理员' }}
              </el-tag>
              
              <div class="user-stats">
                <div class="stat-item">
                  <div class="stat-value">12</div>
                  <div class="stat-label">文章</div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <div class="stat-value">458</div>
                  <div class="stat-label">访问</div>
                </div>
              </div>

              <el-divider />
              
              <div class="info-list">
                <div class="info-item">
                  <el-icon><User /></el-icon>
                  <span class="label">用户名</span>
                  <span class="value">{{ profileData?.username || userStore.user?.username }}</span>
                </div>
                <div class="info-item">
                  <el-icon><Message /></el-icon>
                  <span class="label">邮箱</span>
                  <span class="value">{{ profileData?.email || '-' }}</span>
                </div>
                <div class="info-item">
                  <el-icon><Calendar /></el-icon>
                  <span class="label">加入时间</span>
                  <span class="value">{{ formatDate(profileData?.createTime) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :lg="16" :md="24" class="main-col">
          <el-card shadow="never" class="settings-card">
            <el-tabs v-model="activeTab" class="profile-tabs flex-auto">
              <el-tab-pane label="基本资料" name="basic">
                <el-form 
                  ref="profileFormRef"
                  :model="profileForm" 
                  :rules="profileRules"
                  label-position="top" 
                  class="profile-form"
                >
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="昵称" prop="nickname">
                        <el-input v-model="profileForm.nickname" placeholder="请输入您的昵称" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="邮箱" prop="email">
                        <el-input v-model="profileForm.email" placeholder="请输入您的邮箱" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-form-item label="个人简介" prop="bio">
                    <el-input 
                      v-model="profileForm.bio" 
                      type="textarea" 
                      :rows="4" 
                      maxlength="200"
                      show-word-limit
                      placeholder="这家伙很懒，什么都没有留下。"
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :loading="updating" @click="handleUpdate">保存更改</el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane label="安全设置" name="security">
                <div class="security-list">
                  <div class="security-item">
                    <div class="item-info">
                      <div class="item-title">登录密码</div>
                      <div class="item-desc">定期修改密码可以提高账号安全性</div>
                    </div>
                    <el-button link type="primary" @click="showPasswordDialog = true">修改</el-button>
                  </div>
                  <div class="security-item">
                    <div class="item-info">
                      <div class="item-title">双重验证</div>
                      <div class="item-desc">未开启。开启后登录需要二次确认</div>
                    </div>
                    <el-button link type="primary">开启</el-button>
                  </div>
                  <div class="security-item">
                    <div class="item-info">
                      <div class="item-title">账号注销</div>
                      <div class="item-desc">
                        {{ canDeleteSelf ? '注销后所有数据将无法恢复' : '管理员账户暂不支持自助注销' }}
                      </div>
                    </div>
                    <el-button 
                      link 
                      type="danger" 
                      :disabled="!canDeleteSelf"
                      @click="handleDeleteAccount"
                    >
                      注销
                    </el-button>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px" append-to-body destroy-on-close>
      <el-form 
        ref="passwordFormRef"
        :model="passwordForm" 
        :rules="passwordRules"
        label-position="top"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
          <password-strength :password="passwordForm.newPassword" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="passwordUpdating" @click="handlePasswordUpdate">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import type { User as UserType } from '@/api/types'
import { User, Message, Calendar, Camera } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import PasswordStrength from '@/components/PasswordStrength.vue'
import { userApi } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('basic')
const showPasswordDialog = ref(false)
const updating = ref(false)
const passwordUpdating = ref(false)
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const profileData = ref<UserType | null>(null)

const canDeleteSelf = computed(() => {
  const role = userStore.user?.role?.toUpperCase()
  return role !== 'SUPER_ADMIN' && role !== 'TENANT_ADMIN'
})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

const profileForm = reactive({
  nickname: userStore.user?.nickname || '',
  email: userStore.user?.email || '',
  avatar: userStore.user?.avatar || '',
  bio: userStore.user?.bio || ''
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}

const fetchProfile = async () => {
  try {
    const res = await userApi.getProfile()
    profileData.value = res
    // 同步更新表单数据
    profileForm.nickname = res.nickname || ''
    profileForm.email = res.email || ''
    profileForm.avatar = res.avatar || ''
    profileForm.bio = res.bio || ''
    
    // 更新全局 store，确保头像和昵称在顶栏等位置同步
    userStore.setUser(res)
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  fetchProfile()
})

const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
  if (response.code === 200) {
    profileForm.avatar = response.data.url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(response.message || '头像上传失败')
  }
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('头像必须是 JPG 或 PNG 格式!')
    return false
  }
  if (rawFile.size / 1024 > 2) {
    ElMessage.error('头像大小不能超过 200KB!')
    return false
  }
  return true
}

const profileRules = reactive<FormRules>({
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = reactive<FormRules>({
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        const reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
        if (!reg.test(value)) {
          callback(new Error('密码必须包含字母和数字，且长度至少8位'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

const handleUpdate = async () => {
  if (!profileFormRef.value) return
  
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      updating.value = true
      try {
        const res = await userApi.updateProfile({
          nickname: profileForm.nickname,
          email: profileForm.email,
          avatar: profileForm.avatar,
          bio: profileForm.bio
        })
        profileData.value = res
        // 同步更新全局 store，保证顶栏头像等实时更新
        userStore.setUser(res)
        ElMessage.success('个人信息更新成功')
      } catch (error) {
        // error handled by interceptor
      } finally {
        updating.value = false
      }
    }
  })
}

const handlePasswordUpdate = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordUpdating.value = true
      try {
        await userApi.updatePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        ElMessage.success('密码修改成功，请重新登录')
        showPasswordDialog.value = false
        // 重置表单
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        
        // 登出
        userStore.logout()
        router.push('/login')
      } catch (error) {
        // error handled by interceptor
      } finally {
        passwordUpdating.value = false
      }
    }
  })
}

const handleDeleteAccount = () => {
  ElMessageBox.confirm(
    '确定要注销您的账号吗？此操作不可逆，所有数据将被永久删除！',
    '警告',
    {
      confirmButtonText: '确定注销',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await userApi.deleteAccount()
        ElMessage.success('账号已注销')
        userStore.logout()
        router.push('/login')
      } catch (error) {
        // error handled by interceptor
      }
    })
    .catch(() => {
      // cancel
    })
}
</script>

<style scoped>
.full-height-row {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  overflow: hidden; /* 关键：在 Row 级别吸收亚像素溢出，防止触发 Parent 的滚动条 */
}

.sidebar-col {
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

@media (max-width: 1200px) {
  .full-height-row {
    flex-direction: column;
    height: auto;
    flex: none;
    overflow: visible; /* 移动端恢复可见，允许跟随页面滚动 */
  }
  
  .sidebar-col {
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .sidebar-col, .main-col {
    flex: none;
    height: auto;
  }
  
  .user-info-card, .settings-card {
    height: auto;
  }
  
  .user-info-card :deep(.el-card__body),
  :deep(.el-tabs__content) {
    overflow-y: visible;
  }
}

.user-info-card {
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: center;
  border: none;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
}

.user-info-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-top: 0;
}

.profile-header-bg {
  height: 120px;
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
  margin: 0 -20px 0;
}

.user-avatar-wrapper {
  position: relative;
  margin-top: -50px;
  display: inline-block;
  margin-bottom: 16px;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: var(--el-box-shadow-light);
  font-size: 32px;
  background-color: var(--el-color-primary);
}

.avatar-edit {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--el-box-shadow-lighter);
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.3s;
}

.avatar-edit:hover {
  color: var(--el-color-primary);
  transform: scale(1.1);
}

.user-name {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.role-tag {
  margin-bottom: 24px;
}

.user-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}

.stat-item {
  padding: 0 24px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-divider {
  width: 1px;
  height: 24px;
  background-color: var(--el-border-color-lighter);
}

.info-list {
  text-align: left;
  padding: 0 20px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.info-item .el-icon {
  margin-right: 12px;
  color: var(--el-text-color-secondary);
  font-size: 16px;
}

.info-item .label {
  color: var(--el-text-color-secondary);
  width: 80px;
}

.info-item .value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.settings-card {
  height: 100%;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.settings-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.profile-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
}

:deep(.el-tab-pane) {
  height: 100%;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
  padding: 0 16px;
  border-bottom: 1px solid #f1f5f9;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
  padding: 0 24px;
  height: 48px;
}

:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}

.profile-form {
  padding: 20px 16px;
}

.security-list {
  padding-top: 10px;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.security-item:last-child {
  border-bottom: none;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
