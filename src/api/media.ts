import request from '@/utils/request'

export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  createdAt: string;
}

export interface StorageStats {
  usedSize: number
  totalSize: number
  percentage: number
}

export const mediaApi = {
  async getMediaItems(params?: any) {
      const res = await request.get<any>('/admin/media/list', { params })
      return {
        items: res.content.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          url: item.url,
          type: item.type,
          size: formatBytes(item.size),
          createdAt: item.createTime,
          deleted: item.deleted
        })),
        total: res.totalElements
      }
    },

    async getStorageStats() {
      return request.get<StorageStats>('/admin/media/stats')
    },

    async deleteMediaItem(id: string) {
      return request.delete(`/admin/media/${id}`)
    },

    async restoreMediaItem(id: string) {
      return request.post(`/admin/media/${id}/restore`)
    },

    async permanentDeleteMediaItem(id: string) {
      return request.delete(`/admin/media/${id}/permanent`)
    },

    async emptyTrash() {
      return request.delete('/admin/media/trash/empty')
    },

    async uploadMedia(file: File) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await request.post<{ url: string }>('/admin/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return {
        url: res.url,
        name: file.name
      }
    }
}
