import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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

      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeSelector />
        <NotificationBell />
      </div>
    </header>
  )
}
