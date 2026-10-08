import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSent(true)
    }, 600)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070a11] p-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại đăng nhập</span>
        </Link>

        {isSent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Đã gửi hướng dẫn</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến email <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
            </p>
            <Button variant="outline" className="w-full mt-4" onClick={() => setIsSent(false)}>
              Gửi lại yêu cầu khác
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Quên mật khẩu?</h2>
              <p className="mt-1 text-xs text-slate-400">
                Nhập email liên kết với tài khoản của bạn để nhận mã khôi phục
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email đăng ký"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sports.local"
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Gửi liên kết khôi phục
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
