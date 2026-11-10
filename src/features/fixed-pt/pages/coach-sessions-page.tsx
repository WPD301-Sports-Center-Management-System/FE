import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Play, Square, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { ScheduleTools } from '../components/schedule-tools'
import { formatDateTime, formatTime, formatWeekdayDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { ScheduleChange, Session } from '../types'
import { ErrorBanner, Field, inputCls, label, Loadable, Notice, Page, Panel, Status, Table, td } from '../components/ui'
import { ReasonDialog } from '../components/widgets'

export const localInputToIso = (v: string) => new Date(`${v}:00+07:00`).toISOString()
export const isoToLocalInput = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 7 * 3600000); return d.toISOString().slice(0, 16)
}

// Coach: run sessions (đã đến/bắt đầu/kết thúc/vắng/hủy), answer change requests, schedule makeups.
export function CoachSessionsPage() {
  const [range, setRange] = useState<'upcoming' | 'past' | 'review'>('upcoming')
  const params = range === 'upcoming' ? { from: new Date(Date.now() - 12 * 3600000).toISOString(), limit: 100 } : range === 'past' ? { to: new Date().toISOString(), order: 'desc', limit: 100 } : { needsReview: 'true', limit: 100 }
  const sessions = useLoad(() => fixedPtApi.coachSessions(params), [range])
  const changes = useLoad(() => fixedPtApi.scheduleChanges({ status: 'REQUESTED', limit: 100 }), [])
  const reload = () => { void sessions.reload(); void changes.reload() }
  return (
    <Page title="Lịch PT 1:1" subtitle="Buổi đã đặt hợp lệ được tự xác nhận. Chỉ kết thúc hợp lệ, nghỉ muộn hoặc vắng mới tính buổi." actions={<Button variant="secondary" onClick={reload}>Làm mới buổi tập</Button>}>
      <Notice>Học viên mua trước nhưng chưa đặt sẽ chưa có buổi trong bảng. Mở gói tại Học viên hoặc xem Buổi chưa xếp lịch bên dưới. Đã đến / Bắt đầu chỉ hiện khi trạng thái, thời gian và quyền tài khoản cho phép.</Notice>
      <ChangeRequests state={changes} onDone={reload} />
      <Panel title="Buổi tập" actions={<div className="flex gap-2">{(['upcoming', 'past', 'review'] as const).map(r => <Button key={r} size="sm" variant={range === r ? 'primary' : 'secondary'} onClick={() => setRange(r)}>{{ upcoming: 'Sắp tới', past: 'Đã qua', review: 'Cần xử lý' }[r]}</Button>)}</div>}>
        <Loadable state={sessions} empty="Không có buổi nào.">{items => <SessionTable sessions={items} onChanged={reload} />}</Loadable>
      </Panel>
      <ScheduleCredits onDone={reload} />
    </Page>
  )
}

