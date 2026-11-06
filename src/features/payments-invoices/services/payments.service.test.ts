import { describe, it, expect, vi, beforeEach } from 'vitest'
import { paymentsService } from './payments.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('paymentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] getPayments calls GET /payments with query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: [] } as any)
    const result = await paymentsService.getPayments({ status: 'PAID', method: 'CASH' })
    expect(apiClient.get).toHaveBeenCalledWith('/payments', {
      params: { status: 'PAID', method: 'CASH' },
    })
    expect(result).toEqual({ success: true, data: [] })
  })

  it('[2] payCounter calls POST /payments/counter', async () => {
    const payload = {
      subscriptionId: 'sub-00000000-0000-0000-0000-000000000001',
      method: 'CASH' as const,
      receivedAmount: 500000,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { id: 'pay-1', status: 'PAID', changeAmount: 0 },
    } as any)
    const result = await paymentsService.payCounter(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/payments/counter', payload)
    expect(result.id).toBe('pay-1')
    expect(result.changeAmount).toBe(0)
  })

  it('[3] createVNPay calls POST /payments/vnpay', async () => {
    const payload = {
      ptPurchaseId: 'pur-00000000-0000-0000-0000-000000000001',
      returnTarget: 'web' as const,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: { paymentId: 'pay-1', paymentUrl: 'https://sandbox.vnpayment.vn/payment' },
    } as any)
    const result = await paymentsService.createVNPay(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/payments/vnpay', payload)
    expect(result.paymentId).toBe('pay-1')
    expect(result.paymentUrl).toBe('https://sandbox.vnpayment.vn/payment')
  })

  it('[4] getPaymentById calls GET /payments/{id}', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: { id: 'pay-1', paymentCode: 'PAY-001', status: 'PAID' },
    } as any)
    const result = await paymentsService.getPaymentById('pay-1')
    expect(apiClient.get).toHaveBeenCalledWith('/payments/pay-1')
    expect(result.id).toBe('pay-1')
    expect(result.paymentCode).toBe('PAY-001')
  })

  it('[5] getPaymentStatus calls GET /payments/{id}/status', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: { id: 'pay-1', status: 'PAID', paidAt: '2026-10-10T10:00:00Z' },
    } as any)
    const result = await paymentsService.getPaymentStatus('pay-1')
    expect(apiClient.get).toHaveBeenCalledWith('/payments/pay-1/status')
    expect(result.id).toBe('pay-1')
    expect(result.status).toBe('PAID')
  })
})
