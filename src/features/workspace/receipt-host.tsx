import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiClient } from '@/shared/api/client'
import { RECEIPT_EVENT, type ReceiptRequest, type TransferReceiptRequest } from './receipt-events'
import { loadInvoiceReceipt, ReceiptModal, type ReceiptData } from './receipt'

export function ReceiptHost() {
  const [data, setData] = useState<ReceiptData | null>(null)
  const [request, setRequest] = useState<ReceiptRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const generation = useRef(0)
  const transfer = useRef<TransferReceiptRequest | null>(null)
  const confirming = useRef(false)
  const close = () => {
    if (confirming.current) return
    transfer.current?.cancel(); transfer.current = null
    generation.current++; setData(null); setRequest(null); setLoading(false); setError('')
  }
  const load = async (next: ReceiptRequest) => {
    const current = ++generation.current
    setRequest(next); setData(null); setLoading(true); setError('')
    try {
      let receipt: ReceiptData
      if ('transfer' in next) {
        transfer.current = next
        const targetUrl = next.transfer.subscriptionId ? `/subscriptions/${next.transfer.subscriptionId}` : `/pt-package-purchases/${next.transfer.ptPurchaseId}`
        const { data: order } = await apiClient.get(targetUrl) as unknown as { data: {
          id: string; memberId: string; priceSnapshot: string; planNameSnapshot?: string; packageNameSnapshot?: string
        } }
        const { data: member } = await apiClient.get(`/members/${order.memberId}`) as unknown as { data: { user: { fullName: string; email?: string } } }
        receipt = {
          issuedAt: new Date().toISOString(), customer: { name: member.user.fullName, sub: member.user.email },
          method: 'BANK_TRANSFER', total: Number(order.priceSnapshot), status: 'AWAITING_TRANSFER',
          transferNote: `SC ${order.id}`, externalRef: next.transfer.externalRef,
          lines: [{ name: order.planNameSnapshot ?? order.packageNameSnapshot ?? 'Gói PT', amount: Number(order.priceSnapshot) }],
        }
      }
      else if ('invoiceId' in next) receipt = await loadInvoiceReceipt(next.invoiceId)
      else {
        const { data: payment } = await apiClient.get(`/payments/${next.paymentId}`) as unknown as { data: {
          status: string; application?: string; invoiceId?: string; memberName?: string; paymentCode: string;
          method: string; amount: string; paidAt: string; itemDescription: string
        } }
        if (payment.status !== 'PAID') throw new Error('Giao dịch chưa được xác nhận thanh toán.')
        receipt = payment.invoiceId ? await loadInvoiceReceipt(payment.invoiceId) : {
          issuedAt: payment.paidAt, customer: { name: payment.memberName ?? 'Hội viên' },
          method: payment.method, paymentCode: payment.paymentCode,
          lines: [{ name: payment.itemDescription, amount: Number(payment.amount) }],
          total: Number(payment.amount), status: 'PAID',
          notice: 'Đã nhận tiền, hóa đơn chưa được phát hành. Vui lòng kiểm tra trạng thái đối soát của giao dịch.',
        }
        receipt.change = next.change
      }
      if (current === generation.current) setData(receipt)
    } catch (e) {
      if (current === generation.current) setError(e instanceof Error ? e.message : 'Không mở được hóa đơn. Giao dịch đã thu không cần thanh toán lại.')
    } finally { if (current === generation.current) setLoading(false) }
  }
  useEffect(() => {
    let pendingTransfer: TransferReceiptRequest | null = null
    const listener = (event: Event) => {
      event.preventDefault()
      const next = (event as CustomEvent<ReceiptRequest>).detail
      if (transfer.current && next !== transfer.current && !confirming.current) transfer.current.cancel()
      if (confirming.current && 'transfer' in next) { next.cancel(); return }
      pendingTransfer = 'transfer' in next ? next : null
      if (!('transfer' in next)) transfer.current = null
      void load(next)
    }
    window.addEventListener(RECEIPT_EVENT, listener)
    return () => { generation.current++; pendingTransfer?.cancel(); window.removeEventListener(RECEIPT_EVENT, listener) }
  }, [])
  return <>
    <ReceiptModal data={data} onClose={close} onConfirmTransfer={request && 'transfer' in request ? async ref => {
      if (confirming.current) return false
      confirming.current = true
      try { return await request.confirm(ref) } finally { confirming.current = false }
    } : undefined} />
    {(loading || error) && createPortal(<div className="fixed inset-0 z-[90] grid place-items-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-label="Mở hóa đơn" className="w-full max-w-sm rounded-2xl bg-bg-surface p-6 shadow-xl">
        <p role={error ? 'alert' : 'status'}>{error || 'Đang tải hóa đơn…'}</p>
        <div className="mt-4 flex justify-end gap-3">
          {error && request && <button type="button" onClick={() => void load(request)}>Thử lại</button>}
          <button type="button" onClick={close}>Đóng</button>
        </div>
      </div>
    </div>, document.body)}
  </>
}
