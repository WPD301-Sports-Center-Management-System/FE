import { useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { formatWeekdayDateTime, formatTime } from '@/shared/utils/date'
import type { PreviewItem, WeeklySlot } from '../types'
import { ErrorBanner, Field, inputCls, WEEKDAYS } from './ui'

export function SlotsEditor({ value, onChange, durationMinutes }: { value: WeeklySlot[]; onChange: (slots: WeeklySlot[]) => void; durationMinutes?: number }) {
  const update = (i: number, patch: Partial<WeeklySlot>) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  return (
    <div className="space-y-2">
      {value.map((slot, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <Field label="Thứ"><select className={inputCls} value={slot.weekday} onChange={e => update(i, { weekday: Number(e.target.value) })}>{WEEKDAYS.slice(1).map((w, idx) => <option key={w} value={idx + 1}>{w}</option>)}</select></Field>
          <Field label="Giờ bắt đầu"><input type="time" className={inputCls} value={slot.startTime} onChange={e => update(i, { startTime: e.target.value })} /></Field>
          <Field label="Thời lượng (phút)"><input type="number" min={15} max={480} step={15} className={inputCls} readOnly={durationMinutes !== undefined} value={durationMinutes ?? slot.durationMinutes} onChange={e => update(i, { durationMinutes: Number(e.target.value) })} /></Field>
          <Button type="button" variant="ghost" size="sm" aria-label={`Xóa khung ${WEEKDAYS[slot.weekday]}`} onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" aria-hidden /></Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...value, { weekday: 1, startTime: '18:00', durationMinutes: 60 }])}><Plus className="h-4 w-4" aria-hidden />Thêm khung</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([1, 3, 5].map(weekday => ({ weekday, startTime: value[0]?.startTime ?? '18:00', durationMinutes: value[0]?.durationMinutes ?? 60 })))}>Mẫu 2-4-6</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([2, 4, 6].map(weekday => ({ weekday, startTime: value[0]?.startTime ?? '18:00', durationMinutes: value[0]?.durationMinutes ?? 60 })))}>Mẫu 3-5-7</Button>
      </div>
    </div>
  )
}

export const slotText = (s: WeeklySlot) => `${WEEKDAYS[s.weekday]} ${s.startTime} (${s.durationMinutes}′)`

export function ScheduleList({ items, max }: { items: (PreviewItem | { startsAt: string; endsAt: string; seq?: number })[]; max?: number }) {
  const shown = max ? items.slice(0, max) : items
  return (
    <ol className="grid gap-1 sm:grid-cols-2">
      {shown.map((item, i) => {
        const flag = 'available' in item && !item.available ? (item.coachTimeOff ? 'Coach nghỉ' : item.coachBusy ? 'Coach bận' : 'Member bận') : null
        return (
          <li key={i} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm ${flag ? 'border-danger/40 bg-danger/5' : 'border-border-subtle'}`}>
            <span><span className="mr-2 text-xs text-text-muted">#{('seq' in item && item.seq) || i + 1}</span>{formatWeekdayDateTime(item.startsAt)}–{formatTime(item.endsAt)}</span>
            {flag && <span className="text-xs font-semibold text-danger">{flag}</span>}
          </li>
        )
      })}
      {max && items.length > max && <li className="text-xs text-text-muted">… và {items.length - max} buổi nữa</li>}
    </ol>
  )
}

// Confirmation with an optional required reason; shows the server error in place.
export function ReasonDialog({ open, title, description, confirmLabel = 'Xác nhận', requireReason = true, danger, busy, error, onClose, onConfirm, extra }: {
  open: boolean; title: string; description?: ReactNode; confirmLabel?: string; requireReason?: boolean; danger?: boolean; busy: boolean; error: string | null; onClose: () => void; onConfirm: (reason: string) => void; extra?: ReactNode
}) {
  const [reason, setReason] = useState('')
  return (
    <Modal isOpen={open} onClose={() => { if (!busy) { setReason(''); onClose() } }} title={title} maxWidth="lg">
      <div className="space-y-3">
        {description && <div className="text-sm text-text-muted">{description}</div>}
        {extra}
        <Field label={requireReason ? 'Lý do (bắt buộc)' : 'Ghi chú (tùy chọn)'}><textarea className={inputCls} rows={3} maxLength={5000} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} /></Field>
        <ErrorBanner message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => { setReason(''); onClose() }}>Hủy</Button>
          <Button variant={danger ? 'danger' : 'primary'} isLoading={busy} disabled={requireReason && !reason.trim()} onClick={() => onConfirm(reason.trim())}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
