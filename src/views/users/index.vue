<template>
  <div class="page-container users-management-page">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">成员管理</h2>
        <p class="page-subtitle">管理您的团队成员及其访问权限</p>
      </div>
        
      <div class="page-actions">
        <el-button type="primary" icon="Plus" @click="handleInvite">添加成员</el-button>
      </div>
    </div>

    <div class="page-main-scroll">
      <el-card shadow="never" class="table-card flex-auto">
        <div class="filter-container flex-fixed">
          <el-form :inline="true" :model="queryForm" class="search-form">
            <el-form-item label="用户搜索">
              <el-input 
                v-model="queryForm.keyword" 
                placeholder="姓名/邮箱/用户名" 
                clearable 
                @keyup.enter="handleSearch" 
                prefix-icon="Search"
                style="width: 220px"
              />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="queryForm.role" placeholder="全部角色" clearable style="width: 140px">
                <el-option v-if="isSuperAdmin" label="超级管理员" value="SUPER_ADMIN" />
                <el-option label="租户管理员" value="TENANT_ADMIN" />
                <el-option label="编辑" value="EDITOR" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table 
          :data="paginatedUsers" 
          height="100%"
          style="width: 100%" 
          v-loading="loading" 
          class="custom-table flex-auto"
        >
          <template #empty>
            <el-empty description="暂无成员数据" :image-size="100" />
          </template>
          <el-table-column label="成员信息" min-width="240">
            <template #default="{ row }">
              <div class="user-info-cell">
                <el-avatar :size="40" class="user-avatar" :src="row.avatar">
                  {{ row.nickname.charAt(0) }}
                </el-avatar>
                <div class="user-meta">
                  <div class="user-nickname">{{ row.nickname }}</div>
                  <div class="user-email">{{ row.email }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" width="150" />
          <el-table-column prop="role" label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)" effect="light">
                {{ getRoleName(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ENABLED' ? 'success' : 'danger'" round effect="light">
                {{ row.status === 'ENABLED' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastLoginTime" label="最后登录" width="180" />
          <el-table-column label="操作" width="150" fixed="right" align="right">
            <template #default="{ row }">
              <el-tooltip 
                v-if="!canOperateUser(row)" 
                :content="getDisabledTip(row)" 
                placement="top"
              >
                <span class="action-disabled">
                  <el-button link type="primary" disabled>编辑</el-button>
                  <el-divider direction="vertical" />
                  <el-button link type="danger" disabled>移除</el-button>
                </span>
              </el-tooltip>
              <template v-else>
                <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                <el-divider direction="vertical" />
                <el-button link type="danger" @click="handleDelete(row)">移除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container flex-fixed">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            background
            layout="total, sizes, prev, pager, next"
            :total="filteredUsers.length"
            :page-sizes="[10, 20, 50]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑用户弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogType === 'add' ? '添加成员' : '编辑成员'" 
      width="460px"
      destroy-on-close
      class="custom-dialog"
    >
      <el-form :model="form" :rules="userRules" ref="formRef" label-position="top">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入成员昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入成员邮箱" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="角色权限" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="租户管理员" value="TENANT_ADMIN" />
            <el-option label="编辑" value="EDITOR" />
            <el-option label="观察者" value="VIEWER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { userApi } from '@/api/user'
import type { User } from '@/api/types'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.isSuperAdmin)

/**
 * 判断是否可以操作目标用户
 */
const canOperateUser = (targetUser: User) => {
  // 1. 如果是超级管理员，可以操作所有人
  if (isSuperAdmin.value) return true
  
  // 2. 非超级管理员无权操作超级管理员
  if (targetUser.role === 'SUPER_ADMIN') return false
  
  // 3. 租户下的所有用户无权操作租户管理员
  if (targetUser.role === 'TENANT_ADMIN') return false
  
  return true
}

/**
 * 获取禁用操作的提示文字
 */
const getDisabledTip = (targetUser: User) => {
  if (targetUser.role === 'SUPER_ADMIN') return '无权操作超级管理员账户'
  if (targetUser.role === 'TENANT_ADMIN') return '无权操作租户管理员账户'
  return '无权操作该账户'
}

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const users = ref<User[]>([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

const queryForm = reactive({
  keyword: '',
  role: ''
})

const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await userApi.getUsers()
  } catch (error) {
    ElMessage.error('获取成员列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

const filteredUsers = computed(() => {
  const keyword = (queryForm.keyword || '').toLowerCase().trim()
  return users.value.filter(u => {
    const matchKeyword = !keyword || 
      (u.nickname || '').toLowerCase().includes(keyword) ||
      (u.email || '').toLowerCase().includes(keyword) ||
      (u.username || '').toLowerCase().includes(keyword)
    const matchRole = !queryForm.role || u.role === queryForm.role
    return matchKeyword && matchRole
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const form = reactive({
  id: undefined as number | undefined,
  nickname: '',
  email: '',
  username: '',
  role: 'EDITOR'
})

const userRules = reactive<FormRules>({
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
})

const getRoleName = (role: string) => {
  const roles: Record<string, string> = {
    SUPER_ADMIN: '系统管理员',
    TENANT_ADMIN: '租户管理员',
    EDITOR: '内容编辑',
    VIEWER: '观察员'
  }
  return roles[role?.toUpperCase()] || role
}

const getRoleTagType = (role: string) => {
  const tags: Record<string, string> = {
    SUPER_ADMIN: 'danger',
    TENANT_ADMIN: 'primary',
    EDITOR: 'success',
    VIEWER: 'info'
  }
  return tags[role?.toUpperCase()] || ''
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.role = ''
  currentPage.value = 1
  fetchUsers()
}

const handleInvite = () => {
  dialogType.value = 'add'
  Object.assign(form, { id: undefined, nickname: '', email: '', username: '', role: 'EDITOR' })
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handlePermissions = (row: User) => {
  ElMessage.info(`正在设置 ${row.nickname} 的详细权限`)
}

const handleDelete = (row: User) => {
  ElMessageBox.confirm(`确定要移除成员 ${row.nickname} 吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      await userApi.deleteUser(row.id)
      ElMessage.success('已移除')
      await fetchUsers()
    } catch (error) {
      ElMessage.error('移除失败')
    } finally {
      loading.value = false
    }
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (dialogType.value === 'add') {
          await userApi.createUser(form)
          ElMessage.success('添加成功')
        } else if (form.id) {
          await userApi.updateUser(form.id, form)
          ElMessage.success('修改成功')
        }
        await fetchUsers()
        dialogVisible.value = false
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.table-card {
  min-height: 500px;
}

.custom-table {
  min-height: 300px;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background-color: var(--el-color-primary-light-3);
  font-weight: bold;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-nickname {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: #64748b;
}
</style>
