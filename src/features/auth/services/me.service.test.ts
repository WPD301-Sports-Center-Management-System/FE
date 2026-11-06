import { describe, it, expect, vi, beforeEach } from 'vitest'
import { meService } from './me.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('meService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /me/subscriptions', async () => {
    const mockSubs = [{ id: 'sub-1', planNameSnapshot: 'Vé Gym 1 Tháng' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockSubs,
    } as any)

    const res = await meService.getMySubscriptions()
    expect(apiClient.get).toHaveBeenCalledWith('/me/subscriptions')
    expect(res.data).toEqual(mockSubs)
  })

  it('[2] calls GET /me/pt-packages', async () => {
    const mockPkgs = [{ id: 'pkg-1', totalCredits: 12 }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPkgs,
    } as any)

    const res = await meService.getMyPtPackages()
    expect(apiClient.get).toHaveBeenCalledWith('/me/pt-packages')
    expect(res.data).toEqual(mockPkgs)
  })

  it('[3] calls GET /me/pt-bookings', async () => {
    const mockBkgs = [{ id: 'bkg-1', status: 'CONFIRMED' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockBkgs,
    } as any)

    const res = await meService.getMyPtBookings()
    expect(apiClient.get).toHaveBeenCalledWith('/me/pt-bookings')
    expect(res.data).toEqual(mockBkgs)
  })

  it('[4] calls GET /me/payments', async () => {
    const mockPayments = [{ id: 'pay-1', amount: '1800000', status: 'PAID' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPayments,
    } as any)

    const res = await meService.getMyPayments()
    expect(apiClient.get).toHaveBeenCalledWith('/me/payments')
    expect(res.data).toEqual(mockPayments)
  })

  it('[5] calls GET /me/invoices', async () => {
    const mockInvoices = [{ id: 'inv-1', invoiceNumber: 'INV-123456' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockInvoices,
    } as any)

    const res = await meService.getMyInvoices()
    expect(apiClient.get).toHaveBeenCalledWith('/me/invoices')
    expect(res.data).toEqual(mockInvoices)
  })

  it('[6] calls GET /me/training-plans', async () => {
    const mockPlans = [{ id: 'tp-1', title: 'Giáo án tăng cơ ngực' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPlans,
    } as any)

    const res = await meService.getMyTrainingPlans()
    expect(apiClient.get).toHaveBeenCalledWith('/me/training-plans')
    expect(res.data).toEqual(mockPlans)
  })

  it('[7] calls GET /me/progress', async () => {
    const mockProg = { assessments: [{ id: 'a-1', weightKg: '70' }], results: [] }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockProg,
    } as any)

    const res = await meService.getMyProgress()
    expect(apiClient.get).toHaveBeenCalledWith('/me/progress')
    expect(res).toEqual(mockProg)
  })

  it('[8] calls GET /me/meal-plans', async () => {
    const mockMeals = [{ id: 'mp-1', title: 'Thực đơn giảm mỡ' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockMeals,
    } as any)

    const res = await meService.getMyMealPlans()
    expect(apiClient.get).toHaveBeenCalledWith('/me/meal-plans')
    expect(res.data).toEqual(mockMeals)
  })

  it('[9] calls GET /me/support-requests', async () => {
    const mockTickets = [{ id: 'sup-1', subject: 'Cần hỗ trợ gia hạn' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockTickets,
    } as any)

    const res = await meService.getMySupportRequests()
    expect(apiClient.get).toHaveBeenCalledWith('/me/support-requests')
    expect(res.data).toEqual(mockTickets)
  })
})
