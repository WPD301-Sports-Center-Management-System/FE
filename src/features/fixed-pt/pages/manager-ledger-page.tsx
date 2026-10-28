import { holdReasonLabel } from '@/features/workspace/utils'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { centerDate, formatDate, formatDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { Adjustment, EarningLine, PayoutPeriod } from '../types'
import { ErrorBanner, Field, inputCls, label, Loadable, money, Notice, Page, Panel, Status, Table, td } from '../components/ui'
import { ReasonDialog } from '../components/widgets'

type Tab = 'lines' | 'periods' | 'adjustments' | 'advances'
// Manager: internal Coach ledger. Lock reserves a period; only "mark paid" (after the external
// transfer) settles lines and offsets. No wallet, no withdrawals.
export function ManagerLedgerPage() {
  const coaches = useLoad(async () => (await coachesService.getCoaches({ limit: 100 })).data ?? [], [])
  const [coachId, setCoachId] = useState('')
  const [tab, setTab] = useState<Tab>('lines')
  const summary = useLoad(() => fixedPtApi.earningSummary(coachId || undefined), [coachId])
  return (
    <Page title="Đối soát Coach theo buổi/kỳ" subtitle="Ngân sách 60% chỉ thành khoản được nhận khi buổi đủ điều kiện. Chi trả thực hiện ngoài hệ thống theo kỳ.">
      <Panel title="Phạm vi" actions={<select aria-label="Coach" className={inputCls} value={coachId} onChange={e => setCoachId(e.target.value)}><option value="">Tất cả Coach</option>{(coaches.data ?? []).map((c: { id: string; fullName?: string; user?: { fullName: string } }) => <option key={c.id} value={c.id}>{c.fullName ?? c.user?.fullName}</option>)}</select>}>
        {summary.data && <div className="grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {['PENDING_CONFIRMATION', 'ELIGIBLE', 'ON_HOLD', 'INCLUDED', 'PAID', 'SETTLED_BY_ADVANCE'].map(k => <div key={k} className="rounded-xl border border-border-subtle p-2"><div className="text-xs text-text-muted">{label(k)}</div><div className="font-semibold">{money(summary.data!.byStatus[k]?.amount)}</div></div>)}
          <div className="rounded-xl border border-border-subtle p-2"><div className="text-xs text-text-muted">Ứng chưa đối trừ</div><div className="font-semibold">{money(summary.data.advanceRemaining)}</div></div>
          <div className="rounded-xl border border-border-subtle p-2"><div className="text-xs text-text-muted">Thu hồi còn lại</div><div className="font-semibold">{money(summary.data.recoveryOutstanding)}</div></div>
        </div>}
      </Panel>
      <div role="tablist" className="flex flex-wrap gap-2">{(['lines', 'periods', 'adjustments', 'advances'] as Tab[]).map(t => <Button key={t} role="tab" aria-selected={tab === t} size="sm" variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)}>{{ lines: 'Dòng theo buổi', periods: 'Kỳ chi trả', adjustments: 'Điều chỉnh', advances: 'Khoản ứng cũ' }[t]}</Button>)}</div>
      {tab === 'lines' && <LinesTab coachId={coachId} onChanged={() => void summary.reload()} />}
      {tab === 'periods' && <PeriodsTab coachId={coachId} onChanged={() => void summary.reload()} />}
      {tab === 'adjustments' && <AdjustmentsTab coachId={coachId} />}
      {tab === 'advances' && <AdvancesTab />}
    </Page>
  )
}