export function SessionTable({ sessions, onChanged }: { sessions: Session[]; onChanged: () => void }) {
  const act = useSubmit()
  const [dialog, setDialog] = useState<{ kind: 'noShow' | 'end' | 'reschedule'; session: Session } | null>(null)
  const run = (work: () => Promise<unknown>) => void act.run(async () => { await work(); setDialog(null); onChanged() })
  return (
    <>
      <ErrorBanner message={act.code === 'MEMBER_PRESENT' ? 'Member có lượt vào gym trong khung giờ buổi tập — không ghi vắng. Ghi "Đã đến" hoặc báo Manager xác nhận.' : act.error} />
      <Table head={['Thời gian', 'Học viên', 'Buổi', 'Trạng thái', 'Thao tác']}>
        {sessions.map(s => (
          <tr key={s.id}>
            <td className={td}>{formatWeekdayDateTime(s.startsAt)}–{formatTime(s.endsAt)}{s.actualStartedAt && <div className="text-xs text-text-muted">Bắt đầu thực tế {formatTime(s.actualStartedAt)}{s.actualEndedAt ? ` · kết thúc ${formatTime(s.actualEndedAt)}` : ''}</div>}</td>
            <td className={td}>{s.memberName}<div className="text-xs text-text-muted">{s.purchase?.packageNameSnapshot}</div></td>
            <td className={td}>{s.credit ? `${s.credit.creditIndex}/${s.purchase?.totalCredits}` : '—'}{s.isMakeup && <span className="ml-1 text-xs font-semibold text-sky-700 dark:text-sky-300">Học bù</span>}{s.dataOrigin === 'LEGACY' && <div className="text-xs text-text-muted">Dữ liệu cũ</div>}</td>
            <td className={td}><Status value={s.status} />{s.needsReview && <div className="text-xs text-amber-700 dark:text-amber-300">Cần xử lý: {s.reviewReason}</div>}{s.disruptionId && <div className="text-xs text-amber-700">Trong phạm vi gián đoạn</div>}{s.outcomeReversedAt && <div className="text-xs text-text-muted">Kết quả đã được đảo</div>}</td>
            <td className={td}>
              <div className="flex flex-wrap gap-1.5">
                <Link className="self-center text-xs font-semibold text-primary underline" to={`/coach/slots?sessionId=${s.id}`}>Chi tiết / giáo án / kết quả</Link>
                {s.allowedActions.arrive && <Button size="sm" variant="secondary" disabled={act.busy} onClick={() => run(() => fixedPtApi.arrive(s.id))}><UserCheck className="h-3.5 w-3.5" aria-hidden />Đã đến</Button>}
                {s.allowedActions.start && <Button size="sm" disabled={act.busy} onClick={() => run(() => fixedPtApi.start(s.id))}><Play className="h-3.5 w-3.5" aria-hidden />Bắt đầu</Button>}
                {s.allowedActions.end && <Button size="sm" disabled={act.busy} onClick={() => new Date() < new Date(s.endsAt) ? setDialog({ kind: 'end', session: s }) : run(() => fixedPtApi.end(s.id, {}))}><Square className="h-3.5 w-3.5" aria-hidden />Kết thúc</Button>}
                {s.allowedActions.noShow && <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => setDialog({ kind: 'noShow', session: s })}><UserX className="h-3.5 w-3.5" aria-hidden />Vắng</Button>}
                {s.status === 'CONFIRMED' && <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'reschedule', session: s })}><CalendarPlus className="h-3.5 w-3.5" aria-hidden />Đổi giờ</Button>}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <ReasonDialog open={dialog?.kind === 'noShow'} title="Ghi Member vắng mặt" requireReason={false} danger confirmLabel="Ghi vắng (tính buổi)" busy={act.busy} error={act.error}
        description="Buổi sẽ được tính theo chính sách. Hệ thống chặn nếu Member có lượt vào gym trong khung giờ này." onClose={() => { setDialog(null); act.clear() }} onConfirm={reason => run(() => fixedPtApi.noShow(dialog!.session.id, { reason: reason || undefined }))} />
      <ReasonDialog open={dialog?.kind === 'end'} title="Kết thúc trước giờ dự kiến" confirmLabel="Kết thúc buổi" busy={act.busy} error={act.error}
        description={`Giờ kết thúc dự kiến: ${dialog ? formatTime(dialog.session.endsAt) : ''}. Kết thúc sớm cần ghi lý do.`} onClose={() => { setDialog(null); act.clear() }} onConfirm={reason => run(() => fixedPtApi.end(dialog!.session.id, { earlyEndReason: reason }))} />
      {dialog?.kind === 'reschedule' && <RescheduleModal session={dialog.session} onClose={() => setDialog(null)} onDone={() => { setDialog(null); onChanged() }} />}
    </>
  )
}

function RescheduleModal({ session, onClose, onDone }: { session: Session; onClose: () => void; onDone: () => void }) {
  const duration = new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()
  const [start, setStart] = useState(isoToLocalInput(session.startsAt))
  const save = useSubmit()
  return (
    <Modal isOpen onClose={onClose} title="Đề xuất đổi giờ buổi tập" maxWidth="lg">
      <div className="space-y-3">
        <p className="text-sm text-text-muted">Buổi hiện tại: {formatDateTime(session.startsAt)}. Lịch cũ giữ nguyên cho tới khi Member đồng ý giờ mới; không đổi credit.</p>
        <Notice>Chỉ chọn giờ khác trong cùng ngày buổi gốc; giữ nguyên thời lượng.</Notice>
        <Field label="Giờ mới (giờ trung tâm)"><input type="time" className={inputCls} value={start.slice(11,16)} onChange={e => setStart(isoToLocalInput(session.startsAt).slice(0,11)+e.target.value)} /></Field>
        <ErrorBanner message={save.error} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button isLoading={save.busy} onClick={() => void save.run(async () => { const startsAt = localInputToIso(start); await fixedPtApi.createScheduleChange({ purchaseId: session.purchaseId, items: [{ bookingId: session.id, startsAt, endsAt: new Date(new Date(startsAt).getTime() + duration).toISOString() }] }); onDone() })}>Gửi đề xuất</Button></div>
      </div>
    </Modal>
  )
}

