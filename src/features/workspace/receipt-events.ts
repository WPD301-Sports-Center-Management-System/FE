export type TransferReceiptRequest = {
  transfer: { subscriptionId?: string; ptPurchaseId?: string; receivedAmount: number; externalRef?: string }
  confirm: (ref: string) => Promise<boolean>
  cancel: () => void
}
export type ReceiptRequest = { invoiceId: string } | { paymentId: string; change?: number } | TransferReceiptRequest
export const RECEIPT_EVENT = 'billing:receipt'

export function openReceipt(request: ReceiptRequest) {
  return !window.dispatchEvent(new CustomEvent<ReceiptRequest>(RECEIPT_EVENT, { detail: request, cancelable: true }))
}
