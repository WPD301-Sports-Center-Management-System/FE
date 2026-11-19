import { ScheduleTools } from '@/features/fixed-pt/components/schedule-tools'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SessionWorkQueue, type CoachTodo } from '../components/session-work-queue'
import { Check, Undo2, X, CalendarClock } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { ScheduleChange } from '@/features/fixed-pt/types'
import { centerDate, centerInstant } from '@/shared/utils/date'
import { coachWs, type CoachPurchase } from '../api'
import { useCoachShell } from '../shell'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, Person, Segmented, Table, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { CHANGE_LABEL, CHANGE_TONE, CHANGE_TYPE, hhmm, relativeAgo, shortDate, WEEKDAY_SHORT, weekdayOf } from '@/features/workspace/utils'

type Change = Omit<ScheduleChange, 'items'> & { decidedAt?: string | null; items: (ScheduleChange['items'][number] & { credit?: { creditIndex: number } | null })[] }
type Tab = 'all' | 'REQUESTED' | 'PROPOSED' | 'ACCEPTED' | 'closed'
const slot = (iso?: string | null) => iso ? `${WEEKDAY_SHORT[weekdayOf(centerDate(iso))]} ${shortDate(centerDate(iso))} ${hhmm(iso)}` : 'chưa chọn giờ'

