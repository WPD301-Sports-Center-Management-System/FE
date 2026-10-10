import { describe, it, expect, vi, beforeEach } from 'vitest'
import { subscriptionsService } from './subscriptions.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('subscriptionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /subscriptions with query params', async () => {
    const mockSubs = [
      {
        id: 'sub-1',
        memberId: 'mem-1',
        planId: 'plan-1',
        planNameSnapshot: 'Vé gym 3 tháng',
        status: 'ACTIVE',
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockSubs,
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    } as any)

    const result = await subscriptionsService.getSubscriptions({ memberId: 'mem-1', status: 'ACTIVE' })
    expect(apiClient.get).toHaveBeenCalledWith('/subscriptions', {
      params: { memberId: 'mem-1', status: 'ACTIVE' },
    })
    expect(result.data).toEqual(mockSubs)
  })

  it('[2] calls GET /subscriptions/:id', async () => {
    const mockDetail = {
      id: 'sub-1',
      memberId: 'mem-1',
      planId: 'plan-1',
      status: 'ACTIVE',
      plan: { id: 'plan-1', name: 'Vé gym 1 tháng' },
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockDetail,
    } as any)

    const result = await subscriptionsService.getSubscriptionById('sub-1')
    expect(apiClient.get).toHaveBeenCalledWith('/subscriptions/sub-1')
    expect(result).toEqual(mockDetail)
  })

  it('[3] calls POST /subscriptions to create new subscription', async () => {
    const payload = {
      memberId: 'mem-1',
      planId: 'plan-1',
      startDate: '2026-10-10',
    }
    const created = {
      id: 'sub-123',
      ...payload,
      status: 'PENDING',
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: created,
    } as any)

    const result = await subscriptionsService.createSubscription(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/subscriptions', payload)
    expect(result).toEqual(created)
  })

  it('[4] calls POST /subscriptions/:id/renew to renew subscription', async () => {
    const renewed = {
      id: 'sub-renewed',
      previousSubscriptionId: 'sub-1',
      status: 'PENDING',
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: renewed,
    } as any)

    const result = await subscriptionsService.renewSubscription('sub-1', { startDate: '2026-11-10' })
    expect(apiClient.post).toHaveBeenCalledWith('/subscriptions/sub-1/renew', { startDate: '2026-11-10' })
    expect(result).toEqual(renewed)
  })

  it('[5] calls PATCH /subscriptions/:id/cancel to cancel subscription with reason', async () => {
    const cancelled = {
      id: 'sub-1',
      status: 'CANCELLED',
      cancellationReason: 'Khách hàng chuyển công tác',
    }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: cancelled,
    } as any)

    const result = await subscriptionsService.cancelSubscription('sub-1', {
      reason: 'Khách hàng chuyển công tác',
    })
    expect(apiClient.patch).toHaveBeenCalledWith('/subscriptions/sub-1/cancel', {
      reason: 'Khách hàng chuyển công tác',
    })
    expect(result).toEqual(cancelled)
  })
})
