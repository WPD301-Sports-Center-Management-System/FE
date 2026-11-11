import { hybridGet, hybridSend } from './hybrid-api'

export interface PtRefund {
  id: string; purchaseId: string; amount: number | string; creditIds: string[]
  status: 'PENDING_TRANSFER' | 'PAID'; reason: string; transferRef?: string | null; paidAt?: string | null
  purchase?: { purchaseCode: string; member: { user: { fullName: string } } }
}
export interface RefundQuote { amount: number; creditIds: string[]; purchaseCode: string; refund: PtRefund | null }
export const refundApi = {
  list: () => hybridGet<PtRefund[]>('/pt-purchase-refunds'),
  preview: (id: string) => hybridGet<RefundQuote>(`/pt-package-purchases/${id}/refund-preview`),
  confirm: (id: string, expectedAmount: number, reason: string) => hybridSend<PtRefund>('post', `/pt-package-purchases/${id}/refund`, { expectedAmount, reason }),
  paid: (id: string, transferRef: string) => hybridSend<PtRefund>('post', `/pt-package-purchases/${id}/refund/mark-paid`, { transferRef }),
}
