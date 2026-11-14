<template>
  <div class="page-container">
    <div class="page-action-header">
      <div class="header-info">
        <h2 class="page-title">系统监控</h2>
        <p class="page-subtitle">实时服务器指标，每 {{ refreshSeconds }} 秒自动刷新</p>
      </div>
      <div class="page-actions">
        <el-button type="primary" plain icon="Refresh" :loading="loading" @click="fetchMetrics">刷新</el-button>
      </div>
    </div>

    <div class="page-main-scroll">
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="metric-card" v-loading="loading">
            <template #header>
              <span>CPU</span>
              <el-tag size="small" effect="light">{{ metrics.processors }} 核</el-tag>
            </template>
            <div class="metric-value">
              {{ cpuText }}<span v-if="cpuAvailable" class="metric-unit">%</span>
            </div>
            <el-progress
              v-if="cpuAvailable"
              :percentage="Math.min(100, Math.max(0, metrics.cpuUsage ?? 0))"
              :stroke-width="10"
              :show-text="false"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="metric-card">
            <template #header><span>物理内存</span></template>
            <div class="metric-value">{{ physicalPercent }}<span class="metric-unit">%</span></div>
            <el-progress
              :percentage="physicalPercent"
              :stroke-width="10"
              color="#e6a23c"
              :show-text="false"
            />
            <div class="metric-detail">
              已用 {{ metrics.physicalUsedMb }} MB / 共 {{ metrics.physicalTotalMb }} MB
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="metric-card">
            <template #header><span>磁盘占用（上传目录所在盘）</span></template>
            <div class="metric-value">{{ metrics.diskUsagePercent }}<span class="metric-unit">%</span></div>
            <el-progress
              :percentage="Math.min(100, metrics.diskUsagePercent || 0)"
              :stroke-width="10"
              color="#67c23a"
              :show-text="false"
            />
            <div class="metric-detail">
              已用 {{ metrics.diskUsedMb }} MB / 共 {{ metrics.diskTotalMb }} MB，可用 {{ metrics.diskUsableMb }} MB
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="metric-card">
            <template #header><span>JVM 堆内存</span></template>
            <div class="metric-value">{{ heapPercent }}<span class="metric-unit">%</span></div>
            <el-progress
              :percentage="heapPercent"
              :stroke-width="10"
              color="#909399"
              :show-text="false"
            />
            <div class="metric-detail">
              已用 {{ metrics.heapUsedMb }} MB / 上限 {{ metrics.heapMaxMb }} MB
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="metric-card">
            <template #header><span>运行信息</span></template>
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="运行时长">{{ uptimeText }}</el-descriptions-item>
              <el-descriptions-item label="Java 版本">{{ metrics.javaVersion || '-' }}</el-descriptions-item>
              <el-descriptions-item label="CPU 核数">{{ metrics.processors || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { systemApi, type SystemMetrics } from '@/api/system'

const refreshSeconds = 5
const loading = ref(false)
const metrics = ref<Partial<SystemMetrics>>({})
let timer: number | undefined

/** CPU 在部分平台不可用（后端返回 -1） */
const cpuAvailable = computed(() => (metrics.value.cpuUsage ?? -1) >= 0)
const cpuText = computed(() => (cpuAvailable.value ? metrics.value.cpuUsage : '不可用'))

const physicalPercent = computed(() => {
  const total = metrics.value.physicalTotalMb || 0
  const used = metrics.value.physicalUsedMb || 0
  return total > 0 ? Math.round((used * 100) / total) : 0
})

const heapPercent = computed(() => {
  const max = metrics.value.heapMaxMb || 0
  const used = metrics.value.heapUsedMb || 0
  return max > 0 ? Math.min(100, Math.round((used * 100) / max)) : 0
})

const uptimeText = computed(() => {
  const seconds = metrics.value.uptimeSeconds || 0
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days} 天 ${hours} 小时`
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
  return `${minutes} 分钟`
})

const fetchMetrics = async () => {
  loading.value = true
  try {
    metrics.value = await systemApi.getMetrics()
  } catch {
    ElMessage.error('获取系统指标失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMetrics()
  timer = window.setInterval(fetchMetrics, refreshSeconds * 1000)
})

onUnmounted(() => {
  if (timer) {
    window.clearInterval(timer)
  }
})
</script>

<style scoped>
.page-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.metric-card {
  margin-bottom: 20px;
}

.metric-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.metric-unit {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: 4px;
}

.metric-detail {
  margin-top: 12px;
  font-size: 13px;
  color: #64748b;
}
</style>
