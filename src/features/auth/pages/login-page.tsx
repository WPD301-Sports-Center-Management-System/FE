import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Dumbbell, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { isAppApiError } from '@/shared/api/api-error'
import { isPathAllowedForRole } from '@/features/auth/guards/auth-guards'
import type { UserRole } from '@/shared/types/api'

function LoginVideo() {
  const video = useRef<HTMLVideoElement>(null)
  const [motion, setMotion] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!window.matchMedia) return
    const desktop = window.matchMedia('(min-width: 1024px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMotion(desktop.matches && !reduced.matches)
    update()
    desktop.addEventListener('change', update)
    reduced.addEventListener('change', update)
    return () => { desktop.removeEventListener('change', update); reduced.removeEventListener('change', update) }
  }, [])
  useEffect(() => {
    const pause = () => { if (document.hidden) video.current?.pause() }
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])
  return <div className="absolute inset-0 overflow-hidden bg-neutral-900">
    {motion && !failed ? <video ref={video} src="/landing/training.mp4" poster="/landing/gym.jpg" autoPlay muted loop playsInline preload="metadata" aria-label="Video minh họa tập luyện" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <img src="/landing/gym.jpg" alt="" className="h-full w-full object-cover" />}
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/65" />
    {motion && !failed && <button type="button" onClick={() => { const player = video.current; if (!player) return; if (player.paused) void player.play().catch(() => undefined); else player.pause() }} className="absolute bottom-8 right-8 min-h-11 rounded-lg bg-black/75 px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-white">{playing ? 'Tạm dừng video' : 'Phát video'}</button>}
  </div>
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [passwordChanged] = useState(() => {
    try { return sessionStorage.getItem('sc_password_changed') === '1' } catch { return false }
  })
  useEffect(() => { try { sessionStorage.removeItem('sc_password_changed') } catch { /* Storage can be disabled. */ } }, [])

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const identifierRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [invalidField, setInvalidField] = useState<'identifier' | 'password' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRedirectAfterLogin = (role: UserRole) => {
    const target = (location.state as { from?: { pathname: string; search?: string } })?.from
    const from = target?.pathname
    if (from && isPathAllowedForRole(from, role)) {
      navigate({ pathname: from, search: target?.search?.startsWith('?') ? target.search : '' }, { replace: true })
      return
    }

    switch (role) {
      case 'RECEPTIONIST':
        navigate('/receptionist', { replace: true })
        break
      case 'COACH':
        navigate('/coach', { replace: true })
        break
      case 'MEMBER':
        navigate('/member', { replace: true })
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
      setInvalidField('identifier')
      identifierRef.current?.focus()
      return
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.')
      setInvalidField('password')
      passwordRef.current?.focus()
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setInvalidField(null)

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
    <div className="grid min-h-dvh grid-cols-1 bg-bg-app text-text-primary lg:grid-cols-2">
      <aside className="relative hidden flex-col overflow-hidden border-r border-border-subtle bg-neutral-900 p-12 text-white lg:flex">
        <LoginVideo />
        <Link to="/" className="relative flex items-center gap-3 text-xl font-bold"><Dumbbell aria-hidden className="h-8 w-8 text-orange-400" />ApexFIT</Link>
        <div className="relative my-auto w-full max-w-2xl space-y-6 py-10">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Mỗi buổi tập,<br />một bước tiến.</h2>
          <p className="text-base leading-relaxed text-white/90">Lịch tập, học viên và công việc tại trung tâm — cùng một nơi.</p>
        </div>
        <p className="relative pr-36 text-sm text-white/80">ApexFIT · Phòng gym & huấn luyện cá nhân</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-bold lg:hidden"><Dumbbell aria-hidden className="h-6 w-6 text-primary" />ApexFIT</Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập tài khoản</h1>
          </div>
          {errorMessage && (
            <div id="login-error" role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {(passwordChanged || (location.state as { passwordChanged?: boolean } | null)?.passwordChanged) && <p role="status" className="mb-4 text-sm text-text-primary">Đã đổi mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.</p>}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              ref={identifierRef}
              label="Email hoặc số điện thoại"
              type="text"
              required
              value={identifier}
              onChange={e => { setIdentifier(e.target.value); setErrorMessage(null); setInvalidField(null) }}
              disabled={isLoading}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={invalidField === 'identifier' || undefined}
              aria-describedby={invalidField === 'identifier' ? 'login-error' : undefined}
            />
            <div className="space-y-2">
              <div className="relative">
              <Input
                ref={passwordRef}
                id="login-password"
                label="Mật khẩu"
                className="pr-12"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => { setPassword(e.target.value.replace(/[^\x20-\x7e]/g, '')); setErrorMessage(null); setInvalidField(null) }}
                disabled={isLoading}
                autoComplete="current-password"
                spellCheck={false}
                aria-invalid={invalidField === 'password' || undefined}
                aria-describedby={invalidField === 'password' ? 'login-error' : undefined}
              />
              <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-controls="login-password" aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)} className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring">{showPassword ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}</button>
              </div>
              <div className="flex justify-end text-sm">
                <Link to="/forgot-password" className="inline-flex min-h-11 items-center rounded-lg px-2 font-medium text-primary hover:underline">Quên mật khẩu?</Link>
              </div>
            </div>
            <Button type="submit" className="min-h-11 w-full" isLoading={isLoading} disabled={isLoading}>Đăng nhập ngay</Button>
          </form>
          <Link to="/" className="inline-flex min-h-11 items-center text-sm text-text-muted hover:text-text-primary">← Về trang chủ</Link>
        </div>
      </main>
    </div>
  )
}
