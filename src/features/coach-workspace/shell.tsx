import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight, BookOpenText, CalendarDays, CalendarPlus, CalendarRange, ChevronDown, ClipboardList, ExternalLink,
  LayoutGrid, NotebookPen, Package, Ruler, Sparkles, Users, Utensils, Wallet,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { centerDate } from '@/shared/utils/date'
import { WorkspaceLayout, type WorkspaceNavSection } from '@/features/workspace/layout'
import { PersonSearch, type PersonHit } from '@/features/workspace/person-search'
import { dayEnd, dayStart, isScheduled } from '@/features/workspace/utils'
import { coachWs, type CoachMember, type ServiceSettings } from './api'

// Workspace-wide state: sidebar badges and the Coach's "accepting new members" switch.
interface CoachShellState {
  coachId: string | null
  todaySessions: number | null
  pendingChanges: number | null
  settings: ServiceSettings | null
  refreshBadges: () => void
  setAccepting: (value: boolean) => Promise<void>
}
const ShellContext = createContext<CoachShellState>({ coachId: null, todaySessions: null, pendingChanges: null, settings: null, refreshBadges: () => {}, setAccepting: async () => {} })
export const useCoachShell = () => useContext(ShellContext)

export function CoachShell() {
  const { user } = useAuth()
  const coachId = user?.coachProfilesUserId?.id ?? null
  const [todaySessions, setToday] = useState<number | null>(null)
  const [pendingChanges, setPending] = useState<number | null>(null)
  const [settings, setSettings] = useState<ServiceSettings | null>(null)

  const refreshBadges = useCallback(() => {
    const today = centerDate()
    coachWs.sessions({ from: dayStart(today), to: dayEnd(today) }, 1).then(s => setToday(s.filter(isScheduled).length)).catch(() => setToday(null))
    coachWs.scheduleChanges().then(c => setPending(c.filter(x => x.status === 'REQUESTED').length)).catch(() => setPending(null))
  }, [])
  useEffect(() => { if (user?.role === 'COACH') refreshBadges() }, [refreshBadges, user?.role])
  useEffect(() => { if (coachId) coachWs.settings(coachId).then(setSettings).catch(() => setSettings(null)) }, [coachId])
  const setAccepting = useCallback(async (value: boolean) => {
    if (!coachId) return
    const next = await coachWs.updateSettings(coachId, { acceptingNewMembers: value })
    setSettings(s => ({ ...(s ?? { bufferMinutes: 0 }), ...next, acceptingNewMembers: next?.acceptingNewMembers ?? value }))
  }, [coachId])

  const nav: WorkspaceNavSection[] = [
    { title: 'Tổng quan', items: [{ to: '/coach', label: 'Dashboard Coach', icon: LayoutGrid, end: true }] },
    { title: 'Lịch & buổi dạy', items: [
      { to: '/coach/schedule', label: 'Lịch dạy', icon: CalendarDays, badge: { count: todaySessions, label: n => `${n} ca hôm nay` } },
      { to: '/coach/schedule-changes', label: 'Đổi lịch & học bù', icon: ArrowLeftRight, badge: { count: pendingChanges, tone: 'warning', label: n => `${n} yêu cầu chờ` } },
      { to: '/coach/slots', label: 'Khung giờ làm việc', icon: CalendarRange },
    ] },
    { title: 'Học viên', items: [
      { to: '/coach/students', label: 'Danh sách học viên', icon: Users },
      { to: '/coach/packages', label: 'Gói PT của tôi', icon: Package },
      { to: '/coach/offerings', label: 'Khóa đăng ký dạy', icon: CalendarPlus },
    ] },
    { title: 'Chuyên môn', items: [
      { to: '/coach/library', label: 'Giáo án & Thư viện', icon: BookOpenText },
      { to: '/coach/training-plans', label: 'Chương trình theo gói', icon: NotebookPen },
      { to: '/coach/training-results', label: 'Kết quả tập luyện', icon: ClipboardList },
      { to: '/coach/assessments', label: 'InBody & thể trạng', icon: Ruler },
      { to: '/coach/meal-plans', label: 'Thực đơn dinh dưỡng', icon: Utensils },
      { to: '/coach/ai-recommendation', label: 'Gợi ý AI', icon: Sparkles },
    ] },
    { title: 'Tài chính', items: [{ to: '/coach/earnings', label: 'Thu nhập Coach', icon: Wallet }] },
  ]

  return <ShellContext.Provider value={{ coachId, todaySessions, pendingChanges, settings, refreshBadges, setAccepting }}>
    <WorkspaceLayout nav={nav} panel="Coach Panel" roleLabel="Huấn luyện viên / PT" search={<StudentSearch />}
      actions={<>
        <ReadyToggle />
        {coachId && <Link to={`/coaches/${coachId}`} target="_blank" title="Hồ sơ công khai" aria-label="Hồ sơ công khai (mở tab mới)" className="hidden h-9 w-9 place-items-center rounded-lg border border-border-subtle text-text-muted hover:text-primary sm:grid"><ExternalLink className="h-4 w-4" /></Link>}
      </>} />
  </ShellContext.Provider>
}

