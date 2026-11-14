import request from '@/utils/request'

export interface SystemMetrics {
  cpuUsage: number
  heapUsedMb: number
  heapMaxMb: number
  physicalUsedMb: number
  physicalTotalMb: number
  diskUsedMb: number
  diskTotalMb: number
  diskUsableMb: number
  diskUsagePercent: number
  uptimeSeconds: number
  processors: number
  javaVersion: string
}

export const systemApi = {
  getMetrics() {
    return request.get<SystemMetrics>('/admin/system/metrics')
  }
}
