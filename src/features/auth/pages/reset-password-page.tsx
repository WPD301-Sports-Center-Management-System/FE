import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { authService } from '@/features/auth/services/auth.service'
import { isAppApiError } from '@/shared/api/api-error'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const resetToken = (searchParams.get('token') || searchParams.get('resetToken') || '').trim()
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!resetToken) {
      setErrorMessage('Liên kết đặt lại mật khẩu không có mã xác thực.')
      return
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setErrorMessage('Mật khẩu mới phải có từ 8 đến 128 ký tự.')
      return
    }
    if (newPassword !== confirmation) {
      setErrorMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await authService.resetPassword({ resetToken, newPassword })
      setIsComplete(true)
    } catch (error) {
      setErrorMessage(
        isAppApiError(error)
          ? error.message
          : 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app p-6 text-text-primary">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border-subtle bg-bg-surface p-8 shadow-2xl">
        {isComplete ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-xl font-bold">Đã đặt lại mật khẩu</h1>
            <p className="text-sm text-text-muted">Hãy đăng nhập bằng mật khẩu mới.</p>
            <Link to="/login" className="inline-block text-primary hover:underline">Quay lại đăng nhập</Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
              <p className="mt-1 text-sm text-text-muted">Nhập mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            {!resetToken && (
              <p className="text-sm text-danger">Liên kết không có mã xác thực. Hãy yêu cầu liên kết mới.</p>
            )}
            {errorMessage && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resetToken && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Mật khẩu mới"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                />
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                  Hiện mật khẩu
                </label>
                <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>
                  Đặt mật khẩu mới
                </Button>
              </form>
            )}
            <Link to={resetToken ? '/login' : '/forgot-password'} className="inline-block text-sm text-primary hover:underline">
              {resetToken ? 'Quay lại đăng nhập' : 'Yêu cầu liên kết mới'}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
