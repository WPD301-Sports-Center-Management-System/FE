import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Dumbbell, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { isAppApiError } from '@/shared/api/api-error'
import { isPathAllowedForRole } from '@/features/auth/guards/auth-guards'
import type { UserRole } from '@/shared/types/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRedirectAfterLogin = (role: UserRole) => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    if (from && isPathAllowedForRole(from, role)) {
      navigate(from, { replace: true })
      return
    }

    switch (role) {
      case 'RECEPTIONIST':
        navigate('/receptionist', { replace: true })
        break
      case 'COACH':
        navigate('/coach', { replace: true })
        break
      case 'MANAGER':
      default:
        navigate('/manager', { replace: true })
        break
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier) {
      setErrorMessage('Vui lòng nhập email hoặc số điện thoại.')
      return
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const session = await login({
        identifier: trimmedIdentifier,
        password,
      })

      handleRedirectAfterLogin(session.user.role)
    } catch (err) {
      if (isAppApiError(err)) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setErrorMessage('Tài khoản hoặc mật khẩu không chính xác.')
        } else if (err.code === 'VALIDATION_ERROR') {
          const fieldErr = err.errors?.[0]?.message
          setErrorMessage(fieldErr || err.message || 'Thông tin nhập vào không hợp lệ.')
        } else if (err.code === 'USER_INACTIVE' || err.code === 'ACCOUNT_DISABLED') {
          setErrorMessage('Tài khoản đã bị tạm khóa hoặc chưa kích hoạt.')
        } else if (err.code === 'RATE_LIMIT_EXCEEDED' || err.status === 429) {
          setErrorMessage('Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.')
        } else {
          setErrorMessage(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
        }
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-bg-app text-text-primary">
      {/* Left Column: Hero Banner */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex overflow-hidden bg-bg-surface border-r border-border-subtle">
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-radial-blue pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/40">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">SPORTS CENTER</h2>
            <p className="text-xs uppercase tracking-widest text-text-muted">Hệ Thống Quản Lý Phòng Gym & PT 1:1</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Hợp Đồng API v1.1 BE • FE • Mobile
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
            Nền tảng vận hành tập luyện <span className="text-gradient-orange">Chuẩn Chuyên Nghiệp</span>
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Hỗ trợ quản lý thẻ tập Gym, điều phối lịch hẹn PT 1:1 theo thời gian thực với quy tắc cắt giờ 4 tiếng,
            soạn giáo án điện tử và quyết toán hoa hồng HLV tự động.
          </p>
        </div>

        <div className="relative z-10 text-xs text-text-muted">
          © 2026 Sports Center Management System. All rights reserved.
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">Đăng nhập tài khoản</h2>
            <p className="mt-1 text-xs text-text-muted">
              Nhập thông tin xác thực để truy cập bảng điều khiển nội bộ
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email hoặc Số điện thoại"
              type="text"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="receptionist@gym.local hoặc manager@gym.local"
              disabled={isLoading}
              autoComplete="username"
            />
            <Input
              label="Mật khẩu"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-text-muted hover:text-text-primary select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-subtle bg-bg-input text-primary focus:ring-focus-ring"
                />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="text-primary hover:text-primary-hover transition-colors font-medium">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
              Đăng nhập ngay
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
