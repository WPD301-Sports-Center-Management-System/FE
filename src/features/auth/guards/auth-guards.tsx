import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/auth-context'
import type { UserRole } from '@/shared/types/api'
import { Loader2 } from 'lucide-react'

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app text-text-primary">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs uppercase tracking-widest text-text-muted">Đang khởi tạo phiên làm việc...</p>
      </div>
    </div>
  )
}

export function isPathAllowedForRole(path: string, role: UserRole | null | undefined): boolean {
  if (!role) return false
  if (role === 'MANAGER') return true
  if (role === 'RECEPTIONIST') {
    return (
      path.startsWith('/receptionist') ||
      path === '/' ||
      path.startsWith('/coaches')
    )
  }
  if (role === 'COACH') {
    return (
      path.startsWith('/coach') ||
      path === '/' ||
      path.startsWith('/coaches')
    )
  }
  if (role === 'MEMBER') {
    return path === '/' || path.startsWith('/coaches') || path.startsWith('/member')
  }
  return false
}

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  children?: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <FullPageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function GuestRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isInitializing, role } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <FullPageLoader />
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    if (from && isPathAllowedForRole(from, role)) {
      return <Navigate to={from} replace />
    }

    if (role === 'MANAGER') return <Navigate to="/manager" replace />
    if (role === 'RECEPTIONIST') return <Navigate to="/receptionist" replace />
    if (role === 'COACH') return <Navigate to="/coach" replace />
    if (role === 'MEMBER') return <Navigate to="/member" replace />
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
