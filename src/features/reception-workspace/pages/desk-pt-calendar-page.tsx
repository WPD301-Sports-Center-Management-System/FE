import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, CalendarCheck, CalendarX, ChevronLeft, ChevronRight, Download, Eye, UserCheck, XCircle } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, LinkBtn, PageHeader, Person, Segmented, StatTile, Table, btnCls, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { addDays, dayEnd, dayStart, downloadCsv, hhmm, isoWeek, minutesBetween, mondayOf, SESSION_LABEL, SESSION_TONE, shortDate, WEEKDAY_SHORT, weekdayOf } from '@/features/workspace/utils'
import { deskApi } from '../api'

type Tab = 'all' | 'waiting' | 'here' | 'done' | 'off'
const TABS: { key: Tab; label: string; test: (s: Session) => boolean }[] = [
  { key: 'all', label: 'Tất cả', test: () => true },
  { key: 'waiting', label: 'Chờ đến', test: s => s.status === 'CONFIRMED' },
  { key: 'here', label: 'Đã đến / đang tập', test: s => s.status === 'ARRIVED' || s.status === 'IN_PROGRESS' },
  { key: 'done', label: 'Hoàn thành', test: s => s.status === 'COMPLETED' },
  { key: 'off', label: 'Hủy / vắng', test: s => ['CANCELLED_EARLY', 'CANCELLED_LATE', 'COACH_CANCELLED', 'NO_SHOW', 'RESCHEDULED'].includes(s.status) },
]

