import { useState, useMemo, useEffect } from 'react'
import {
  AlertCircle,
  Sun,
  Moon,
  CheckSquare,
  Square,
  Sparkles,
  Info,
} from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import { STANDARD_TEMPLATE_SLOTS } from '../constants/coach-slot.constants'
import type { QuickBulkCreateSlotsInput } from '../types/coach-slot-types'
import type { CoachSlot } from '@/shared/types/api'

export interface ApprovedOfferingOption {
  id: string
  name: string
  courseName?: string
  status?: string
}

interface QuickSlotGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  offerings: ApprovedOfferingOption[]
  existingSlots?: CoachSlot[]
  onSubmit: (data: QuickBulkCreateSlotsInput) => Promise<void>
  isSubmitting?: boolean
}

const WEEKDAYS = [
  { value: 1, label: 'Thứ 2', short: 'T2' },
  { value: 2, label: 'Thứ 3', short: 'T3' },
  { value: 3, label: 'Thứ 4', short: 'T4' },
  { value: 4, label: 'Thứ 5', short: 'T5' },
  { value: 5, label: 'Thứ 6', short: 'T6' },
  { value: 6, label: 'Thứ 7', short: 'T7' },
  { value: 7, label: 'Chủ nhật', short: 'CN' },
]

export function QuickSlotGeneratorModal({
  isOpen,
  onClose,
  offerings,
  existingSlots = [],
  onSubmit,
  isSubmitting = false,
}: QuickSlotGeneratorModalProps) {
  // Lọc chỉ các khóa học APPROVED (nếu có trường status)
  const approvedOfferings = useMemo(() => {
    return offerings.filter((o) => !o.status || o.status === 'APPROVED')
  }, [offerings])

  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('')
  const [scheduleMode, setScheduleMode] = useState<'single' | 'range'>('single')
  const [singleDate, setSingleDate] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // T2 -> T6
  const [selectedSlotIndexes, setSelectedSlotIndexes] = useState<number[]>([4, 5, 6, 7])
  const [note, setNote] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  // Helper kiểm tra slot có thuộc quá khứ của ngày được chọn không
  const isSlotPast = (slot: (typeof STANDARD_TEMPLATE_SLOTS)[0]) => {
    if (scheduleMode === 'single') {
      if (!singleDate) return false
      if (singleDate < todayStr) return true
      if (singleDate === todayStr) {
        const [y, m, d] = singleDate.split('-').map(Number)
        const [h, min] = slot.startTime.split(':').map(Number)
        const slotStart = new Date(y, m - 1, d, h, min, 0, 0)
        return slotStart <= new Date()
      }
    }
    return false
  }

  // Helper kiểm tra ca đã tồn tại trên lịch chưa (Chống trùng slot)
  const getExistingSlotForShift = (slot: (typeof STANDARD_TEMPLATE_SLOTS)[0]): CoachSlot | null => {
    if (scheduleMode === 'single' && singleDate && existingSlots.length > 0) {
      const found = existingSlots.find((s) => {
        if (s.status === 'CANCELLED') return false
        const sDate = s.startsAt.split('T')[0]
        if (sDate !== singleDate) return false
        const sTime = s.startsAt.substring(11, 16)
        return sTime === slot.startTime
      })
      return found || null
    }
    return null
  }

  // Slot bị disable nếu đã qua giờ hoặc đã được tạo trước đó
  const isSlotDisabled = (slot: (typeof STANDARD_TEMPLATE_SLOTS)[0]) => {
    return isSlotPast(slot) || !!getExistingSlotForShift(slot)
  }

  // Khởi tạo ngày mặc định khi mở modal
  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      const todayString = `${y}-${m}-${d}`

      const twoWeeks = new Date(Date.now() + 14 * 86400000)
      const ty = twoWeeks.getFullYear()
      const tm = String(twoWeeks.getMonth() + 1).padStart(2, '0')
      const td = String(twoWeeks.getDate()).padStart(2, '0')
      const twoWeeksLater = `${ty}-${tm}-${td}`

      setSingleDate(todayString)
      setStartDate(todayString)
      setEndDate(twoWeeksLater)
      if (approvedOfferings[0]) {
        setSelectedOfferingId(approvedOfferings[0].id)
      }

      // Tự động chỉ chọn những slot ca tối chưa bị trùng và chưa qua giờ
      const eveningValid = [4, 5, 6, 7].filter((idx) => {
        const s = STANDARD_TEMPLATE_SLOTS.find((item) => item.index === idx)
        if (!s) return false
        const [h, min] = s.startTime.split(':').map(Number)
        const slotStart = new Date(y, today.getMonth(), today.getDate(), h, min, 0, 0)
        if (slotStart <= new Date()) return false
        // Kiểm tra xem đã có slot chưa
        const conflict = existingSlots.find((item) => {
          if (item.status === 'CANCELLED') return false
          const iDate = item.startsAt.split('T')[0]
          return iDate === todayString && item.startsAt.substring(11, 16) === s.startTime
        })
        return !conflict
      })

      setSelectedSlotIndexes(eveningValid)
      setSelectedDays([1, 2, 3, 4, 5])
      setErrorMessage(null)
    }
  }, [isOpen, approvedOfferings, existingSlots])

  // Tự động bỏ chọn các slot đã bị trùng hoặc đã qua giờ khi đổi ngày hoặc đổi chế độ
  useEffect(() => {
    if (scheduleMode === 'single' && singleDate) {
      setSelectedSlotIndexes((prev) =>
        prev.filter((idx) => {
          const s = STANDARD_TEMPLATE_SLOTS.find((item) => item.index === idx)
          return s ? !isSlotDisabled(s) : true
        })
      )
    }
  }, [singleDate, scheduleMode, todayStr, existingSlots])

  // Presets lựa chọn ca (Tự động lọc bỏ các ca đã qua giờ & ca đã tồn tại)
  const selectMorningSlots = () => {
    const valid = [1, 2].filter((idx) => {
      const s = STANDARD_TEMPLATE_SLOTS.find((item) => item.index === idx)
      return s ? !isSlotDisabled(s) : false
    })
    setSelectedSlotIndexes(valid)
    setErrorMessage(null)
  }

  const selectEveningSlots = () => {
    const valid = [4, 5, 6, 7].filter((idx) => {
      const s = STANDARD_TEMPLATE_SLOTS.find((item) => item.index === idx)
      return s ? !isSlotDisabled(s) : false
    })
    setSelectedSlotIndexes(valid)
    setErrorMessage(null)
  }

  const selectAllSlots = () => {
    const valid = [1, 2, 3, 4, 5, 6, 7].filter((idx) => {
      const s = STANDARD_TEMPLATE_SLOTS.find((item) => item.index === idx)
      return s ? !isSlotDisabled(s) : false
    })
    setSelectedSlotIndexes(valid)
    setErrorMessage(null)
  }

  const clearAllSlots = () => {
    setSelectedSlotIndexes([])
    setErrorMessage(null)
  }

  const toggleSlotIndex = (index: number) => {
    const slot = STANDARD_TEMPLATE_SLOTS.find((s) => s.index === index)
    if (slot && isSlotDisabled(slot)) return // Không cho toggle slot quá khứ hoặc đã tồn tại

    setErrorMessage(null)
    setSelectedSlotIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    )
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  // Tính số lượng ngày thực tế sẽ tạo slot
  const calculatedDaysCount = useMemo(() => {
    if (scheduleMode === 'single') return 1
    if (!startDate || !endDate || endDate < startDate) return 0
    let count = 0
    const cur = new Date(startDate)
    const end = new Date(endDate)
    while (cur <= end) {
      const d = cur.getDay() === 0 ? 7 : cur.getDay()
      if (selectedDays.includes(d)) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  }, [scheduleMode, startDate, endDate, selectedDays])

  const totalSlotsCount = calculatedDaysCount * selectedSlotIndexes.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedOfferingId) {
      setErrorMessage('Vui lòng chọn khóa học được phê duyệt.')
      return
    }

    if (selectedSlotIndexes.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 khung giờ trong 7 ca chuẩn.')
      return
    }

    if (scheduleMode === 'single') {
      if (!singleDate) {
        setErrorMessage('Vui lòng chọn ngày áp dụng.')
        return
      }
      if (singleDate < todayStr) {
        setErrorMessage('Không thể mở ca dạy cho ngày trong quá khứ.')
        return
      }
      // Check if any selected slot is disabled
      const hasConflictSlot = selectedSlotIndexes.some((idx) => {
        const s = STANDARD_TEMPLATE_SLOTS.find((item) => item.index === idx)
        return s ? isSlotDisabled(s) : false
      })
      if (hasConflictSlot) {
        setErrorMessage('Có ca dạy đã tồn tại hoặc đã qua thời gian hiện tại. Vui lòng bỏ chọn ca này.')
        return
      }
    } else {
      if (!startDate || !endDate) {
        setErrorMessage('Vui lòng chọn ngày bắt đầu và kết thúc chu kỳ.')
        return
      }
      if (startDate < todayStr) {
        setErrorMessage('Ngày bắt đầu chu kỳ không được ở trong quá khứ.')
        return
      }
      if (endDate < startDate) {
        setErrorMessage('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.')
        return
      }
      if (selectedDays.length === 0) {
        setErrorMessage('Vui lòng chọn ít nhất 1 ngày trong tuần.')
        return
      }
    }

    try {
      const payload: QuickBulkCreateSlotsInput = {
        courseOfferingId: selectedOfferingId,
        slotIndexes: selectedSlotIndexes,
        note: note.trim() || undefined,
        ...(scheduleMode === 'single'
          ? { date: singleDate }
          : { startDate, endDate, daysOfWeek: selectedDays }),
      }

      await onSubmit(payload)
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể mở khung giờ. Vui lòng kiểm tra trùng lịch.'
      setErrorMessage(msg)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mở khung giờ dạy nhanh (7 Ca Chuẩn 1:1)"
      description="Quy chuẩn mỗi ca: 60 phút tập luyện + 15 phút buffer nghỉ / ghi chép hồ sơ hội viên"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3.5 text-xs text-rose-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Lỗi thao tác:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* 1. Chọn Khóa học đang phụ trách */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">
            Khóa học phụ trách (Chỉ các khóa đã được duyệt - APPROVED) <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-input px-3.5 py-2.5 text-xs text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            >
              {approvedOfferings.length === 0 ? (
                <option value="">-- Chưa có khóa học nào được duyệt --</option>
              ) : (
                approvedOfferings.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.courseName || off.name} [ĐÃ DUYỆT]
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* 2. Chọn hình thức ngày áp dụng */}
        <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-surface-muted p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">Thời gian áp dụng</span>
            <div className="inline-flex rounded-lg bg-bg-surface p-0.5 border border-border-subtle">
              <button
                type="button"
                onClick={() => setScheduleMode('single')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  scheduleMode === 'single'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                1 Ngày duy nhất
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode('range')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  scheduleMode === 'range'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Lặp lại theo tuần
              </button>
            </div>
          </div>

          {scheduleMode === 'single' ? (
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Chọn ngày cụ thể
              </label>
              <input
                type="date"
                min={todayStr}
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Day of week chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-text-muted">
                    Áp dụng cho các ngày trong tuần:
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                      className="text-orange-500 hover:underline"
                    >
                      T2 - T6
                    </button>
                    <span className="text-text-muted/60">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                      className="text-orange-500 hover:underline"
                    >
                      Cả tuần
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.value)
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 text-orange-600 dark:text-orange-300 shadow-xs'
                            : 'bg-bg-surface border-border-subtle text-text-muted hover:border-border-strong'
                        }`}
                      >
                        {day.short}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. 7 Khung giờ cố định chuẩn (Template Slots) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div>
              <span className="text-xs font-semibold text-text-primary">
                Chọn các ca muốn mở ({selectedSlotIndexes.length}/7 ca)
              </span>
              <p className="text-[10px] text-text-muted">
                Đã bao gồm 15 phút buffer giữa các ca để hồi phục &amp; ghi chép (Tự động loại bỏ ca trùng &amp; quá khứ)
              </p>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectMorningSlots}
                className="h-7 text-[11px] px-2.5 gap-1 border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10"
              >
                <Sun className="h-3 w-3" />
                Ca sáng (1, 2)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectEveningSlots}
                className="h-7 text-[11px] px-2.5 gap-1 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10"
              >
                <Moon className="h-3 w-3" />
                Ca tối (4, 5, 6, 7)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAllSlots}
                className="h-7 text-[11px] px-2 text-text-muted hover:text-text-primary"
              >
                Tất cả
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllSlots}
                className="h-7 text-[11px] px-2 text-text-muted hover:text-danger"
              >
                Bỏ chọn
              </Button>
            </div>
          </div>

          {/* Cards for each of the 7 template slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1">
            {STANDARD_TEMPLATE_SLOTS.map((slot) => {
              const isPast = isSlotPast(slot)
              const existingSlot = getExistingSlotForShift(slot)
              const isAlreadyCreated = !!existingSlot
              const isDisabled = isPast || isAlreadyCreated
              const isChecked = !isDisabled && selectedSlotIndexes.includes(slot.index)

              return (
                <div
                  key={slot.index}
                  onClick={() => {
                    if (!isDisabled) toggleSlotIndex(slot.index)
                  }}
                  className={`rounded-xl border p-2.5 transition-all select-none flex items-start gap-2.5 ${
                    isDisabled
                      ? 'border-border-subtle bg-bg-surface-muted/60 opacity-40 cursor-not-allowed'
                      : isChecked
                      ? 'cursor-pointer border-orange-500/80 bg-orange-500/10 ring-1 ring-orange-500/40'
                      : 'cursor-pointer border-border-subtle bg-bg-surface hover:border-border-strong opacity-80 hover:opacity-100'
                  }`}
                  title={
                    isAlreadyCreated
                      ? `Ca này đã được mở (${existingSlot.status}) - Không thể tạo trùng!`
                      : isPast
                      ? 'Ca dạy đã qua thời gian'
                      : undefined
                  }
                >
                  <div className="mt-0.5 text-orange-500">
                    {isDisabled ? (
                      <Square className="h-4 w-4 text-text-muted/40" />
                    ) : isChecked ? (
                      <CheckSquare className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Square className="h-4 w-4 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-xs font-bold truncate ${
                          isDisabled ? 'text-text-muted line-through' : 'text-text-primary'
                        }`}
                      >
                        {slot.name}
                      </span>
                      {isAlreadyCreated ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          Đã có ca ({existingSlot.status})
                        </span>
                      ) : isPast ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-400">
                          Đã qua giờ
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${slot.colorBadge}`}
                        >
                          {slot.periodLabel}
                        </span>
                      )}
                    </div>

                    {/* Workout time & buffer time */}
                    <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-text-muted">
                      <span className={`font-semibold ${isDisabled ? 'text-text-muted' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span className="text-[10px] text-text-muted font-sans">
                        Buffer: {slot.bufferTime}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Note input */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Ghi chú thêm (Tùy chọn)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Ưu tiên hội viên mục tiêu tăng cơ, chuẩn bị dụng cụ..."
            className="w-full rounded-xl border border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* Footer & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-xs text-text-primary">
            <Info className="h-4 w-4 text-orange-500 shrink-0" />
            <span>
              Tổng số khung giờ dự kiến:{' '}
              <strong className="text-orange-500 font-bold text-sm">
                {totalSlotsCount}
              </strong>{' '}
              slot ({selectedSlotIndexes.length} ca × {calculatedDaysCount} ngày)
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs border-border-subtle hover:bg-bg-surface-muted"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || totalSlotsCount === 0}
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-1.5 shadow-md shadow-orange-500/20"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Mở {totalSlotsCount} ca dạy
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
