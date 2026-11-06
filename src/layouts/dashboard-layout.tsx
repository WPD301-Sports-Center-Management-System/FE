import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Dumbbell, Menu, X } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { SidebarNav } from './components/sidebar-nav'
import { Topbar } from './components/topbar'
import { useDialog } from '@/shared/hooks/use-dialog'

export function DashboardLayout() {
  const { role } = useAuth()
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  const dialog = useDialog(drawer, () => setDrawer(false))
  useEffect(() => setDrawer(false), [location.pathname, location.search])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const close = () => { if (desktop.matches) setDrawer(false) }
    desktop.addEventListener('change', close)
    return () => desktop.removeEventListener('change', close)
  }, [])

  return (
    <div className="flex min-h-screen bg-bg-app text-text-primary">
      <a href="#member-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:bg-bg-surface focus:p-3">Bỏ qua tới nội dung</a>
      {drawer && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden onClick={() => setDrawer(false)} />}
      {/* Sidebar */}
      <aside ref={dialog} id="member-sidebar" tabIndex={-1} role={drawer ? 'dialog' : undefined} aria-modal={drawer || undefined} aria-label="Điều hướng hội viên" className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border-subtle bg-bg-surface transition-transform motion-reduce:transition-none lg:visible lg:translate-x-0 ${drawer ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}>
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border-subtle px-6">
          <div className="flex h-10 w-10 items-center justify-center text-primary">
            <Dumbbell aria-hidden className="h-7 w-7" />
          </div>
          <div>
            <Link to="/" className="text-sm font-bold tracking-tight text-text-primary hover:text-primary transition-colors">
              ApexFIT
            </Link>
            <p className="text-xs text-text-muted">Không gian hội viên</p>
          </div>
          <button type="button" aria-label="Đóng menu" onClick={() => setDrawer(false)} className="ml-auto grid h-11 w-11 place-items-center rounded-lg hover:bg-bg-surface-muted lg:hidden"><X aria-hidden className="h-5 w-5" /></button>
        </div>

        {/* Dynamic navigation based on active role */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav role={role} />
        </div>

        {/* Footer info */}
        <div className="border-t border-border-subtle p-4 text-center">
          <p className="text-xs text-text-muted">ApexFIT · Gym & PT</p>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 max-w-full flex-1 flex-col lg:pl-64">
        <Topbar navigation={<button type="button" aria-label="Mở menu" aria-expanded={drawer} aria-controls="member-sidebar" onClick={() => setDrawer(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-bg-surface-muted lg:hidden"><Menu aria-hidden className="h-5 w-5" />Menu</button>} />
        <main id="member-main" tabIndex={-1} className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
