import { apiClient } from '@/shared/api/client'
import { openReceipt } from './receipt-events'

/** All counter sale entry points show the same server-confirmed receipt. */
export async function counterPayment<T extends { id: string; changeAmount?: number }>(body: {
  subscriptionId?: string; ptPurchaseId?: string; method: string; receivedAmount: number; externalRef?: string; overrideReason?: string
}): Promise<T> {
  const settle = async (ref?: string) => {
    const payload = ref ? { ...body, externalRef: ref } : body
    const response = await apiClient.post('/payments/counter', payload) as unknown as { data: T }
    const payment = response.data ?? response as unknown as T
    openReceipt({ paymentId: payment.id, change: payment.changeAmount })
    return payment
  }
  if (body.method === 'BANK_TRANSFER') {
    return new Promise<T>((resolve, reject) => {
      const handled = openReceipt({
        transfer: body,
        confirm: async ref => { const payment = await settle(ref); resolve(payment); return true },
        cancel: () => reject(new Error('Đã đóng hóa đơn chuyển khoản. Chưa ghi nhận thanh toán.')),
      })
      if (!handled) reject(new Error('Không mở được hóa đơn xác nhận chuyển khoản. Chưa ghi nhận thanh toán; hãy tải lại trang.'))
    })
  }
  return settle()
}
