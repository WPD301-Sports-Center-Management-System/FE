import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { useAuth } from '../context/auth-context'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { isAppApiError } from '@/shared/api/api-error'

export function ChangePasswordPage() {
  const { role, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNext] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)
    if (newPassword !== confirmation) { setError('Mật khẩu xác nhận không khớp.'); return }
    setBusy(true)
    try {
      await authService.changePassword({ currentPassword, newPassword })
      // The auth guard may redirect as soon as logout clears the user, before navigate runs.
      try { sessionStorage.setItem('sc_password_changed', '1') } catch { /* Router state remains the fallback. */ }
      await logout()
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    } catch (err) {
      setError(isAppApiError(err) ? err.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.')
    } finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-bg-app px-4 py-10 text-text-primary">
    <div className="mx-auto max-w-md space-y-6">
      <Link to={`/${role?.toLowerCase() ?? ''}`} className="text-sm underline">Về không gian làm việc</Link>
      <div><p className="mb-2 text-sm font-semibold">APEXFIT · Tài khoản</p><h1 className="text-2xl font-semibold">Đổi mật khẩu</h1><p className="mt-2 text-sm text-text-muted">Sau khi đổi mật khẩu, hãy đăng nhập lại bằng mật khẩu mới.</p></div>
      <form onSubmit={event => void submit(event)} className="space-y-5 rounded-xl border border-border-subtle bg-bg-surface p-5">
        <fieldset disabled={busy} className="space-y-5">
          <Input label="Mật khẩu hiện tại" type="password" autoComplete="current-password" required minLength={8} maxLength={128} value={currentPassword} onChange={event => setCurrent(event.target.value)} />
          <Input label="Mật khẩu mới" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={newPassword} onChange={event => setNext(event.target.value)} />
          <Input label="Xác nhận mật khẩu mới" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Đang đổi mật khẩu…' : 'Lưu mật khẩu mới'}</Button>
        </fieldset>
      </form>
    </div>
  </main>
}
