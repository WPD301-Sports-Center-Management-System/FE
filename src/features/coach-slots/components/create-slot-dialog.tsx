import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, Clock, Sparkles } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { STANDARD_TEMPLATE_SLOTS } from '../constants/coach-slot.constants'
import type { CreateSlotInput } from '../types/coach-slot-types'
import type { CoachSlot } from '@/shared/types/api'

interface CreateSlotDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSlotInput) => Promise<void> | void
  initialValues?: Partial<CreateSlotInput>
  offerings: Array<{ id: string; name: string; courseName?: string; status?: string }>
  existingSlots?: CoachSlot[]
  isSubmitting?: boolean
}

export function CreateSlotDialog({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  offerings,
  existingSlots = [],
  isSubmitting = false,
}: CreateSlotDialogProps) {
  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  // Filter approved offerings
  const approvedOfferings = useMemo(() => {
    const approved = offerings.filter((o) => !o.status || o.status === 'APPROVED')
    return approved.length > 0 ? approved : offerings
  }, [offerings])

  const [date, setDate] = useState<string>('')
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(1)
  const [offeringId, setOfferingId] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Find the selected template slot
  const selectedSlot = useMemo(() => {
    return (
      STANDARD_TEMPLATE_SLOTS.find((s) => s.index === selectedSlotIndex) ||
      STANDARD_TEMPLATE_SLOTS[0]!
    )
  }, [selectedSlotIndex])

  // Check if slot on selected date is in the past
  const isPast = useMemo(() => {
    if (!date) return false
    if (date < todayStr) return true
    if (date === todayStr) {
      const [y, m, d] = date.split('-').map(Number)
      const [h, min] = selectedSlot.startTime.split(':').map(Number)
      const slotStart = new Date(y, m - 1, d, h, min, 0, 0)
      return slotStart <= new Date()
    }
    return false
  }, [date, selectedSlot, todayStr])

  // Check if this slot already exists on the selected date (Chống trùng slot)
  const existingConflict = useMemo(() => {
    if (!date || existingSlots.length === 0) return null
    return existingSlots.find((s) => {
      if (s.status === 'CANCELLED') return false
      const sDate = s.startsAt.split('T')[0]
      if (sDate !== date) return false
      const sTime = s.startsAt.substring(11, 16)
      return sTime === selectedSlot.startTime
    })
  }, [date, selectedSlot, existingSlots])

  useEffect(() => {
    if (isOpen) {
      const initDate = initialValues?.date || todayStr
      setDate(initDate)

      // Determine slot index from initialValues
      let slotIdx = initialValues?.slotIndex
      if (!slotIdx && initialValues?.startTime) {
        const found = STANDARD_TEMPLATE_SLOTS.find((s) => s.startTime === initialValues.startTime)
        if (found) slotIdx = found.index
      }
      setSelectedSlotIndex(slotIdx || 1)

      setOfferingId(initialValues?.offeringId || approvedOfferings[0]?.id || '')
      setNote(initialValues?.note || '')
      setErrorMsg(null)
    }
  }, [isOpen, initialValues, approvedOfferings, todayStr])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!date) {
      setErrorMsg('Vui lòng chọn ngày áp dụng.')
      return
    }

    if (isPast) {
      setErrorMsg('Khung giờ này đã ở trong quá khứ. Vui lòng chọn ca hoặc ngày khác.')
      return
    }

    if (existingConflict) {
      setErrorMsg(
        `Trùng lịch: Ca ${selectedSlot.index} ngày ${date} đã tồn tại (Trạng thái: ${existingConflict.status}). Không thể tạo trùng ca!`
      )
      return
    }

    if (!offeringId) {
      setErrorMsg('Vui lòng chọn khóa học giảng dạy.')
      return
    }

    try {
      await onSubmit({
        date,
        slotIndex: selectedSlot.index,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        offeringId,
        note: note.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể mở ca dạy. Ca này có thể đã bị trùng lịch với slot hiện có.'
      setErrorMsg(msg)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mở ca dạy mới (Ca ${selectedSlot.index})`}
      description="Quy chuẩn mỗi ca: 60 phút tập luyện 1:1 + 15 phút buffer nghỉ / ghi chép hồ sơ"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Existing Conflict Warning */}
        {existingConflict && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/60 p-3 text-xs text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Trùng lịch: Ca {selectedSlot.index} ngày {date} đã tồn tại (Trạng thái: <strong>{existingConflict.status}</strong>). Một PT không thể mở 2 ca trùng giờ!
            </span>
          </div>
        )}

        {/* 1. Ngày áp dụng */}
        <Input
          label="Ngày áp dụng"
          type="date"
          min={todayStr}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* 2. Chọn Khung giờ Ca dạy (Slot 1 -> 7) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Khung giờ Ca dạy (Quy chuẩn 7 ca cố định) <span className="text-rose-400">*</span>
          </label>
          <select
            value={selectedSlotIndex}
            onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
          >
            {STANDARD_TEMPLATE_SLOTS.map((slot) => {
              const isConflict = existingSlots.some(
                (s) =>
                  s.status !== 'CANCELLED' &&
                  s.startsAt.split('T')[0] === date &&
                  s.startsAt.substring(11, 16) === slot.startTime
              )
              return (
                <option key={slot.index} value={slot.index}>
                  Ca {slot.index}: {slot.startTime} – {slot.endTime} ({slot.periodLabel}) {isConflict ? '[ĐÃ CÓ CA]' : ''}
                </option>
              )
            })}
          </select>
        </div>

        {/* 3. Slot Visual Preview Card */}
        <div
          className={`rounded-xl border p-3.5 transition-all ${
            existingConflict
              ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
              : isPast
              ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
              : 'border-orange-500/30 bg-orange-950/20 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-orange-400">
                Ca {selectedSlot.index}: {selectedSlot.name}
              </span>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${selectedSlot.colorBadge}`}
              >
                {selectedSlot.periodLabel}
              </span>
            </div>
            {existingConflict ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                Đã có ca ({existingConflict.status})
              </span>
            ) : isPast ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/40">
                Đã qua giờ
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-slate-300">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>
                Tập luyện:{' '}
                <strong className="text-emerald-400 font-semibold">
                  {selectedSlot.startTime} – {selectedSlot.endTime}
                </strong>{' '}
                (60p)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              Buffer: <strong className="text-amber-300">{selectedSlot.bufferTime}</strong> (15p)
            </span>
          </div>
        </div>

        {/* 4. Khóa học giảng dạy (APPROVED) */}
        <Select
          label="Khóa học giảng dạy"
          value={offeringId}
          onChange={(e) => setOfferingId(e.target.value)}
          options={approvedOfferings.map((o) => ({
            value: o.id,
            label: `${o.courseName || o.name} [ĐÃ DUYỆT]`,
          }))}
        />

        {/* 5. Ghi chú (Tùy chọn) */}
        <Input
          label="Ghi chú (tùy chọn)"
          placeholder="Ví dụ: Ưu tiên hội viên mục tiêu tăng cơ, phòng tạ 2..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isPast || !!existingConflict}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              'Đang lưu...'
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Mở Ca {selectedSlot.index}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