/** Coach's own "accepting new members" switch (PATCH /coaches/:id/service-settings). */
function ReadyToggle() {
  const { settings, setAccepting } = useCoachShell()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  if (!settings) return null
  const on = settings.acceptingNewMembers
  const choose = async (value: boolean) => {
    setBusy(true); setError(null)
    try { await setAccepting(value); setOpen(false) } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được.') } finally { setBusy(false) }
  }
  return <div ref={ref} className="relative">
    <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(o => !o)}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${on ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-border-subtle bg-bg-surface-muted text-text-muted'}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      <span className="hidden sm:inline">{on ? 'Đang nhận học viên mới' : 'Tạm ngưng nhận học viên'}</span>
      <ChevronDown aria-hidden className="h-4 w-4" />
    </button>
    {open && <div id={menuId} role="menu" className="absolute right-0 top-11 w-72 rounded-xl border border-border-subtle bg-bg-surface p-2 shadow-xl">
      {[{ v: true, t: 'Nhận học viên mới', d: 'Hiển thị bạn trong danh sách Coach còn nhận gói PT.' }, { v: false, t: 'Tạm ngưng nhận', d: 'Học viên hiện tại vẫn tập bình thường.' }].map(o =>
        <button key={String(o.v)} role="menuitemradio" aria-checked={on === o.v} type="button" disabled={busy} onClick={() => void choose(o.v)}
          className={`block w-full rounded-lg px-3 py-2 text-left hover:bg-bg-surface-muted ${on === o.v ? 'bg-primary/5' : ''}`}>
          <span className="text-sm font-semibold text-text-primary">{o.t}</span>
          <span className="block text-xs text-text-muted">{o.d}</span>
        </button>)}
      {error && <p role="alert" className="px-3 py-1 text-xs text-red-600">{error}</p>}
    </div>}
  </div>
}

/** Quick search across the Coach's own members; `/coaches/me/members` has no server search, so the list is filtered here. */
function StudentSearch() {
  const navigate = useNavigate()
  const cache = useRef<Promise<CoachMember[]> | null>(null)
  const find = useCallback(async (term: string): Promise<PersonHit[]> => {
    cache.current ??= coachWs.members().catch(e => { cache.current = null; throw e })
    const t = term.toLowerCase()
    return (await cache.current).filter(m => [m.fullName ?? m.user?.fullName, m.phone, m.memberCode].some(v => v?.toLowerCase().includes(t)))
      .map(m => ({ id: m.id, name: m.fullName ?? m.user?.fullName ?? m.memberCode, sub: `${m.memberCode}${m.phone ? ` · ${m.phone}` : ''}`, avatarUrl: m.avatarUrl ?? m.user?.avatarUrl }))
  }, [])
  return <PersonSearch label="Tìm nhanh học viên" placeholder="Tìm nhanh học viên theo tên / SĐT…" find={find} onPick={h => navigate(`/coach/students/${h.id}`)} />
}
