import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Check, ChevronLeft, ChevronRight, Download, Moon } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import { calendarSessions, type CalendarSession as Session } from '../calendar-sessions'
import { centerDate } from '@/shared/utils/date'
import { coachWs, type TimeOff } from '../api'
import { useCoachShell } from '../shell'
import { Badge, Btn, Card, ErrorBox, LinkBtn, PageHeader, Segmented, Skeleton, btnCls } from '@/features/workspace/ui'
import { addDays, dayEnd, dayStart, downloadCsv, hhmm, isScheduled, longDate, minutesBetween, mondayOf, SESSION_LABEL, shortDate, WEEKDAY_NAMES, weekdayOf } from '@/features/workspace/utils'

type Kind = 'trial' | 'pt' | 'makeup' | 'live' | 'done' | 'absent' | 'cancelled'
const KIND: Record<Kind, { card: string; time: string; label: string }> = {
  trial: { card: 'border-dashed border-amber-300 bg-amber-50/80 dark:border-amber-500/40 dark:bg-amber-500/10', time: 'text-amber-800 dark:text-amber-300', label: 'Tập thử PT' },
  pt: { card: 'border-sky-200 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-500/10', time: 'text-sky-700 dark:text-sky-300', label: 'PT 1-1' },
  makeup: { card: 'border-violet-200 bg-violet-50/80 dark:border-violet-500/30 dark:bg-violet-500/10', time: 'text-violet-700 dark:text-violet-300', label: 'Học bù' },
  live: { card: 'border-2 border-primary bg-primary/5', time: 'text-primary', label: 'Đang dạy' },
  done: { card: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10', time: 'text-emerald-700 dark:text-emerald-300', label: 'Hoàn thành' },
  absent: { card: 'border-red-200 bg-red-50/70 dark:border-red-500/30 dark:bg-red-500/10', time: 'text-red-700 dark:text-red-300', label: 'Vắng / hủy muộn' },
  cancelled: { card: 'border-border-subtle bg-bg-surface-muted/60 opacity-75', time: 'text-text-muted', label: 'Đã hủy / dời' },
}
const kindOf = (s: Session): Kind => s.status === 'IN_PROGRESS' ? 'live' : s.status === 'COMPLETED' ? 'done' : s.status === 'NO_SHOW' || s.status === 'CANCELLED_LATE' ? 'absent' : !isScheduled(s) ? 'cancelled' : s.trialPhone ? 'trial' : s.isMakeup ? 'makeup' : 'pt'

export function CoachSchedulePage() {
  const today = centerDate()
  const [params, setParams] = useSearchParams()
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(params.get('day') ?? '') ? params.get('day')! : today
  const view = (params.get('view') ?? (window.matchMedia('(max-width: 767px)').matches ? 'day' : 'week')) === 'day' ? 'day' : 'week'
  const [showCancelled, setShowCancelled] = useState(false)
  const { pendingChanges } = useCoachShell()
  const monday = mondayOf(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const range = view === 'week' ? [monday, days[6]!] : [anchor, anchor]
  const sessions = useLoad(async () => {
    const params = { from: dayStart(range[0]!), to: dayEnd(range[1]!) }
    const [paid, trials] = await Promise.all([coachWs.sessions(params, 3), coachWs.trialSessions(params)])
    return calendarSessions(paid, trials)
  }, [range[0], range[1]])
  const timeOffs = useLoad(() => coachWs.timeOffs(), [])
  const set = (next: { day?: string; view?: string }) => { const p = new URLSearchParams(params); if (next.day) p.set('day', next.day); if (next.view) p.set('view', next.view); setParams(p, { replace: true }) }
  const step = (dir: number) => set({ day: addDays(anchor, dir * (view === 'week' ? 7 : 1)) })

  const all = sessions.data ?? []
  const visible = showCancelled ? all : all.filter(s => isScheduled(s))
  const byDay = useMemo(() => { const m = new Map<string, Session[]>(); for (const s of visible) { const d = centerDate(s.startsAt); m.set(d, [...(m.get(d) ?? []), s]) } return m }, [visible])
  const offsByDay = (day: string) => (timeOffs.data ?? []).filter(t => centerDate(t.startsAt) <= day && centerDate(t.endsAt) >= day)
  const scheduled = all.filter(isScheduled)
  const hours = scheduled.reduce((n, s) => n + minutesBetween(s.startsAt, s.endsAt), 0) / 60
  const cancelledCount = all.length - scheduled.length

  const exportCsv = () => downloadCsv(`lich-day-${range[0]}_${range[1]}.csv`, ['Ngày', 'Bắt đầu', 'Kết thúc', 'Học viên', 'Gói', 'Buổi', 'Trạng thái'],
    all.map(s => [centerDate(s.startsAt), hhmm(s.startsAt), hhmm(s.endsAt), s.memberName ?? '', s.trialPhone ? s.courseName : s.purchase?.packageNameSnapshot ?? '', s.credit ? `${s.credit.creditIndex}/${s.purchase?.totalCredits ?? ''}` : '', SESSION_LABEL[s.status] ?? s.status]))

  const title = view === 'week' ? `Tuần ${shortDate(monday)} – ${shortDate(days[6]!)}/${days[6]!.slice(0, 4)}` : longDate(anchor)
  return <div>
    <PageHeader title="Lịch theo ngày / tuần"
      subtitle={sessions.data ? <span>{scheduled.length} ca · khoảng {Math.round(hours * 10) / 10} giờ dạy</span> : <span>{sessions.error ? 'Không tải được lịch' : 'Đang tải…'}</span>}
      actions={<Btn icon={<Download aria-hidden className="h-4 w-4" />} onClick={exportCsv} disabled={!all.length}>Xuất lịch đã tải</Btn>} />

    <Card flush title={title}
      actions={<>
        <div className="flex items-center gap-1">
          <button type="button" aria-label={view === 'week' ? 'Tuần trước' : 'Ngày trước'} onClick={() => step(-1)} className={btnCls('ghost', 'md')}><ChevronLeft aria-hidden className="h-4 w-4" /></button>
          <Btn onClick={() => set({ day: today })}>Hôm nay</Btn>
          <button type="button" aria-label={view === 'week' ? 'Tuần sau' : 'Ngày sau'} onClick={() => step(1)} className={btnCls('ghost', 'md')}><ChevronRight aria-hidden className="h-4 w-4" /></button>
        </div>
        <input type="date" aria-label="Chọn ngày" value={anchor} onChange={e => e.target.value && set({ day: e.target.value })} className="h-9 rounded-lg border border-border-subtle bg-bg-input px-2 text-sm" />
        <LinkBtn to="/coach/schedule-changes" icon={<ArrowLeftRight aria-hidden className="h-4 w-4" />}>Đổi lịch & bù {pendingChanges ? <Badge tone="warning">{pendingChanges}</Badge> : null}</LinkBtn>
        <Segmented label="Chế độ xem" value={view} onChange={v => set({ view: v })} items={[{ key: 'day', label: 'Ngày' }, { key: 'week', label: 'Tuần' }]} />
      </>}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-subtle px-5 py-2.5 text-xs text-text-muted">
        {(Object.keys(KIND) as Kind[]).filter(k => k !== 'cancelled' || showCancelled).map(k => <span key={k} className="inline-flex items-center gap-1.5"><span aria-hidden className={`h-3 w-3 rounded border ${KIND[k].card}`} />{KIND[k].label}</span>)}
        <span className="inline-flex items-center gap-1.5"><Moon aria-hidden className="h-3.5 w-3.5" />Ngày nghỉ</span>
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} className="accent-[var(--primary)]" />Hiện ca đã hủy / dời ({cancelledCount})</label>
      </div>
      {sessions.error ? <ErrorBox message={sessions.error} onRetry={() => void sessions.reload()} /> : !sessions.data ? <Skeleton rows={6} /> :
        view === 'week'
          ? <div className="overflow-x-auto p-3"><div className="grid min-w-[1050px] grid-cols-7 gap-2">
            {days.map(day => <DayColumn key={day} day={day} today={today} sessions={byDay.get(day) ?? []} offs={offsByDay(day)} onPick={() => set({ day, view: 'day' })} />)}
          </div></div>
          : <DayList day={anchor} sessions={byDay.get(anchor) ?? []} offs={offsByDay(anchor)} />}
      <div className="flex flex-wrap justify-between gap-2 border-t border-border-subtle px-5 py-3 text-sm text-text-muted">
        <span>{scheduled.length} ca · {scheduled.filter(s => s.status === 'COMPLETED').length} hoàn thành · {scheduled.filter(s => s.isMakeup).length} học bù</span>
        <span>Tổng: {Math.round(hours * 10) / 10} giờ dạy</span>
      </div>
    </Card>
    <p className="mt-3 text-xs text-text-muted">Lịch sử dụng tối đa 300 buổi PT và 1.000 buổi tập thử đã tải trong khoảng đang xem.</p>
  </div>
}

function DayColumn({ day, today, sessions, offs, onPick }: { day: string; today: string; sessions: Session[]; offs: TimeOff[]; onPick: () => void }) {
  const isToday = day === today
  return <div className={`flex min-h-[260px] flex-col rounded-lg border ${isToday ? 'border-primary/40 bg-primary/[0.03]' : 'border-border-subtle bg-bg-surface-muted/30'}`}>
    <button type="button" onClick={onPick} className={`border-b border-border-subtle px-2 py-3 text-center hover:bg-bg-surface-muted/60 ${isToday ? 'text-primary' : ''}`} aria-label={`Xem ngày ${longDate(day)}`}>
      <span className="block text-sm font-semibold">{WEEKDAY_NAMES[weekdayOf(day)]}</span>
      <span className="text-xs text-text-muted">{shortDate(day)}{isToday ? ' · Hôm nay' : ''}</span>
    </button>
    <div className="flex flex-1 flex-col gap-2 p-2">
      {offs.map(o => <OffCard key={o.id} off={o} />)}
      {sessions.map(s => <SessionCard key={s.id} s={s} />)}
      {!sessions.length && !offs.length && <p className="px-1 py-2 text-xs text-text-muted">Không có ca</p>}
    </div>
  </div>
}

function SessionCard({ s, wide }: { s: Session; wide?: boolean }) {
  const k = KIND[kindOf(s)]
  if (s.trialPhone) return <div className={`rounded-lg border p-2.5 ${k.card} ${wide ? 'flex flex-wrap items-center gap-x-6 gap-y-1' : ''}`}>
    <p className={`text-xs font-bold tabular-nums ${k.time}`}>{hhmm(s.startsAt)} – {hhmm(s.endsAt)} · {minutesBetween(s.startsAt, s.endsAt)}'</p>
    <p className="mt-1 text-sm font-semibold">Tập thử PT · {s.memberName}</p>
    <p className="mt-0.5 text-xs text-text-muted">{s.trialPhone} · {SESSION_LABEL[s.status] ?? s.status}</p>
  </div>
  return <Link to={`/coach/sessions/${s.id}`} className={`block rounded-lg border p-2.5 transition-colors hover:border-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50 ${k.card} ${wide ? 'flex flex-wrap items-center gap-x-6 gap-y-1' : ''}`}>
    <p className={`flex items-center justify-between gap-1 text-xs font-bold tabular-nums ${k.time}`}>
      <span>{hhmm(s.startsAt)} – {hhmm(s.endsAt)} · {minutesBetween(s.startsAt, s.endsAt)}'</span>
      {s.status === 'COMPLETED' && <Check aria-hidden className="h-4 w-4 text-emerald-600" />}
    </p>
    {s.status === 'IN_PROGRESS' && <p className="mt-1 text-xs font-semibold text-primary">● Đang dạy</p>}
    <p className={`mt-1 text-sm font-semibold leading-snug text-text-primary ${!isScheduled(s) ? 'line-through' : ''}`}>{s.memberName}</p>
    <p className="mt-0.5 text-xs text-text-muted">{s.credit ? `Buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : 'Buổi PT'} · {s.courseName ?? s.purchase?.packageNameSnapshot}</p>
    {s.status === 'COMPLETED' && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Hoàn thành</p>}
    {!['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(s.status) && <p className="mt-1 text-xs text-text-muted">{SESSION_LABEL[s.status] ?? s.status}</p>}
  </Link>
}

function OffCard({ off }: { off: TimeOff }) {
  return <div className="rounded-lg border border-dashed border-border-strong bg-bg-surface p-2.5 text-xs text-text-muted">
    <p className="flex items-center gap-1.5 font-semibold text-text-primary"><Moon aria-hidden className="h-3.5 w-3.5" />Nghỉ</p>
    <p className="mt-0.5 tabular-nums">{hhmm(off.startsAt)} – {hhmm(off.endsAt)}</p>
    {off.reason && <p className="mt-0.5">{off.reason}</p>}
  </div>
}

function DayList({ day, sessions, offs }: { day: string; sessions: Session[]; offs: TimeOff[] }) {
  if (!sessions.length && !offs.length) return <div className="px-5 py-16 text-center text-sm text-text-muted">Không có ca dạy trong ngày {longDate(day)}.</div>
  return <div className="space-y-2 p-4">
    {offs.map(o => <OffCard key={o.id} off={o} />)}
    {sessions.map(s => <SessionCard key={s.id} s={s} wide />)}
  </div>
}
