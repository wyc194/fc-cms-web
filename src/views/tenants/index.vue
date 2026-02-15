<template>
  <div class="page-container">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">租户管理</h2>
        <p class="page-subtitle">管理所有博客租户、套餐分配及状态控制</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增租户</el-button>
      </div>
    </div>

    <div class="page-main-scroll">
      <el-row :gutter="20" class="stat-row flex-fixed">
        <el-col :span="6" v-for="item in stats" :key="item.label">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-label">{{ item.label }}</div>
                <div class="stat-value">{{ item.value }}</div>
              </div>
              <el-icon :class="['stat-icon', item.type]"><component :is="item.icon" /></el-icon>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="table-card flex-auto">
        <div class="filter-container flex-fixed">
          <el-form :inline="true" :model="queryForm" class="search-form">
            <el-form-item label="租户名称">
              <el-input v-model="queryForm.name" placeholder="搜索租户名称" clearable @keyup.enter="handleSearch" prefix-icon="Search" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 140px">
                <el-option label="运行中" value="ACTIVE" />
                <el-option label="已禁用" value="DISABLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="paginatedTenants" class="custom-table flex-auto" v-loading="loading">
          <template #empty>
            <el-empty description="暂无租户数据" :image-size="100" />
          </template>
          <el-table-column prop="name" label="博客名称" min-width="180">
            <template #default="{ row }">
              <div class="tenant-info-cell">
                <span class="tenant-name">{{ row.name }}</span>
                <span class="tenant-id">ID: {{ row.id }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="domain" label="域名" min-width="200">
            <template #default="{ row }">
              <el-link type="primary" :underline="false">{{ row.domain }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="packageId" label="套餐类型" width="120">
            <template #default="{ row }">
              <el-tag :type="row.packageId === '3' ? 'danger' : row.packageId === '2' ? 'success' : 'info'" effect="light">
                {{ getPackageName(row.packageId) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" round effect="light">
                {{ row.status === 'ACTIVE' ? '运行中' : '已禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="120" />
          <el-table-column label="操作" width="180" fixed="right" align="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-divider direction="vertical" />
              <el-button link :type="row.status === 'ACTIVE' ? 'warning' : 'success'" @click="handleToggleStatus(row)">
                {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
              </el-button>
              <el-divider direction="vertical" />
              <el-button 
                link 
                type="danger" 
                :disabled="row.code === DEFAULT_TENANT_CODE" 
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container flex-fixed">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            background
            layout="total, sizes, prev, pager, next"
            :total="filteredTenants.length"
            :page-sizes="[10, 20, 50]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑租户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增租户' : '编辑租户'"
      width="520px"
      class="custom-dialog"
      destroy-on-close
    >
      <el-form :model="form" :rules="tenantRules" ref="formRef" label-position="top" class="dialog-form">
        <el-form-item label="租户编码" prop="code" v-if="dialogType === 'add'">
          <el-input v-model="form.code" placeholder="请输入租户编码（唯一标识）" />
        </el-form-item>
        <el-form-item label="博客名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入博客名称" />
        </el-form-item>
        <el-form-item label="二级域名" prop="domain">
          <el-input v-model="form.domain" placeholder="请输入二级域名">
            <template #append>.freecity.com</template>
          </el-input>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐选择" prop="packageId">
              <el-select v-model="form.packageId" placeholder="请选择套餐" style="width: 100%">
                <el-option
                  v-for="pkg in packages"
                  :key="pkg.id"
                  :label="pkg.name"
                  :value="pkg.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expireTime">
              <el-date-picker
                v-model="form.expireTime"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 管理员凭据弹窗 -->
    <el-dialog
      v-model="credentialDialogVisible"
      title="租户创建成功"
      width="420px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      class="custom-dialog credential-dialog"
    >
      <div class="credential-container">
        <el-alert
          title="请务必保存以下管理员账号信息，关闭后将无法再次查看明文密码。"
          type="warning"
          :closable="false"
          show-icon
          class="mb-20"
        />
        <div class="credential-card">
          <div class="credential-item">
            <span class="label">管理账号</span>
            <div class="value-box">
              <code>{{ generatedCredentials.username }}</code>
              <el-button link type="primary" icon="DocumentCopy" @click="copyToClipboard(generatedCredentials.username)">复制</el-button>
            </div>
          </div>
          <div class="credential-item">
            <span class="label">初始密码</span>
            <div class="value-box">
              <code>{{ generatedCredentials.password }}</code>
              <el-button link type="primary" icon="DocumentCopy" @click="copyToClipboard(generatedCredentials.password)">复制</el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="credentialDialogVisible = false">我已妥善保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { packageApi } from '@/api/package'
import { tenantApi } from '@/api/tenant'
import type { Tenant, Package } from '@/api/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Search, Monitor, Box, Timer, Check, DocumentCopy } from '@element-plus/icons-vue'

// 获取默认租户编码
const DEFAULT_TENANT_CODE = import.meta.env.VITE_DEFAULT_TENANT_CODE || 'admin'

const tenants = ref<Tenant[]>([])
const packages = ref<Package[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const loading = ref(false)
const formRef = ref<FormInstance>()

// 管理员凭据展示
const credentialDialogVisible = ref(false)
const generatedCredentials = reactive({
  username: '',
  password: ''
})

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

const queryForm = reactive({
  name: '',
  status: ''
})

const fetchTenants = async () => {
  loading.value = true
  try {
    const [tenantsRes, packagesRes] = await Promise.all([
      tenantApi.getTenants(),
      packageApi.getPackages()
    ])
    tenants.value = tenantsRes
    packages.value = packagesRes
  } catch (error) {
    ElMessage.error('获取租户列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTenants()
})

const stats = computed(() => [
  { label: '总租户数', value: tenants.value.length, icon: Box, type: 'primary' },
  { label: '运行中', value: tenants.value.filter(t => t.status === 'ACTIVE').length, icon: Check, type: 'success' },
  { label: '已到期', value: 0, icon: Timer, type: 'warning' },
  { label: '活跃域名', value: tenants.value.length, icon: Monitor, type: 'info' }
])

const filteredTenants = computed(() => {
  const nameQuery = queryForm.name?.trim().toLowerCase() || ''
  return tenants.value.filter(t => {
    const matchName = (t.name?.toLowerCase() || '').includes(nameQuery)
    const matchDomain = (t.domain?.toLowerCase() || '').includes(nameQuery)
    const matchStatus = !queryForm.status || t.status === queryForm.status
    return (matchName || matchDomain) && matchStatus
  })
})

const paginatedTenants = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTenants.value.slice(start, end)
})

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const handleSearch = () => {
  currentPage.value = 1
  fetchTenants()
}

const resetQuery = () => {
  queryForm.name = ''
  queryForm.status = ''
  currentPage.value = 1
  fetchTenants()
}

const getPackageName = (id: number | string | undefined) => {
  if (!id) return '未分配'
  return packages.value.find(p => p.id === Number(id))?.name || '未知套餐'
}

const form = reactive({
  id: undefined as number | undefined,
  code: '',
  name: '',
  domain: '',
  packageId: '' as string | number,
  expireTime: '',
  status: 'ACTIVE' as const
})

const handleAdd = () => {
  dialogType.value = 'add'
  Object.assign(form, {
    id: undefined,
    code: '',
    name: '',
    domain: '',
    packageId: '',
    expireTime: '',
    status: 'ACTIVE'
  })
  dialogVisible.value = true
}

const handleEdit = (row: Tenant) => {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleToggleStatus = (row: Tenant) => {
  const isDefaultTenant = row.code === DEFAULT_TENANT_CODE
  const isDisabling = row.status === 'ACTIVE'
  const statusText = isDisabling ? '禁用' : '启用'
  
  let confirmMessage = `确定要${statusText}该租户吗？`
  let confirmTitle = '提示'
  
  if (isDisabling && isDefaultTenant) {
    confirmMessage = '此租户为默认租户，禁用后将导致网站和管理端都不可使用。'
    confirmTitle = '严重警告'
  }

  ElMessageBox.confirm(confirmMessage, confirmTitle, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: isDefaultTenant && isDisabling ? 'error' : 'warning'
  }).then(async () => {
    loading.value = true
    try {
      await tenantApi.updateTenant(row.id as number, {
        status: row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
      })
      ElMessage.success(`${statusText}成功`)
      await fetchTenants()
    } catch (error: any) {
      ElMessage.error(error.message || `${statusText}失败`)
    } finally {
      loading.value = false
    }
  })
}

const handleDelete = (row: Tenant) => {
  if (row.code === DEFAULT_TENANT_CODE) {
    ElMessage.warning('默认租户不允许删除')
    return
  }
  ElMessageBox.confirm('确定要删除该租户吗？此操作不可逆！', '警告', {
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      await tenantApi.deleteTenant(row.id as number)
      ElMessage.success('删除成功')
      await fetchTenants()
    } catch (error) {
      ElMessage.error('删除失败')
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
          const res = await tenantApi.createTenant(form as any)
          generatedCredentials.username = res.adminUsername
          generatedCredentials.password = res.adminPassword
          ElMessage.success('新增成功')
          dialogVisible.value = false
          credentialDialogVisible.value = true
        } else {
          await tenantApi.updateTenant(form.id as number, form as any)
          ElMessage.success('修改成功')
          dialogVisible.value = false
        }
        await fetchTenants()
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const tenantRules = reactive<FormRules>({
  code: [
    { required: true, message: '请输入租户编码', trigger: 'blur' },
    { pattern: /^[a-z0-9]+$/, message: '编码仅支持小写字母和数字', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入博客名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  domain: [
    { required: true, message: '请输入二级域名', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '域名仅支持小写字母、数字和连字符', trigger: 'blur' }
  ],
  packageId: [
    { required: true, message: '请选择套餐', trigger: 'change' }
  ],
  expireTime: [
    { required: true, message: '请选择过期时间', trigger: 'change' }
  ]
})
</script>

<style scoped>
.stat-row {
  margin: 0;
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  background-color: #fff;
}

.stat-card {
  height: 100%;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  box-shadow: none;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.primary { background-color: #eef2ff; color: #4f46e5; }
.stat-icon.success { background-color: #f0fdf4; color: #22c55e; }
.stat-icon.warning { background-color: #fffbeb; color: #f59e0b; }
.stat-icon.info { background-color: #f8fafc; color: #64748b; }

.table-card {
  min-height: 400px; /* 确保表格区域在小窗口下不消失 */
}

.tenant-info-cell {
  display: flex;
  flex-direction: column;
}

.tenant-name {
  font-weight: 600;
  color: #1e293b;
}

.tenant-id {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

.custom-table {
  flex: 1;
  min-height: 260px; /* 仅保留基础高度确保表头可见，其余交给 flex 自动伸缩 */
}

:deep(.el-table__row) {
  cursor: pointer;
}

.dialog-form {
  padding: 0 12px;
}

.pagination-container {
  padding: 16px 0 0;
  display: flex;
  justify-content: flex-end;
}

.mb-20 {
  margin-bottom: 20px;
}

.credential-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.credential-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credential-item:not(:last-child) {
  margin-bottom: 16px;
}

.credential-item .label {
  font-size: 13px;
  color: #6c757d;
}

.credential-item .value-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.credential-item code {
  font-family: Monaco, Consolas, "Lucida Console", monospace;
  font-size: 15px;
  color: #212529;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
