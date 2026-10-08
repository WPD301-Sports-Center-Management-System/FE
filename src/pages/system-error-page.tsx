import { Link } from 'react-router-dom'
import { ShieldAlert, FileQuestion, ServerCrash, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export interface SystemErrorPageProps {
  code?: '403' | '404' | '500'
  title?: string
  message?: string
}

export function SystemErrorPage({ code = '404', title, message }: SystemErrorPageProps) {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070a11] p-6 text-center text-slate-100">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <Icon className={`h-10 w-10 ${configs.color}`} />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">{title || configs.defaultTitle}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">{message || configs.defaultMessage}</p>

      <div className="mt-8 flex items-center gap-3">
        <Link to="/login">
          <Button variant="primary" className="gap-2">
            <Home className="h-4 w-4" />
            <span>Về trang chủ</span>
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
