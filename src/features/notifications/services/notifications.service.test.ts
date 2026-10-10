import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationsService } from './notifications.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('notificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getNotifications calls GET /notifications with params', async () => {
    const mockData = {
      success: true,
      data: [{ id: 'notif-1', title: 'Buổi tập mới', message: 'HLV đã duyệt lịch', readAt: null }],
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockData as any)

    const res = await notificationsService.getNotifications({ limit: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/notifications', { params: { limit: 10 } })
    expect(res.data).toHaveLength(1)
  })

  it('getUnreadCount calls GET /notifications/unread-count', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: { count: 4 } } as any)

    const res = await notificationsService.getUnreadCount()
    expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count')
    expect(res.count).toBe(4)
  })

  it('markAsRead calls PATCH /notifications/:id/read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: { id: 'notif-1', readAt: '2026-10-10T12:00:00Z' },
    } as any)

    const res = await notificationsService.markAsRead('notif-1')
    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/notif-1/read')
    expect(res.readAt).toBe('2026-10-10T12:00:00Z')
  })

  it('markAllAsRead calls PATCH /notifications/read-all', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: { updated: 5 },
    } as any)

    const res = await notificationsService.markAllAsRead()
    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/read-all')
    expect(res.updated).toBe(5)
  })
})
