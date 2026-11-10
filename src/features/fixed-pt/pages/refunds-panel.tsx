import { PurchasePicker } from '../components/purchase-picker'
import { useState } from 'react'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { mgrApi } from '@/features/manager-workspace/api'
import { Async, Badge, Btn, Card, Field, InlineError, Table, inputCls, td, useFlash } from '@/features/workspace/ui'
import { money } from '../components/ui'

type Refund = { id: string; purchaseId: string; amount: string; creditIds: string[]; status: 'PENDING_TRANSFER' | 'PAID'; reason: string; transferRef?: string | null; purchase: { purchaseCode: string; member: { user: { fullName: string } } } }
type Quote = { purchaseId?: string; amount: number; creditIds: string[]; purchaseCode: string; refund: Refund | null }

export function RefundsPanel({ initialPurchaseId = '' }: { initialPurchaseId?: string } = {}) {
  const refunds = useLoad(() => hybridGet<Refund[]>('/pt-purchase-refunds'))
  const purchases = useLoad(() => mgrApi.purchases({}, 10))
  const [purchaseId, setPurchaseId] = useState(initialPurchaseId)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [reason, setReason] = useState('')
  const act = useSubmit()
  const { flash, node } = useFlash()
  return <div className="mt-6 space-y-4">
    {node}
    <Card title="Hoàn phần gói PT chưa dùng" subtitle="Chốt hoàn sẽ đóng gói, thu hồi toàn bộ buổi chưa dùng và nhả lịch. Sau đó chuyển tiền cho học viên và xác nhận mã giao dịch.">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1"><Field label="Gói cần hoàn" required>{initialPurchaseId ? <p className="text-sm">Gói đang xem đã được chọn.</p> : <PurchasePicker value={purchaseId} onChange={id => { setPurchaseId(id); setQuote(null); act.clear() }} />}<InlineError message={purchases.error} /></Field></div>
        <Btn busy={act.busy} disabled={!purchaseId} onClick={() => void act.run(async () => { setQuote(null); setQuote({ ...await hybridGet<Quote>(`/pt-package-purchases/${purchaseId}/refund-preview`), purchaseId }) })}>Xem số buổi và tiền hoàn</Btn>
      </div>
      {quote && quote.purchaseId === purchaseId && <div className="mt-4 space-y-3">
        <p className="text-sm"><strong>{quote.purchaseCode}</strong> · Thu hồi {quote.creditIds.length} buổi chưa dùng · Tiền hoàn <strong>{money(quote.amount)}</strong></p>
        <p className="text-xs text-text-muted">Tính theo giá gói lúc mua. Buổi đã tập hoặc mất hợp lệ và commission tương ứng được giữ nguyên.</p>
        <Field label="Lý do chốt hoàn" required><textarea className={inputCls} rows={2} maxLength={5000} value={reason} disabled={act.busy} onChange={e => setReason(e.target.value)} /></Field>
        <Btn variant="danger" busy={act.busy} disabled={!reason.trim() || !!quote.refund} onClick={() => void act.run(async () => {
          await hybridSend('post', `/pt-package-purchases/${purchaseId}/refund`, { expectedAmount: quote.amount, expectedCreditIds: quote.creditIds, reason: reason.trim() })
          flash('Đã chốt hoàn và thu hồi buổi. Chuyển tiền rồi xác nhận ở danh sách bên dưới.'); setQuote(null); setPurchaseId(''); setReason(''); await refunds.reload(); await purchases.reload()
        })}>Chốt hoàn và thu hồi {quote.creditIds.length} buổi</Btn>
      </div>}
      <InlineError message={act.error} />
    </Card>
    <Card flush title="Các khoản hoàn đã chốt" subtitle="Chờ chuyển tiền và đã xác nhận chi được theo dõi riêng.">
      <Async state={refunds} rows={3}>{rows => <Table head={['Gói / Học viên', 'Buổi thu hồi', 'Tiền hoàn', 'Trạng thái / Xác nhận']} minWidth={680} alignLast={false}>
        {rows.filter(r => !initialPurchaseId || r.purchaseId === initialPurchaseId).map(r => <tr key={r.id}><td className={td}><p className="font-semibold">{r.purchase.purchaseCode} · {r.purchase.member.user.fullName}</p><p className="text-xs text-text-muted">{r.reason}</p></td><td className={td}>{r.creditIds.length}</td><td className={`${td} tabular-nums`}>{money(r.amount)}</td><td className={td}><RefundPayment r={r} onDone={() => { flash('Đã xác nhận chuyển tiền hoàn.'); void refunds.reload() }} /></td></tr>)}
      </Table>}</Async>
    </Card>
  </div>
}

function RefundPayment({ r, onDone }: { r: Refund; onDone: () => void }) {
  const [reference, setReference] = useState('')
  const act = useSubmit()
  if (r.status === 'PAID') return <><Badge tone="success">Đã xác nhận hoàn</Badge><p className="mt-1 text-xs text-text-muted">Mã giao dịch: {r.transferRef}</p></>
  return <div className="space-y-2"><Badge tone="warning">Chờ chuyển tiền</Badge><input aria-label={`Mã chuyển tiền hoàn ${r.purchase.purchaseCode}`} placeholder="Mã giao dịch đã chuyển" className={inputCls} value={reference} maxLength={120} disabled={act.busy} onChange={e => setReference(e.target.value)} /><Btn size="sm" busy={act.busy} disabled={!reference.trim()} onClick={() => void act.run(async () => { await hybridSend('post', `/pt-package-purchases/${r.purchaseId}/refund/mark-paid`, { transferRef: reference.trim() }); onDone() })}>Đã chuyển — xác nhận</Btn><InlineError message={act.error} /></div>
}
