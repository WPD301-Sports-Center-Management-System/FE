import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Clock, Dumbbell, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { ThemeSelector } from '@/components/ThemeSelector'
import { CENTER_TIME_ZONE } from '@/shared/utils/date'
import { Person } from './ui'
import { useDialog } from '@/shared/hooks/use-dialog'

// Shared frame of the staff workspaces (Coach, Receptionist): sidebar with grouped navigation and
// live badges, sticky topbar, skip link and a mobile drawer.
export interface WorkspaceNavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
  badge?: { count: number | null; tone?: 'primary' | 'warning'; label: (n: number) => string }
}
export interface WorkspaceNavSection { title: string; items: WorkspaceNavItem[] }

export function WorkspaceLayout({ nav, panel, roleLabel, search, actions }: { nav: WorkspaceNavSection[]; panel: string; roleLabel: string; search?: ReactNode; actions?: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  const currentItem = nav.flatMap(section => section.items)
    .filter(item => item.end ? location.pathname === item.to : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
  useEffect(() => setDrawer(false), [location.pathname])
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeAtDesktop = () => { if (desktop.matches) setDrawer(false) }
    desktop.addEventListener('change', closeAtDesktop)
    return () => desktop.removeEventListener('change', closeAtDesktop)
  }, [])
  useEffect(() => {
    if (!drawer) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawer(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [drawer])
  return <div className="flex min-h-dvh bg-bg-app text-text-primary">
    <a href="#workspace-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-bg-surface focus:px-3 focus:py-2 focus:shadow">Bỏ qua tới nội dung</a>
    {drawer && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden onClick={() => setDrawer(false)} />}
    <Sidebar nav={nav} panel={panel} roleLabel={roleLabel} open={drawer} onClose={() => setDrawer(false)} actions={actions} />
    <div className="flex min-w-0 flex-1 flex-col lg:pl-[240px]">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b border-border-subtle bg-bg-surface px-4 py-2 sm:gap-3 sm:px-6 lg:px-8 print:hidden">
        <button type="button" onClick={() => setDrawer(true)} aria-label="Mở menu" aria-expanded={drawer} aria-controls="workspace-sidebar" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-text-primary hover:bg-bg-surface-muted lg:hidden"><Menu className="h-5 w-5" />Menu</button>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold lg:hidden">{currentItem?.label ?? panel}</span>
        <div className="order-last w-full min-w-0 lg:order-none lg:w-auto lg:flex-1">{search}</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 xl:flex">{actions}</div>
          <LiveClock />
          <ThemeSelector />
          <NotificationBell />
        </div>
      </header>
      <main id="workspace-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  </div>
}

function Sidebar({ nav, panel, roleLabel, open, onClose, actions }: { nav: WorkspaceNavSection[]; panel: string; roleLabel: string; open: boolean; onClose: () => void; actions?: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const dialog = useDialog(open, onClose)
  return <aside ref={dialog} tabIndex={-1} role={open ? 'dialog' : undefined} aria-modal={open || undefined} id="workspace-sidebar" aria-label={`Điều hướng ${panel}`} className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border-subtle bg-bg-surface transition-transform duration-200 motion-reduce:transition-none lg:visible lg:translate-x-0 print:hidden ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}>
    <div className="flex items-center gap-3 px-4 pb-3 pt-4">
      <span aria-hidden className="grid h-10 w-10 place-items-center text-primary"><Dumbbell className="h-7 w-7" /></span>
      <div className="min-w-0 flex-1">
        <Link to="/" className="block text-[15px] font-bold tracking-tight text-text-primary hover:text-primary">ApexFIT</Link>
        <p className="flex items-center gap-1.5 text-xs text-text-muted"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />{panel}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Đóng menu" className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted lg:hidden"><X className="h-5 w-5" /></button>
    </div>
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
      {nav.map(section => <div key={section.title}>
        <p className="px-3 pb-1.5 text-xs font-medium text-text-muted">{section.title}</p>
        <ul className="space-y-0.5">
          {section.items.map(item => <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50 ${isActive ? 'bg-primary/10 font-semibold text-text-primary' : 'text-text-primary/80 hover:bg-bg-surface-muted hover:text-text-primary'}`}>
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 leading-5">{item.label}</span>
              {item.badge?.count ? <span aria-label={item.badge.label(item.badge.count)} className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${item.badge.tone === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-primary/10 text-primary'}`}>{item.badge.count}</span> : null}
            </NavLink>
          </li>)}
        </ul>
      </div>)}
    </nav>
    {actions && <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle p-3 xl:hidden">{actions}</div>}
    <div className="flex items-center gap-3 border-t border-border-subtle p-3">
      <span className="relative"><Person name={user?.fullName} src={user?.avatarUrl} size={38} /><span aria-hidden className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bg-surface bg-emerald-500" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{user?.fullName ?? '—'}</p>
        <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">{roleLabel}</span>
        <Link to="/account/change-password" className="mt-1 block text-xs text-text-muted underline">Đổi mật khẩu</Link>
      </div>
      <button type="button" title="Đăng xuất" aria-label="Đăng xuất" onClick={async () => { await logout(); navigate('/login') }} className="rounded-lg p-2 text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><LogOut className="h-4 w-4" /></button>
    </div>
  </aside>
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return <span title="Giờ hiện tại của trung tâm" aria-label="Giờ hiện tại của trung tâm" className="hidden h-9 items-center gap-2 px-2 text-sm tabular-nums text-text-muted 2xl:inline-flex">
    <Clock aria-hidden className="h-4 w-4 text-text-muted" />
    <time dateTime={now.toISOString()}>{new Intl.DateTimeFormat('vi-VN', { timeZone: CENTER_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(now)}</time>
  </span>
}
