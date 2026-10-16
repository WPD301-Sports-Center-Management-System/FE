import { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  User,
  BookOpen,
  AlertCircle,
  Lock,
  Trash2,
  Phone,
  Mail,
  Copy,
  Check,
  ClipboardList,
  Activity,
  ArrowRight,
  ShieldAlert,
  Dumbbell,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { SlotStatusBadge } from './slot-status-badge'
import { STANDARD_TEMPLATE_SLOTS } from '../constants/coach-slot.constants'
import type { CoachSlot } from '@/shared/types/api'
import type { SlotCalendarEventProps } from '../types/coach-slot-types'

interface SlotDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  slot: (CoachSlot & Partial<SlotCalendarEventProps>) | null
  onBlockSlot?: (slot: CoachSlot) => void
  onDeleteSlot?: (slotId: string) => void
  isDeleting?: boolean
}

export function SlotDetailDrawer({
  isOpen,
  onClose,
  slot,
  onBlockSlot,
  onDeleteSlot,
  isDeleting = false,
}: SlotDetailDrawerProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !slot) return null

  const isBooked =
    slot.status === 'BOOKED' ||
    slot.status === 'COMPLETED' ||
    Boolean(slot.bookingId || slot.bookingCode || slot.memberName)
  const isBlocked = slot.status === 'BLOCKED'
  const isOpenStatus = slot.status === 'OPEN'

  const bookingCodeDisplay =
    slot.bookingCode ||
    (slot.bookingId
      ? slot.bookingId.length > 12
        ? `BK-${slot.bookingId.slice(0, 8).toUpperCase()}`
        : slot.bookingId
      : slot.id.length > 12
      ? `SL-${slot.id.slice(0, 8).toUpperCase()}`
      : slot.id)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNavigate = (path: string) => {
    onClose()
    try {
      window.location.assign(path)
    } catch {
      // fallback
    }
  }

  // Calculate duration and time
  const startObj = new Date(slot.startsAt)
  const endObj = new Date(slot.endsAt)
  const durationMinutes = Math.max(15, Math.round((endObj.getTime() - startObj.getTime()) / 60000))

  const startHourStr = String(startObj.getHours()).padStart(2, '0')
  const startMinStr = String(startObj.getMinutes()).padStart(2, '0')
  const startTimeFormatted = `${startHourStr}:${startMinStr}`

  const endHourStr = String(endObj.getHours()).padStart(2, '0')
  const endMinStr = String(endObj.getMinutes()).padStart(2, '0')
  const endTimeFormatted = `${endHourStr}:${endMinStr}`

  // Match template slot if applicable
  const matchedTemplate = STANDARD_TEMPLATE_SLOTS.find((t) => t.startTime === startTimeFormatted)

  const dateFormattedRaw = startObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const dateFormatted = dateFormattedRaw.charAt(0).toUpperCase() + dateFormattedRaw.slice(1)

  // Credits & progress
  const totalCredits = slot.totalCredits || 12
  const consumedCredits = slot.consumedCredits ?? 1
  const remainingCredits = slot.remainingCredits ?? Math.max(0, totalCredits - consumedCredits)
  const progressPercent = Math.min(100, Math.round((consumedCredits / totalCredits) * 100))

  // Get member initials
  const memberName = slot.memberName || 'Hội viên'
  const initials = memberName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          className="w-screen max-w-md bg-bg-surface border-l border-border-subtle shadow-2xl flex flex-col justify-between transition-all animate-in slide-in-from-right duration-250 ease-out"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border-subtle bg-bg-surface-muted/40">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    <Dumbbell className="h-3 w-3" />
                    Lịch tập PT 1:1
                  </span>
                  {matchedTemplate && (
                    <span className="text-[11px] font-medium text-text-muted">
                      • {matchedTemplate.name}
                    </span>
                  )}
                </div>
                <h2 id="drawer-title" className="text-lg font-bold text-text-primary tracking-tight">
                  {isBooked
                    ? 'Chi tiết buổi học PT'
                    : isBlocked
                    ? 'Khung giờ tạm khóa'
                    : 'Chi tiết khung giờ làm việc'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <SlotStatusBadge status={slot.status} />
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Đóng bảng chi tiết"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto text-sm">
            {/* Booking Code Banner (if booked) */}
            {isBooked && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-medium">Mã lịch hẹn:</span>
                  <span className="font-mono text-xs font-bold text-text-primary">
                    {bookingCodeDisplay}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(bookingCodeDisplay)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  title="Sao chép mã"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-semibold text-[11px]">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Schedule & Time Hero Card */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface-muted/60 p-4 space-y-3.5 shadow-xs">
              {/* Date & Time block */}
              <div className="flex items-start gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex flex-col items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-muted">Thời gian thực hiện</p>
                  <p className="font-bold text-base text-text-primary truncate">{dateFormatted}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {startTimeFormatted} – {endTimeFormatted}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="px-1.5 py-0.5 rounded bg-bg-surface text-[11px] font-medium border border-border-subtle text-text-muted">
                      {durationMinutes} phút
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub metadata grid */}
              <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-bg-surface border border-border-subtle space-y-0.5">
                  <p className="text-[11px] text-text-muted font-medium">Hình thức</p>
                  <p className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Dumbbell className="h-3.5 w-3.5 text-primary" />
                    PT 1:1 kèm riêng
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-bg-surface border border-border-subtle space-y-0.5">
                  <p className="text-[11px] text-text-muted font-medium">HLV phụ trách</p>
                  <p className="font-semibold text-text-primary truncate">
                    {slot.coachName || 'Huấn luyện viên'}
                  </p>
                </div>
              </div>
            </div>

            {/* Course Card (for OPEN / Non-booked slot) */}
            {!isBooked && (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Khóa đào tạo áp dụng
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Sẵn sàng nhận lịch
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-bg-surface-muted/50 border border-border-subtle space-y-1">
                  <p className="text-base font-bold text-text-primary">
                    {slot.courseName || 'Huấn luyện thể hình cá nhân'}
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Khung giờ mở sẵn sàng tiếp nhận đặt lịch tập từ Hội viên thông qua ứng dụng hoặc
                    Lễ tân xếp lịch.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Info className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                  <span>Quy chuẩn 1 học viên / ca, đảm bảo chất lượng hướng dẫn tối ưu.</span>
                </div>
              </div>
            )}

            {/* Booked Member Profile */}
            {isBooked && (
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Thông tin học viên
                  </span>
                  {slot.memberCode && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold border border-sky-500/25">
                      {slot.memberCode}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {slot.memberAvatar ? (
                    <img
                      src={slot.memberAvatar}
                      alt={memberName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-sky-500/30 shadow-xs"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500/20 to-primary/20 border-2 border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-300 font-bold text-base shadow-xs">
                      {initials || <User className="h-6 w-6" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary truncate text-base leading-snug">
                      {memberName}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {slot.fitnessLevel ? `Thể trạng: ${slot.fitnessLevel}` : 'Hội viên Gym Center'}
                    </p>
                  </div>
                </div>

                {/* Contact Shortcuts */}
                <div className="pt-2.5 border-t border-sky-500/20 grid grid-cols-2 gap-2 text-xs">
                  {slot.memberPhone ? (
                    <a
                      href={`tel:${slot.memberPhone}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface border border-sky-500/20 text-sky-600 dark:text-sky-300 hover:bg-sky-500/10 font-medium transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{slot.memberPhone}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface/50 border border-border-subtle text-text-muted italic">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>Chưa có SĐT</span>
                    </div>
                  )}

                  {slot.memberEmail ? (
                    <a
                      href={`mailto:${slot.memberEmail}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface border border-sky-500/20 text-sky-600 dark:text-sky-300 hover:bg-sky-500/10 font-medium transition-colors"
                      title={slot.memberEmail}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Gửi Email</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface/50 border border-border-subtle text-text-muted italic">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span>Chưa có Email</span>
                    </div>
                  )}
                </div>

                {/* Medical / Fitness Notes */}
                {slot.medicalNotes && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <span className="font-bold">Lưu ý sức khỏe: </span>
                      {slot.medicalNotes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Course & Training Progress (for Booked slot) */}
            {isBooked && (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Khóa đào tạo & Gói tập
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {slot.courseName || 'Khóa Huấn Luyện PT'}
                  </span>
                </div>

                <div className="bg-bg-surface-muted/60 p-3.5 rounded-xl border border-border-subtle space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-medium">Gói đăng ký:</span>
                    <span className="font-bold text-text-primary">
                      {slot.packageName || `${slot.courseName || 'PT 1:1'} - ${totalCredits} Buổi`}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Tiến độ gói tập:</span>
                      <span className="font-bold text-primary">
                        Buổi {consumedCredits} / {totalCredits} ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(5, progressPercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-0.5">
                      <span>Đã học: {consumedCredits} buổi</span>
                      <span>Còn lại: {remainingCredits} buổi</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Blocked Alert Card */}
            {isBlocked && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                  <Lock className="h-4 w-4" />
                  <span>Khung giờ đã bị khóa</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Khung giờ này đã được tạm khóa bận. Học viên và Lễ tân sẽ không thể xếp lịch vào ca
                  này.
                </p>
                {slot.note && (
                  <div className="p-2.5 rounded-xl bg-bg-surface border border-amber-500/20 text-xs text-text-primary">
                    <span className="text-text-muted font-medium">Lý do: </span>
                    {slot.note}
                  </div>
                )}
              </div>
            )}

            {/* Note / reason (if not blocked, e.g. normal note) */}
            {slot.note && !isBlocked && (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface-muted/50 p-4 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  Ghi chú buổi học
                </span>
                <p className="text-xs text-text-primary bg-bg-surface p-2.5 rounded-xl border border-border-subtle">
                  {slot.note}
                </p>
              </div>
            )}

            {/* Quick Actions Shortcuts for Booked Session */}
            {isBooked && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Thao tác nhanh buổi học
                </span>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full justify-between bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2.5 shadow-sm"
                    onClick={() => handleNavigate('/coach/bookings')}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Điểm danh & Quản lý lịch hẹn
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-center text-xs gap-1.5 border-border-subtle hover:bg-bg-surface-muted"
                      onClick={() => handleNavigate('/coach/training-plans')}
                    >
                      <ClipboardList className="h-3.5 w-3.5 text-sky-500" />
                      <span>Soạn giáo án</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-center text-xs gap-1.5 border-border-subtle hover:bg-bg-surface-muted"
                      onClick={() => handleNavigate('/coach/training-results')}
                    >
                      <Activity className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Ghi kết quả</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-border-subtle bg-bg-surface space-y-2">
            {isOpenStatus && (
              <div className="grid grid-cols-2 gap-2.5">
                {onBlockSlot && (
                  <Button
                    variant="outline"
                    className="w-full text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 gap-1.5 text-xs font-semibold"
                    onClick={() => {
                      onClose()
                      onBlockSlot(slot)
                    }}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Chặn khung giờ này</span>
                  </Button>
                )}

                {onDeleteSlot && (
                  <Button
                    variant="outline"
                    className="w-full text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1.5 text-xs font-semibold"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn hủy khung giờ này không?')) {
                        onDeleteSlot(slot.id)
                        onClose()
                      }
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isDeleting ? 'Đang hủy...' : 'Hủy khung giờ'}</span>
                  </Button>
                )}
              </div>
            )}

            {isBlocked && onDeleteSlot && (
              <Button
                variant="outline"
                className="w-full text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1.5 text-xs font-semibold"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn hủy khung giờ này không?')) {
                    onDeleteSlot(slot.id)
                    onClose()
                  }
                }}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Đang hủy...' : 'Hủy khung giờ'}</span>
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full text-xs text-text-muted hover:text-text-primary"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