function LinesTab({ coachId, onChanged }: { coachId: string; onChanged: () => void }) {
  const [status, setStatus] = useState('PENDING_CONFIRMATION')
  const lines = useLoad(() => fixedPtApi.earnings({ coachId: coachId || undefined, status: status || undefined, limit: 100 }), [coachId, status])
  const act = useSubmit()
  const [dialog, setDialog] = useState<{ kind: 'reject' | 'release' | 'dispute' | 'resolve'; line: EarningLine } | null>(null)
  const [resolution, setResolution] = useState<'UPHELD' | 'NOT_ELIGIBLE'>('UPHELD')
  const done = async () => { setDialog(null); await lines.reload(); onChanged() }
  return (
    <Panel title="Dòng thu nhập theo buổi" actions={<select aria-label="Trạng thái" className={inputCls} value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{['PENDING_CONFIRMATION', 'ELIGIBLE', 'ON_HOLD', 'INCLUDED', 'PAID', 'SETTLED_BY_ADVANCE', 'VOIDED'].map(v => <option key={v} value={v}>{label(v)}</option>)}</select>}>
      <ErrorBanner message={act.error} />
      <Loadable state={lines} empty="Không có dòng nào.">{items => (
        <Table head={['Buổi', 'Coach / Member', 'Kết quả', 'Số tiền', 'Trạng thái', '']}>
          {items.map(l => { const open = l.disputes.find(d => d.status === 'OPEN'); return <tr key={l.id}>
            <td className={td}>{formatDateTime(l.booking.plannedStartsAt)}<div className="text-xs text-text-muted">{l.purchase.purchaseCode} · buổi {l.credit.creditIndex}</div></td>
            <td className={td}>{l.coach?.user.fullName}<div className="text-xs text-text-muted">{l.purchase.member.user.fullName}</div></td>
            <td className={td}>{label(l.outcome)}{l.dataOrigin === 'LEGACY' && <div className="text-xs text-text-muted">Dữ liệu cũ</div>}</td>
            <td className={td}>{money(l.amount)}</td>
            <td className={td}><Status value={l.status} />{l.holdReason && <div className="text-xs text-text-muted">{holdReasonLabel(l.holdReason)}</div>}{open && <div className="text-xs text-amber-700">Tranh chấp {open.afterPayment ? 'sau chi' : 'trước chi'}</div>}</td>
            <td className={td}><div className="flex flex-wrap gap-1.5">
              {l.status === 'PENDING_CONFIRMATION' && <><Button size="sm" disabled={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.earningAction(l.id, 'confirm', {}); await done() })}>Công nhận</Button><Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'reject', line: l })}>Không công nhận</Button></>}
              {l.status === 'ON_HOLD' && !open && <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'release', line: l })}>Giải phóng</Button>}
              {open ? <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'resolve', line: l })}>Kết luận tranh chấp</Button>
                : l.status !== 'VOIDED' && l.effective && <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'dispute', line: l })}>Mở tranh chấp</Button>}
            </div></td>
          </tr> })}
        </Table>
      )}</Loadable>
      <ReasonDialog open={dialog?.kind === 'reject'} title="Không công nhận khoản" danger busy={act.busy} error={act.error} onClose={() => { setDialog(null); act.clear() }} onConfirm={reason => void act.run(async () => { await fixedPtApi.earningAction(dialog!.line.id, 'reject', { reason }); await done() })} />
      <ReasonDialog open={dialog?.kind === 'release'} title="Giải phóng khoản tạm giữ" busy={act.busy} error={act.error} onClose={() => { setDialog(null); act.clear() }} onConfirm={reason => void act.run(async () => { await fixedPtApi.earningAction(dialog!.line.id, 'release', { reason }); await done() })} />
      <ReasonDialog open={dialog?.kind === 'dispute'} title="Mở tranh chấp" busy={act.busy} error={act.error} description="Trước khi chi: khoản bị tạm giữ và gỡ khỏi kỳ nháp. Sau khi chi: khoản giữ nguyên, kết luận 'không đủ điều kiện' sẽ tạo khoản thu hồi." onClose={() => { setDialog(null); act.clear() }} onConfirm={reason => void act.run(async () => { await fixedPtApi.openDispute(dialog!.line.id, reason); await done() })} />
      <ReasonDialog open={dialog?.kind === 'resolve'} title="Kết luận tranh chấp" busy={act.busy} error={act.error} confirmLabel="Kết luận"
        extra={<Field label="Kết luận"><select className={inputCls} value={resolution} onChange={e => setResolution(e.target.value as 'UPHELD' | 'NOT_ELIGIBLE')}><option value="UPHELD">Giữ khoản (đủ điều kiện)</option><option value="NOT_ELIGIBLE">Không đủ điều kiện</option></select></Field>}
        onClose={() => { setDialog(null); act.clear() }} onConfirm={note => void act.run(async () => { await fixedPtApi.resolveDispute(dialog!.line.disputes.find(d => d.status === 'OPEN')!.id, resolution, note); await done() })} />
    </Panel>
  )
}

