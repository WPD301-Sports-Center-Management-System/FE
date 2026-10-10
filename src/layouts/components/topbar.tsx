import { useAuth } from '@/features/auth/context/auth-context'
import { Bell, LogOut, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { UserRole } from '@/shared/types/api'

export function Topbar() {
  const { user, role, login, logout, switchRoleDemo } = useAuth()
  const navigate = useNavigate()

  const handleRoleSwitch = async (newRole: UserRole) => {
    const demoCredentials: Record<UserRole, { identifier: string; password: string; path: string }> = {
      MANAGER: { identifier: 'manager@gym.local', password: 'password123', path: '/manager' },
      RECEPTIONIST: { identifier: 'receptionist@gym.local', password: 'password123', path: '/receptionist' },
      COACH: { identifier: 'coach1@gym.local', password: 'password123', path: '/coach' },
      MEMBER: { identifier: 'member4@gym.local', password: 'password123', path: '/' },
    }

    const target = demoCredentials[newRole]
    if (target) {
      try {
        await login({ identifier: target.identifier, password: target.password })
        navigate(target.path, { replace: true })
      } catch {
        switchRoleDemo(newRole)
        navigate(target.path, { replace: true })
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chuyển vai trò:</span>
        <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
          {(['MANAGER', 'RECEPTIONIST', 'COACH'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleSwitch(r)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                role === r
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'MANAGER' ? 'Manager' : r === 'RECEPTIONIST' ? 'Lễ tân' : 'HLV'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Link to public coach profile */}
        <Link
          to="/coaches/coa-01"
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-300 hover:border-orange-500/40 hover:text-orange-400 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Profile HLV (Khách)</span>
        </Link>

        {/* Notifications */}
        <button
          className="relative rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-slate-400 hover:text-white transition-colors"
          title="Thông báo"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={user?.fullName}
            className="h-8 w-8 rounded-full border border-orange-500/30 object-cover"
          />
          <div className="hidden text-left md:block">
            <p className="text-xs font-bold text-slate-200 leading-tight">{user?.fullName}</p>
            <p className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {role}
            </p>
          </div>
          <button
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
