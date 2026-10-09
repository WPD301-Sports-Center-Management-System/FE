import { Outlet, Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { SidebarNav } from './components/sidebar-nav'
import { Topbar } from './components/topbar'

export function DashboardLayout() {
  const { role } = useAuth()

  return (
    <div className="flex min-h-screen bg-[#070a11] text-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-900/95 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 shadow-md shadow-orange-600/30">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <div>
            <Link to="/" className="text-sm font-bold tracking-tight text-white hover:text-orange-400 transition-colors">
              SPORTS CENTER
            </Link>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Gym & PT Management</p>
          </div>
        </div>

        {/* Dynamic navigation based on active role */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav role={role} />
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800/80 p-4 text-center">
          <p className="text-[10px] text-slate-500">Phiên bản v1.1 • Dual-Mode Mock Ready</p>
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