function PeriodsTab({ coachId, onChanged }: { coachId: string; onChanged: () => void }) {
  const periods = useLoad(() => fixedPtApi.periods({ coachId: coachId || undefined, limit: 50 }), [coachId])
  const [from, setFrom] = useState(centerDate()); const [to, setTo] = useState(centerDate())
  const [open, setOpen] = useState<PayoutPeriod | null>(null)
  const create = useSubmit()
  return (
    <Panel title="Kỳ chi trả">
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Field label="Từ ngày"><input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
        <Field label="Đến ngày"><input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
        <Button isLoading={create.busy} disabled={!coachId} onClick={() => void create.run(async () => { const p = await fixedPtApi.createPeriod({ coachId, periodFrom: from, periodTo: to }); await periods.reload(); setOpen(p) })}>Tạo kỳ nháp</Button>
        {!coachId && <span className="text-xs text-text-muted">Chọn Coach để tạo kỳ.</span>}
      </div>
      <ErrorBanner message={create.error} />
      <Loadable state={periods} empty="Chưa có kỳ chi trả.">{items => (
        <Table head={['Kỳ', 'Coach', 'Khoảng', 'Phải trả', 'Bù trừ', 'Thực chi', 'Trạng thái', '']}>
          {items.map(p => <tr key={p.id}><td className={td}>{p.code}</td><td className={td}>{p.coach?.user.fullName}</td><td className={td}>{formatDate(p.periodFrom)} – {formatDate(p.periodTo)}</td><td className={td}>{money(p.grossAmount)}</td><td className={td}>{money(p.offsetAmount)}</td><td className={td}>{money(p.netAmount)}</td><td className={td}><Status value={p.status} /></td><td className={td}><Button size="sm" variant="secondary" onClick={() => setOpen(p)}>Mở</Button></td></tr>)}
        </Table>
      )}</Loadable>
      {open && <PeriodModal period={open} onClose={() => { setOpen(null); void periods.reload(); onChanged() }} />}
    </Panel>
  )
}

