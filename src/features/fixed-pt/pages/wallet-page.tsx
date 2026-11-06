import { useState } from 'react'
import { ArrowDownToLine, CheckCircle2, Clock3, Hourglass, Landmark, Wallet } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { centerDate } from '@/shared/utils/date'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { label, money } from '../components/ui'
import { Async, Badge, Btn, Card, EmptyBox, ErrorBox, Field, InlineError, PageHeader, Person, Skeleton, StatTile, Table, inputCls, td, useFlash } from '@/features/workspace/ui'

type Withdrawal = { id: string; code: string; amount: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; bankName: string; accountNumber: string; accountName: string; transferRef?: string | null; rejectReason?: string | null; createdAt?: string; coach?: { user: { fullName: string } } }
type Wallet = { pending: number; available: number; reserved: number; withdrawn: number; recovery?: number; minimumWithdrawal: number; holdDays: number; withdrawals: Withdrawal[]; statement: { id: string; amount: string; paidAmount: string; createdAt: string; status: string; outcome?: string }[] }
const W_STATUS: Record<Withdrawal['status'], { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Chờ Manager chi', tone: 'warning' }, APPROVED: { label: 'Đã chuyển khoản', tone: 'success' }, REJECTED: { label: 'Bị từ chối', tone: 'danger' },
}
const LINE_TONE: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = { ELIGIBLE: 'success', PAID: 'neutral', INCLUDED: 'info', PENDING_CONFIRMATION: 'warning', ON_HOLD: 'warning', VOIDED: 'danger' }
const OUTCOME: Record<string, string> = { COMPLETED: 'Buổi đã dạy', NO_SHOW: 'Học viên vắng', CANCELLED_LATE: 'Báo nghỉ muộn' }
const dmy = (iso: string) => centerDate(iso).split('-').reverse().join('/')

/** Coach virtual wallet (PRD §5.8): pending → available after the hold days → withdrawal → Manager pays. */
export function WalletPage() {
  const [month, setMonth] = useState(centerDate().slice(0, 7))
  const state = useLoad(() => hybridGet<Wallet>('/coaches/me/wallet', { month }), [month])
  return <div>
    <PageHeader title="Ví Coach" subtitle="Thu nhập từ các buổi được tính. Manager chuyển khoản rồi xác nhận lệnh rút." />
    {state.error ? <ErrorBox message={state.error} onRetry={() => void state.reload()} /> : !state.data ? <Skeleton rows={4} /> : <WalletBody w={state.data} month={month} setMonth={setMonth} reload={() => void state.reload()} />}
  </div>
}

