import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { authService } from '@/features/auth/services/auth.service'
import { isAppApiError } from '@/shared/api/api-error'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await authService.forgotPassword({ email: trimmedEmail })
      setIsSent(true)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không tìm thấy tài khoản với email này.')
      } else {
        setErrorMessage('Không thể gửi yêu cầu. Vui lòng kiểm tra lại kết nối mạng.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app p-6 text-text-primary">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-8 shadow-2xl backdrop-blur-xl">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại đăng nhập</span>
        </Link>

        {isSent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Đã gửi hướng dẫn</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến email <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
            </p>
            <Button variant="outline" className="w-full mt-4" onClick={() => setIsSent(false)}>
              Gửi lại yêu cầu khác
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">Quên mật khẩu?</h2>
              <p className="mt-1 text-xs text-text-muted">
                Nhập email liên kết với tài khoản của bạn để nhận mã khôi phục
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email đăng ký"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                placeholder="name@sports.local"
                disabled={isLoading}
              />

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
                Gửi liên kết khôi phục
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