function PeriodModal({ period: initial, onClose }: { period: PayoutPeriod; onClose: () => void }) {
  const [period, setPeriod] = useState(initial)
  const adjustments = useLoad(() => fixedPtApi.adjustments({ coachId: period.coachId, limit: 100 }), [period.coachId])
  const [adjId, setAdjId] = useState(''); const [adjAmount, setAdjAmount] = useState(''); const [ref, setRef] = useState('')
  const [dialog, setDialog] = useState<{ kind: 'remove'; itemId: string } | { kind: 'reopen' | 'cancel' } | null>(null)
  const act = useSubmit()
  const apply = (work: () => Promise<PayoutPeriod>) => void act.run(async () => { setPeriod(await work()); setDialog(null) })
  const live = period.items.filter(i => i.status !== 'REMOVED')
  const openAdjustments = (adjustments.data ?? []).filter(a => ['OUTSTANDING', 'PARTIALLY_SETTLED'].includes(a.status))
  return (
    <Modal isOpen onClose={onClose} title={`Kỳ ${period.code} · ${label(period.status)}`} maxWidth="2xl">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm"><div>Phải trả: <strong>{money(period.grossAmount)}</strong></div><div>Bù trừ: <strong>{money(period.offsetAmount)}</strong></div><div>Thực chi: <strong>{money(period.netAmount)}</strong></div></div>
        {period.status === 'LOCKED' && <Notice>Kỳ đã khóa: các khoản được giữ cho kỳ này, <strong>chưa</strong> tính là đã chi hoặc đã thu hồi cho tới khi xác nhận chi.</Notice>}
        <Table head={['Khoản', 'Số tiền', 'Trạng thái', '']}>
          {live.map(i => <tr key={i.id}>
            <td className={td}>{i.itemType === 'EARNING' ? `Buổi ${i.earningLine?.credit.creditIndex} · ${formatDateTime(i.earningLine?.booking.plannedStartsAt)} · ${i.earningLine?.purchase.purchaseCode}` : `Bù trừ ${i.adjustment?.code} · ${i.adjustment?.reason}`}</td>
            <td className={td}>{i.itemType === 'ADJUSTMENT' && i.adjustment?.type === 'RECOVERY' ? '−' : ''}{money(i.amount)}</td>
            <td className={td}>{label(i.status)}</td>
            <td className={td}>{period.status === 'DRAFT' && i.status === 'INCLUDED' && <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'remove', itemId: i.id })}>Gỡ</Button>}</td>
          </tr>)}
        </Table>
        {period.status === 'DRAFT' && openAdjustments.length > 0 && <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border-subtle p-2">
          <Field label="Thêm bù trừ/bổ sung"><select className={inputCls} value={adjId} onChange={e => setAdjId(e.target.value)}><option value="">— Khoản điều chỉnh —</option>{openAdjustments.map(a => <option key={a.id} value={a.id}>{a.code} · {a.type === 'RECOVERY' ? 'Thu hồi' : 'Bổ sung'} · còn {money(a.remaining)}</option>)}</select></Field>
          <Field label="Số tiền trong kỳ này"><input type="number" min={1} className={inputCls} value={adjAmount} onChange={e => setAdjAmount(e.target.value)} /></Field>
          <Button size="sm" variant="secondary" disabled={!adjId || !adjAmount || act.busy} onClick={() => apply(() => fixedPtApi.addPeriodItems(period.id, { adjustmentId: adjId, amount: Number(adjAmount) }))}>Thêm</Button>
        </div>}
        <ErrorBanner message={act.error} />
        <div className="flex flex-wrap justify-end gap-2">
          {period.status === 'DRAFT' && <Button disabled={act.busy} onClick={() => apply(() => fixedPtApi.periodAction(period.id, 'lock'))}>Khóa kỳ</Button>}
          {period.status === 'LOCKED' && <>
            <Button variant="ghost" onClick={() => setDialog({ kind: 'reopen' })}>Mở lại</Button>
            <input aria-label="Mã chuyển khoản" placeholder="Mã chuyển khoản ngoài hệ thống" className={`${inputCls} max-w-xs`} value={ref} onChange={e => setRef(e.target.value)} />
            <Button disabled={!ref.trim() || act.busy} onClick={() => apply(() => fixedPtApi.periodAction(period.id, 'mark-paid', { transferRef: ref.trim() }))}>Xác nhận đã chi</Button>
          </>}
          {['DRAFT', 'LOCKED'].includes(period.status) && <Button variant="ghost" onClick={() => setDialog({ kind: 'cancel' })}>Hủy kỳ</Button>}
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </div>
      <ReasonDialog open={!!dialog} title={dialog?.kind === 'remove' ? 'Gỡ khoản khỏi kỳ' : dialog?.kind === 'reopen' ? 'Mở lại kỳ đã khóa' : 'Hủy kỳ chi trả'} busy={act.busy} error={act.error} onClose={() => setDialog(null)}
        onConfirm={reason => apply(() => dialog?.kind === 'remove' ? fixedPtApi.removePeriodItem(period.id, dialog.itemId, reason) : fixedPtApi.periodAction(period.id, dialog!.kind as 'reopen' | 'cancel', { reason }))} />
    </Modal>
  )
}

