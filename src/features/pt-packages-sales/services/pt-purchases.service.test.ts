import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ptPurchasesService } from './pt-purchases.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('ptPurchasesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] getPurchases calls GET /pt-package-purchases with params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: [] } as any)
    const result = await ptPurchasesService.getPurchases({ status: 'ACTIVE' })
    expect(apiClient.get).toHaveBeenCalledWith('/pt-package-purchases', {
      params: { status: 'ACTIVE' },
    })
    expect(result).toEqual({ success: true, data: [] })
  })

  it('[3] getPurchaseById calls GET /pt-package-purchases/{id}', async () => {
    const mockDetail = { id: 'pur-1', status: 'ACTIVE', availableCredits: 8 }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: mockDetail } as any)

    const result = await ptPurchasesService.getPurchaseById('pur-1')
    expect(apiClient.get).toHaveBeenCalledWith('/pt-package-purchases/pur-1')
    expect(result.availableCredits).toBe(8)
  })

  it('[4] getMakeupEntitlements calls GET /pt-package-purchases/{id}/makeup-entitlements', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: [] } as any)

    const result = await ptPurchasesService.getMakeupEntitlements('pur-1', { status: 'PENDING' })
    expect(apiClient.get).toHaveBeenCalledWith('/pt-package-purchases/pur-1/makeup-entitlements', {
      params: { status: 'PENDING' },
    })
    expect(result).toEqual({ success: true, data: [] })
  })

  it('[5] cancelPurchase calls PATCH /pt-package-purchases/{id}/cancel', async () => {
    const mockCancelled = { id: 'pur-1', status: 'CANCELLED' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ success: true, data: mockCancelled } as any)

    const result = await ptPurchasesService.cancelPurchase('pur-1', { reason: 'Khách đổi ý' })
    expect(apiClient.patch).toHaveBeenCalledWith('/pt-package-purchases/pur-1/cancel', {
      reason: 'Khách đổi ý',
    })
    expect(result.status).toBe('CANCELLED')
  })

  it('[6] getPurchaseReview calls GET /pt-package-purchases/{id}/review', async () => {
    const mockReview = { id: 'rev-1', rating: 5, comment: 'HLV rất nhiệt tình' }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: mockReview } as any)

    const result = await ptPurchasesService.getPurchaseReview('pur-1')
    expect(apiClient.get).toHaveBeenCalledWith('/pt-package-purchases/pur-1/review')
    expect(result?.rating).toBe(5)
  })

  it('[7] createPurchaseReview calls POST /pt-package-purchases/{id}/review', async () => {
    const mockReview = { id: 'rev-1', rating: 5, comment: 'Tuyệt vời' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: mockReview } as any)

    const result = await ptPurchasesService.createPurchaseReview('pur-1', { rating: 5, comment: 'Tuyệt vời' })
    expect(apiClient.post).toHaveBeenCalledWith('/pt-package-purchases/pur-1/review', {
      rating: 5,
      comment: 'Tuyệt vời',
    })
    expect(result.id).toBe('rev-1')
  })
})
