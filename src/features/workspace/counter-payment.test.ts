import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { counterPayment } from './counter-payment'

vi.mock('@/shared/api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }))
vi.mock('./receipt-events', () => ({ openReceipt: vi.fn() }))

const sale = { ptPurchaseId: 'pur-1', method: 'CASH', receivedAmount: 1_000_000, overrideReason: 'Thu tại quầy' }
const keyOf = (call: number) => (vi.mocked(apiClient.post).mock.calls[call]![1] as { idempotencyKey: string }).idempotencyKey

describe('counterPayment idempotency key', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('reuses one key when the same sale is retried after a lost response, then drops it once the sale succeeds', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('timeout')).mockResolvedValue({ data: { id: 'pay-1' } } as never)
    await expect(counterPayment(sale)).rejects.toThrow('timeout')
    await counterPayment(sale)
    expect(keyOf(1)).toBe(keyOf(0))
    await counterPayment(sale)
    expect(keyOf(2)).not.toBe(keyOf(0)) // a genuinely new sale of the same amount is not mistaken for a retry
  })

  it('uses a different key when the sale details change', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('timeout'))
    await expect(counterPayment(sale)).rejects.toThrow()
    await expect(counterPayment({ ...sale, receivedAmount: 1_200_000 })).rejects.toThrow()
    expect(keyOf(1)).not.toBe(keyOf(0))
  })
})