function AdjustmentsTab({ coachId }: { coachId: string }) {
  const list = useLoad(() => fixedPtApi.adjustments({ coachId: coachId || undefined, limit: 100 }), [coachId])
  const [form, setForm] = useState({ type: 'RECOVERY' as 'RECOVERY' | 'ADDITION', amount: '', reason: '' })
  const [settling, setSettling] = useState<Adjustment | null>(null); const [waiving, setWaiving] = useState<Adjustment | null>(null)
  const [settle, setSettle] = useState({ amount: '', reference: '' })
  const act = useSubmit()
  return (
    <Panel title="Khoản điều chỉnh (thu hồi/bổ sung)">
      <div className="mb-3 grid gap-2 sm:grid-cols-4">
        <Field label="Loại"><select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'RECOVERY' | 'ADDITION' })}><option value="RECOVERY">Thu hồi</option><option value="ADDITION">Bổ sung</option></select></Field>
        <Field label="Số tiền"><input type="number" min={1} className={inputCls} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Lý do / căn cứ"><input className={inputCls} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Field>
        <div className="flex items-end"><Button disabled={!coachId || !form.amount || !form.reason.trim() || act.busy} onClick={() => void act.run(async () => { await fixedPtApi.createAdjustment({ coachId, type: form.type, amount: Number(form.amount), reason: form.reason }); setForm({ ...form, amount: '', reason: '' }); await list.reload() })}>Tạo</Button></div>
      </div>
      <ErrorBanner message={act.error} />
      <Loadable state={list} empty="Chưa có khoản điều chỉnh.">{items => (
        <Table head={['Mã', 'Coach', 'Loại', 'Số tiền', 'Còn lại', 'Trạng thái', '']}>
          {items.map(a => <tr key={a.id}><td className={td}>{a.code}<div className="text-xs text-text-muted">{a.reason}</div></td><td className={td}>{a.coach?.user.fullName}</td><td className={td}>{a.type === 'RECOVERY' ? 'Thu hồi' : 'Bổ sung'}</td><td className={td}>{money(a.amount)}</td><td className={td}>{money(a.remaining)}</td><td className={td}><Status value={a.status} />{a.settlements.map(s => <div key={s.id} className="text-xs text-text-muted">{s.method === 'PERIOD_OFFSET' ? 'Bù trừ kỳ' : 'Ngoài hệ thống'} {money(s.amount)} {s.reference}</div>)}</td>
            <td className={td}>{['OUTSTANDING', 'PARTIALLY_SETTLED'].includes(a.status) && <div className="flex gap-1.5"><Button size="sm" variant="secondary" onClick={() => setSettling(a)}>Ghi đã thu</Button><Button size="sm" variant="ghost" onClick={() => setWaiving(a)}>Miễn</Button></div>}</td></tr>)}
        </Table>
      )}</Loadable>
      <Modal isOpen={!!settling} onClose={() => setSettling(null)} title="Ghi nhận thu/bù ngoài hệ thống" maxWidth="md">
        <div className="space-y-3">
          <Field label={`Số tiền (còn ${money(settling?.remaining)})`}><input type="number" min={1} className={inputCls} value={settle.amount} onChange={e => setSettle({ ...settle, amount: e.target.value })} /></Field>
          <Field label="Chứng từ / tham chiếu"><input className={inputCls} value={settle.reference} onChange={e => setSettle({ ...settle, reference: e.target.value })} /></Field>
          <ErrorBanner message={act.error} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setSettling(null)}>Hủy</Button><Button isLoading={act.busy} disabled={!settle.amount || !settle.reference.trim()} onClick={() => void act.run(async () => { await fixedPtApi.settleAdjustment(settling!.id, Number(settle.amount), settle.reference); setSettling(null); setSettle({ amount: '', reference: '' }); await list.reload() })}>Ghi nhận</Button></div>
        </div>
      </Modal>
      <ReasonDialog open={!!waiving} title="Miễn khoản điều chỉnh" danger busy={act.busy} error={act.error} onClose={() => setWaiving(null)} onConfirm={reason => void act.run(async () => { await fixedPtApi.waiveAdjustment(waiving!.id, reason); setWaiving(null); await list.reload() })} />
    </Panel>
  )
}

function AdvancesTab() {
  const advances = useLoad(() => fixedPtApi.advances(), [])
  return (
    <Panel title="Khoản đã ứng theo cơ chế cũ (payout cả đơn)">
      <Notice>Buổi đủ điều kiện của các gói này được đối trừ vào khoản ứng; không phát sinh khoản chi tiền mặt mới. Số còn lại chỉ thu hồi khi có quyết định (D-09/D-12).</Notice>
      <Loadable state={advances} empty="Không có khoản ứng cũ.">{items => (
        <Table head={['Gói', 'Coach', 'Đã ứng', 'Chưa đối trừ', 'Tham chiếu']}>
          {items.map(a => <tr key={a.id}><td className={td}>{a.purchase.purchaseCode}<div className="text-xs text-text-muted">{a.purchase.packageNameSnapshot} · {label(a.purchase.status)}</div></td><td className={td}>{a.coach.user.fullName}</td><td className={td}>{money(a.amount)}</td><td className={td}>{money(a.remaining)}</td><td className={td}>{a.reference ?? '—'}</td></tr>)}
        </Table>
      )}</Loadable>
    </Panel>
  )
}
