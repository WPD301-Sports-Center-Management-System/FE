import { useAuth } from '@/features/auth/context/auth-context'
import { LogOut, ExternalLink, ShieldCheck, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { ThemeSelector } from '@/components/ThemeSelector'

export interface TopbarProps {
  onToggleMobileMenu?: () => void
  onToggleDesktopCollapse?: () => void
  isCollapsed?: boolean
}

export function Topbar({
  onToggleMobileMenu,
  onToggleDesktopCollapse,
  isCollapsed = false,
}: TopbarProps) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle bg-bg-surface/85 px-3 sm:px-6 backdrop-blur-md">
      {/* Left section: Hamburger for mobile + Desktop Collapse button + Status pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Mở menu điều hướng"
          className="flex lg:hidden rounded-xl border border-border-subtle bg-bg-surface p-2 text-text-muted hover:bg-bg-surface-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleDesktopCollapse}
          title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-label={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          className="hidden lg:flex items-center justify-center rounded-xl border border-border-subtle bg-bg-surface p-2 text-text-muted hover:bg-bg-surface-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-primary" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* System status pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-medium text-text-primary truncate">Hệ thống Gym & PT sẵn sàng</span>
        </div>
      </div>

      {/* Right section: Profile guest link + ScaleSelector + ThemeSelector + Notifications + User Card */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Link to public coach profile */}
        <Link
          to="/coaches/coa-01"
          target="_blank"
          className="hidden xl:flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface-muted px-2.5 py-1.5 text-xs text-text-muted hover:border-primary/40 hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Profile HLV (Khách)</span>
        </Link>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Notifications */}
        <NotificationBell />

        {/* User Card */}
        <div className="flex items-center gap-2 sm:gap-3 border-l border-border-subtle pl-2 sm:pl-3">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={user?.fullName || 'Avatar'}
            className="h-8 w-8 rounded-full border border-primary/30 object-cover shrink-0"
          />
          <div className="hidden md:block text-left max-w-[130px] lg:max-w-[160px]">
            <p className="text-xs font-bold text-text-primary leading-tight truncate">{user?.fullName}</p>
            <p className="text-[10px] text-primary font-medium flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span className="truncate">{role}</span>
            </p>
          </div>
          <button
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted hover:text-danger transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