function WalletBody({ w, month, setMonth, reload }: { w: Wallet; month: string; setMonth: (m: string) => void; reload: () => void }) {
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' })
  const act = useSubmit()
  const { flash, node } = useFlash()
  const pending = w.withdrawals.find(x => x.status === 'PENDING')
  const canWithdraw = !pending && w.available >= w.minimumWithdrawal
  const amount = Number(form.amount)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const submit = () => void act.run(async () => { await hybridSend('post', '/coaches/me/withdrawals', { ...form, amount }); flash('Đã gửi lệnh rút. Manager sẽ chuyển khoản và xác nhận.'); setForm({ ...form, amount: '' }); reload() })
  return <>
    {node}
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Khả dụng" icon={<Wallet className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={money(w.available)} hint={`Rút tối thiểu ${money(w.minimumWithdrawal)}`} />
      <StatTile label="Đang chờ" icon={<Hourglass className="h-[18px] w-[18px]" />} iconTone="warning" value={money(w.pending)} hint={`Khả dụng sau ${w.holdDays} ngày nếu không có khiếu nại`} />
      <StatTile label="Đang rút" icon={<Clock3 className="h-[18px] w-[18px]" />} iconTone="info" value={money(w.reserved)} hint={pending ? `Lệnh ${pending.code}` : 'Không có lệnh chờ'} />
      <StatTile label="Đã rút" icon={<CheckCircle2 className="h-[18px] w-[18px]" />} iconTone="primary" value={money(w.withdrawn)} hint={w.recovery ? `Đang thu hồi ${money(w.recovery)}` : undefined} />
    </div>
    <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
      <Card title="Tạo lệnh rút" subtitle={pending ? 'Mỗi lúc chỉ có một lệnh chờ duyệt.' : 'Tiền được chuyển vào tài khoản ngân hàng của bạn.'}>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit() }}>
          <fieldset disabled={!canWithdraw || act.busy} className="space-y-4">
            <Field label="Số tiền (đ)" required hint={canWithdraw ? `Tối đa ${money(w.available)}` : pending ? 'Chờ lệnh hiện tại được xử lý.' : `Cần tối thiểu ${money(w.minimumWithdrawal)} khả dụng.`}>
              <div className="flex gap-2"><input required type="number" min={w.minimumWithdrawal} max={w.available} className={inputCls} value={form.amount} onChange={set('amount')} />
                <Btn onClick={() => setForm({ ...form, amount: String(Math.floor(w.available)) })}>Rút hết</Btn></div>
            </Field>
            <Field label="Ngân hàng" required><input required className={inputCls} value={form.bankName} onChange={set('bankName')} placeholder="VD: Vietcombank" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Số tài khoản" required><input required inputMode="numeric" className={inputCls} value={form.accountNumber} onChange={set('accountNumber')} /></Field>
              <Field label="Chủ tài khoản" required><input required className={inputCls} value={form.accountName} onChange={set('accountName')} /></Field>
            </div>
          </fieldset>
          <InlineError message={act.error} />
          <Btn type="submit" variant="primary" className="w-full" busy={act.busy} disabled={!canWithdraw || amount < w.minimumWithdrawal || amount > w.available} icon={<ArrowDownToLine aria-hidden className="h-4 w-4" />}>Gửi lệnh rút</Btn>
        </form>
      </Card>
      <div className="space-y-6">
        <Card flush title="Lệnh rút">
          {w.withdrawals.length === 0 ? <EmptyBox icon={<Landmark className="h-5 w-5" />} title="Chưa có lệnh rút" /> : <Table head={['Mã', 'Số tiền', 'Tài khoản', 'Trạng thái']} minWidth={560} alignLast={false}>
            {w.withdrawals.map(x => <tr key={x.id}>
              <td className={`${td} font-medium`}>{x.code}{x.createdAt && <p className="text-xs text-text-muted">{dmy(x.createdAt)}</p>}</td>
              <td className={`${td} tabular-nums font-semibold`}>{money(x.amount)}</td>
              <td className={td}>{x.bankName}<p className="text-xs text-text-muted">{x.accountNumber}</p></td>
              <td className={td}><Badge tone={W_STATUS[x.status].tone}>{W_STATUS[x.status].label}</Badge>{(x.transferRef || x.rejectReason) && <p className="mt-1 text-xs text-text-muted">{x.transferRef ? `Mã GD: ${x.transferRef}` : x.rejectReason}</p>}</td>
            </tr>)}
          </Table>}
        </Card>
        <Card flush title="Sao kê theo buổi" actions={<label><span className="sr-only">Tháng sao kê</span><input type="month" className={`${inputCls} w-40`} value={month} onChange={e => setMonth(e.target.value)} /></label>}>
          {w.statement.length === 0 ? <EmptyBox title="Không có khoản thu trong tháng" /> : <Table head={['Ngày', 'Khoản', 'Số tiền', 'Trạng thái']} minWidth={560} alignLast={false}>
            {w.statement.map(x => <tr key={x.id}>
              <td className={`${td} tabular-nums`}>{dmy(x.createdAt)}</td>
              <td className={td}>{OUTCOME[x.outcome ?? ''] ?? 'Buổi PT'}</td>
              <td className={`${td} tabular-nums`}>{money(x.amount)}{Number(x.paidAmount) > 0 && Number(x.paidAmount) < Number(x.amount) && <p className="text-xs text-text-muted">đã rút {money(x.paidAmount)}</p>}</td>
              <td className={td}><Badge tone={LINE_TONE[x.status] ?? 'neutral'}>{label(x.status)}</Badge></td>
            </tr>)}
          </Table>}
        </Card>
      </div>
    </div>
  </>
}

