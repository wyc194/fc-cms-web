import request from '@/utils/request'
import type { Package } from './types'

export const packageApi = {
  getPackages() {
    return request.get<Package[]>('/admin/packages')
  },

  getPackageById(id: number) {
    return request.get<Package>(`/admin/packages/${id}`)
  },

  createPackage(data: Partial<Package>) {
    return request.post<Package>('/admin/packages', data)
  },

  updatePackage(data: Partial<Package>) {
    return request.put<Package>('/admin/packages', data)
  },

  deletePackage(id: number) {
    return request.delete(`/admin/packages/${id}`)
  }
}