export function CoachScheduleChangesPage() {
  const [params] = useSearchParams()
  const purchaseId = params.get('purchaseId') ?? ''
  const absenceId = params.get('absenceId') ?? ''
  const { refreshBadges } = useCoachShell()
  const { flash, node } = useFlash()
  const changes = useLoad(() => coachWs.scheduleChanges() as Promise<Change[]>, [])
  const purchases = useLoad(() => coachWs.purchases(), [])
  const requestId = params.get('requestId') ?? ''
  const [filter, setFilter] = useState<{ requestId: string; tab: Tab }>({ requestId, tab: requestId ? 'all' : 'REQUESTED' })
  // A newly targeted request must be visible even when this page is already mounted.
  const tab = filter.requestId === requestId ? filter.tab : requestId ? 'all' : 'REQUESTED'
  const setTab = (tab: Tab) => setFilter({ requestId, tab })
  const selectedRow = useRef<HTMLTableRowElement | null>(null)
  const focusedRequest = useRef('')
  const [answer, setAnswer] = useState<Change | null>(null)
  const [decline, setDecline] = useState<Change | null>(null)
  const [revision, setRevision] = useState(0)
  const byPurchase = useMemo(() => new Map((purchases.data ?? []).map(p => [p.id, p])), [purchases.data])
  const list = changes.data ?? []
  const pending = list.filter(c => c.status === 'REQUESTED')
  const tabs: { key: Tab; label: string; test: (c: Change) => boolean }[] = [
    { key: 'all', label: 'Tất cả', test: () => true }, { key: 'REQUESTED', label: 'Chờ xử lý', test: c => c.status === 'REQUESTED' },
    { key: 'PROPOSED', label: 'Chờ HV đồng ý', test: c => c.status === 'PROPOSED' }, { key: 'ACCEPTED', label: 'Đã duyệt', test: c => c.status === 'ACCEPTED' },
    { key: 'closed', label: 'Đã đóng', test: c => ['DECLINED', 'WITHDRAWN', 'EXPIRED'].includes(c.status) },
  ]
  const rows = list.filter(tabs.find(t => t.key === tab)!.test)
  useEffect(() => {
    if (!requestId) { focusedRequest.current = ''; return }
    if (selectedRow.current && focusedRequest.current !== requestId) {
      selectedRow.current.scrollIntoView?.({ block: 'center', behavior: 'instant' })
      selectedRow.current.focus({ preventScroll: true })
      focusedRequest.current = requestId
    }
  }, [requestId, changes.data, tab])
  const refresh = () => { setRevision(v => v + 1); void changes.reload(); void purchases.reload(); refreshBadges() }
  const done = (m: string) => { flash(m); setAnswer(null); setDecline(null); refresh() }

  const queueChanges: CoachTodo[] = list.map(c => ({ id: 'CHANGE:' + c.id, kind: 'CHANGE', label: c.status === 'PROPOSED' ? 'Đề xuất lịch đang chờ học viên xác nhận' : c.status === 'REQUESTED' ? 'Trả lời yêu cầu lịch tập' : CHANGE_LABEL[c.status], waitingOn: c.status === 'REQUESTED' ? 'COACH' : c.status === 'PROPOSED' ? 'MEMBER' : 'DONE', purchaseId: c.purchaseId, scheduleRequestId: c.id, packageName: c.purchase.packageNameSnapshot, memberName: byPurchase.get(c.purchaseId)?.memberName, at: c.createdAt }))
  return <div className="space-y-6"><SessionWorkQueue key={revision} additional={queueChanges} /><details key={`${purchaseId}:${absenceId}`} open={!!params.get('tool') || !!absenceId} className="rounded-xl border border-border-subtle p-4"><summary className="cursor-pointer font-semibold">Tạo đề xuất lịch tập</summary><div className="mt-4"><ScheduleTools key={`${purchaseId}:${absenceId}`} initialPurchaseId={purchaseId} initialAbsenceId={absenceId} initialTool={params.get('tool') === 'SCHEDULE_PENDING' ? 'SCHEDULE_PENDING' : undefined} onChanged={refresh} /></div></details>
    {node}
    <details open={!!params.get('requestId') || params.get('inbox') === '1'}><summary className="cursor-pointer font-semibold">Hộp thư và lịch sử đổi lịch</summary><Card flush title="Hộp thư yêu cầu" badge={changes.data ? <Badge tone="warning">{pending.length} chờ</Badge> : null}
      actions={<Segmented label="Lọc yêu cầu" value={tab} onChange={setTab} items={tabs.map(t => ({ key: t.key, label: t.label, count: list.filter(t.test).length }))} />}>
      <Async state={changes} rows={5} empty={() => !rows.length && <EmptyBox icon={<CalendarClock className="h-5 w-5" />} title="Không có yêu cầu nào" hint="Khi học viên xin đổi giờ, học bù hoặc xếp buổi còn trống, yêu cầu sẽ hiện ở đây." />}>
        {() => <Table head={['Học viên', 'Yêu cầu', 'Lời nhắn', 'Gửi lúc', 'Trạng thái', 'Phản hồi']} minWidth={1000}>
          {rows.map(c => { const p = byPurchase.get(c.purchaseId); return <tr key={c.id} ref={c.id === requestId ? selectedRow : undefined} tabIndex={c.id === requestId ? -1 : undefined} aria-label={`Yêu cầu ${c.code}`} className={`align-top ${requestId === c.id ? 'bg-bg-surface-muted' : ''}`}>
            <td className={td}><div className="flex items-center gap-3"><Person name={p?.memberName} src={p?.avatarUrl} /><div><Link to={p ? `/coach/students/${p.memberId}` : '#'} className="font-semibold hover:text-primary">{p?.memberName ?? c.purchase.purchaseCode}</Link><p className="text-xs text-text-muted">{p?.memberCode ?? c.code}</p></div></div></td>
            <td className={td}><p className="font-medium">{CHANGE_TYPE[c.type]} · {c.purchase.packageNameSnapshot}</p>
              <ul className="mt-0.5 space-y-0.5 text-xs text-text-muted">{c.items.map(i => <li key={i.id}>{i.credit ? `Buổi ${i.credit.creditIndex}: ` : ''}{i.sourceBooking ? <>{slot(i.sourceBooking.plannedStartsAt)} → </> : null}<span className="font-semibold text-text-primary">{slot(i.startsAt)}</span></li>)}</ul></td>
            <td className={`${td} max-w-64`}><p className="line-clamp-3">{c.note || <span className="text-text-muted">—</span>}</p>{c.responseNote && <p className="mt-1 text-xs text-text-muted">Phản hồi: {c.responseNote}</p>}</td>
            <td className={td}><p className="font-semibold tabular-nums">{hhmm(c.createdAt)}</p><p className="text-xs text-text-muted">{relativeAgo(c.createdAt)}</p></td>
            <td className={td}><Badge tone={CHANGE_TONE[c.status]}>{CHANGE_LABEL[c.status]}</Badge></td>
            <td className={`${td} text-right`}>
              {c.status === 'REQUESTED' && !c.proposedBy && c.type === 'RESCHEDULE' && c.items.every(i => i.startsAt && i.endsAt) && <Btn size="sm" variant="primary" onClick={() => { void coachWs.confirmChange(c.id).then(() => done('Đã xác nhận lịch tập mới.')).catch(e => flash(e instanceof Error ? e.message : 'Không thể xác nhận lịch tập mới.')) }}>Xác nhận giờ đã chọn</Btn>}
              {c.status === 'REQUESTED' && <div className="flex justify-end gap-1.5"><Btn size="sm" variant="soft" icon={<Check aria-hidden className="h-4 w-4" />} onClick={() => setAnswer(c)}>Đề xuất giờ</Btn><Btn size="sm" icon={<X aria-hidden className="h-4 w-4" />} onClick={() => setDecline(c)}>Từ chối</Btn></div>}
              {c.status === 'PROPOSED' && <WithdrawButton id={c.id} onDone={done} />}
            </td>
          </tr> })}
        </Table>}
      </Async>
    </Card>
    </details>
    {answer && <AnswerModal change={answer} purchase={byPurchase.get(answer.purchaseId)} onClose={() => setAnswer(null)} onDone={done} />}
    {decline && <DeclineModal change={decline} onClose={() => setDecline(null)} onDone={done} />}
  </div>
}

