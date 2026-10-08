import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Dumbbell, Shield, UserCheck, Award } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import type { UserRole } from '@/shared/types/api'

export function LoginPage() {
  const { login, switchRoleDemo } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('manager@sports.local')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await login({ email, password })
      navigate('/manager')
    } catch {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickDemo = (role: UserRole, targetPath: string) => {
    switchRoleDemo(role)
    navigate(targetPath)
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[#070a11] text-slate-100">
      {/* Left Column: Hero Banner */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex overflow-hidden bg-slate-950 border-r border-slate-800">
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-radial-blue pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 shadow-lg shadow-orange-600/40">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">SPORTS CENTER</h2>
            <p className="text-xs uppercase tracking-widest text-slate-400">Hệ Thống Quản Lý Phòng Gym & PT 1:1</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
            Hợp Đồng API v1.1 BE • FE • Mobile
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Nền tảng vận hành tập luyện <span className="text-gradient-orange">Chuẩn Chuyên Nghiệp</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Hỗ trợ quản lý thẻ tập Gym, điều phối lịch hẹn PT 1:1 theo thời gian thực với quy tắc cắt giờ 4 tiếng,
            soạn giáo án điện tử và quyết toán hoa hồng HLV tự động.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2026 Sports Center Management System. All rights reserved.
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Đăng nhập tài khoản</h2>
            <p className="mt-1 text-xs text-slate-400">
              Nhập thông tin xác thực để truy cập bảng điều khiển nội bộ
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email hoặc Số điện thoại"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@sports.local"
            />
            <Input
              label="Mật khẩu"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900" />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="text-orange-400 hover:text-orange-300 transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Đăng nhập ngay
            </Button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Truy cập nhanh (Chế độ Demo):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('MANAGER', '/manager')}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center hover:border-orange-500/40 hover:bg-slate-850 transition-colors"
              >
                <Shield className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-semibold text-slate-200">Quản lý</span>
                <span className="text-[10px] text-slate-500">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('RECEPTIONIST', '/receptionist')}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center hover:border-sky-500/40 hover:bg-slate-850 transition-colors"
              >
                <UserCheck className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-semibold text-slate-200">Lễ tân</span>
                <span className="text-[10px] text-slate-500">Receptionist</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('COACH', '/coach')}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center hover:border-emerald-500/40 hover:bg-slate-850 transition-colors"
              >
                <Award className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">HLV</span>
                <span className="text-[10px] text-slate-500">Coach</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
