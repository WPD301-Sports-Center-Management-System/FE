import { useState } from 'react'
import { WeeklySchedulePicker } from '@/features/workspace/weekly-schedule-picker'
import { WEEK_DAYS, minuteClock, type WeeklySlot } from '@/features/workspace/weekly-schedule'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { Btn, Card, Field, InlineError, Segmented, inputCls, useFlash } from '@/features/workspace/ui'
import { centerDate, formatDateTime } from '@/shared/utils/date'

type Tool = 'MOVE_ONE' | 'SCHEDULE_PENDING' | 'ABSENCES'
type Item = { bookingId?: string; creditId?: string; startsAt: string; endsAt: string; available: boolean; reason?: string | null }
type SchedulingStatus = { allowance: { used: number; remaining: number; limit: number }; expectedCompletionAt: string | null; absences: { id: string; plannedStartsAt: string; cancelledAt: string; replacements: { id: string; plannedStartsAt: string; status: string }[] }[] }
type Pkg = { id: string; purchaseCode: string; memberName: string; status: string }
const tools = [{ key: 'MOVE_ONE' as const, label: 'Đổi giờ trong ngày' }, { key: 'ABSENCES' as const, label: 'Nghỉ / nối cuối gói' }, { key: 'SCHEDULE_PENDING' as const, label: 'Xếp buổi chờ' }]
export function ScheduleTools({ initialPurchaseId = '', initialAbsenceId = '', initialTool = 'MOVE_ONE', onChanged }: { initialPurchaseId?: string; initialAbsenceId?: string; initialTool?: Tool; onChanged?: () => void } = {}) {
  const [purchaseId, setPurchase] = useState(initialPurchaseId)
  const [tool, setTool] = useState<Tool>(initialTool)
  const [bookingId, setBooking] = useState(''), [time, setTime] = useState(''), [startDate, setStart] = useState(centerDate()), [weekly, setWeekly] = useState<WeeklySlot[]>([]), [note, setNote] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const packages = useLoad(() => hybridGet<Pkg[]>('/coaches/me/pt-packages', { limit: 100 }))
  const sessions = useLoad(() => hybridGet<{ id: string; plannedStartsAt: string }[]>('/coaches/me/pt-bookings', { purchaseId, status: 'CONFIRMED', limit: 100 }), [purchaseId], !!purchaseId)
  const status = useLoad(() => hybridGet<SchedulingStatus>(`/pt-package-purchases/${purchaseId}/scheduling-status`), [purchaseId], !!purchaseId)
  const slots = useLoad(() => hybridGet<{ day: string; slots: Item[] }>(`/pt-bookings/${bookingId}/reschedule-slots`), [bookingId], !!bookingId)
  const act = useSubmit(), { flash, node } = useFlash()
  const pkg = packages.data?.find(p => p.id === purchaseId)
  const reset = () => setItems([])
  const send = () => void act.run(async () => {
    await hybridSend('post', '/pt-schedule-changes', { purchaseId, absenceId: tool === 'SCHEDULE_PENDING' && initialAbsenceId ? initialAbsenceId : undefined, note: note.trim() || undefined, items: items.map(({ bookingId, creditId, startsAt, endsAt }) => ({ bookingId, creditId, startsAt, endsAt })) })
    reset(); flash('Đã gửi đề xuất. Lịch hiện tại giữ nguyên đến khi học viên đồng ý.'); onChanged?.()
  })
  return <div className="space-y-4">{node}
    <Card title="Xếp / đổi lịch" subtitle="Giữ ngày tập đã thống nhất; nghỉ hợp lệ được nối sau buổi cuối gói." actions={<Segmented label="Công cụ" value={tool} onChange={v => { setTool(v); reset() }} items={tools} />}>
      <div className="space-y-4">
        {!initialPurchaseId && <Field label="Gói học viên"><select className={inputCls} value={purchaseId} onChange={e => { setPurchase(e.target.value); setBooking(''); reset() }}><option value="">Chọn gói</option>{packages.data?.filter(p => ['ACTIVE', 'PAUSED'].includes(p.status)).map(p => <option key={p.id} value={p.id}>{p.memberName} · {p.purchaseCode}</option>)}</select></Field>}
        {status.data && <div role="status" className="space-y-1 text-sm"><p>Đã nghỉ hợp lệ: <strong>{status.data.allowance.used}/{status.data.allowance.limit}</strong> · còn {status.data.allowance.remaining} lượt.</p><p>Hoàn thành dự kiến: {status.data.expectedCompletionAt ? formatDateTime(status.data.expectedCompletionAt) : 'Chờ xếp lịch'}</p></div>}
        <InlineError message={status.error} />
        {tool === 'ABSENCES' && <div className="divide-y divide-border-subtle">{status.data?.absences.length === 0 && <p className="text-sm text-text-muted">Chưa có buổi nghỉ hợp lệ.</p>}{status.data?.absences.map(a => <div key={a.id} className="space-y-1 py-3 text-sm"><p>Buổi nghỉ: {formatDateTime(a.plannedStartsAt)}</p><p>Báo lúc: {formatDateTime(a.cancelledAt)}</p>{a.replacements.length ? a.replacements.map(r => <p key={r.id}>Buổi thay thế: {formatDateTime(r.plannedStartsAt)} · {r.status}</p>) : <><p className="text-amber-700">Chưa có lịch nối phù hợp. Quyền buổi được giữ.</p><Btn size="sm" onClick={() => setTool('SCHEDULE_PENDING')}>Xử lý lịch nối còn thiếu</Btn></>}</div>)}</div>}
        {tool === 'MOVE_ONE' && <><Field label="Buổi cần đổi"><select className={inputCls} value={bookingId} onChange={e => { setBooking(e.target.value); setTime(''); reset() }}><option value="">Chọn buổi</option>{sessions.data?.map(s => <option key={s.id} value={s.id}>{formatDateTime(s.plannedStartsAt)}</option>)}</select></Field><Field label={`Giờ mới${slots.data ? ' · ngày ' + slots.data.day : ''}`}><select className={inputCls} value={time} onChange={e => { setTime(e.target.value); reset() }}><option value="">Chọn giờ trống trong ngày</option>{slots.data?.slots.map(s => <option key={s.startsAt} value={s.startsAt}>{formatDateTime(s.startsAt)}</option>)}</select></Field><InlineError message={slots.error} /><Btn disabled={!time || pkg?.status === 'PAUSED'} onClick={() => { const selected = slots.data?.slots.find(s => s.startsAt === time); if (selected) setItems([{ ...selected, bookingId }]) }}>Xem giờ đề xuất</Btn></>}
        {tool === 'SCHEDULE_PENDING' && <><p className="text-sm text-text-muted">Buổi nghỉ hợp lệ phải xếp sau buổi cuối gói. Hệ thống kiểm tra lịch trống, buffer và tối đa 6 buổi/tuần.</p><Field label="Bắt đầu xếp từ"><input type="date" min={centerDate()} className={inputCls} value={startDate} onChange={e => { setStart(e.target.value); reset() }} /></Field><WeeklySchedulePicker mode="pattern" verified={false} maxDays={6} value={weekly} onChange={v => { setWeekly(v); reset() }} slots={WEEK_DAYS.flatMap(weekday => Array.from({ length: 34 }, (_, i) => ({ weekday, startTime: minuteClock(300 + i * 30), available: true })))} /><Btn busy={act.busy} disabled={!purchaseId || pkg?.status === 'PAUSED' || !weekly.length || weekly.some(v => !v.startTime)} onClick={() => void act.run(async () => { const r = await hybridSend<{ items: Item[]; cadenceError?: string | null }>('post', `/pt-package-purchases/${purchaseId}/schedule-preview`, { tool, absenceId: initialAbsenceId || undefined, startDate, pattern: weekly }); if (r.cadenceError) throw new Error(r.cadenceError); setItems(r.items) })}>Xem trước lịch</Btn></>}
        {items.length > 0 && <div className="space-y-3 border-t border-border-subtle pt-4">{items.map((i, n) => <p key={n} className="text-sm">{formatDateTime(i.startsAt)} · {i.available ? 'Khả dụng' : i.reason ?? 'Cần chọn lại'}</p>)}<Field label="Ghi chú (không bắt buộc)"><input className={inputCls} value={note} onChange={e => setNote(e.target.value)} /></Field><Btn variant="primary" busy={act.busy} disabled={items.some(i => !i.available)} onClick={send}>Gửi đề xuất cho học viên</Btn></div>}
        <InlineError message={act.error} />
      </div>
    </Card>
    {pkg && <Card title="Bảo lưu / mất liên lạc" subtitle="Bảo lưu theo nhu cầu nghỉ do Manager xử lý; không thay thế giới hạn 6 lượt nghỉ."><ContactTools key={pkg.id} pkg={pkg} onDone={() => { void packages.reload(); onChanged?.() }} /></Card>}
  </div>
}
function ContactTools({ pkg, onDone }: { pkg: Pkg; onDone: () => void }) {
  const [note, setNote] = useState('')
  const act = useSubmit()
  const contact = useLoad(() => hybridGet<{ hasNoShow: boolean; canPause: boolean; eligibleAt: string | null }>(`/pt-package-purchases/${pkg.id}/contact-status`), [pkg.id])
  const run = (path: string, body: object) => void act.run(async () => { await hybridSend('post', `/pt-package-purchases/${pkg.id}/${path}`, body); await contact.reload(); onDone() })
  return <div className="space-y-3"><p className="text-sm text-text-muted">{pkg.status === 'PAUSED' ? 'Gói đang bảo lưu. Mở lại để xếp buổi chờ theo lịch trống hiện tại.' : 'Chỉ tạm ngưng mất liên lạc khi hệ thống xác nhận đủ điều kiện.'}</p>{pkg.status === 'PAUSED' ? <Btn busy={act.busy} onClick={() => run('resume', {})}>Mở lại gói</Btn> : <><Field label="Căn cứ liên hệ"><input className={inputCls} value={note} onChange={e => setNote(e.target.value)} /></Field><div className="flex flex-wrap gap-2"><Btn busy={act.busy} disabled={!note.trim() || !contact.data?.hasNoShow} onClick={() => run('contact-attempts', { outcome: 'NO_RESPONSE', note: note.trim() })}>Đã liên hệ, chưa phản hồi</Btn><Btn busy={act.busy} disabled={!note.trim()} onClick={() => run('contact-attempts', { outcome: 'CONTACTED', note: note.trim() })}>Đã liên lạc được</Btn><Btn busy={act.busy} disabled={!note.trim() || !contact.data?.canPause} onClick={() => run('pause', { kind: 'UNREACHABLE', note: note.trim() })}>Tạm ngưng do mất liên lạc</Btn></div></>}<InlineError message={act.error || contact.error} /></div>
}
