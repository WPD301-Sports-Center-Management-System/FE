import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, RotateCw } from 'lucide-react'
import type { Tone } from './utils'
import { FIELD_ERRORS_EVENT, normalizeLabel, type FieldErrorMap } from './field-errors'

// Building blocks of the Coach workspace (light enterprise layout, orange primary shared with Mobile).
// Colors come from the theme tokens in styles/index.css so dark mode keeps working.

const TONE: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
}
const BAR: Record<Tone, string> = { neutral: 'bg-slate-400', primary: 'bg-primary', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500', info: 'bg-sky-500', violet: 'bg-violet-500' }
export const toneText: Record<Tone, string> = { neutral: 'text-text-primary', primary: 'text-primary', success: 'text-emerald-700 dark:text-emerald-400', warning: 'text-amber-700 dark:text-amber-400', danger: 'text-red-700 dark:text-red-400', info: 'text-sky-700 dark:text-sky-400', violet: 'text-violet-700 dark:text-violet-400' }

export function Badge({ tone = 'neutral', dot, children, className = '' }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${TONE[tone]} ${className}`}>
    {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}{children}
  </span>
}

type BtnVariant = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger'
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20',
  soft: 'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/25',
  outline: 'border border-border-subtle bg-bg-surface text-text-primary hover:border-border-strong hover:bg-bg-surface-muted',
  ghost: 'text-text-muted hover:bg-bg-surface-muted hover:text-text-primary',
  danger: 'border border-red-200 bg-bg-surface text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10',
}
const btnBase = 'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50 disabled:cursor-not-allowed disabled:opacity-50'
const SIZE = { sm: 'min-h-11 px-3 text-sm sm:min-h-8 sm:text-xs', md: 'min-h-11 px-3.5 text-sm sm:min-h-10' }
export const btnCls = (variant: BtnVariant = 'outline', size: 'sm' | 'md' = 'md') => `${btnBase} ${BTN[variant]} ${SIZE[size]}`

export function Btn({ variant = 'outline', size = 'md', icon, busy, children, className = '', type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md'; icon?: ReactNode; busy?: boolean }) {
  return <button type={type} {...rest} disabled={rest.disabled || busy} aria-busy={busy || undefined} className={`${btnCls(variant, size)} ${className}`}>
    {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : icon}{children}
  </button>
}
export function LinkBtn({ to, variant = 'outline', size = 'md', icon, children, className = '' }: { to: string; variant?: BtnVariant; size?: 'sm' | 'md'; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <Link to={to} className={`${btnCls(variant, size)} ${className}`}>{icon}{children}</Link>
}

export function PageHeader({ title, subtitle, actions, crumbs }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; crumbs?: { label: string; to?: string }[] }) {
  return <header className="mb-5">
    {crumbs && <nav aria-label="Đường dẫn" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
      {crumbs.map((c, i) => <span key={i} className="inline-flex items-center gap-1.5">
        {i > 0 && <span aria-hidden className="text-border-strong">•</span>}
        {c.to ? <Link to={c.to} className="hover:text-primary">{c.label}</Link> : <span aria-current="page" className="font-semibold text-text-primary">{c.label}</span>}
      </span>)}
    </nav>}
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
        {subtitle && <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>
}
export const Dot = () => <span aria-hidden className="text-border-strong">•</span>

export function Card({ title, subtitle, badge, actions, children, className = '', flush }: { title?: ReactNode; subtitle?: ReactNode; badge?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return <section className={`min-w-0 rounded-xl border border-border-subtle bg-bg-surface ${className}`}>
    {(title || actions) && <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
      <div className="min-w-0">
        <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-text-primary">{title}{badge}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>}
    <div className={flush ? '' : 'p-5'}>{children}</div>
  </section>
}

export function StatTile({ label, value, unit, hint, tone = 'neutral', progress }: { label: string; icon?: ReactNode; value: ReactNode; unit?: string; hint?: ReactNode; tone?: Tone; progress?: { value: number; max: number; tone?: Tone }; iconTone?: Tone }) {
  return <div className="min-w-0 rounded-xl border border-border-subtle bg-bg-surface p-5">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-medium text-text-muted">{label}</p>
    </div>
    <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${toneText[tone]}`}>{value}{unit && <span className="ml-1 text-sm font-medium text-text-muted">{unit}</span>}</p>
    {(hint || progress) && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
      {progress && <ProgressBar value={progress.value} max={progress.max} tone={progress.tone} className="w-24" />}
      {hint}
    </div>}
  </div>
}

export function ProgressBar({ value, max, tone = 'primary', className = '', label }: { value: number; max: number; tone?: Tone; className?: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label} className={`h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700 ${className}`}>
    <div className={`h-full rounded-full ${BAR[tone]}`} style={{ width: `${pct}%` }} />
  </div>
}