export function DeskPtCalendarPage() {
  const today = centerDate()
  const { flash, node } = useFlash()
  const [params, setParams] = useSearchParams()
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(params.get('day') ?? '') ? params.get('day')! : today
  const monday = mondayOf(anchor)
  const sunday = addDays(monday, 6)
  const sessions = useLoad(() => deskApi.sessions({ from: dayStart(monday), to: dayEnd(sunday) }, 5), [monday])
  const [tab, setTab] = useState<Tab>('all')
  const [coach, setCoach] = useState('')
  const [day, setDay] = useState<string>('week')
  const [cancel, setCancel] = useState<Session | null>(null)
  const go = (d: string) => { const p = new URLSearchParams(params); p.set('day', d); setParams(p, { replace: true }); setDay('week') }
  const all = sessions.data ?? []
  const coaches = useMemo(() => [...new Map((sessions.data ?? []).map(s => [s.coachId, s.coachName ?? s.coachId])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi')), [sessions.data])
  const scoped = all.filter(s => (!coach || s.coachId === coach) && (day === 'week' || centerDate(s.startsAt) === day))
  const rows = scoped.filter(TABS.find(t => t.key === tab)!.test)
  const todays = all.filter(s => centerDate(s.startsAt) === today && !TABS[4]!.test(s))
  const checked = todays.filter(s => ['IN_PROGRESS', 'COMPLETED'].includes(s.status)).length
  const reload = (m: string) => { flash(m); setCancel(null); void sessions.reload() }

  return <div>
    {node}
    <PageHeader title="Lịch PT" subtitle={<><span>Tuần {isoWeek(monday)} · {shortDate(monday)} – {shortDate(sunday)}/{sunday.slice(0, 4)}</span><Dot /><span>Hội viên check-in gym; Coach bắt đầu buổi tập</span></>}
      actions={<><LinkBtn to="/receptionist/calendar?tab=changes" icon={<ArrowLeftRight aria-hidden className="h-4 w-4" />}>Đổi lịch & học bù</LinkBtn>
        <Btn icon={<Download aria-hidden className="h-4 w-4" />} disabled={!rows.length} onClick={() => downloadCsv(`lich-pt-${monday}.csv`, ['Ngày', 'Giờ', 'Hội viên', 'HLV', 'Khóa', 'Buổi', 'Trạng thái'],
          rows.map(s => [centerDate(s.startsAt), `${hhmm(s.startsAt)}-${hhmm(s.endsAt)}`, s.memberName ?? '', s.coachName ?? '', s.courseName ?? '', s.credit ? `${s.credit.creditIndex}/${s.purchase?.totalCredits ?? ''}` : '', SESSION_LABEL[s.status] ?? s.status]))}>Xuất CSV</Btn></>} />
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <StatTile label="Buổi PT hôm nay" icon={<CalendarCheck className="h-[18px] w-[18px]" />} iconTone="info" value={sessions.data ? todays.length : '—'} unit="buổi" hint={sessions.data ? `${new Set(todays.map(s => s.coachId)).size} HLV có lịch` : undefined} />
      <StatTile label="Buổi đã bắt đầu hôm nay" icon={<UserCheck className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={sessions.data ? <>{checked}<span className="text-lg font-medium text-text-muted">/{todays.length}</span></> : '—'}
        progress={todays.length ? { value: checked, max: todays.length, tone: 'success' } : undefined} hint={sessions.data ? `${todays.filter(s => s.status === 'CONFIRMED').length} buổi chưa bắt đầu` : undefined} />
      <StatTile label="Hủy / vắng trong tuần" icon={<CalendarX className="h-[18px] w-[18px]" />} iconTone="danger" value={sessions.data ? all.filter(TABS[4]!.test).length : '—'} unit="buổi" hint={sessions.data ? `${all.filter(s => s.isMakeup).length} buổi học bù trong tuần` : undefined} />
    </div>
    <Card flush title="Lịch hẹn trong tuần" subtitle="Bấm tên hội viên để mở hồ sơ"
      actions={<div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Tuần trước" onClick={() => go(addDays(monday, -7))} className={btnCls('ghost')}><ChevronLeft aria-hidden className="h-4 w-4" /></button>
        <Btn onClick={() => go(today)}>Tuần này</Btn>
        <button type="button" aria-label="Tuần sau" onClick={() => go(addDays(monday, 7))} className={btnCls('ghost')}><ChevronRight aria-hidden className="h-4 w-4" /></button>
        <label><span className="sr-only">Lọc theo HLV</span><select value={coach} onChange={e => setCoach(e.target.value)} className={`${inputCls} w-48`}><option value="">Tất cả HLV</option>{coaches.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label>
      </div>}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3">
        <div role="tablist" aria-label="Chọn ngày" className="flex flex-wrap gap-1">
          {['week', ...Array.from({ length: 7 }, (_, i) => addDays(monday, i))].map(d => <button key={d} role="tab" type="button" aria-selected={day === d} onClick={() => setDay(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${day === d ? 'bg-primary text-primary-foreground' : d === today ? 'text-primary hover:bg-bg-surface-muted' : 'text-text-muted hover:bg-bg-surface-muted'}`}>
            {d === 'week' ? 'Cả tuần' : `${WEEKDAY_SHORT[weekdayOf(d)]} ${shortDate(d)}`}</button>)}
        </div>
        <div className="ml-auto"><Segmented label="Lọc trạng thái" value={tab} onChange={setTab} items={TABS.map(t => ({ key: t.key, label: t.label, count: scoped.filter(t.test).length }))} /></div>
      </div>
      <Async state={sessions} rows={6} empty={() => !rows.length && <EmptyBox icon={<CalendarCheck className="h-5 w-5" />} title="Không có buổi PT nào phù hợp" />}>
        {() => <Table head={['Khung giờ', 'Hội viên', 'HLV', 'Buổi', 'Trạng thái', 'Thao tác']} minWidth={1000}>
          {rows.map(s => <SessionRow key={s.id} s={s} onCancel={() => setCancel(s)} />)}
        </Table>}
      </Async>
    </Card>
    {cancel && <CancelModal s={cancel} onClose={() => setCancel(null)} onDone={reload} />}
  </div>
}

function SessionRow({ s, onCancel }: { s: Session; onCancel: () => void }) {
  const d = centerDate(s.startsAt)
  return <tr className="hover:bg-bg-surface-muted/40">
    <td className={td}><p className="whitespace-nowrap font-semibold tabular-nums">{WEEKDAY_SHORT[weekdayOf(d)]} {shortDate(d)} · {hhmm(s.startsAt)}–{hhmm(s.endsAt)}</p><p className="text-xs text-text-muted">{minutesBetween(s.startsAt, s.endsAt)} phút</p></td>
    <td className={td}><Link to={`/receptionist/members/${s.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={s.memberName} size={32} /><span><span className="block whitespace-nowrap font-semibold">{s.memberName}</span><span className="text-xs text-text-muted">{s.bookingCode}</span></span></Link></td>
    <td className={td}>{s.coachName}</td>
    <td className={td}>{s.courseName}<p className="text-xs text-text-muted">{s.credit ? `buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : ''}{s.isMakeup ? ' · học bù' : ''}</p></td>
    <td className={td}><Badge tone={SESSION_TONE[s.status]} dot={s.status === 'IN_PROGRESS'}>{s.status === 'CONFIRMED' ? 'Chờ đến' : SESSION_LABEL[s.status]}</Badge>{s.arrivedAt && <p className="mt-1 text-xs text-text-muted">đến {hhmm(s.arrivedAt)}</p>}</td>
    <td className={`${td} text-right`}><div className="flex justify-end gap-1.5">
      {s.allowedActions.cancel && <Btn size="sm" icon={<XCircle aria-hidden className="h-3.5 w-3.5" />} onClick={onCancel}>Báo nghỉ</Btn>}
      <LinkBtn size="sm" variant="ghost" to={`/receptionist/sessions/${s.id}`} icon={<Eye aria-hidden className="h-4 w-4" />}><span className="sr-only">Chi tiết buổi {s.bookingCode}</span></LinkBtn>
    </div></td>
  </tr>
}

/** Member cancels through the desk; the server decides (4-hour rule) whether the session is returned or counted. */
function CancelModal({ s, onClose, onDone }: { s: Session; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [reason, setReason] = useState('')
  const p = s.cancellationPolicy
  const effect = p?.creditEffect ?? 'RETURN'
  return <Modal isOpen onClose={onClose} title="Báo nghỉ buổi PT" description={`${s.memberName} · ${hhmm(s.startsAt)} ${shortDate(centerDate(s.startsAt))} với ${s.coachName}`}>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => deskApi.cancelSession(s.id, { reason: reason.trim() || undefined, expectedEffect: effect }))) onDone(effect === 'RETURN' ? 'Đã báo nghỉ — buổi được hoàn cho hội viên.' : 'Đã báo nghỉ — buổi vẫn bị tính theo quy định.') }}>
      <div className={`rounded-lg border p-3 text-sm ${effect === 'RETURN' ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'}`}>
        {effect === 'RETURN' ? <><p className="font-semibold">Hoàn buổi cho hội viên</p><p>Báo trước mốc {p ? `${hhmm(p.cutoffAt)} ${shortDate(centerDate(p.cutoffAt))}` : '4 giờ'}; hệ thống tự nối buổi cuối gói nếu còn lượt trong hạn mức 6 buổi nghỉ hợp lệ.</p></>
          : <><p className="font-semibold">Buổi vẫn bị tính</p><p>Đã qua mốc báo nghỉ {p ? `${hhmm(p.cutoffAt)}` : '4 giờ trước buổi'}.{p?.makeupEligible ? ' Hội viên vẫn được xếp học bù.' : ''}</p></>}
      </div>
      <Field label="Lý do"><textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} placeholder="Khách gọi báo bận công việc…" /></Field>
      <InlineError message={submit.code === 'POLICY_CHANGED' ? 'Đã qua mốc báo nghỉ trong lúc thao tác — đóng lại và thử lại để xem hiệu lực mới.' : submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Quay lại</Btn><Btn type="submit" variant="danger" busy={submit.busy}>Xác nhận báo nghỉ</Btn></div>
    </form>
  </Modal>
}
