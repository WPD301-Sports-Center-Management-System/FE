import { useState } from 'react'
import { WeeklySchedulePicker } from '@/features/workspace/weekly-schedule-picker'
import { WEEK_DAYS, minuteClock, type WeeklySlot } from '@/features/workspace/weekly-schedule'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { Btn, Card, ErrorBox, Field, InlineError, Segmented, Skeleton, inputCls, useFlash } from '@/features/workspace/ui'
import { centerDate, formatDateTime } from '@/shared/utils/date'
import { SESSION_LABEL } from '@/features/workspace/utils'

type Tool = 'MOVE_ONE' | 'SCHEDULE_PENDING' | 'ABSENCES'
type Item = { bookingId?: string; creditId?: string; startsAt: string; endsAt: string; available: boolean; reason?: string | null }
type Absence = { id: string; absenceId?: string | null; awaitingConfirmation?: boolean; plannedStartsAt: string; cancelledAt: string; replacements: { id: string; plannedStartsAt: string; status: string }[] }
type SchedulingStatus = { allowance: { used: number; remaining: number; limit: number }; expectedCompletionAt: string | null; absences: Absence[] }
type Pkg = { id: string; purchaseCode: string; memberName: string; status: string }
const tools = [{ key: 'MOVE_ONE' as const, label: 'Đổi giờ buổi tập' }, { key: 'ABSENCES' as const, label: 'Nghỉ & học bù' }, { key: 'SCHEDULE_PENDING' as const, label: 'Xếp lịch bổ sung' }]

