import { Outlet, Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { SidebarNav } from './components/sidebar-nav'
import { Topbar } from './components/topbar'

export function DashboardLayout() {
  const { role } = useAuth()

  return (
    <div className="flex min-h-screen bg-bg-app text-text-primary">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border-subtle bg-bg-surface/95 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border-subtle px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <Link to="/" className="text-sm font-bold tracking-tight text-text-primary hover:text-primary transition-colors">
              ApexFIT
            </Link>
            <p className="text-xs uppercase tracking-wider text-text-muted">Gym & PT Management</p>
          </div>
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
      <div className="flex flex-1 flex-col pl-64 min-w-0 max-w-full">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