function WithdrawButton({ id, onDone }: { id: string; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <div className="text-right"><Btn size="sm" icon={<Undo2 aria-hidden className="h-4 w-4" />} busy={submit.busy} onClick={async () => { if (await submit.run(() => coachWs.withdrawChange(id))) onDone('Đã rút đề xuất.') }}>Rút đề xuất</Btn>
    {submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}</div>
}

/** Coach answers a member request with concrete times (prefilled with what the member asked for). */
function AnswerModal({ change, purchase, onClose, onDone }: { change: Change; purchase?: CoachPurchase; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [note, setNote] = useState('')
  const [times, setTimes] = useState(() => change.items.map(i => {
    const ref = i.startsAt ?? i.sourceBooking?.plannedStartsAt ?? null
    const len = i.startsAt && i.endsAt ? (new Date(i.endsAt).getTime() - new Date(i.startsAt).getTime()) / 60_000 : i.sourceBooking ? (new Date(i.sourceBooking.plannedEndsAt).getTime() - new Date(i.sourceBooking.plannedStartsAt).getTime()) / 60_000 : 60
    return { creditId: i.creditId, day: ref ? centerDate(ref) : centerDate(), time: ref ? hhmm(ref) : '08:00', minutes: len }
  }))
  const set = (k: number, patch: Partial<(typeof times)[number]>) => setTimes(t => t.map((x, i) => i === k ? { ...x, ...patch } : x))
  return <Modal isOpen onClose={onClose} maxWidth="xl" title="Đề xuất giờ cho yêu cầu" description={`${purchase?.memberName ?? ''} · ${CHANGE_TYPE[change.type]}. Học viên sẽ nhận đề xuất và bấm đồng ý để chốt lịch.`}>
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const items = times.map(t => { const s = centerInstant(t.day, t.time); return { creditId: t.creditId, startsAt: s.toISOString(), endsAt: new Date(s.getTime() + t.minutes * 60_000).toISOString() } })
      if (await submit.run(() => coachWs.answerChange(change.id, items, note.trim() || undefined))) onDone('Đã gửi giờ đề xuất cho học viên.')
    }}>
      {change.note && <p className="rounded-lg bg-bg-surface-muted px-3 py-2 text-sm"><span className="font-semibold">Học viên nhắn:</span> {change.note}</p>}
      {times.map((t, k) => { const item = change.items[k]!; return <fieldset key={t.creditId} className="rounded-lg border border-border-subtle p-3">
        <legend className="px-1 text-sm font-semibold">{item.credit ? `Buổi ${item.credit.creditIndex}` : `Buổi ${k + 1}`}{item.sourceBooking ? ` · đang ở ${slot(item.sourceBooking.plannedStartsAt)}` : ''}</legend>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Ngày buổi gốc"><input type="date" disabled={!!item.sourceBooking} required min={centerDate()} value={t.day} onChange={e => set(k, { day: e.target.value })} className={inputCls} /></Field>
          <Field label="Giờ bắt đầu"><input type="time" required value={t.time} onChange={e => set(k, { time: e.target.value })} className={inputCls} /></Field>
          <Field label="Thời lượng (phút)"><input type="number" disabled={!!item.sourceBooking} required min={15} max={300} step={15} value={t.minutes} onChange={e => set(k, { minutes: Number(e.target.value) })} className={inputCls} /></Field>
        </div>
      </fieldset> })}
      <Field label="Lời nhắn cho học viên"><textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} /></Field>
      <InlineError message={submit.code === 'SLOT_CONFLICT' ? 'Giờ này đã trùng lịch của bạn hoặc học viên. Hãy chọn giờ khác.' : submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy}>Gửi đề xuất</Btn></div>
    </form>
  </Modal>
}

function DeclineModal({ change, onClose, onDone }: { change: Change; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [reason, setReason] = useState('')
  return <Modal isOpen onClose={onClose} title="Từ chối yêu cầu" description="Lịch hiện tại được giữ nguyên; số buổi trong gói không thay đổi.">
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => coachWs.declineChange(change.id, reason.trim() || undefined))) onDone('Đã từ chối yêu cầu.') }}>
      <Field label="Lý do (gửi cho học viên)"><textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} placeholder="VD: Khung giờ này đã kín, mời bạn chọn T3 hoặc T5…" /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Quay lại</Btn><Btn type="submit" variant="danger" busy={submit.busy}>Từ chối</Btn></div>
    </form>
  </Modal>
}