export function ScheduleTools({ initialPurchaseId = '', initialAbsenceId = '', initialTool = 'MOVE_ONE', onChanged }: { initialPurchaseId?: string; initialAbsenceId?: string; initialTool?: Tool; onChanged?: () => void } = {}) {
  const [purchaseId, setPurchase] = useState(initialPurchaseId)
  const [tool, setTool] = useState<Tool>(initialTool)
  const [absenceId, setAbsence] = useState(initialAbsenceId)
  const [sourceDate, setSourceDate] = useState('')
  const [sourceBooking, setSourceBooking] = useState(''), [makeupTime, setMakeupTime] = useState('')
  const [bookingId, setBooking] = useState(''), [time, setTime] = useState('')
  const [startDate, setStart] = useState(centerDate()), [weekly, setWeekly] = useState<WeeklySlot[]>([]), [note, setNote] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const packages = useLoad(() => hybridGet<Pkg[]>('/coaches/me/pt-packages', { limit: 100 }))
  const sessions = useLoad(() => hybridGet<{ id: string; plannedStartsAt: string }[]>('/coaches/me/pt-bookings', { purchaseId, status: 'CONFIRMED', limit: 100 }), [purchaseId, tool], !!purchaseId && tool === 'MOVE_ONE')
  const status = useLoad(() => hybridGet<SchedulingStatus>(`/pt-package-purchases/${purchaseId}/scheduling-status`), [purchaseId], !!purchaseId)
  const slots = useLoad(() => hybridGet<{ day: string; slots: Item[] }>(`/pt-bookings/${bookingId}/reschedule-slots`), [bookingId], !!bookingId && tool === 'MOVE_ONE')
  const act = useSubmit(), { flash, node } = useFlash()
  const pkg = packages.data?.find(p => p.id === purchaseId)
  const absenceView = initialTool === 'ABSENCES'
  const reset = () => { setItems([]); act.clear() }
  const changeTool = (next: Tool) => { if (act.busy) return; setTool(next); setAbsence(''); setSourceDate(''); setSourceBooking(''); setMakeupTime(''); setBooking(''); setTime(''); setWeekly([]); setNote(''); reset() }
  const openMakeup = (a: Absence) => {
    changeTool('SCHEDULE_PENDING'); setAbsence(a.absenceId ?? ''); setSourceDate(a.plannedStartsAt); setSourceBooking(a.id)
    const lastDay = status.data?.expectedCompletionAt ? centerDate(status.data.expectedCompletionAt) : ''
    setStart(lastDay >= centerDate() ? new Date(Date.parse(lastDay) + 86400000).toISOString().slice(0, 10) : centerDate())
  }
  const send = () => void act.run(async () => {
    await hybridSend('post', '/pt-schedule-changes', { purchaseId, absenceId: tool === 'SCHEDULE_PENDING' ? absenceId || undefined : undefined, note: note.trim() || undefined, items: items.map(({ bookingId, creditId, startsAt, endsAt }) => ({ bookingId, creditId, startsAt, endsAt })) })
    setItems([]); setWeekly([]); setNote(''); if (absenceView) setTool('ABSENCES')
    flash('Đã gửi đề xuất lịch. Học viên cần xác nhận để hoàn tất.'); await status.reload(); onChanged?.()
  })
  const title = absenceView ? tool === 'ABSENCES' ? 'Nghỉ & học bù' : 'Xếp lịch học bù' : 'Điều chỉnh lịch tập'
  return <div className="space-y-4">{node}
    <Card title={title} subtitle={absenceView ? 'Theo dõi buổi nghỉ và lịch học bù của học viên.' : 'Lịch mới có hiệu lực sau khi học viên xác nhận.'}
      actions={!absenceView && <Segmented label="Thao tác lịch tập" value={tool} onChange={changeTool} items={tools} />}>
      <div className="space-y-4">
        {packages.error ? <ErrorBox message={packages.error} onRetry={() => void packages.reload()} /> : packages.loading ? <Skeleton rows={1} /> : !initialPurchaseId ? <Field label="Học viên và gói tập"><select disabled={act.busy} className={inputCls} value={purchaseId} onChange={e => { setPurchase(e.target.value); changeTool(initialTool) }}>
          <option value="">Chọn học viên và gói tập</option>{packages.data?.filter(p => ['ACTIVE', 'PAUSED'].includes(p.status)).map(p => <option key={p.id} value={p.id}>{p.memberName} · {p.purchaseCode}</option>)}
        </select></Field> : pkg && <p className="text-sm font-medium">{pkg.memberName} · {pkg.purchaseCode}</p>}
        {!purchaseId ? <p className="text-sm text-text-muted">Chọn gói tập để xem thông tin và điều chỉnh lịch.</p> : status.loading ? <Skeleton rows={2} /> : status.error ? <ErrorBox message={status.error} onRetry={() => void status.reload()} /> : <>
          {status.data && tool === 'ABSENCES' && <p role="status" className="text-sm">Số lượt nghỉ theo chính sách: <strong>{status.data.allowance.used}/{status.data.allowance.limit}</strong> · Còn {status.data.allowance.remaining} lượt.
            {status.data.expectedCompletionAt && <span className="mt-1 block text-text-muted">Dự kiến hoàn tất gói: {formatDateTime(status.data.expectedCompletionAt)}</span>}</p>}
          {absenceView && tool !== 'ABSENCES' && <Btn variant="ghost" size="sm" disabled={act.busy} onClick={() => changeTool('ABSENCES')}>← Quay lại danh sách nghỉ</Btn>}
          {tool === 'ABSENCES' && <div className="divide-y divide-border-subtle">
            {!status.data?.absences.length && <p className="py-4 text-sm text-text-muted">Chưa có buổi nghỉ được ghi nhận.</p>}
            {status.data?.absences.map(a => <section key={a.id} className="space-y-2 py-4 text-sm">
              <p className="font-medium">Buổi nghỉ: {formatDateTime(a.plannedStartsAt)}</p>
              {a.replacements.length ? a.replacements.map(r => <p key={r.id}>Lịch học bù: {formatDateTime(r.plannedStartsAt)} · {SESSION_LABEL[r.status] ?? 'Đã xếp lịch'}</p>) : a.awaitingConfirmation ? <p className="text-text-muted">Đang chờ học viên xác nhận lịch học bù.</p> : <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-text-muted">Chưa xếp lịch học bù. Buổi tập được giữ lại.</p><Btn size="sm" disabled={pkg?.status === 'PAUSED'} onClick={() => openMakeup(a)}>Xếp lịch học bù</Btn></div>}
              <details><summary className="cursor-pointer text-xs text-text-muted">Chi tiết báo nghỉ</summary><p className="mt-2 text-xs text-text-muted">Thời điểm báo nghỉ: {formatDateTime(a.cancelledAt)}</p></details>
            </section>)}
          </div>}
          {tool !== 'ABSENCES' && <fieldset disabled={act.busy || pkg?.status === 'PAUSED'} className="space-y-4">
            {tool === 'MOVE_ONE' && <>
              <Field label="Buổi cần đổi"><select className={inputCls} value={bookingId} onChange={e => { setBooking(e.target.value); setTime(''); reset() }}><option value="">Chọn buổi tập</option>{sessions.data?.map(s => <option key={s.id} value={s.id}>{formatDateTime(s.plannedStartsAt)}</option>)}</select></Field><InlineError message={sessions.error} />
              {bookingId && <><Field label={`Giờ mới${slots.data ? ' · ngày ' + slots.data.day : ''}`}><select disabled={slots.loading} className={inputCls} value={time} onChange={e => { const value = e.target.value; setTime(value); const selected = slots.data?.slots.find(s => s.startsAt === value); setItems(selected ? [{ ...selected, bookingId }] : []); act.clear() }}><option value="">{slots.loading ? 'Đang tìm giờ trống…' : 'Chọn giờ trống trong ngày'}</option>{slots.data?.slots.map(s => <option key={s.startsAt} value={s.startsAt}>{formatDateTime(s.startsAt)}</option>)}</select></Field><InlineError message={slots.error} /></>}
            </>}
            {tool === 'SCHEDULE_PENDING' && <>
              {sourceDate && <p className="text-sm font-medium">Xếp bù cho buổi nghỉ: {formatDateTime(sourceDate)}</p>}
              <p className="text-sm text-text-muted">Buổi học bù được xếp sau buổi cuối của gói. Chọn ngày và giờ, sau đó kiểm tra lịch trống.</p>
              <div className={sourceBooking ? 'grid gap-3 sm:grid-cols-2' : ''}><Field label={sourceBooking ? 'Ngày học bù' : 'Ngày bắt đầu xếp lịch'}><input type="date" min={centerDate()} className={inputCls} value={startDate} onChange={e => { setStart(e.target.value); reset() }} /></Field>
                {sourceBooking && <Field label="Giờ bắt đầu"><input type="time" className={inputCls} value={makeupTime} onChange={e => { setMakeupTime(e.target.value); reset() }} /></Field>}</div>
              {!sourceBooking && <WeeklySchedulePicker mode="pattern" verified={false} maxDays={6} value={weekly} onChange={v => { setWeekly(v); reset() }} slots={WEEK_DAYS.flatMap(weekday => Array.from({ length: 34 }, (_, i) => ({ weekday, startTime: minuteClock(300 + i * 30), available: true })))} />}
              {!items.length && <Btn busy={act.busy} disabled={!startDate || (sourceBooking ? !makeupTime : !weekly.length || weekly.some(v => !v.startTime))} onClick={() => void act.run(async () => { const pattern = sourceBooking ? [{ weekday: new Date(`${startDate}T00:00:00Z`).getUTCDay() || 7, startTime: makeupTime }] : weekly; const r = await hybridSend<{ items: Item[]; cadenceError?: string | null }>('post', `/pt-package-purchases/${purchaseId}/schedule-preview`, { tool, absenceId: absenceId || undefined, bookingId: sourceBooking || undefined, startDate, pattern }); if (r.cadenceError) throw new Error(r.cadenceError); setItems(r.items) })}>Kiểm tra lịch trống</Btn>}
            </>}
            {items.length > 0 && <div className="space-y-3 border-t border-border-subtle pt-4"><p className="text-sm font-medium">Lịch đề xuất</p>{items.map((i, n) => <p key={n} className="text-sm">{formatDateTime(i.startsAt)} · {i.available ? 'Còn trống' : i.reason ?? 'Vui lòng chọn giờ khác'}</p>)}
              <details><summary className="cursor-pointer text-sm text-text-muted">Thêm lời nhắn cho học viên</summary><div className="mt-2"><Field label="Lời nhắn (không bắt buộc)"><input className={inputCls} value={note} onChange={e => setNote(e.target.value)} /></Field></div></details>
              <Btn variant="primary" busy={act.busy} disabled={items.some(i => !i.available)} onClick={send}>Gửi đề xuất cho học viên</Btn>
            </div>}
          </fieldset>}
        </>}
        <InlineError message={act.error} />
      </div>
    </Card>
    {pkg?.status === 'PAUSED' && <Card title="Gói tập đang bảo lưu"><p className="mb-3 text-sm text-text-muted">Tiếp tục gói tập để có thể xếp lịch mới. Các buổi chưa sử dụng được giữ lại.</p><Btn busy={act.busy} onClick={() => void act.run(async () => { await hybridSend('post', '/pt-package-purchases/' + pkg.id + '/resume', {}); await packages.reload(); await status.reload(); onChanged?.() })}>Tiếp tục gói tập</Btn><InlineError message={act.error} /></Card>}
  </div>
}
