<template>
  <div class="page-container">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">套餐管理</h2>
        <p class="page-subtitle">配置不同的租户套餐，定义资源限制与定价</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增套餐</el-button>
      </div>
    </div>

    <div class="page-main-scroll">
      <transition-group name="list-fade" tag="div" class="el-row package-grid">
        <el-col :span="8" v-for="pkg in packages" :key="pkg.id">
          <el-card shadow="hover" :class="['package-card', { 'is-featured': pkg.id === 2 }]">
            <div v-if="pkg.id === 2" class="featured-badge">最受欢迎</div>
            <div class="package-header">
              <h3 class="package-name">{{ pkg.name }}</h3>
              <div class="package-price">
                <span class="currency">¥</span>
                <span class="amount">{{ pkg.price }}</span>
                <span class="period">/月</span>
              </div>
            </div>
            
            <el-divider />
            
            <ul class="feature-list">
              <li>
                <el-icon class="feature-icon success"><Check /></el-icon>
                <span>最多 <strong>{{ pkg.maxArticles === 9999 ? '无限' : pkg.maxArticles }}</strong> 篇文章</span>
              </li>
              <li>
                <el-icon class="feature-icon success"><Check /></el-icon>
                <span><strong>{{ pkg.maxStorage }}MB</strong> 存储空间</span>
              </li>
              <li>
                <el-icon :class="['feature-icon', pkg.customDomainEnabled ? 'success' : 'info']">
                  <component :is="pkg.customDomainEnabled ? 'Check' : 'Close'" />
                </el-icon>
                <span :class="{ 'disabled-feature': !pkg.customDomainEnabled }">支持自定义域名</span>
              </li>
              <li>
                <el-icon class="feature-icon success"><Check /></el-icon>
                <span>基础数据分析</span>
              </li>
              <li>
                <el-icon :class="['feature-icon', pkg.advancedStatsEnabled ? 'success' : 'info']">
                  <component :is="pkg.advancedStatsEnabled ? 'Check' : 'Close'" />
                </el-icon>
                <span :class="{ 'disabled-feature': !pkg.advancedStatsEnabled }">高级统计报表</span>
              </li>
            </ul>

            <div class="package-actions">
              <el-button type="primary" plain class="action-btn" @click="handleEdit(pkg)">编辑套餐</el-button>
              <el-button type="danger" plain class="action-btn" @click="handleDelete(pkg)">删除套餐</el-button>
            </div>
          </el-card>
        </el-col>
      </transition-group>
    </div>

    <!-- 新增/编辑套餐弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月价格 (¥)" prop="price">
              <el-input-number v-model="form.price" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文章上限" prop="maxArticles">
              <el-input-number v-model="form.maxArticles" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存储空间 (MB)" prop="maxStorage">
              <el-input-number v-model="form.maxStorage" :min="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自定义域名" prop="customDomainEnabled">
              <el-switch v-model="form.customDomainEnabled" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="高级统计报表" prop="advancedStatsEnabled">
              <el-switch v-model="form.advancedStatsEnabled" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="套餐描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入套餐描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { packageApi } from '@/api/package'
import { Plus, Check, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Package } from '@/api/types'

const packages = ref<Package[]>([])
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const isEdit = ref(false)

const fetchPackages = async () => {
  try {
    const res = await packageApi.getPackages()
    packages.value = res
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  }
}

onMounted(() => {
  fetchPackages()
})

const dialogTitle = computed(() => isEdit.value ? '编辑套餐' : '新增套餐')

const form = reactive<Partial<Package>>({
  id: undefined,
  name: '',
  price: 0,
  maxArticles: 100,
  maxStorage: 500,
  customDomainEnabled: false,
  advancedStatsEnabled: false,
  description: ''
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入套餐名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  maxArticles: [
    { required: true, message: '请输入文章上限', trigger: 'blur' }
  ],
  maxStorage: [
    { required: true, message: '请输入存储空间上限', trigger: 'blur' }
  ]
})

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: undefined,
    name: '',
    price: 0,
    maxArticles: 100,
    maxStorage: 500,
    customDomainEnabled: false,
    advancedStatsEnabled: false,
    description: ''
  })
  dialogVisible.value = true
}

const handleEdit = (pkg: Package) => {
  isEdit.value = true
  Object.assign(form, { ...pkg })
  dialogVisible.value = true
}

const handleDelete = (pkg: Package) => {
  ElMessageBox.confirm(
    `确定要删除套餐 "${pkg.name}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await packageApi.deletePackage(Number(pkg.id))
      ElMessage.success('删除成功')
      fetchPackages()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await packageApi.updatePackage(form)
          ElMessage.success('更新成功')
        } else {
          await packageApi.createPackage(form)
          ElMessage.success('添加成功')
        }
        fetchPackages()
        dialogVisible.value = false
      } catch (error) {
        console.error('保存失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
.package-grid {
  padding: 16px 20px;
  width: 100%;
  margin: 0;
}

.package-card {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  margin: 0 8px;
  transition: all 0.3s ease;
  overflow: visible;
}

.package-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.package-card.is-featured {
  border: 2px solid #4f46e5;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.1);
}

.featured-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #4f46e5;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
}

.package-header {
  text-align: center;
  padding: 12px 0;
}

.package-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.package-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  color: #1e293b;
}

.currency {
  font-size: 18px;
  font-weight: 600;
  margin-right: 2px;
}

.amount {
  font-size: 42px;
  font-weight: 800;
}

.period {
  font-size: 14px;
  color: #64748b;
  margin-left: 4px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 24px 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  margin: 16px;
  font-size: 14px;
  color: #475569;
}

.feature-icon {
  font-size: 18px;
  margin-right: 12px;
}

.feature-icon.success {
  color: #22c55e;
}

.feature-icon.info {
  color: #cbd5e1;
}

.disabled-feature {
  color: #94a3b8;
  text-decoration: line-through;
}

.package-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.package-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.action-btn {
  width: 100%;
  height: 34px;
  border-radius: 10px;
  font-weight: 600;
}

:deep(.el-divider) {
  margin: 20px 0;
}

/* 列表动画 */
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.4s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-fade-move {
  transition: transform 0.4s ease;
}
</style>
