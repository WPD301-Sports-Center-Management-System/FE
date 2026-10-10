import { Link } from 'react-router-dom'
import { ShieldAlert, FileQuestion, ServerCrash, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/features/auth/context/auth-context'

export interface SystemErrorPageProps {
  code?: '403' | '404' | '500'
  title?: string
  message?: string
}

export function SystemErrorPage({ code = '404', title, message }: SystemErrorPageProps) {
  const { role, isAuthenticated } = useAuth()

  const configs = {
    '403': {
      icon: ShieldAlert,
      defaultTitle: '403 — Không có quyền truy cập',
      defaultMessage: 'Bạn không có quyền truy cập vào tài nguyên hoặc chức năng này.',
      color: 'text-amber-400',
    },
    '404': {
      icon: FileQuestion,
      defaultTitle: '404 — Không tìm thấy trang',
      defaultMessage: 'Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị di chuyển.',
      color: 'text-orange-400',
    },
    '500': {
      icon: ServerCrash,
      defaultTitle: '500 — Lỗi hệ thống',
      defaultMessage: 'Máy chủ gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng thử lại sau.',
      color: 'text-red-400',
    },
  }[code]

  const Icon = configs.icon

  const getHomePath = () => {
    if (!isAuthenticated) return '/login'
    if (role === 'RECEPTIONIST') return '/receptionist'
    if (role === 'COACH') return '/coach'
    if (role === 'MANAGER') return '/manager'
    return '/'
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-app p-6 text-center text-text-primary">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border-subtle bg-bg-surface shadow-xl">
        <Icon className={`h-10 w-10 ${configs.color}`} />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-text-primary">{title || configs.defaultTitle}</h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">{message || configs.defaultMessage}</p>

      <div className="mt-8 flex items-center gap-3">
        <Link to={getHomePath()}>
          <Button variant="primary" className="gap-2">
            <Home className="h-4 w-4" />
            <span>Về trang chủ của bạn</span>
          </Button>
        </Link>
        <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          <span>Thử lại</span>
        </Button>
      </div>
    </div>
  )
}
