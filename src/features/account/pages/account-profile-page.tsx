import { useEffect, useState } from 'react'
import { Check, Mail, Phone, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import type { UpdateProfilePayload } from '@/features/auth/types/auth.types'
import { authService } from '@/features/auth/services/auth.service'

export function AccountProfilePage() {
  const { user, role, isLoading, updateUserProfile } = useAuth()
  const [form, setForm] = useState<UpdateProfilePayload>({})
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName, phone: user.phone, avatarUrl: user.avatarUrl || '' })
  }, [user])

  if (!user) return null

  const update = (key: keyof UpdateProfilePayload, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaved(false)
    setError('')
    try {
      await updateUserProfile(form)
      setSaved(true)
    } catch {
      setError('Không thể cập nhật thông tin. Vui lòng thử lại.')
    }
  }

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordMessage('')
    try {
      await authService.changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setPasswordMessage('Đã đổi mật khẩu thành công.')
    } catch {
      setPasswordMessage('Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Tài khoản</p>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Thông tin tài khoản</h1>
        <p className="mt-1 text-sm text-text-muted">Quản lý thông tin cá nhân và tùy chọn tài khoản của bạn.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <img src={user.avatarUrl || '/favicon.svg'} alt={user.fullName} className="h-24 w-24 rounded-3xl border-4 border-primary/15 object-cover shadow-sm" />
            <h2 className="mt-4 text-lg font-bold text-text-primary">{user.fullName}</h2>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" /> {role}</p>
            <span className="mt-4 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600">Tài khoản đang hoạt động</span>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-border-subtle pb-4">
            <UserRound className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-text-primary">Thông tin cá nhân</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-text-muted">Họ và tên</span><input value={form.fullName || ''} onChange={(e) => update('fullName', e.target.value)} className="w-full rounded-xl border border-border-subtle bg-bg-surface-muted px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" required /></label>
            <label className="space-y-1.5"><span className="text-xs font-semibold text-text-muted">Email</span><div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface-muted px-3.5 py-2.5 text-sm text-text-muted"><Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{user.email}</span></div></label>
            <label className="space-y-1.5"><span className="text-xs font-semibold text-text-muted">Số điện thoại</span><div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface-muted px-3.5 py-2.5"><Phone className="h-4 w-4 shrink-0 text-text-muted" /><input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none" /></div></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-text-muted">URL ảnh đại diện</span><input value={form.avatarUrl || ''} onChange={(e) => update('avatarUrl', e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-border-subtle bg-bg-surface-muted px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          </div>
          {saved && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600"><Check className="h-4 w-4" /> Đã cập nhật thông tin tài khoản.</p>}
          {error && <p className="mt-4 text-xs font-semibold text-danger">{error}</p>}
          <div className="mt-6 flex justify-end"><button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" /> {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
        </form>

        <form onSubmit={handlePasswordChange} className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm sm:p-6 lg:col-start-2">
          <div className="mb-5 flex items-center gap-2 border-b border-border-subtle pb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-text-primary">Bảo mật tài khoản</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-xs font-semibold text-text-muted">Mật khẩu hiện tại</span><input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords((value) => ({ ...value, currentPassword: e.target.value }))} className="w-full rounded-xl border border-border-subtle bg-bg-surface-muted px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" required /></label>
            <label className="space-y-1.5"><span className="text-xs font-semibold text-text-muted">Mật khẩu mới</span><input type="password" minLength={8} value={passwords.newPassword} onChange={(e) => setPasswords((value) => ({ ...value, newPassword: e.target.value }))} className="w-full rounded-xl border border-border-subtle bg-bg-surface-muted px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" required /></label>
          </div>
          {passwordMessage && <p className="mt-4 text-xs font-semibold text-text-muted">{passwordMessage}</p>}
          <div className="mt-5 flex justify-end"><button type="submit" className="rounded-xl border border-border-subtle px-4 py-2.5 text-xs font-bold text-text-primary transition hover:bg-bg-surface-muted">Đổi mật khẩu</button></div>
        </form>
      </div>
    </div>
  )
}
