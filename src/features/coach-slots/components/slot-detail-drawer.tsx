import { useEffect } from 'react'
import { X, Calendar, Clock, User, BookOpen, AlertCircle, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { SlotStatusBadge } from './slot-status-badge'
import { formatDateTime } from '@/shared/utils/date'
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !slot) return null

  const isBooked = slot.status === 'BOOKED'
  const isBlocked = slot.status === 'BLOCKED'
  const isOpenStatus = slot.status === 'OPEN'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          className="w-screen max-w-md bg-bg-surface border-l border-border-subtle shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-primary tracking-wider">
                WEB-COA-03
              </span>
              <h2 id="drawer-title" className="text-lg font-bold text-text-primary mt-0.5">
                {isBooked ? 'Chi tiết lịch tập' : 'Chi tiết khung giờ'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted hover:text-text-primary transition-colors"
              aria-label="Đóng bảng chi tiết"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Status & Time overview */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Trạng thái</span>
                <SlotStatusBadge status={slot.status} />
              </div>

              <div className="flex items-center gap-2.5 text-sm text-text-primary">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>{formatDateTime(slot.startsAt)}</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-text-muted">
                <Clock className="h-4 w-4 text-primary/80 shrink-0" />
                <span>
                  Kết thúc:{' '}
                  {new Date(slot.endsAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Booked details */}
            {isBooked && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Thông tin học viên
                </h3>
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-600 dark:text-sky-300 font-bold">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {slot.memberName || 'Hội viên đã đăng ký'}
                      </p>
                      <p className="text-xs text-sky-600 dark:text-sky-400">Mã đặt lịch: {slot.bookingId || slot.id}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sky-500/20 text-xs text-text-primary flex items-center justify-between">
                    <span className="text-text-muted">Hình thức:</span>
                    <span className="font-semibold text-sky-700 dark:text-sky-300">PT 1:1 Kèm riêng</span>
                  </div>
                </div>
              </div>
            )}

            {/* Course info */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Khóa đào tạo
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <span>{slot.courseName || 'Huấn luyện cá nhân'}</span>
              </div>
            </div>

            {/* Note / reason */}
            {slot.note && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {isBlocked ? 'Lý do khóa khung giờ' : 'Ghi chú'}
                </h3>
                <div className="rounded-lg bg-bg-surface-muted p-3 text-xs text-text-primary border border-border-subtle flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{slot.note}</span>
                </div>
              </div>
            )}

            {/* Coach info */}
            {slot.coachName && (
              <div className="space-y-1">
                <span className="text-xs text-text-muted">Huấn luyện viên phụ trách:</span>
                <p className="text-xs font-medium text-text-primary">{slot.coachName}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border-subtle bg-bg-surface flex flex-col sm:flex-row gap-2.5">
            {isOpenStatus && onBlockSlot && (
              <Button
                variant="outline"
                className="w-full text-amber-400 border-amber-500/30 hover:bg-amber-950/40 gap-2"
                onClick={() => {
                  onClose()
                  onBlockSlot(slot)
                }}
              >
                <Lock className="h-4 w-4" />
                <span>Chặn khung giờ này</span>
              </Button>
            )}

            {(isOpenStatus || isBlocked) && onDeleteSlot && (
              <Button
                variant="outline"
                className="w-full text-rose-400 border-rose-500/30 hover:bg-rose-950/40 gap-2"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn hủy khung giờ này không?')) {
                    onDeleteSlot(slot.id)
                    onClose()
                  }
                }}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'Đang hủy...' : 'Hủy khung giờ'}</span>
              </Button>
            )}

            <Button variant="ghost" className="w-full" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
