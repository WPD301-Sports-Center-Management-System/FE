import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { centerDate, formatTime } from '@/shared/utils/date'
import { inputCls } from './ui'

// Shared weekly board (Coach, Receptionist, Manager): filters → week navigation + legend → 7 day
// columns of session cards. Days are center-local YYYY-MM-DD strings.
export const addDays = (day: string, n: number) =>
  new Date(new Date(`${day}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10)
export const weekdayOf = (day: string) => ((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7) + 1
export const mondayOf = (day: string) => addDays(day, 1 - weekdayOf(day))
const ddmm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`
const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

export type Tone = 'scheduled' | 'makeup' | 'done' | 'cancelled' | 'moved' | 'hold'
export const TONE_LABEL: Record<Tone, string> = {
  scheduled: 'Đã lên lịch', makeup: 'Buổi dạy bù', done: 'Hoàn thành', cancelled: 'Đã hủy', moved: 'Đã đổi giờ', hold: 'Đang giữ chỗ',
}
const TONE: Record<Tone, { card: string; text: string; chip: string; dot: string }> = {
  scheduled: { card: 'border-emerald-500 bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  makeup: { card: 'border-amber-500 bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  done: { card: 'border-sky-500 bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300', chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  cancelled: { card: 'border-rose-500 bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  moved: { card: 'border-slate-400 bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300', chip: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
  hold: { card: 'border-violet-500 border-dashed bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
}
export const DEFAULT_LEGEND: Tone[] = ['scheduled', 'makeup', 'done', 'cancelled']

export function toneOf(status: string, isMakeup = false): Tone {
  if (status === 'COMPLETED') return 'done'
  if (['CANCELLED_EARLY', 'CANCELLED_LATE', 'COACH_CANCELLED', 'NO_SHOW'].includes(status)) return 'cancelled'
  if (status === 'RESCHEDULED') return 'moved'
  return isMakeup ? 'makeup' : 'scheduled'
}

export interface WeekEvent { id: string; start: string; end: string; title: string; subtitle?: string; tone: Tone; statusText?: string; onOpen?: () => void }
export interface DayNote { id: string; day: string; text: string; kind: 'hours' | 'open' | 'closed' }

export function ViewToggle({ value, onChange }: { value: 'week' | 'table'; onChange: (v: 'week' | 'table') => void }) {
  return (
    <div role="group" aria-label="Kiểu hiển thị" className="inline-flex rounded-xl border border-border-subtle bg-bg-surface-muted p-1">
      {(['week', 'table'] as const).map(v => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`min-h-9 cursor-pointer rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${value === v ? 'bg-bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
          {v === 'week' ? 'Lịch tuần' : 'Bảng'}
        </button>
      ))}
    </div>
  )
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="block font-medium text-text-primary">{label}</span>
      <select className={`${inputCls} min-h-11 cursor-pointer`} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Tất cả</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
// Distinct, sorted select options from a list of rows.
export function optionsOf<T>(rows: T[], pick: (row: T) => string | null | undefined) {
  return [...new Set(rows.map(pick).filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, 'vi')).map(v => ({ value: v, label: v }))
}
export const STATUS_OPTIONS = DEFAULT_LEGEND.map(t => ({ value: t, label: TONE_LABEL[t] }))

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

export function WeekToolbar({ first, onChange, legend = DEFAULT_LEGEND }: { first: string; onChange: (monday: string) => void; legend?: Tone[] }) {
  const last = addDays(first, 6)
  const nav = 'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-text-primary transition-colors hover:bg-bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={nav} aria-label="Tuần trước" onClick={() => onChange(addDays(first, -7))}><ChevronLeft className="h-4 w-4" aria-hidden /></button>
        <span className="min-w-44 text-center text-sm font-medium tabular-nums text-text-primary" aria-live="polite">{ddmm(first)} – {ddmm(last)}/{last.slice(0, 4)}</span>
        <button type="button" className={nav} aria-label="Tuần sau" onClick={() => onChange(addDays(first, 7))}><ChevronRight className="h-4 w-4" aria-hidden /></button>
        <button type="button" className={nav} onClick={() => onChange(mondayOf(centerDate()))}>Tuần này</button>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Chú thích trạng thái">
        {legend.map(t => (
          <li key={t} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${TONE[t].chip}`}>
            <span className={`h-2 w-2 rounded-full ${TONE[t].dot}`} aria-hidden />{TONE_LABEL[t]}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WeekBoard({ first, events, notes = [] }: { first: string; events: WeekEvent[]; notes?: DayNote[] }) {
  const today = centerDate()
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle">
      <div className="grid grid-cols-1 gap-px bg-border-subtle sm:grid-cols-2 lg:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(first, i)
          const isToday = day === today
          const dayEvents = events.filter(e => centerDate(e.start) === day).sort((a, b) => a.start.localeCompare(b.start))
          const dayNotes = notes.filter(n => n.day === day)
          return (
            <section key={day} aria-label={`${DAY_NAMES[i]} ${ddmm(day)}`} className="flex min-w-0 flex-col bg-bg-surface sm:last:col-span-2 lg:last:col-span-1">
              <header aria-current={isToday ? 'date' : undefined}
                className={`flex items-center justify-between gap-2 border-b-2 bg-bg-surface-muted px-4 py-3 text-sm ${isToday ? 'border-primary font-semibold text-primary' : 'border-transparent text-text-primary'}`}>
                <span>{DAY_NAMES[i]}</span><span className={`tabular-nums ${isToday ? '' : 'text-text-muted'}`}>{ddmm(day)}</span>
              </header>
              <div className="flex min-h-24 flex-1 flex-col gap-2 p-2 lg:min-h-72">
                {dayNotes.map(n => (
                  <p key={n.id} title={n.text} className={`truncate rounded-md px-2 py-1 text-xs ${n.kind === 'closed' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : n.kind === 'open' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-bg-surface-muted text-text-muted'}`}>{n.text}</p>
                ))}
                {dayEvents.map(e => <EventCard key={e.id} event={e} />)}
                {!dayEvents.length && <p className="py-4 text-center text-sm text-text-muted">Trống</p>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function EventCard({ event: e }: { event: WeekEvent }) {
  const tone = TONE[e.tone]
  const time = `${formatTime(e.start)}–${formatTime(e.end)}`
  const status = e.statusText ?? TONE_LABEL[e.tone]
  const body = (
    <>
      <span className={`block text-xs font-semibold tabular-nums ${tone.text}`}>{time}</span>
      <span className="block truncate text-sm font-medium text-text-primary">{e.title}</span>
      {e.subtitle && <span className="block truncate text-xs text-text-muted">{e.subtitle}</span>}
      {e.tone !== 'scheduled' ? <span className={`mt-0.5 block truncate text-[11px] font-medium ${tone.text}`}>{status}</span> : <span className="sr-only">{status}</span>}
    </>
  )
  const cls = `block w-full rounded-lg border-l-4 px-3 py-2 text-left ${tone.card}`
  const title = [time, e.title, e.subtitle, status].filter(Boolean).join(' · ')
  return e.onOpen
    ? <button type="button" title={title} onClick={e.onOpen} className={`${cls} cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary`}>{body}</button>
    : <div title={title} className={cls}>{body}</div>
}
