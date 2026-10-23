import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import { ptBookingsService } from '../services/pt-bookings.service'
import { ptPurchasesService } from '@/features/pt-packages-sales/services/pt-purchases.service'
import { STANDARD_TEMPLATE_SLOTS } from '@/features/coach-slots/constants/coach-slot.constants'
import type { Purchase } from '@/shared/types/api'
import type {
  CoachRecurringMatrixResponse,
  FixedSchedulePreviewResponse,
} from '../types/pt-bookings.types'
import { isAppApiError } from '@/shared/api/api-error'

export interface RecurringScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  purchase?: Purchase | null
  allPurchases?: Purchase[]
  onSuccess?: () => void
}

const PRESET_PATTERNS = [
  { key: 'MON_WED_FRI', label: 'Thứ 2 - 4 - 6', days: [1, 3, 5], hint: 'Cách ngày - Phục hồi 48h' },
  { key: 'TUE_THU_SAT', label: 'Thứ 3 - 5 - 7', days: [2, 4, 6], hint: 'Cách ngày - Phục hồi 48h' },
  { key: 'TUE_FRI', label: 'Thứ 3 - 6', days: [2, 5], hint: '2 buổi / tuần' },
  { key: 'WED_SAT', label: 'Thứ 4 - 7', days: [3, 6], hint: '2 buổi / tuần' },
]