function ChangeRequests({ state, onDone }: { state: ReturnType<typeof useLoad<ScheduleChange[]>>; onDone: () => void }) {
  const [open, setOpen] = useState<ScheduleChange | null>(null)
  if (!state.loading && !state.error && !state.data?.length) return null
  return (
    <Panel title="Yêu cầu đổi lịch / học bù từ Member">
      <Loadable state={state}>{items => (
        <ul className="space-y-2">{items.map(c => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle p-3 text-sm">
            <span>{label(c.type)} · {c.purchase.packageNameSnapshot} · {c.items.length} buổi {c.note && <span className="text-text-muted">· “{c.note}”</span>}</span>
            <Button size="sm" onClick={() => setOpen(c)}>Đề xuất giờ</Button>
          </li>))}</ul>
      )}</Loadable>
      {open && <ProposeChangeModal change={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); onDone() }} />}
    </Panel>
  )
}

function ProposeChangeModal({ change, onClose, onDone }: { change: ScheduleChange; onClose: () => void; onDone: () => void }) {
  const [times, setTimes] = useState<Record<string, string>>(Object.fromEntries(change.items.map(i => [i.creditId, i.sourceBooking ? isoToLocalInput(i.sourceBooking.plannedStartsAt) : ''])))
  const save = useSubmit(); const decline = useSubmit()
  return (
    <Modal isOpen onClose={onClose} title={`Đề xuất giờ – ${label(change.type)}`} maxWidth="lg">
      <div className="space-y-3">
        {change.items.map(i => (
          <Field key={i.id} label={i.sourceBooking ? `Buổi ${formatDateTime(i.sourceBooking.plannedStartsAt)} → giờ mới` : 'Giờ buổi bù/xếp mới'}>
            <input type={i.sourceBooking ? 'time' : 'datetime-local'} className={inputCls} value={i.sourceBooking ? (times[i.creditId] ?? '').slice(11,16) : times[i.creditId] ?? ''} onChange={e => setTimes({ ...times, [i.creditId]: i.sourceBooking ? isoToLocalInput(i.sourceBooking.plannedStartsAt).slice(0,11)+e.target.value : e.target.value })} />
          </Field>
        ))}
        <ErrorBanner message={save.error ?? decline.error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={decline.busy} onClick={() => void decline.run(async () => { await fixedPtApi.scheduleChangeAction(change.id, 'decline', { reason: 'Coach không sắp được giờ khác' }); onDone() })}>Từ chối</Button>
          <Button isLoading={save.busy} disabled={change.items.some(i => !times[i.creditId])} onClick={() => void save.run(async () => {
            await fixedPtApi.proposeScheduleChange(change.id, change.items.map(i => { const startsAt = localInputToIso(times[i.creditId]!); const dur = i.sourceBooking ? new Date(i.sourceBooking.plannedEndsAt).getTime() - new Date(i.sourceBooking.plannedStartsAt).getTime() : 3600000; return { creditId: i.creditId, startsAt, endsAt: new Date(new Date(startsAt).getTime() + dur).toISOString() } }))
            onDone()
          })}>Gửi cho Member</Button>
        </div>
      </div>
    </Modal>
  )
}

// Credits without a session: makeup rights (after timely cancel / Coach cancel / reversal) and packages
// paid after their hold was lost. The Coach proposes times; the Member must accept.
function ScheduleCredits({ onDone }: { onDone: () => void }) {
  const packages = useLoad(async () => (await fixedPtApi.coachPackages()).filter(p => ['ACTIVE', 'EXPIRED'].includes(p.status)), [])
  const [purchase, setPurchase] = useState<{ id: string; memberId: string; memberName?: string } | null>(null)
  return (
    <Panel title="Buổi chưa xếp lịch (học bù / sắp lại)">
      <Loadable state={packages} empty="Không có gói đang hoạt động.">{items => (
        <ul className="grid gap-2 sm:grid-cols-2">{items.map(p => (
          <li key={p.id} className="flex items-center justify-between rounded-xl border border-border-subtle p-3 text-sm">
            <span>{p.memberName} · {p.packageNameSnapshot}<span className="block text-xs text-text-muted">{p.availableCredits ?? 0} buổi chưa xếp</span></span>
            <Button size="sm" variant="secondary" disabled={!p.availableCredits} onClick={() => setPurchase(p)}>Xếp lịch</Button>
          </li>))}</ul>
      )}</Loadable>
      {purchase && <ScheduleCreditsModal purchase={purchase} onClose={() => setPurchase(null)} onDone={() => { setPurchase(null); void packages.reload(); onDone() }} />}
    </Panel>
  )
}

function ScheduleCreditsModal({ purchase, onClose, onDone }: { purchase: { id: string; memberId: string; memberName?: string }; onClose: () => void; onDone: () => void }) {
  return <Modal isOpen onClose={onClose} title={'Xếp lịch cho ' + (purchase.memberName ?? 'Member')} maxWidth="2xl"><ScheduleTools initialPurchaseId={purchase.id} initialTool="SCHEDULE_PENDING" onChanged={onDone} /></Modal>
}
