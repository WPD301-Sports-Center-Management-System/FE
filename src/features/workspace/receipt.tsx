import { useEffect, useId, useState, type ReactNode } from 'react'
import { useDialog } from '@/shared/hooks/use-dialog'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { CheckCircle2, Clock3, Download, Dumbbell, Printer, X } from 'lucide-react'
import { apiClient } from '@/shared/api/client'
import { appConfig } from '@/app/config'
import { downloadBlob } from '@/shared/utils/download'
import { transferNote, vietQrPayload } from '@/shared/utils/vietqr'
import { CENTER_TIME_ZONE } from '@/shared/utils/date'

// Payment receipt shown wherever money is taken or an invoice is opened: the invoice on the left,
// and on the right either the VietQR transfer details (waiting for a transfer) or the payment proof.
// Printing outputs only the invoice. Stacks into one column on small screens.

export interface ReceiptLine { name: string; qty?: number; amount: number; note?: string }
export interface ReceiptData {
  number?: string | null
  issuedAt: string
  customer: { name: string; sub?: string | null }
  cashier?: string | null
  method: 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | string
  transferNote?: string
  paymentCode?: string | null
  lines: ReceiptLine[]
  total: number
  status: 'PAID' | 'AWAITING_TRANSFER' | 'PENDING'
  invoiceId?: string | null
  change?: number
  notice?: string
  externalRef?: string | null
}
export const METHOD_TEXT: Record<string, string> = { CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', VNPAY: 'VNPay' }
const vnd = (v: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(v))} ₫`
const stamp = (iso: string) => new Intl.DateTimeFormat('vi-VN', { timeZone: CENTER_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)).replace(',', ' ·')

/** Invoice from the API (GET /invoices/:id includes its payment) in receipt shape. */
export interface InvoiceRecord { id: string; invoiceNumber: string; memberNameSnapshot: string; memberEmailSnapshot: string; itemNameSnapshot: string; subtotal: string; total: string; issuedAt: string; payment?: { paymentCode: string; method: string; amount: string } | null }
export async function loadInvoiceReceipt(invoiceId: string): Promise<ReceiptData> {
  const inv = ((await apiClient.get(`/invoices/${invoiceId}`)) as unknown as { data: InvoiceRecord }).data
  return { number: inv.invoiceNumber, issuedAt: inv.issuedAt, customer: { name: inv.memberNameSnapshot, sub: inv.memberEmailSnapshot }, method: inv.payment?.method ?? '', paymentCode: inv.payment?.paymentCode,
    lines: [{ name: inv.itemNameSnapshot, qty: 1, amount: Number(inv.subtotal) }], total: Number(inv.total), status: 'PAID', invoiceId: inv.id }
}

export function ReceiptModal({ data, onClose, onConfirmTransfer, footer }: { data: ReceiptData | null; onClose: () => void; onConfirmTransfer?: (ref: string) => Promise<boolean | undefined>; footer?: ReactNode }) {
  const titleId = useId()
  const dialog = useDialog(!!data, onClose)
  if (!data) return null
  return createPortal(<div className="receipt-print-root fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
    <div className="no-print absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden onClick={onClose} />
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
      className="receipt-sheet relative flex max-h-[100dvh] w-full max-w-6xl flex-col overflow-y-auto rounded-t-2xl bg-bg-surface shadow-2xl outline-none sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl lg:flex-row lg:overflow-hidden">
      <button type="button" onClick={onClose} aria-label="Đóng hóa đơn" className="no-print absolute right-3 top-3 z-10 rounded-lg p-2 text-text-muted hover:bg-bg-surface-muted"><X className="h-5 w-5" /></button>
      <Invoice data={data} titleId={titleId} footer={footer} />
      <aside className="no-print flex flex-col gap-4 border-t border-border-subtle bg-bg-surface-muted/60 p-6 lg:w-[400px] lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-8">
        {data.status === 'AWAITING_TRANSFER' ? <TransferPanel data={data} onConfirm={onConfirmTransfer} /> : <PaidPanel data={data} />}
      </aside>
    </div>
  </div>, document.body)
}

function Invoice({ data, titleId, footer }: { data: ReceiptData; titleId: string; footer?: ReactNode }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subtotal = data.lines.reduce((n, l) => n + l.amount, 0)
  const discount = Math.max(0, subtotal - data.total)
  const rows: [string, ReactNode][] = [
    ['Khách hàng', <>{data.customer.name}{data.customer.sub && <span className="font-normal text-text-muted"> · {data.customer.sub}</span>}</>],
    ...(data.cashier ? [['Thu ngân', data.cashier] as [string, ReactNode]] : []),
    ['Thanh toán', METHOD_TEXT[data.method] ?? (data.method || '—')],
    ...(data.paymentCode ? [['Mã giao dịch', data.paymentCode] as [string, ReactNode]] : []),
    ...(data.externalRef ? [['Mã chuyển khoản', data.externalRef] as [string, ReactNode]] : []),
  ]
  return <section className="receipt-paper flex min-w-0 flex-1 flex-col p-6 lg:overflow-y-auto lg:p-9">
    <header className="flex flex-wrap items-start justify-between gap-4 pr-10 md:pr-0">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-blue-400 text-white shadow-md shadow-primary/30"><Dumbbell className="h-6 w-6" /></span>
        <div><p className="text-lg font-bold tracking-tight text-text-primary">ApexFIT</p><p className="text-sm text-text-muted">Gym & Personal Training</p></div>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{data.status === 'PAID' ? data.invoiceId ? 'Hóa đơn thanh toán' : 'Biên nhận thanh toán' : 'Hóa đơn tạm tính'}</p>
        <h2 id={titleId} className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums text-text-primary">{data.number ?? 'Chưa xuất số'}</h2>
        <p className="mt-0.5 text-sm tabular-nums text-text-muted">{stamp(data.issuedAt)}</p>
      </div>
    </header>
    <hr className="my-6 border-dashed border-border-strong" />
    <dl className="grid grid-cols-[88px_1fr] gap-x-3 sm:grid-cols-[minmax(110px,auto)_1fr] sm:gap-x-6 gap-y-3 text-[15px]">
      {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-text-muted">{k}</dt><dd className="font-semibold text-text-primary [overflow-wrap:anywhere]">{v}</dd></div>)}
    </dl>
    <hr className="my-6 border-dashed border-border-strong" />
    <table className="w-full text-[15px]">
      <thead><tr className="bg-bg-surface-muted/70 text-xs uppercase tracking-wider text-text-muted"><th className="py-2.5 pl-3 text-left font-semibold">Nội dung</th><th className="w-16 py-2.5 text-center font-semibold">SL</th><th className="py-2.5 pr-3 text-right font-semibold">Thành tiền</th></tr></thead>
      <tbody>{data.lines.map((l, i) => <tr key={i} className="border-b border-border-subtle"><td className="py-3.5 pl-3 text-text-primary">{l.name}{l.note && <p className="text-xs text-text-muted">{l.note}</p>}</td><td className="py-3.5 text-center tabular-nums text-text-muted">×{l.qty ?? 1}</td><td className="py-3.5 pr-3 text-right font-medium tabular-nums">{vnd(l.amount)}</td></tr>)}</tbody>
    </table>
    <dl className="mt-5 space-y-2 text-[15px]">
      <div className="flex justify-between"><dt className="text-text-muted">Tạm tính</dt><dd className="font-semibold tabular-nums">{vnd(subtotal)}</dd></div>
      {discount > 0 && <div className="flex justify-between"><dt className="text-text-muted">Giảm giá</dt><dd className="font-semibold tabular-nums text-emerald-700">−{vnd(discount)}</dd></div>}
    </dl>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/10 px-5 py-4">
      <span className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Tổng cộng</span>
      <span className="text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">{vnd(data.total)}</span>
    </div>
    {data.change ? <p className="mt-3 text-right text-sm text-text-muted">Tiền thối cho khách: <span className="font-semibold text-text-primary">{vnd(data.change)}</span></p> : null}
    <p className="mt-6 text-center text-sm text-text-muted">Cảm ơn quý khách, hẹn gặp lại tại phòng tập!</p>
    {error && <p role="alert" className="no-print mt-3 text-center text-sm text-red-600">{error}</p>}
    <div className="no-print mt-6 grid gap-3 sm:grid-cols-2">
      <button type="button" disabled={!data.invoiceId || busy} title={data.invoiceId ? undefined : 'Hóa đơn được xuất sau khi thanh toán xong'}
        onClick={async () => { setBusy(true); setError(null); try { await downloadBlob((await apiClient.get(`/invoices/${data.invoiceId}/pdf`, { responseType: 'blob' })) as unknown as Blob, `${data.number ?? 'hoa-don'}.pdf`) } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được hóa đơn.') } finally { setBusy(false) } }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-surface font-semibold text-text-primary hover:bg-bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"><Download aria-hidden className="h-5 w-5" />{busy ? 'Đang tải…' : 'Tải hóa đơn PDF'}</button>
      <button type="button" onClick={() => window.print()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary-hover"><Printer aria-hidden className="h-5 w-5" />In hóa đơn</button>
    </div>
    {footer && <div className="no-print mt-3">{footer}</div>}
  </section>
}

function TransferPanel({ data, onConfirm }: { data: ReceiptData; onConfirm?: (ref: string) => Promise<boolean | undefined> }) {
  const bank = appConfig.bank
  const ready = /^\d{6}$/.test(bank.bin) && /^[A-Za-z0-9]{1,19}$/.test(bank.accountNo)
  const note = transferNote(data.transferNote ?? `${data.paymentCode ?? data.number ?? 'SC'} ${data.customer.name}`)
  const [qr, setQr] = useState<string | null>(null)
  const [qrError, setQrError] = useState(false)
  const [ref, setRef] = useState(data.externalRef ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setQr(null)
    setQrError(false)
    if (!ready) return
    let alive = true
    QRCode.toDataURL(vietQrPayload({ bin: bank.bin, accountNo: bank.accountNo, amount: data.total, note }), { margin: 1, width: 560, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } })
      .then(url => { if (alive) setQr(url) }).catch(() => { if (alive) setQrError(true) })
    return () => { alive = false }
  }, [ready, bank.bin, bank.accountNo, data.total, note])
  return <>
    <h3 className="pr-8 text-sm font-bold uppercase tracking-[0.12em] text-text-primary">Chuyển khoản ngân hàng</h3>
    {ready ? <>
      <dl className="grid grid-cols-[110px_1fr] gap-y-2.5 text-[15px]">
        <dt className="text-text-muted">Ngân hàng</dt><dd className="flex flex-wrap items-center gap-2 font-semibold">{bank.name || bank.bin}<span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">VietQR</span></dd>
        {bank.accountName && <><dt className="text-text-muted">Chủ tài khoản</dt><dd className="font-semibold uppercase">{bank.accountName}</dd></>}
        <dt className="text-text-muted">Số tài khoản</dt><dd className="font-semibold tabular-nums tracking-wide">{bank.accountNo.replace(/(\d{4})(?=\d)/g, '$1 ')}</dd>
      </dl>
      <div className="grid place-items-center rounded-2xl border border-border-subtle bg-white p-4">
        {qr ? <img src={qr} alt={`Mã VietQR chuyển ${vnd(data.total)} tới ${bank.accountNo}`} className="aspect-square w-full max-w-[280px]" /> : qrError ? <p role="alert" className="p-4 text-sm text-slate-600">Không tạo được mã QR. Vui lòng chuyển khoản theo thông tin tài khoản bên trên.</p> : <div aria-label="Đang tạo mã QR" className="aspect-square w-full max-w-[280px] animate-pulse rounded-lg bg-slate-100" />}
      </div>
      <dl className="grid grid-cols-[110px_1fr] gap-y-2.5 text-[15px]">
        <dt className="text-text-muted">Số tiền</dt><dd className="text-2xl font-extrabold tabular-nums text-primary">{vnd(data.total)}</dd>
        <dt className="text-text-muted">Nội dung CK</dt><dd className="font-semibold [overflow-wrap:anywhere]">{note}</dd>
      </dl>
      <p className="text-sm text-text-muted">Khách quét bằng app ngân hàng bất kỳ (NAPAS 247). Kiểm tra tiền đã vào tài khoản rồi mới xác nhận.</p>
    </> : <p className="rounded-xl border border-dashed border-border-strong bg-bg-surface p-4 text-sm text-text-muted">Thông tin chuyển khoản chưa sẵn sàng. Vui lòng liên hệ quầy để lấy tài khoản nhận tiền và kiểm tra giao dịch trước khi xác nhận.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {onConfirm && <form className="mt-auto space-y-3 border-t border-border-subtle pt-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { await onConfirm(ref.trim()) } catch (e) { setError(e instanceof Error ? e.message : 'Không xác nhận được giao dịch.') } finally { setBusy(false) } }}>
      <label className="block space-y-1.5"><span className="text-sm font-medium">Mã giao dịch ngân hàng (nếu có)</span>
        <input value={ref} onChange={e => setRef(e.target.value)} maxLength={120} className="h-10 w-full rounded-lg border border-border-subtle bg-bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30" placeholder="VD: FT26301123456" /></label>
      <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><CheckCircle2 aria-hidden className="h-5 w-5" />{busy ? 'Đang xác nhận…' : 'Đã nhận tiền — xác nhận'}</button>
    </form>}
  </>
}

function PaidPanel({ data }: { data: ReceiptData }) {
  const paid = data.status === 'PAID'
  return <>
    <h3 className="pr-8 text-sm font-bold uppercase tracking-[0.12em] text-text-primary">Trạng thái thanh toán</h3>
    <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-surface px-6 py-8 text-center">
      <span aria-hidden className={`grid h-16 w-16 place-items-center rounded-full ${paid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15'}`}>{paid ? <CheckCircle2 className="h-9 w-9" /> : <Clock3 className="h-9 w-9" />}</span>
      <p className="mt-4 text-xl font-bold">{paid ? 'Đã thanh toán' : 'Đang chờ thanh toán'}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums text-text-primary">{vnd(data.total)}</p>
      <p className="mt-2 text-sm text-text-muted">{paid ? `Qua ${METHOD_TEXT[data.method] ?? data.method}` : 'Hóa đơn được xuất ngay khi giao dịch được xác nhận.'}</p>
    </div>
    <dl className="grid grid-cols-[120px_1fr] gap-y-2.5 text-[15px]">
      {data.paymentCode && <><dt className="text-text-muted">Mã giao dịch</dt><dd className="font-semibold tabular-nums [overflow-wrap:anywhere]">{data.paymentCode}</dd></>}
      {data.number && <><dt className="text-text-muted">Số hóa đơn</dt><dd className="font-semibold tabular-nums [overflow-wrap:anywhere]">{data.number}</dd></>}
      <dt className="text-text-muted">Thời gian</dt><dd className="font-semibold tabular-nums">{stamp(data.issuedAt)}</dd>
    </dl>
    {data.notice && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{data.notice}</p>}
    <p className="mt-auto text-sm text-text-muted">Hội viên xem lại hóa đơn trong ứng dụng, mục Thanh toán & hóa đơn.</p>
  </>
}
