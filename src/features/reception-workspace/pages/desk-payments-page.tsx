import { openReceipt } from '@/features/workspace/receipt-events'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Clock3, Download, FileDown, Hash, QrCode, ReceiptText, Scale, Search, Wallet } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, LinkBtn, PageHeader, Pagination, Person, Segmented, StatTile, Table, inputCls, td } from '@/features/workspace/ui'
import { downloadCsv, fmtMoney, fmtNumber, hhmm, relativeAgo } from '@/features/workspace/utils'
import { deskApi, type Invoice, type Payment, type PaymentStatus } from '../api'
import { dmy, METHOD_LABEL, PAYMENT_LABEL } from '../labels'

const PAGE = 12
type Filter = 'all' | PaymentStatus | 'closed'

export function DeskPaymentsPage() {
  const desk = useAuth().role !== 'MANAGER'
  const base = desk ? '/receptionist' : '/manager'
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'invoices' ? 'invoices' : 'payments'
  const initial = (params.get('status') as Filter | null) ?? 'all'
  const [filter, setFilter] = useState<Filter>(initial)
  const [method, setMethod] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const payments = useLoad(() => deskApi.payments({}, 5), [])
  const invoices = useLoad(() => deskApi.invoices({}, 3), [], view === 'invoices')
  const today = centerDate()
  const all = payments.data ?? []
  const paidToday = all.filter(p => p.status === 'PAID' && p.paidAt && centerDate(p.paidAt) === today)
  const revenue = paidToday.reduce((n, p) => n + Number(p.amount), 0)
  const pending = all.filter(p => p.status === 'PENDING')
  const failedToday = all.filter(p => ['FAILED', 'EXPIRED', 'CANCELLED'].includes(p.status) && centerDate(p.createdAt) === today)
  const term = q.trim().toLowerCase()
  const test = (p: Payment) => (filter === 'all' || (filter === 'closed' ? ['FAILED', 'EXPIRED', 'CANCELLED', 'SUPERSEDED'].includes(p.status) : p.status === filter)) && (!method || p.method === method)
    && (!term || [p.paymentCode, p.memberName, p.memberCode, p.itemDescription].some(v => v?.toLowerCase().includes(term)))
  const rows = all.filter(test)
  const setView = (v: string) => { const p = new URLSearchParams(params); if (v === 'payments') p.delete('view'); else p.set('view', v); setParams(p, { replace: true }); setPage(1) }
  const byMethod = (m: Payment['method']) => paidToday.filter(p => p.method === m).reduce((n, p) => n + Number(p.amount), 0)

  return <div>
    <PageHeader title="Thanh toán & Hóa đơn" subtitle={<><span>Toàn bộ giao dịch tại quầy và VNPay</span><Dot /><span>Hôm nay: tiền mặt {fmtMoney(byMethod('CASH'))} · chuyển khoản {fmtMoney(byMethod('BANK_TRANSFER'))} · VNPay {fmtMoney(byMethod('VNPAY'))}</span></>}
      actions={<><LinkBtn to={`${base}/reconciliation`} icon={<Scale aria-hidden className="h-4 w-4" />}>Đối soát tiền nhận</LinkBtn>
        <Btn icon={<Download aria-hidden className="h-4 w-4" />} disabled={!paidToday.length} onClick={() => downloadCsv(`bao-cao-ngay-${today}.csv`, ['Mã', 'Giờ', 'Hội viên', 'Mã HV', 'Nội dung', 'Phương thức', 'Số tiền'],
          paidToday.map(p => [p.paymentCode, hhmm(p.paidAt), p.memberName ?? '', p.memberCode ?? '', p.itemDescription ?? '', METHOD_LABEL[p.method], Number(p.amount)]))}>Xuất báo cáo ngày</Btn>
        {desk && <LinkBtn to="/receptionist/membership-sale" variant="primary">Tạo hóa đơn mới</LinkBtn>}</>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Doanh thu đã thu hôm nay" icon={<Wallet className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={payments.data ? fmtNumber(revenue) : '—'} unit="₫" />
      <StatTile label="Giao dịch thành công hôm nay" icon={<Hash className="h-[18px] w-[18px]" />} iconTone="info" value={payments.data ? paidToday.length : '—'} hint={paidToday.length ? `Trung bình ${fmtMoney(revenue / paidToday.length)} / giao dịch` : undefined} />
      <StatTile label="Chờ thanh toán" icon={<Clock3 className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={payments.data ? pending.length : '—'} hint="Chủ yếu là VNPay khách chưa quét xong" />
      <StatTile label="Thất bại / hết hạn hôm nay" icon={<AlertCircle className="h-[18px] w-[18px]" />} iconTone="danger" value={payments.data ? failedToday.length : '—'} />
    </div>
    <Card flush title={view === 'payments' ? 'Danh sách giao dịch' : 'Hóa đơn đã xuất'} subtitle={view === 'payments' ? '500 giao dịch gần nhất' : 'Hóa đơn tạo tự động khi giao dịch được áp dụng'}
      actions={<Segmented label="Chế độ xem" value={view} onChange={setView} items={[{ key: 'payments', label: 'Giao dịch' }, { key: 'invoices', label: 'Hóa đơn' }]} />}>
      {view === 'payments' ? <>
        <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
          <Segmented label="Lọc trạng thái" value={filter} onChange={f => { setFilter(f); setPage(1) }} items={[
            { key: 'all' as Filter, label: 'Tất cả', count: all.length }, { key: 'PAID' as Filter, label: 'Đã thanh toán', count: all.filter(p => p.status === 'PAID').length },
            { key: 'PENDING' as Filter, label: 'Chờ thanh toán', count: pending.length }, { key: 'closed' as Filter, label: 'Hủy / thất bại', count: all.filter(p => ['FAILED', 'EXPIRED', 'CANCELLED', 'SUPERSEDED'].includes(p.status)).length }]} />
          <label><span className="sr-only">Phương thức</span><select value={method} onChange={e => { setMethod(e.target.value); setPage(1) }} className={`${inputCls} w-44`}><option value="">Mọi phương thức</option>{Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><span className="sr-only">Tìm giao dịch</span><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input type="search" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Mã GD, tên, mã HV…" className={`${inputCls} pl-9`} /></label>
        </div>
        <Async state={payments} rows={8} empty={() => !rows.length && <EmptyBox icon={<ReceiptText className="h-5 w-5" />} title="Không có giao dịch phù hợp" />}>
          {() => <><Table head={['Mã giao dịch', 'Khách hàng', 'Nội dung', 'Phương thức', 'Số tiền', 'Trạng thái', 'Thời gian', '']} minWidth={1080}>
            {rows.slice((page - 1) * PAGE, page * PAGE).map(p => <PaymentRow key={p.id} p={p} base={base} desk={desk} />)}
          </Table><Pagination page={page} pageSize={PAGE} total={rows.length} onChange={setPage} noun="giao dịch" /></>}
        </Async>
      </> : <Async state={invoices} rows={8} empty={i => !i.length && <EmptyBox icon={<ReceiptText className="h-5 w-5" />} title="Chưa có hóa đơn" />}>
        {i => <><Table head={['Số hóa đơn', 'Khách hàng', 'Nội dung', 'Tổng tiền', 'Ngày xuất', '']} minWidth={860}>
          {i.slice((page - 1) * PAGE, page * PAGE).map(x => <InvoiceRow key={x.id} x={x} />)}
        </Table><Pagination page={page} pageSize={PAGE} total={i.length} onChange={setPage} noun="hóa đơn" /></>}
      </Async>}
    </Card>
  </div>
}

function PdfButton({ invoiceId, name }: { invoiceId: string; name: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return <><Btn size="sm" variant="ghost" busy={busy} icon={<FileDown aria-hidden className="h-4 w-4" />} aria-label={`Tải hóa đơn ${name}`}
    onClick={async () => { setBusy(true); setError(null); try { openReceipt({ invoiceId }) } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được.') } finally { setBusy(false) } }}>In</Btn>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}</>
}

function PaymentRow({ p, base, desk }: { p: Payment; base: string; desk: boolean }) {
  const submit = useSubmit()
  const st = PAYMENT_LABEL[p.status]
  const t = p.paidAt ?? p.createdAt
  return <tr className="hover:bg-bg-surface-muted/40">
    <td className={`${td} font-semibold`}>{p.paymentCode}</td>
    <td className={td}><Link to={`${base}/members/${p.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={p.memberName} size={30} /><span><span className="block whitespace-nowrap font-medium">{p.memberName ?? '—'}</span><span className="text-xs text-text-muted">{p.memberCode}</span></span></Link></td>
    <td className={td}>{p.itemDescription}<p className="text-xs text-text-muted">{p.subscriptionId ? 'Vé gym' : p.ptPurchaseId ? 'Gói PT' : ''}</p></td>
    <td className={td}>{METHOD_LABEL[p.method]}</td>
    <td className={`${td} font-semibold tabular-nums`}>{fmtMoney(p.amount)}</td>
    <td className={td}><Badge tone={st.tone}>{st.label}</Badge>{p.status === 'PAID' && p.application && p.application !== 'APPLIED' && <p className="mt-1 text-xs text-amber-700">Cần đối soát</p>}</td>
    <td className={`${td} tabular-nums`}>{hhmm(t)}<p className="text-xs text-text-muted">{relativeAgo(t) === 'hôm nay' ? 'hôm nay' : dmy(t)}</p></td>
    <td className={`${td} text-right`}>
      {p.invoiceId && <PdfButton invoiceId={p.invoiceId} name={p.paymentCode} />}
      {desk && p.status === 'PENDING' && p.method === 'VNPAY' && <Btn size="sm" variant="soft" busy={submit.busy} icon={<QrCode aria-hidden className="h-3.5 w-3.5" />}
        onClick={async () => { const r = await submit.run(() => deskApi.payVnpay({ subscriptionId: p.subscriptionId ?? undefined, ptPurchaseId: p.ptPurchaseId ?? undefined })); if (r) window.location.href = r.paymentUrl }}>Tạo lại mã</Btn>}
      {submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}
    </td>
  </tr>
}

function InvoiceRow({ x }: { x: Invoice }) {
  return <tr className="hover:bg-bg-surface-muted/40">
    <td className={`${td} font-semibold`}>{x.invoiceNumber}</td>
    <td className={td}>{x.memberNameSnapshot}<p className="text-xs text-text-muted">{x.memberEmailSnapshot}</p></td>
    <td className={td}>{x.itemNameSnapshot}</td>
    <td className={`${td} font-semibold tabular-nums`}>{fmtMoney(x.total)}</td>
    <td className={`${td} tabular-nums`}>{dmy(x.issuedAt)} {hhmm(x.issuedAt)}</td>
    <td className={`${td} text-right`}><PdfButton invoiceId={x.id} name={x.invoiceNumber} /></td>
  </tr>
}
