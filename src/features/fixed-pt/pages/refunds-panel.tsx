import { useEffect, useState } from 'react'
import { PurchasePicker } from '../components/purchase-picker'
import { useLoad, useSubmit } from '../hooks'
import { refundApi, type PtRefund } from '../refund-api'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, Segmented, inputCls, textareaCls, useFlash } from '@/features/workspace/ui'
import { fmtMoney } from '@/features/workspace/utils'
import { formatDateTime } from '@/shared/utils/date'

export function RefundsPanel({ initialPurchaseId = '', onChanged }: { initialPurchaseId?: string; onChanged?: () => void } = {}) {
  const refunds = useLoad(refundApi.list)
  const [purchaseId, setPurchaseId] = useState(initialPurchaseId), [reason, setReason] = useState('')
  const [view, setView] = useState<'pending' | 'paid'>('pending')
  const quote = useLoad(() => refundApi.preview(purchaseId), [purchaseId], !!purchaseId)
  const reloadQuote = quote.reload
  const act = useSubmit(), { flash, node } = useFlash()
  const refresh = () => { void refunds.reload(); if (purchaseId) void quote.reload(); onChanged?.() }
  useEffect(() => { if (act.code === 'REFUND_CHANGED') void reloadQuote() }, [act.code, reloadQuote])
  return <div className="mt-5 space-y-5" data-refunds-panel>
    {node}<Card title="Hoàn phần gói PT chưa dùng">
      {!initialPurchaseId && <div className="mb-5"><PurchasePicker value={purchaseId} onChange={id => { setPurchaseId(id); setReason(''); act.clear() }} /></div>}
      {purchaseId && <Async state={quote} rows={2}>{q => <div className="grid gap-6 lg:grid-cols-2">
        <div><p className="text-sm text-text-muted">{q.purchaseCode} · {q.creditIds.length} buổi {q.refund ? 'đã thu hồi' : 'chưa dùng'}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{fmtMoney(q.amount)}</p><p className="mt-3 text-sm text-text-muted">Chốt hoàn sẽ đóng gói, thu hồi buổi chưa dùng và hủy lịch tương lai. Thu nhập từ buổi đã tập được giữ nguyên.</p></div>
        <div>{q.refund ? <RefundPayment refund={q.refund} purchaseCode={q.purchaseCode} onDone={() => { flash('Đã ghi nhận tiền hoàn cho học viên.'); refresh() }} /> : q.amount <= 0 || !q.creditIds.length ? <EmptyBox title="Không còn phần chưa dùng để hoàn" hint="Thu nhập từ buổi đã ghi nhận vẫn được giữ nguyên." /> : <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!reason.trim()) return; void act.run(async () => {
          const refund = await refundApi.confirm(purchaseId, q.amount, reason.trim())
          quote.setData({ ...q, refund }); setView('pending'); flash('Đã chốt hoàn. Nhập mã giao dịch sau khi chuyển tiền cho học viên.'); await refunds.reload(); onChanged?.()
        }) }}><Field label="Lý do hoàn tiền"><textarea aria-label="Lý do hoàn tiền" required rows={3} maxLength={5000} className={textareaCls} value={reason} disabled={act.busy} onChange={e => setReason(e.target.value)} /></Field><InlineError message={act.error} /><Btn type="submit" variant="danger" busy={act.busy} disabled={!reason.trim()}>Chốt hoàn {fmtMoney(q.amount)} và thu hồi {q.creditIds.length} buổi</Btn></form>}</div>
      </div>}</Async>}
    </Card>
    {!initialPurchaseId && <Card title="Theo dõi tiền hoàn" actions={<Btn size="sm" disabled={refunds.loading} onClick={() => void refunds.reload()}>Cập nhật</Btn>}>
      <Async state={refunds} rows={3}>{all => {
        const rows = all.filter(r => r.purchaseId !== purchaseId)
        const shown = rows.filter(r => view === 'pending' ? r.status === 'PENDING_TRANSFER' : r.status === 'PAID')
        return <><Segmented label="Trạng thái tiền hoàn" value={view} onChange={setView} items={[{ key: 'pending', label: 'Chờ chuyển', count: rows.filter(r => r.status === 'PENDING_TRANSFER').length }, { key: 'paid', label: 'Đã chuyển', count: rows.filter(r => r.status === 'PAID').length }]} />
          {!shown.length ? <p role="status" className="mt-4 text-sm text-text-muted">{view === 'pending' ? 'Không có khoản hoàn chờ chuyển' : 'Chưa có khoản hoàn đã chuyển'}</p> : <ul className="mt-4 divide-y divide-border-subtle">{shown.map(r => <li key={r.id} className="grid items-start gap-4 py-4 first:pt-0 last:pb-0 lg:grid-cols-2"><div><p className="font-medium">{r.purchase?.member.user.fullName ?? 'Học viên'} · {r.purchase?.purchaseCode}</p><p className="mt-1 text-sm text-text-muted">{r.reason}</p><p className="mt-2 text-lg font-semibold tabular-nums">{fmtMoney(Number(r.amount))}<span className="ml-2 text-sm font-normal text-text-muted">· {r.creditIds.length} buổi</span></p></div><RefundPayment refund={r} purchaseCode={r.purchase?.purchaseCode ?? r.purchaseId} onDone={() => { flash('Đã ghi nhận chuyển tiền hoàn.'); refresh() }} /></li>)}</ul>}
        </>
      }}</Async>
    </Card>}
  </div>
}

function RefundPayment({ refund: r, purchaseCode, onDone }: { refund: PtRefund; purchaseCode: string; onDone: () => void }) {
  const [reference, setReference] = useState(''), [sent, setSent] = useState(false)
  const act = useSubmit()
  if (r.status === 'PAID') return <div className="space-y-2"><Badge tone="success">Đã chuyển tiền hoàn</Badge><p className="break-words text-sm">Mã giao dịch: {r.transferRef}</p>{r.paidAt && <p className="text-xs text-text-muted">{formatDateTime(r.paidAt)}</p>}</div>
  return <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!reference.trim() || sent) return; void act.run(async () => {
    await refundApi.paid(r.purchaseId, reference.trim()); setSent(true); onDone()
  }) }}><Badge tone="warning">Chờ chuyển tiền</Badge><p className="text-sm text-text-muted">Chuyển tiền sau khi đối chiếu tài khoản với học viên. Chưa rõ kết quả ngân hàng thì giữ chờ, kiểm tra sao kê trước khi chuyển lại.</p><Field label="Mã giao dịch đã chuyển"><input aria-label={`Mã chuyển tiền hoàn ${purchaseCode}`} required className={inputCls} value={reference} maxLength={120} disabled={act.busy || sent} onChange={e => setReference(e.target.value)} /></Field><InlineError message={act.error} /><Btn type="submit" busy={act.busy} disabled={!reference.trim() || sent}>Xác nhận đã chuyển</Btn></form>
}
