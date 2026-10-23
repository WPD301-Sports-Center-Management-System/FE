import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Dumbbell, X } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { SidebarNav } from './components/sidebar-nav'
import { Topbar } from './components/topbar'

const COLLAPSED_STORAGE_KEY = 'sidebar_collapsed'

export function DashboardLayout() {
  const { role } = useAuth()
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY)
      if (stored !== null) return stored === 'true'
      // Tự động thu gọn trên laptop nhỏ hoặc màn hình có tỉ lệ hiển thị cao
      return window.innerWidth >= 1024 && window.innerWidth <= 1280
    } catch {
      return false
    }
  })

  // Đóng sidebar drawer khi đổi trang trên mobile
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Đóng sidebar drawer khi bấm phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next))
      } catch {
        // ignore storage error
      }
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-bg-app text-text-primary">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Đóng menu điều hướng"
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsMobileOpen(false)
            }
          }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border-subtle bg-bg-surface/98 backdrop-blur-xl transition-all duration-300 ease-in-out ${
          // Mobile: slide-in drawer
          isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop: collapsed (w-20) or expanded (w-64)
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-16 items-center border-b border-border-subtle transition-all duration-200 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform hover:scale-105"
              title="Về Trang Chủ"
            >
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </Link>
            {!isCollapsed && (
              <div className="min-w-0 overflow-hidden">
                <Link
                  to="/"
                  className="block text-sm font-black tracking-tight text-text-primary hover:text-primary transition-colors truncate font-heading"
                >
                  SPORTS CENTER
                </Link>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted truncate">
                  Gym & PT Management
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile drawer */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng menu"
            className="flex lg:hidden rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic navigation based on active role */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarNav
            role={role}
            isCollapsed={isCollapsed}
            onNavigate={() => setIsMobileOpen(false)}
          />
        </div>

        {/* Footer info */}
        <div
          className={`border-t border-border-subtle p-3 text-center transition-all ${
            isCollapsed ? 'hidden lg:block' : 'block'
          }`}
        >
          {isCollapsed ? (
            <span
              className="inline-block text-[10px] font-bold text-primary"
              title="Phiên bản v1.1 • Dual-Mode"
            >
              v1.1
            </span>
          ) : (
            <p className="text-[10px] text-text-muted">Phiên bản v1.1 • Dual-Mode Mock Ready</p>
          )}
        </div>
      </aside>

      {/* Main Container - Responsive left padding based on sidebar state */}
      <div
        className={`flex flex-1 flex-col min-w-0 max-w-full transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
          onToggleDesktopCollapse={toggleCollapse}
          isCollapsed={isCollapsed}
        />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
