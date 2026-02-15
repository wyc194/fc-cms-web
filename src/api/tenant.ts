import request from '@/utils/request'
import type { Tenant, TenantCreateResult } from './types'

export const tenantApi = {
  getTenants() {
    return request.get<Tenant[]>('/admin/tenants')
  },

  getTenantById(id: number) {
    return request.get<Tenant>(`/admin/tenants/${id}`)
  },

  createTenant(data: Partial<Tenant>) {
    return request.post<TenantCreateResult>('/admin/tenants', data)
  },

  updateTenant(id: number, data: Partial<Tenant>) {
    return request.put<Tenant>('/admin/tenants', { ...data, id })
  },

  deleteTenant(id: number) {
    return request.delete(`/admin/tenants/${id}`)
  },

  getCurrentConfig() {
    return request.get<Tenant>('/admin/tenants/config')
  },

  updateCurrentConfig(data: Partial<Tenant>) {
    return request.put<Tenant>('/admin/tenants/config', data)
  }
}
