import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'
import type { AppNotification, NotificationQueryParams } from '../types/notifications.types'

export const notificationsService = {
  /**
   * [1] GET /notifications - List notifications for current user
   */
  async getNotifications(params?: NotificationQueryParams): Promise<ApiSuccess<AppNotification[]>> {
    const res = await apiClient.get<ApiSuccess<AppNotification[]>>('/notifications', { params })
    return res as unknown as ApiSuccess<AppNotification[]>
  },

  /**
   * [2] GET /notifications/unread-count - Get unread count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    const res = await apiClient.get<ApiSuccess<{ count: number }>>('/notifications/unread-count')
    const data = res as unknown as ApiSuccess<{ count: number }>
    return data.data ?? (data as unknown as { count: number })
  },

  /**
   * [3] PATCH /notifications/:id/read - Mark notification as read
   */
  async markAsRead(id: string): Promise<AppNotification> {
    const res = await apiClient.patch<ApiSuccess<AppNotification>>(`/notifications/${id}/read`)
    const data = res as unknown as ApiSuccess<AppNotification>
    return data.data ?? (data as unknown as AppNotification)
  },

  /**
   * [4] PATCH /notifications/read-all - Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    const res = await apiClient.patch<ApiSuccess<{ updated: number }>>('/notifications/read-all')
    const data = res as unknown as ApiSuccess<{ updated: number }>
    return data.data ?? (data as unknown as { updated: number })
  },
}