const AVATAR_TONES: Tone[] = ['danger', 'warning', 'info', 'success', 'violet', 'primary']
export function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts.length === 1 ? parts[0]!.slice(0, 2) : parts[0]![0]! + parts.at(-1)![0]!).toUpperCase()
}
export function Person({ name, src, size = 36 }: { name?: string | null; src?: string | null; size?: number }) {
  const [broken, setBroken] = useState<string | null>(null)
  const tone = AVATAR_TONES[[...(name ?? '')].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_TONES.length]!
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }
  if (src && broken !== src) return <img src={src} alt="" style={style} onError={() => setBroken(src)} className="shrink-0 rounded-full object-cover" />
  return <span aria-hidden style={style} className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${TONE[tone]}`}>{initials(name)}</span>
}

export function Segmented<K extends string>({ items, value, onChange, label }: { items: { key: K; label: string; count?: number }[]; value: K; onChange: (k: K) => void; label: string }) {
  return <div role="tablist" aria-label={label} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-bg-surface-muted p-1">
    {items.map((it,index) => <button key={it.key} role="tab" type="button" tabIndex={value === it.key ? 0 : -1} aria-selected={value === it.key} onClick={() => onChange(it.key)}
      onKeyDown={event => {
        const target = event.key === 'ArrowRight' ? (index + 1) % items.length : event.key === 'ArrowLeft' ? (index - 1 + items.length) % items.length : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null
        if (target == null) return
        event.preventDefault(); onChange(items[target]!.key)
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[target]?.focus()
      }}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50 sm:min-h-9 ${value === it.key ? 'bg-bg-surface text-text-primary shadow-sm' : 'text-text-primary/70 hover:text-text-primary'}`}>
      {it.label}{it.count !== undefined && <span className={`text-xs tabular-nums ${value === it.key ? 'text-primary' : 'text-text-primary/70'}`}>{it.count}</span>}
    </button>)}
  </div>
}