/** Manager queue: pay outside the system, then confirm with the transfer reference (or reject with a reason). */
export function WithdrawalsPanel() {
  const state = useLoad(() => hybridGet<Withdrawal[]>('/coach-withdrawals', { status: 'PENDING' }))
  const [open, setOpen] = useState<Withdrawal | null>(null)
  const { flash, node } = useFlash()
  return <Card flush title="Lệnh rút chờ chi" badge={state.data ? <Badge tone="warning">{state.data.length}</Badge> : null} subtitle="Chuyển khoản ngoài hệ thống rồi nhập mã giao dịch để xác nhận.">
    {node}
    <Async state={state} rows={3} empty={rows => !rows.length && <EmptyBox icon={<CheckCircle2 className="h-5 w-5" />} title="Không có lệnh rút chờ chi" />}>
      {rows => <Table head={['Coach', 'Số tiền', 'Tài khoản nhận', '']} minWidth={720}>
        {rows.map(w => <tr key={w.id} className="hover:bg-bg-surface-muted/40">
          <td className={td}><span className="flex items-center gap-3"><Person name={w.coach?.user.fullName} /><span><span className="block font-semibold">{w.coach?.user.fullName}</span><span className="text-xs text-text-muted">{w.code}</span></span></span></td>
          <td className={`${td} font-semibold tabular-nums`}>{money(w.amount)}</td>
          <td className={td}>{w.bankName} · {w.accountNumber}<p className="text-xs text-text-muted">{w.accountName}</p></td>
          <td className={`${td} text-right`}><Btn size="sm" variant="soft" onClick={() => setOpen(w)}>Xử lý</Btn></td>
        </tr>)}
      </Table>}
    </Async>
    {open && <ReviewWithdrawal w={open} onClose={() => setOpen(null)} onDone={m => { flash(m); setOpen(null); void state.reload() }} />}
  </Card>
}

function ReviewWithdrawal({ w, onClose, onDone }: { w: Withdrawal; onClose: () => void; onDone: (m: string) => void }) {
  const [text, setText] = useState('')
  const act = useSubmit()
  const review = (approve: boolean) => void act.run(async () => { await hybridSend('patch', `/coach-withdrawals/${w.id}/review`, { approve, ...(approve ? { transferRef: text.trim() } : { reason: text.trim() }) }); onDone(approve ? 'Đã xác nhận chi.' : 'Đã từ chối lệnh rút.') })
  return <Modal isOpen onClose={onClose} title={`Lệnh rút ${w.code}`} description={`${w.coach?.user.fullName ?? ''} · ${money(w.amount)}`}>
    <div className="space-y-4">
      <div className="rounded-lg bg-bg-surface-muted px-3 py-2 text-sm"><p className="font-medium">{w.bankName}</p><p className="tabular-nums">{w.accountNumber}</p><p>{w.accountName}</p></div>
      <Field label="Mã giao dịch đã chuyển (khi duyệt) / lý do (khi từ chối)" required><input className={inputCls} value={text} onChange={e => setText(e.target.value)} /></Field>
      <InlineError message={act.error} />
      <div className="flex justify-end gap-2">
        <Btn variant="danger" busy={act.busy} disabled={!text.trim()} onClick={() => review(false)}>Từ chối</Btn>
        <Btn variant="primary" busy={act.busy} disabled={!text.trim()} onClick={() => review(true)}>Đã chuyển khoản — xác nhận</Btn>
      </div>
    </div>
  </Modal>
}
