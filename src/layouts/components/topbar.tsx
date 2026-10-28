import { useAuth } from '@/features/auth/context/auth-context'
import { Avatar } from '@/shared/components/ui/avatar'
import { LogOut, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { ThemeSelector } from '@/components/ThemeSelector'
import { roleLabel } from '@/shared/constants/labels'
import { MemberSearch } from './member-search'

export function Topbar() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle bg-bg-surface/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {(role === 'RECEPTIONIST' || role === 'MANAGER') && <MemberSearch />}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Link to public coach profile */}
        {user?.coachProfilesUserId?.id && <Link
          to={`/coaches/${user.coachProfilesUserId.id}`}
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-surface-muted px-2.5 py-1.5 text-xs text-text-muted hover:border-primary/40 hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Hồ sơ công khai</span>
        </Link>}

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Notifications */}
        <NotificationBell />

        {/* User Card */}
        <div className="flex items-center gap-3 border-l border-border-subtle pl-3 md:pl-4">
          <Avatar src={user?.avatarUrl} name={user?.fullName} size={32} className="rounded-full" />
          <div className="hidden text-left md:block">
            <p className="text-xs font-bold text-text-primary leading-tight">{user?.fullName}</p>
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {roleLabel(role)}
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