export const th = 'whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-text-muted'
export const td = 'px-4 py-3 align-middle text-sm text-text-primary'
export function Table({ head, children, minWidth = 860, alignLast = true }: { head: string[]; children: ReactNode; minWidth?: number; alignLast?: boolean }) {
  // `relative` keeps absolutely positioned cell content (sr-only labels) inside the scroller on phones.
  return <div className="relative overflow-x-auto">
    <table className="w-full border-collapse" style={{ minWidth }}>
      <thead className="border-b border-border-subtle"><tr>{head.map((h, i) => <th key={h + i} scope="col" className={`${th} ${alignLast && i === head.length - 1 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-border-subtle">{children}</tbody>
    </table>
  </div>
}

export function Pagination({ page, pageSize, total, onChange, noun }: { page: number; pageSize: number; total: number; onChange: (p: number) => void; noun: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total ? (page - 1) * pageSize + 1 : 0
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-3 text-sm text-text-muted">
    <span>Hiển thị {from}–{Math.min(total, page * pageSize)} của {total} {noun}</span>
    {pages > 1 && <nav aria-label="Phân trang" className="flex items-center gap-1">
      <button type="button" aria-label="Trang trước" disabled={page <= 1} onClick={() => onChange(page - 1)} className={btnCls('ghost', 'sm')}><ChevronLeft aria-hidden className="h-4 w-4" /></button>
      {Array.from({ length: pages }, (_, i) => i + 1).filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1).map((p, i, arr) => <span key={p} className="flex items-center">
        {i > 0 && p - arr[i - 1]! > 1 && <span className="px-1">…</span>}
        <button type="button" aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)} className={`h-8 min-w-8 cursor-pointer rounded-lg px-2 text-sm font-medium ${p === page ? 'border border-primary text-primary' : 'hover:bg-bg-surface-muted'}`}>{p}</button>
      </span>)}
      <button type="button" aria-label="Trang sau" disabled={page >= pages} onClick={() => onChange(page + 1)} className={btnCls('ghost', 'sm')}><ChevronRight aria-hidden className="h-4 w-4" /></button>
    </nav>}
  </div>
}

export function Skeleton({ rows = 4, className = '' }: { rows?: number; className?: string }) {
  return <div className={`space-y-3 p-5 ${className}`} aria-busy="true" aria-label="Đang tải">
    {Array.from({ length: rows }, (_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-bg-surface-muted motion-reduce:animate-none" />)}
  </div>
}
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
    <span className="inline-flex items-center gap-2"><AlertTriangle aria-hidden className="h-4 w-4 shrink-0" />{message}</span>
    {onRetry && <Btn size="sm" variant="danger" icon={<RotateCw aria-hidden className="h-3.5 w-3.5" />} onClick={onRetry}>Thử lại</Btn>}
  </div>
}
export function EmptyBox({ title, hint, action, icon }: { title: string; hint?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return <div className="flex flex-col items-center px-6 py-12 text-center">
    <span aria-hidden className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-bg-surface-muted text-text-muted">{icon ?? <Inbox className="h-5 w-5" />}</span>
    <p className="font-semibold text-text-primary">{title}</p>
    {hint && <p className="mt-1 max-w-md text-sm text-text-muted">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
}
/** Loading / error / empty switch for a useLoad() state. */
export function Async<T>({ state, empty, rows, children }: { state: { data: T | null; loading: boolean; error: string | null; reload: () => void }; empty?: (data: T) => ReactNode | false; rows?: number; children: (data: T) => ReactNode }) {
  if (state.error) return <ErrorBox message={state.error} onRetry={() => void state.reload()} />
  if (state.data === null) return <Skeleton rows={rows} />
  const e = empty?.(state.data)
  return <>{e || children(state.data)}</>
}

export const inputCls = 'h-11 w-full rounded-lg border border-border-strong bg-bg-input px-3 text-base sm:text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30'
export const textareaCls = 'w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30'
/** Vietnamese text for a failed browser-side check, whatever language the browser is set to. */
function viValidity(el: HTMLInputElement) {
  const v = el.validity
  if (v.valueMissing) return el.type === 'file' ? 'Vui lòng chọn tệp' : el.tagName === 'SELECT' ? 'Vui lòng chọn một mục' : 'Vui lòng nhập thông tin này'
  if (v.typeMismatch) return el.type === 'email' ? 'Email không hợp lệ (ví dụ: ten@email.com)' : el.type === 'url' ? 'Đường dẫn không hợp lệ' : 'Giá trị không đúng định dạng'
  if (v.badInput) return 'Phải là một số hợp lệ'
  if (v.rangeUnderflow) return `Giá trị tối thiểu là ${el.min}`
  if (v.rangeOverflow) return `Giá trị tối đa là ${el.max}`
  if (v.stepMismatch) return 'Giá trị chưa đúng bước cho phép'
  if (v.tooShort) return `Cần ít nhất ${el.minLength} ký tự`
  if (v.tooLong) return `Tối đa ${el.maxLength} ký tự`
  if (v.patternMismatch) return el.title || 'Định dạng chưa đúng'
  return el.validationMessage || 'Giá trị chưa hợp lệ'
}
export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string | null; children: ReactNode; required?: boolean }) {
  // A browser-side check (required, min/max, type, pattern) that fails turns this field red with its own message, and the
  // message goes away as soon as the user edits it. The browser's own bubble (in the browser's language) is suppressed; the first bad field is focused instead.
  const [native, setNative] = useState<string | null>(null)
  const [server, setServer] = useState<string | null>(null)
  useEffect(() => {
    const key = normalizeLabel(label)
    const on = (e: Event) => setServer((e as CustomEvent<FieldErrorMap>).detail[key] ?? null)
    window.addEventListener(FIELD_ERRORS_EVENT, on)
    return () => window.removeEventListener(FIELD_ERRORS_EVENT, on)
  }, [label])
  const shown = error ?? native ?? server
  return <label className={`block space-y-1.5${shown ? ' [&_input]:!border-red-500 [&_select]:!border-red-500 [&_textarea]:!border-red-500 [&_input]:!ring-red-500/20 [&_textarea]:!ring-red-500/20' : ''}`}
    onInvalidCapture={e => { const el = e.target as HTMLInputElement; e.preventDefault(); setNative(viValidity(el)); if (!(document.activeElement as HTMLElement | null)?.matches(':invalid')) el.focus() }}
    onInputCapture={() => { setNative(null); setServer(null) }} onChangeCapture={() => { setNative(null); setServer(null) }}>
    <span className="text-sm font-medium text-text-primary">{label}{required && <span className="text-red-600 dark:text-red-400" aria-hidden> *</span>}</span>
    {children}
    {hint && !shown && <span className="block text-xs text-text-muted">{hint}</span>}
    {shown && <span role="alert" className="block text-xs font-medium text-red-600 dark:text-red-400">{shown}</span>}
  </label>
}
export function InlineError({ message }: { message?: string | null }) {
  return message ? <p role="alert" className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{message}</p> : null
}

/** Short success message announced politely and cleared after 4 s. */
export function useFlash() {
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) }, [message])
  const node = <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[60]">
    {message && <div className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{message}</div>}
  </div>
  return { flash: setMessage, node }
}

/** Trend line for a short numeric series (no axes). */
export function Sparkline({ values, width = 110, height = 32, className = 'text-primary' }: { values: number[]; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 3 - ((v - min) / span) * (height - 6)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts.at(-1)!
  return <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
    <path d={`${d} L${last[0]},${height} L2,${height} Z`} fill="currentColor" opacity={0.08} />
    <path d={d} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={last[0]} cy={last[1]} r={2.6} fill="currentColor" />
  </svg>
}