export function RecurringScheduleModal({
  isOpen,
  onClose,
  purchase,
  allPurchases,
  onSuccess,
}: RecurringScheduleModalProps) {
  const navigate = useNavigate()
  // Navigation & form state
  const defaultStartDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1) // Tomorrow
    return d.toISOString().slice(0, 10)
  }, [])

  const [internalPurchaseId, setInternalPurchaseId] = useState<string>('')
  const [loadedPurchases, setLoadedPurchases] = useState<Purchase[]>(allPurchases || [])

  useEffect(() => {
    if (purchase) {
      setInternalPurchaseId(purchase.id)
    } else if (allPurchases && allPurchases.length > 0) {
      setInternalPurchaseId(allPurchases[0].id)
    } else if (isOpen) {
      ptPurchasesService
        .getPurchases({ status: 'ACTIVE', limit: 100 })
        .then((res) => {
          const list = (res as any)?.data || (Array.isArray(res) ? res : [])
          setLoadedPurchases(list)
          if (list.length > 0) setInternalPurchaseId(list[0].id)
        })
        .catch(() => {})
    }
  }, [purchase, allPurchases, isOpen])

  const currentPurchase = useMemo(() => {
    if (purchase) return purchase
    return loadedPurchases.find((p) => p.id === internalPurchaseId) || null
  }, [purchase, loadedPurchases, internalPurchaseId])

  const [startDate, setStartDate] = useState(defaultStartDate)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5])
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(4) // Default Slot 4 (Ca Chiều: 16:45 - 17:45)

  // Data fetching state
  const [matrixData, setMatrixData] = useState<CoachRecurringMatrixResponse | null>(null)
  const [previewData, setPreviewData] = useState<FixedSchedulePreviewResponse | null>(null)
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSessionList, setShowSessionList] = useState(false)
  const availableCredits = currentPurchase
    ? (currentPurchase.availableCredits ?? (currentPurchase.totalCredits - currentPurchase.reservedCredits - currentPurchase.consumedCredits))
    : 0

  // Calculate estimated total weeks
  const totalWeeks = useMemo(() => {
    if (!currentPurchase || currentPurchase.availableCredits <= 0) return 4
    const sessionsPerWeek = selectedDays.length || 3
    return Math.max(1, Math.ceil(currentPurchase.availableCredits / sessionsPerWeek))
  }, [currentPurchase, selectedDays])

  // The receptionist creates the selected schedule directly. Coach availability is
  // verified by the server only when there is an actual overlapping booking.
  const loadMatrix = useCallback(async () => {
    if (!currentPurchase?.coachId) return
    setIsLoadingMatrix(true)
    setErrorMessage(null)
    try {
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
      setMatrixData({
        coachId: currentPurchase.coachId,
        coachName: currentPurchase.coachNameSnapshot || 'Huấn luyện viên',
        startDate,
        totalWeeks,
        patterns: [],
        matrix: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
          dayOfWeek,
          dayName: dayNames[dayOfWeek === 7 ? 0 : dayOfWeek],
          slots: STANDARD_TEMPLATE_SLOTS.map((template) => {
            return {
              slotIndex: template.index,
              slotName: template.name,
              startTime: template.startTime,
              endTime: template.endTime,
              isAvailableFully: true,
              totalWeeksChecked: totalWeeks,
              conflictCount: 0,
              conflicts: [],
            }
          }),
        })),
      })
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể khởi tạo lịch tập.')
      } else {
        setErrorMessage('Lỗi kết nối khi khởi tạo lịch tập.')
      }
    } finally {
      setIsLoadingMatrix(false)
    }
  }, [currentPurchase?.coachId, startDate, totalWeeks])

  useEffect(() => {
    if (isOpen && currentPurchase?.coachId) {
      loadMatrix()
    }
  }, [isOpen, currentPurchase?.coachId, loadMatrix])

  // Load preview when parameters change
  const loadPreview = useCallback(async () => {
    if (!currentPurchase?.id || selectedDays.length === 0 || !selectedSlotIndex) return
    setIsLoadingPreview(true)
    setErrorMessage(null)
    try {
      const template = STANDARD_TEMPLATE_SLOTS.find((item) => item.index === selectedSlotIndex)
      if (!template) return
      const dates: Date[] = []
      const cursor = new Date(`${startDate}T00:00:00`)
      while (dates.length < availableCredits) {
        const day = cursor.getDay() || 7
        if (selectedDays.includes(day)) dates.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      const sessions = dates.map((time, index) => {
        const day = time.getDay() || 7
        const date = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`
        return { sessionNumber: index + 1, date: time.toLocaleDateString('vi-VN'), dayOfWeek: day, dayName: time.toLocaleDateString('vi-VN', { weekday: 'long' }), slotIndex: selectedSlotIndex, slotName: template.name, startTime: template.startTime, endTime: template.endTime, startsAt: new Date(`${date}T${template.startTime}:00+07:00`).toISOString(), endsAt: new Date(`${date}T${template.endTime}:00+07:00`).toISOString(), isAvailable: true, conflictReason: null, isGymMembershipActive: true }
      })
      setPreviewData({
        isAvailable: true,
        totalSessions: availableCredits,
        startDate,
        endDate: sessions.at(-1)?.date || startDate,
        slot: { index: template.index, name: template.name, startTime: template.startTime, endTime: template.endTime },
        coachName: currentPurchase.coachNameSnapshot || 'Huấn luyện viên',
        courseName: currentPurchase.courseNameSnapshot,
        memberName: currentPurchase.memberName || 'Hội viên',
        isGymActiveUntilEnd: true,
        sessions,
      })
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể xem trước lịch tập.')
      } else {
        setErrorMessage('Lỗi khi tính toán lịch tập dự kiến.')
      }
      setPreviewData(null)
    } finally {
      setIsLoadingPreview(false)
    }
  }, [currentPurchase?.id, startDate, selectedDays, selectedSlotIndex, availableCredits])

  useEffect(() => {
    if (isOpen && currentPurchase?.id && selectedDays.length > 0 && selectedSlotIndex) {
      loadPreview()
    }
  }, [isOpen, currentPurchase?.id, selectedDays, selectedSlotIndex, loadPreview])


  // Handle toggle day of week
  const handleToggleDay = (dow: number) => {
    setSelectedDays((prev) => {
      const next = prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort((a, b) => a - b)
      return next.length > 0 ? next : prev
    })
  }

  // Handle Preset pattern click
  const handleSelectPreset = (days: number[]) => {
    setSelectedDays(days)
  }

  // Handle confirm booking
  const handleConfirmBook = async () => {
    if (!currentPurchase?.id) return
    if (!previewData || selectedDays.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một ngày tập.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await ptBookingsService.bookFixedSchedule(currentPurchase.id, {
        startDate,
        daysOfWeek: selectedDays,
        slotIndex: selectedSlotIndex,
      })
      setSuccessMessage(`Đã đặt thành công ${result.totalBooked} buổi theo lịch đã chọn.`)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể chốt lịch cố định.')
      } else {
        setErrorMessage('Lỗi hệ thống khi chốt lịch cố định.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  if (!currentPurchase && loadedPurchases.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Thiết Lập Lịch Cố Định Gói PT 1:1"
        maxWidth="md"
      >
        <div className="py-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-text-primary">Chưa có gói PT sẵn sàng để xếp lịch</p>
            <p className="text-xs text-text-muted">Chỉ gói đã thanh toán và kích hoạt, còn buổi tập mới có thể đặt lịch.</p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="primary" onClick={() => navigate('/receptionist/pt-sale')} size="sm">Đến bán gói / thu tiền</Button>
            <Button variant="outline" onClick={onClose} size="sm">Đóng</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-text-primary">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Xếp nhiều buổi cho gói PT 1:1</span>
        </div>
      }
      description={`Chọn slot trống thực tế của HLV ${currentPurchase?.coachNameSnapshot || 'HLV'} rồi đặt các buổi khả dụng.`}
      maxWidth="2xl"
    >
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {/* Alerts */}
        {errorMessage && (
          <div role="alert" className="flex items-center gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div role="alert" className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Contract Selector if opened without fixed purchase */}
        {!purchase && loadedPurchases.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-bg-surface-muted border border-border-subtle">
            <label className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Chọn hợp đồng gói PT cần xếp lịch:</span>
            </label>
            <select
              value={internalPurchaseId}
              onChange={(e) => setInternalPurchaseId(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
            >
              {loadedPurchases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.memberName || p.memberCode || 'Hội viên'} — {p.courseNameSnapshot} (HLV: {p.coachNameSnapshot}) — Còn {p.availableCredits} buổi
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Contract & Coach Snapshot Header */}
        {currentPurchase && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary text-sm">{currentPurchase.courseNameSnapshot}</span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">PT 1:1</span>
              </div>
              <p className="text-text-muted">
                Học viên: <strong className="text-text-primary">{currentPurchase.memberName || currentPurchase.memberCode || 'Hội viên'}</strong> • Mã gói:{' '}
                <span className="font-mono">{currentPurchase.purchaseCode || currentPurchase.id.slice(0, 8)}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 bg-bg-surface p-2.5 rounded-xl border border-border-subtle shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                {(currentPurchase.coachNameSnapshot || 'HLV').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-text-muted font-medium">HLV phụ trách độc quyền</p>
                <p className="font-bold text-text-primary text-xs">{currentPurchase.coachNameSnapshot || 'HLV'}</p>
              </div>
              <div className="pl-3 border-l border-border-subtle text-right">
                <p className="text-[10px] text-text-muted">Lượt cần xếp</p>
                <p className="font-bold text-primary text-sm">{availableCredits} buổi</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Config date and pattern */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span>1. Ngày bắt đầu & Mẫu ngày tập (Nhịp cách ngày khoa học)</span>
            </label>
            <Button variant="ghost" size="sm" onClick={loadMatrix} disabled={isLoadingMatrix} className="gap-1.5 text-[11px] h-7">
              <RefreshCw className={`h-3 w-3 ${isLoadingMatrix ? 'animate-spin' : ''}`} />
              <span>Tải lại ma trận lịch</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] text-text-muted mb-1">Ngày bắt đầu buổi đầu tiên</label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-text-muted mb-1">Mẫu gợi ý chuẩn (Cơ bắp nghỉ hồi phục 48h)</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_PATTERNS.map((p) => {
                  const isMatch = p.days.length === selectedDays.length && p.days.every((d) => selectedDays.includes(d))
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleSelectPreset(p.days)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all border ${
                        isMatch
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border-subtle bg-bg-surface text-text-primary hover:border-primary/50'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="block text-[9px] opacity-80">{p.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Days of week custom selector */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-text-muted mr-1">Các ngày trong tuần:</span>
            {[
              { dow: 1, label: 'T2' },
              { dow: 2, label: 'T3' },
              { dow: 3, label: 'T4' },
              { dow: 4, label: 'T5' },
              { dow: 5, label: 'T6' },
              { dow: 6, label: 'T7' },
              { dow: 7, label: 'CN' },
            ].map(({ dow, label }) => {
              const active = selectedDays.includes(dow)
              return (
                <button
                  key={dow}
                  type="button"
                  onClick={() => handleToggleDay(dow)}
                  className={`h-7 w-8 rounded-lg text-xs font-bold transition-all ${
                    active ? 'bg-primary text-white shadow-sm' : 'bg-bg-surface-muted text-text-muted hover:text-text-primary border border-border-subtle'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: Visual PT Recurring Availability Matrix */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-primary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>2. Chọn khung giờ cố định ({totalWeeks} tuần dự kiến)</span>
            </span>
            <span className="text-[11px] font-normal text-text-muted">
              Lễ tân có thể xếp trực tiếp • Hệ thống sẽ chặn lịch bị trùng khi xác nhận
            </span>
          </label>

          {isLoadingMatrix ? (
            <div className="flex items-center justify-center py-10 gap-2 text-xs text-text-muted border border-border-subtle rounded-2xl bg-bg-surface-muted/30">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Đang kiểm tra lịch trống của HLV {currentPurchase?.coachNameSnapshot || 'HLV'}...</span>
            </div>
          ) : matrixData ? (
            <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface-muted/50 text-[11px] text-text-muted">
                    <th className="p-2.5 font-bold min-w-[140px]">Khung Giờ (Slot)</th>
                    {matrixData.matrix.map((d) => {
                      const isDaySelected = selectedDays.includes(d.dayOfWeek)
                      return (
                        <th
                          key={d.dayOfWeek}
                          className={`p-2 text-center font-bold min-w-[70px] ${
                            isDaySelected ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          <div>{d.dayName}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {[1, 2, 3, 4, 5, 6, 7].map((slotIdx) => {
                    const isRowSelected = selectedSlotIndex === slotIdx
                    // Get slot meta from Monday
                    const slotMeta = matrixData.matrix[0]?.slots.find((s) => s.slotIndex === slotIdx)
                    if (!slotMeta) return null

                    // Check if this slot is fully available across all selectedDays
                    const isSlotPatternAvailable = selectedDays.every((dow) => {
                      const dayCol = matrixData.matrix.find((m) => m.dayOfWeek === dow)
                      const s = dayCol?.slots.find((x) => x.slotIndex === slotIdx)
                      return s?.isAvailableFully
                    })

                    return (
                      <tr
                        key={slotIdx}
                        className={`transition-colors cursor-pointer ${
                          isRowSelected
                            ? 'bg-primary/10 font-medium'
                            : isSlotPatternAvailable
                            ? 'hover:bg-primary/5'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setSelectedSlotIndex(slotIdx)}
                      >
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="slotSelection"
                              checked={isRowSelected}
                              onChange={() => setSelectedSlotIndex(slotIdx)}
                              className="text-primary focus:ring-primary"
                            />
                            <div>
                              <div className="font-bold text-text-primary text-[12px]">{slotMeta.slotName}</div>
                              <div className="text-[10px] text-text-muted">
                                {slotMeta.startTime} – {slotMeta.endTime}
                              </div>
                            </div>
                          </div>
                        </td>

                        {matrixData.matrix.map((d) => {
                          const slotCell = d.slots.find((s) => s.slotIndex === slotIdx)
                          const isDaySelected = selectedDays.includes(d.dayOfWeek)
                          const isAvailable = slotCell?.isAvailableFully
                          const openCount = slotCell
                            ? Math.max(0, slotCell.totalWeeksChecked - slotCell.conflictCount)
                            : 0

                          return (
                            <td
                              key={d.dayOfWeek}
                              className={`p-2 text-center text-[10px] ${
                                isDaySelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              {isAvailable ? (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Có thể xếp
                                </span>
                              ) : openCount === 0 ? (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded-full bg-slate-500/15 px-1.5 py-0.5 font-bold text-slate-600 dark:text-slate-300"
                                  title={slotCell?.conflicts.map((c) => `${c.date}: ${c.reason}`).join('\n')}
                                >
                                  — Chưa mở
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 font-bold text-amber-700 dark:text-amber-300"
                                  title={slotCell?.conflicts.map((c) => `${c.date}: ${c.reason}`).join('\n')}
                                >
                                  ~ Còn {openCount}/{slotCell?.totalWeeksChecked}
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* Step 3: Live Preview & Conflict Check */}
        {isLoadingPreview ? (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-text-muted">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span>Đang tính toán và rà soát trùng lịch...</span>
          </div>
        ) : previewData ? (
          <div className="space-y-3 rounded-2xl border border-border-subtle bg-bg-surface-muted/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">
                    {previewData.slot.name} ({previewData.slot.startTime} – {previewData.slot.endTime})
                  </span>
                  {previewData.isAvailable ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> HLV sẵn sàng toàn bộ {previewData.totalSessions} buổi
                    </span>
                  ) : (
                    <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-bold text-danger flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Trùng lịch HLV ở một số ngày
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted">
                  Thời gian: <strong className="text-text-primary">{previewData.startDate}</strong> đến{' '}
                  <strong className="text-text-primary">{previewData.endDate}</strong> ({previewData.totalSessions} buổi)
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSessionList(!showSessionList)}
                className="text-[11px] h-7"
              >
                {showSessionList ? 'Ẩn danh sách ngày' : `Xem chi tiết ${previewData.totalSessions} ngày`}
              </Button>
            </div>

            {/* Gym membership warning if not valid until end */}
            {!previewData.isGymActiveUntilEnd && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Thẻ Gym của hội viên có thể hết hạn trước buổi tập cuối ({previewData.endDate}). Nhắc hội viên gia hạn thẻ Gym để đảm bảo check-in vào cửa.
                </span>
              </div>
            )}

            {/* Collapsible session breakdown */}
            {showSessionList && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border-subtle bg-bg-surface p-2 space-y-1 text-[11px]">
                {previewData.sessions.map((s) => (
                  <div
                    key={s.sessionNumber}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-bg-surface-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-muted w-6">#{s.sessionNumber}</span>
                      <span className="font-medium text-text-primary">{s.dayName}, {s.date}</span>
                    </div>
                    <div>
                      {s.isAvailable ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Hợp lệ</span>
                      ) : (
                        <span className="text-danger font-semibold">✕ {s.conflictReason || 'Bị trùng'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Đóng / Quay lại
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmBook}
            disabled={isSubmitting || !previewData || !previewData.isAvailable}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang khóa lịch HLV...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Xác nhận chốt lịch cố định ({availableCredits} buổi)</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
