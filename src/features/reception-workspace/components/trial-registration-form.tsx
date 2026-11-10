import { useCallback, useEffect, useRef, useState } from 'react'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Async, Badge, Btn, EmptyBox, Field, InlineError, inputCls } from '@/features/workspace/ui'
import { deskApi, type PublicCoach, type TrialAllowance, type TrialSession } from '../api'

export interface TrialRegistrationSeed { fullName?: string; phone?: string; coachId?: string | null; id?: string; mode?: 'GYM' | 'PT' | 'BOTH' }
type Mode = 'GYM' | 'BOTH'
const modeHint: Record<Mode, string> = {
  GYM: '3 ngày liên tiếp từ lần check-in gym đầu tiên. Không cần chọn PT.',
  BOTH: 'Gym: 3 ngày từ lần check-in đầu tiên. PT: 3 buổi riêng, không phụ thuộc hạn gym.',
}
const modeLabel: Record<Mode, string> = { GYM: 'Trải nghiệm phòng gym', BOTH: 'Trải nghiệm phòng gym + PT' }

export function TrialRegistrationForm({ seed, onClose, onDone }: { seed: TrialRegistrationSeed; onClose: () => void; onDone: (message: string, session?: TrialSession) => void }) {
  const [phone, setPhone] = useState(seed.phone ?? '')
  const [name, setName] = useState(seed.fullName ?? '')
  const [preferredMode, setMode] = useState<Mode>(seed.mode === 'PT' ? 'BOTH' : seed.mode ?? (seed.coachId ? 'BOTH' : 'GYM'))
  const [coachId, setCoachId] = useState(seed.coachId ?? '')
  const [requestId, setRequestId] = useState(seed.id)
  const [checkedAllowance, setAllowance] = useState<TrialAllowance | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)
  const request = useRef(0)
  const allowance = checkedAllowance
  const normalizedPhone = phone.replace(/\s/g, '').replace(/^(\+84|84)/, '0')
  const validPhone = /^0\d{9}$/.test(normalizedPhone)
  const checkPhone = useCallback(async () => {
    const generation = ++request.current
    setLooking(true); setLookupError(null); setAllowance(null)
    try { const result = await deskApi.trialAllowance(normalizedPhone); if (generation === request.current) setAllowance(result) }
    catch { if (generation === request.current) setLookupError('Không kiểm tra được số điện thoại. Bấm Kiểm tra để thử lại.') }
    finally { if (generation === request.current) setLooking(false) }
  }, [normalizedPhone])
  useEffect(() => {
    const pendingRequest = request
    const timer = validPhone ? window.setTimeout(() => void checkPhone(), 450) : undefined
    return () => { window.clearTimeout(timer); pendingRequest.current++ }
  }, [checkPhone, validPhone, phone])
  const submit = useSubmit()
  const registered = allowance?.registeredTypes ?? []
  const availableModes = (['GYM', 'BOTH'] as const).filter(type => !registered.includes(type === 'BOTH' ? 'PT' : 'GYM'))
  const mode = availableModes.includes(preferredMode) ? preferredMode : availableModes[0] ?? preferredMode
  const coaches = useLoad(() => deskApi.coaches(), [], mode !== 'GYM' && availableModes.length > 0)
  // Existing gym customers add only the missing PT service when upgrading to gym + PT.
  const registrationMode = mode === 'BOTH' && registered.includes('GYM') ? 'PT' : mode
  const duplicate = !availableModes.length
  const gym = allowance?.gym ?? allowance
  const canRegister = !!allowance && (registrationMode === 'PT' ? allowance.pt?.canCheckIn !== false : registrationMode === 'GYM' ? gym?.canRegister : gym?.canRegister && allowance.pt?.canCheckIn !== false)
  return <form className="space-y-5" onSubmit={async e => {
    e.preventDefault()
    if (!canRegister || duplicate) return
    const result = await submit.run(() => deskApi.createTrialSession({ trialRequestId: requestId, fullName: name.trim(), phone, mode: registrationMode, type: mode === 'GYM' ? 'GYM' : 'PT', coachId: mode === 'GYM' ? undefined : coachId }))
    if (result) onDone(registrationMode === 'GYM' ? `Đã đăng ký gym cho ${result.fullName}.` : registrationMode === 'PT' ? 'Đã gửi yêu cầu tập thử đến PT.' : 'Đã đăng ký gym và gửi yêu cầu đến PT.', result)
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Số điện thoại" required><div className="flex gap-2"><input required aria-label="Số điện thoại khách" type="tel"  value={phone} onChange={e => { request.current++; setPhone(e.target.value); setAllowance(null); setLookupError(null); setLooking(false); setRequestId(undefined) }} className={`${inputCls} min-w-0`} /><Btn className="shrink-0" busy={looking} disabled={!validPhone} onClick={() => void checkPhone()}>Kiểm tra</Btn></div></Field>
      <Field label="Họ và tên" required><input required maxLength={180} value={name} onChange={e => setName(e.target.value)} className={inputCls} /></Field>
    </div>

    <InlineError message={lookupError} />
    {allowance && <div role="status" className="space-y-1 rounded-lg bg-bg-surface-muted p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>{allowance.phone}</strong><Badge tone={canRegister && !duplicate ? 'success' : 'neutral'}>{canRegister && !duplicate ? 'Có thể đăng ký' : 'Đã đăng ký / hết quyền trải nghiệm'}</Badge></div>
      <p>Gym: {gym?.startsOn ? `${gym.startsOn} → hết ngày ${gym.expiresOn}.` : '3 ngày liên tiếp từ lần check-in gym đầu tiên.'}</p>
      <p>PT: còn {allowance.pt?.remainingSessions ?? 3}/{allowance.pt?.totalSessions ?? 3} buổi. Quyền PT độc lập với thời hạn gym.</p>
      {registered.length > 0 && <p>Đã đăng ký: {registered.map(t => t === 'GYM' ? 'gym' : 'PT').join(' + ')}. {availableModes.length ? 'Có thể đăng ký thêm dịch vụ chưa trải nghiệm.' : 'Khách quay lại dùng check-in hoặc xếp buổi PT tiếp theo.'}</p>}
    </div>}
    {availableModes.length > 0 ? <Field label="Hình thức tập thử" hint={registrationMode === 'PT' ? 'Bổ sung 3 buổi PT riêng. Không gia hạn hoặc mở lại đợt gym đã hết hạn.' : modeHint[mode]}><select value={mode} onChange={e => { setMode(e.target.value as Mode); setCoachId('') }} className={inputCls}>{availableModes.map(type => <option key={type} value={type}>{modeLabel[type]}</option>)}</select></Field> : <p className="text-sm text-text-muted">Khách đã đăng ký cả gym và PT. Dùng check-in hoặc xếp buổi PT tiếp theo nếu còn quyền trải nghiệm.</p>}
    {mode !== 'GYM' && availableModes.length > 0 && <section className="space-y-3"><div><h4 className="font-semibold">PT khách chọn</h4><p className="mt-1 text-sm text-text-muted">Khách xem hồ sơ và tự chọn. PT tự phản hồi trên ứng dụng sau khi đăng ký.</p></div><Async state={coaches} rows={2} empty={data => !data.length && <EmptyBox title="Chưa có PT để lựa chọn" />}>{data => <CoachPicker coaches={data} value={coachId} onChange={setCoachId} />}</Async></section>}
    <InlineError message={submit.error} />
    <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-4"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!canRegister || duplicate || !name.trim() || (mode !== 'GYM' && !coachId)}>Lưu đăng ký</Btn></div>
  </form>
}

export function CoachPicker({ coaches, value, onChange }: { coaches: PublicCoach[]; value: string; onChange: (value: string) => void }) {
  return <div className="max-h-80 space-y-2 overflow-y-auto">{coaches.map(c => <div key={c.id} className={`rounded-lg border p-3 ${value === c.id ? 'border-primary bg-primary/5' : 'border-border-subtle'}`}>
    <label className="flex cursor-pointer items-start gap-3"><input type="radio" name="trial-coach" aria-label={c.user.fullName} disabled={c.serviceSettings?.acceptingNewMembers === false} value={c.id} checked={value === c.id} onChange={() => onChange(c.id)} className="mt-1" />
      {c.user.avatarUrl && <img src={c.user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />}
      <span className="min-w-0 text-sm"><span className="block font-semibold">{c.user.fullName}</span><span className="mt-0.5 block text-text-muted">{c.specialization || 'Chưa cập nhật chuyên môn'}{c.yearsOfExperience != null ? ` · ${c.yearsOfExperience} năm kinh nghiệm` : ''}</span></span>
    </label>
    {c.serviceSettings?.acceptingNewMembers === false && <p className="ml-6 mt-2 text-sm text-text-muted">Tạm ngừng nhận khách mới</p>}
    <details className="ml-6 mt-2 text-sm"><summary className="cursor-pointer text-text-muted hover:text-text-primary">Xem hồ sơ</summary><div className="mt-2 space-y-1"><p>Chứng chỉ: {c.certification || 'Chưa cập nhật'}</p>{c.bio && <p className="whitespace-pre-wrap">{c.bio}</p>}<p>{c.reviewCount ? `${c.averageRating}/5 · ${c.reviewCount} đánh giá` : 'Chưa có đánh giá'}</p>{c.user.phone && <a href={`tel:${c.user.phone}`} className="block text-primary underline">Gọi PT: {c.user.phone}</a>}</div></details>
  </div>)}</div>
}
