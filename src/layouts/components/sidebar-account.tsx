import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronUp,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'

interface SidebarAccountProps {
  isCollapsed?: boolean
}

const roleLabels: Record<string, string> = {
  MANAGER: 'Quản lý',
  RECEPTIONIST: 'Lễ tân',
  COACH: 'Coach',
  MEMBER: 'Hội viên',
}

export function SidebarAccount({ isCollapsed = false }: SidebarAccountProps) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="relative border-t border-border-subtle p-3">
      {isOpen && (
        <div
          className={`absolute bottom-full z-50 mb-2 w-[calc(100%-1.5rem)] rounded-2xl border border-border-subtle bg-bg-surface p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isCollapsed ? 'left-full ml-2 w-64' : 'left-3'
          }`}
        >
          <div className="flex items-center gap-3 rounded-xl bg-bg-surface-muted p-3 mb-2">
            <img src={user.avatarUrl || '/favicon.svg'} alt="" className="h-10 w-10 rounded-full border border-primary/30 object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text-primary">{user.fullName}</p>
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            </div>
          </div>
          <Link to="/account/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-bg-surface-muted">
            <UserRound className="h-4 w-4 text-primary" /> Xem thông tin tài khoản
          </Link>
          <Link to="/account/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-bg-surface-muted">
            <Settings className="h-4 w-4 text-text-muted" /> Cài đặt tài khoản
          </Link>
          <div className="my-1 border-t border-border-subtle" />
          <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-danger hover:bg-danger/10">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className={`group flex w-full items-center rounded-xl border border-transparent p-2 text-left transition-colors hover:border-border-subtle hover:bg-bg-surface-muted ${isCollapsed ? 'justify-center' : 'gap-3'}`}
      >
        <img src={user.avatarUrl || '/favicon.svg'} alt={user.fullName} className="h-9 w-9 shrink-0 rounded-full border border-primary/30 object-cover" />
        {!isCollapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-text-primary">{user.fullName}</span>
            <span className="flex items-center gap-1 text-[10px] font-medium text-primary"><ShieldCheck className="h-3 w-3" /> {roleLabels[role || ''] || role}</span>
          </span>
        )}
        {!isCollapsed && <ChevronUp className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? '' : 'rotate-180'}`} />}
      </button>
    </div>
  )
}
