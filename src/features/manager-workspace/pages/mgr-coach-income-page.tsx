import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Clock3, Download, HandCoins, Scale, Wallet, X } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { EarningLine } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, LinkBtn, PageHeader, Person, Segmented, StatTile, Table, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { downloadCsv, fmtMoney, fmtNumber, type Tone } from '@/features/workspace/utils'
import { dmy } from '@/features/reception-workspace/labels'
import { mgrApi } from '../api'
import { useMgrShell } from '../shell'

const OUTCOME: Record<string, string> = { COMPLETED: 'Hoàn thành', NO_SHOW: 'Học viên vắng', CANCELLED_LATE: 'Hủy muộn' }
const PERIOD: Record<string, { label: string; tone: Tone }> = { DRAFT: { label: 'Đang lập', tone: 'neutral' }, LOCKED: { label: 'Đã chốt', tone: 'info' }, PAID: { label: 'Đã chi trả', tone: 'success' }, CANCELLED: { label: 'Đã hủy', tone: 'neutral' } }
const amount = (l: EarningLine) => Number(l.amount) || 0
const millions = (v: number) => `${fmtNumber(v / 1_000_000, 1)}tr`

export function MgrCoachIncomePage() {
  const { refresh } = useMgrShell()
  const { flash, node } = useFlash()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'pending' ? 'pending' : 'coaches'
  const lines = useLoad(() => mgrApi.earnings({}, 10), [])
  const summary = useLoad(() => mgrApi.earningSummary(), [])
  const periods = useLoad(() => mgrApi.periods(), [])
  const adjustments = useLoad(() => mgrApi.adjustments(), [])
  const all = lines.data ?? []
  const months = useMemo(() => [...new Set([centerDate().slice(0, 7), ...(lines.data ?? []).map(l => centerDate(l.booking.plannedStartsAt).slice(0, 7))])].sort().reverse(), [lines.data])
  const [month, setMonth] = useState(() => centerDate().slice(0, 7))
  const [reject, setReject] = useState<EarningLine | null>(null)
  const inMonth = all.filter(l => l.effective && l.status !== 'VOIDED' && centerDate(l.booking.plannedStartsAt).startsWith(month))
  const byCoach = useMemo(() => {
    const m = new Map<string, { name: string; n: number; done: number; other: number; total: number; pending: number; hold: number; paid: number }>()
    for (const l of inMonth) {
      const r = m.get(l.coachId) ?? { name: l.coach?.user.fullName ?? '—', n: 0, done: 0, other: 0, total: 0, pending: 0, hold: 0, paid: 0 }
      r.n++; if (l.outcome === 'COMPLETED') r.done++; else r.other++
      r.total += amount(l)
      if (l.status === 'PENDING_CONFIRMATION') r.pending += amount(l)
      if (l.status === 'ON_HOLD') r.hold += amount(l)
      if (l.status === 'PAID' || l.status === 'SETTLED_BY_ADVANCE') r.paid += amount(l)
      m.set(l.coachId, r)
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total)
  }, [inMonth])
  const pending = all.filter(l => l.status === 'PENDING_CONFIRMATION')
  const s = summary.data
  const payable = s ? (s.byStatus.ELIGIBLE?.amount ?? 0) + (s.byStatus.INCLUDED?.amount ?? 0) : null
  const total = inMonth.reduce((n, l) => n + amount(l), 0)
  const setTab = (t: string) => { const p = new URLSearchParams(params); p.set('tab', t); setParams(p, { replace: true }) }
  const done = (m: string) => { flash(m); setReject(null); void lines.reload(); void summary.reload(); refresh() }

  return <div>
    {node}
    <PageHeader title="Thu nhập & chi trả Coach" subtitle={<><span>Tính theo từng buổi đã dạy</span><Dot /><span>Tháng {month.slice(5)}/{month.slice(0, 4)}: {fmtMoney(total)} cho {byCoach.length} Coach</span></>}
      actions={<>
        <label><span className="sr-only">Chọn tháng</span><select value={month} onChange={e => setMonth(e.target.value)} className="h-9 rounded-lg border border-border-subtle bg-bg-input px-2 text-sm">{months.map(m => <option key={m} value={m}>Tháng {m.slice(5)}/{m.slice(0, 4)}</option>)}</select></label>
        <LinkBtn to="/manager/coach-ledger" icon={<Scale aria-hidden className="h-4 w-4" />}>Kỳ chi & điều chỉnh</LinkBtn>
        <Btn variant="primary" icon={<Download aria-hidden className="h-4 w-4" />} disabled={!byCoach.length} onClick={() => downloadCsv(`thu-nhap-coach-${month}.csv`, ['Coach', 'Buổi tính', 'Hoàn thành', 'Vắng/hủy muộn', 'Ghi nhận', 'Chờ xác nhận', 'Tạm giữ', 'Đã chi'],
          byCoach.map(([, r]) => [r.name, r.n, r.done, r.other, r.total, r.pending, r.hold, r.paid]))}>Xuất Excel (CSV)</Btn>
      </>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label={`Ghi nhận tháng ${month.slice(5)}`} icon={<Wallet className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={lines.data ? fmtNumber(total / 1_000_000, 1) : '—'} unit="triệu ₫" hint={lines.data ? `${inMonth.length} buổi được tính` : undefined} />
      <StatTile label="Đủ điều kiện, chờ chi" icon={<HandCoins className="h-[18px] w-[18px]" />} iconTone="info" value={payable === null ? '—' : fmtNumber(payable / 1_000_000, 1)} unit="triệu ₫" hint={s ? `Đã chi tổng cộng ${millions(s.paidOut)}` : undefined} />
      <StatTile label="Chờ Manager xác nhận" icon={<Clock3 className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={lines.data ? pending.length : '—'} unit="buổi" hint={pending.length ? fmtMoney(pending.reduce((n, l) => n + amount(l), 0)) : 'Không có khoản chờ'} />
      <StatTile label="Ứng trước / thu hồi còn lại" icon={<Scale className="h-[18px] w-[18px]" />} iconTone="violet" value={s ? fmtNumber((s.advanceRemaining + s.recoveryOutstanding) / 1_000_000, 1) : '—'} unit="triệu ₫" hint={s ? `Ứng ${millions(s.advanceRemaining)} · thu hồi ${millions(s.recoveryOutstanding)}` : undefined} />
    </div>
    <Card flush className="mb-6" title={tab === 'coaches' ? `Chi trả theo Coach — tháng ${month.slice(5)}/${month.slice(0, 4)}` : 'Khoản chờ xác nhận'} subtitle={tab === 'coaches' ? 'Theo ngày diễn ra buổi; số đã chi có thể thuộc kỳ trước' : 'Buổi học viên vắng hoặc hủy muộn: Manager quyết định Coach có được tính hay không'}
      actions={<Segmented label="Chế độ" value={tab} onChange={setTab} items={[{ key: 'coaches', label: 'Theo Coach', count: byCoach.length }, { key: 'pending', label: 'Chờ xác nhận', count: pending.length }]} />}>
      {tab === 'coaches' ? <Async state={lines} rows={6} empty={() => !byCoach.length && <EmptyBox title="Chưa có buổi nào được tính trong tháng" />}>
        {() => <Table head={['Coach', 'Buổi tính', 'Hoàn thành', 'Vắng / hủy muộn', 'Chờ xác nhận', 'Tạm giữ', 'Đã chi', 'Ghi nhận']} minWidth={980}>
          {byCoach.map(([id, r]) => <tr key={id} className="hover:bg-bg-surface-muted/40">
            <td className={td}><span className="flex items-center gap-2"><Person name={r.name} size={32} /><span className="font-semibold">{r.name}</span></span></td>
            <td className={`${td} tabular-nums`}>{r.n}</td><td className={`${td} tabular-nums`}>{r.done}</td><td className={`${td} tabular-nums`}>{r.other}</td>
            <td className={`${td} tabular-nums ${r.pending ? 'text-amber-700 dark:text-amber-400' : 'text-text-muted'}`}>{r.pending ? fmtMoney(r.pending) : '—'}</td>
            <td className={`${td} tabular-nums ${r.hold ? 'text-red-600' : 'text-text-muted'}`}>{r.hold ? fmtMoney(r.hold) : '—'}</td>
            <td className={`${td} tabular-nums text-text-muted`}>{r.paid ? fmtMoney(r.paid) : '—'}</td>
            <td className={`${td} text-right font-semibold tabular-nums`}>{fmtMoney(r.total)}</td>
          </tr>)}
          <tr className="bg-bg-surface-muted/40"><td className={`${td} font-semibold`} colSpan={7}>Tổng ghi nhận tháng</td><td className={`${td} text-right text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400`}>{fmtMoney(total)}</td></tr>
        </Table>}
      </Async> : <Async state={lines} rows={5} empty={() => !pending.length && <EmptyBox icon={<Check className="h-5 w-5" />} title="Không có khoản chờ xác nhận" />}>
        {() => <Table head={['Buổi', 'Coach', 'Học viên', 'Kết quả', 'Số tiền', 'Quyết định']} minWidth={900}>
          {pending.map(l => <PendingRow key={l.id} l={l} onReject={() => setReject(l)} onDone={done} />)}
        </Table>}
      </Async>}
    </Card>
    <div className="grid gap-6 2xl:grid-cols-2">
      <Card flush title="Kỳ chi trả gần đây" actions={<LinkBtn size="sm" to="/manager/coach-ledger">Lập / chốt kỳ</LinkBtn>}>
        <Async state={periods} rows={4} empty={p => !p.length && <EmptyBox title="Chưa có kỳ chi trả" />}>
          {p => <Table head={['Kỳ', 'Coach', 'Thời gian', 'Thực nhận', 'Trạng thái']} minWidth={640} alignLast={false}>
            {p.slice(0, 8).map(x => <tr key={x.id}><td className={`${td} font-semibold`}>{x.code}</td><td className={td}>{x.coach?.user.fullName ?? '—'}</td><td className={`${td} tabular-nums`}>{dmy(x.periodFrom)} – {dmy(x.periodTo)}</td>
              <td className={`${td} font-semibold tabular-nums`}>{fmtMoney(x.netAmount)}</td><td className={td}><Badge tone={PERIOD[x.status]?.tone ?? 'neutral'}>{PERIOD[x.status]?.label ?? x.status}</Badge></td></tr>)}
          </Table>}
        </Async>
      </Card>
      <Card flush title="Điều chỉnh & thu hồi" actions={<LinkBtn size="sm" to="/manager/coach-ledger">Tạo điều chỉnh</LinkBtn>}>
        <Async state={adjustments} rows={4} empty={a => !a.length && <EmptyBox title="Chưa có khoản điều chỉnh" />}>
          {a => <Table head={['Mã', 'Coach', 'Loại', 'Số tiền', 'Còn lại', 'Lý do']} minWidth={700} alignLast={false}>
            {a.slice(0, 8).map(x => <tr key={x.id}><td className={`${td} font-semibold`}>{x.code}</td><td className={td}>{x.coach?.user.fullName ?? '—'}</td>
              <td className={td}><Badge tone={x.type === 'ADDITION' ? 'success' : 'danger'}>{x.type === 'ADDITION' ? 'Bổ sung' : 'Thu hồi'}</Badge></td>
              <td className={`${td} tabular-nums ${x.type === 'ADDITION' ? '' : 'text-red-600'}`}>{x.type === 'ADDITION' ? '+' : '−'}{fmtMoney(x.amount)}</td>
              <td className={`${td} tabular-nums`}>{fmtMoney(x.remaining)}</td><td className={`${td} max-w-64 text-xs text-text-muted`}>{x.reason}</td></tr>)}
          </Table>}
        </Async>
      </Card>
    </div>
    {reject && <RejectModal l={reject} onClose={() => setReject(null)} onDone={done} />}
  </div>
}

function PendingRow({ l, onReject, onDone }: { l: EarningLine; onReject: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <tr className="hover:bg-bg-surface-muted/40">
    <td className={`${td} tabular-nums`}>{dmy(l.booking.plannedStartsAt)}<p className="text-xs text-text-muted">{l.booking.bookingCode} · buổi {l.credit.creditIndex}</p></td>
    <td className={td}>{l.coach?.user.fullName ?? '—'}</td>
    <td className={td}>{l.purchase.member.user.fullName}<p className="text-xs text-text-muted">{l.purchase.packageNameSnapshot}</p></td>
    <td className={td}><Badge tone="warning">{OUTCOME[l.outcome] ?? l.outcome}</Badge></td>
    <td className={`${td} font-semibold tabular-nums`}>{fmtMoney(l.amount)}</td>
    <td className={`${td} text-right`}><div className="flex justify-end gap-1.5">
      <Btn size="sm" variant="soft" busy={submit.busy} icon={<Check aria-hidden className="h-4 w-4" />} onClick={async () => { if (await submit.run(() => mgrApi.confirmEarning(l.id))) onDone('Đã công nhận khoản cho Coach.') }}>Công nhận</Btn>
      <Btn size="sm" icon={<X aria-hidden className="h-4 w-4" />} onClick={onReject}>Không tính</Btn>
    </div>{submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}</td>
  </tr>
}

function RejectModal({ l, onClose, onDone }: { l: EarningLine; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [reason, setReason] = useState('')
  return <Modal isOpen onClose={onClose} title="Không tính khoản này cho Coach" description={`${l.coach?.user.fullName ?? ''} · ${l.purchase.member.user.fullName} · ${dmy(l.booking.plannedStartsAt)} · ${fmtMoney(l.amount)}`}>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => mgrApi.rejectEarning(l.id, reason.trim()))) onDone('Đã ghi nhận không tính khoản này.') }}>
      <Field label="Lý do (Coach sẽ thấy)" required><textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Quay lại</Btn><Btn type="submit" variant="danger" busy={submit.busy} disabled={!reason.trim()}>Không tính</Btn></div>
    </form>
  </Modal>
}
