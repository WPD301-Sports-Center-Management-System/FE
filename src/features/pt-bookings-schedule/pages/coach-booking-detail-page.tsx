import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, UserX, XCircle, Clock, ArrowRight, RefreshCw, Calendar, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { formatDateTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import { isAppApiError } from '@/shared/api/api-error'
import type { Booking } from '@/shared/types/api'

export function CoachBookingDetailPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null)
  const [coachCancelReason, setCoachCancelReason] = useState('')
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadBookings = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await coachesService.getMyBookings()
      const data = res?.data || (Array.isArray(res) ? res : [])
      setBookings(data)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách lịch hẹn PT.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const showSuccess = (msg: string) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(null), 4000)
  }

  const handleMarkCompleted = async (b: Booking) => {
    setProcessingId(b.id)
    setErrorMessage(null)
    try {
      await coachesService.completeBooking(b.id)
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: 'COMPLETED' as const } : item))
      )
      const memberName = (b as any).member?.user?.fullName || b.memberName || 'Hội viên'
      showSuccess(`Đã đánh dấu hoàn thành buổi tập với ${memberName}!`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Xác nhận hoàn thành thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi cập nhật trạng thái.')
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkNoShow = async (b: Booking) => {
    setProcessingId(b.id)
    setErrorMessage(null)
    try {
      await coachesService.reportNoShow(b.id, 'Hội viên vắng mặt không báo trước')
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: 'NO_SHOW' as const } : item))
      )
      const memberName = (b as any).member?.user?.fullName || b.memberName || 'Hội viên'
      showSuccess(`Đã ghi nhận vắng mặt (No-Show) cho ${memberName}. Lượt tập đã bị trừ.`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Ghi nhận vắng mặt thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi cập nhật trạng thái.')
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirmCoachCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancelModalBooking || !coachCancelReason.trim()) return

    setIsSubmittingCancel(true)
    setErrorMessage(null)
    try {
      await coachesService.coachCancelBooking(cancelModalBooking.id, coachCancelReason.trim())
      setBookings((prev) =>
        prev.map((item) =>
          item.id === cancelModalBooking.id ? { ...item, status: 'COACH_CANCELLED' as const } : item
        )
      )
      setCancelModalBooking(null)
      setCoachCancelReason('')
      showSuccess('Đã hủy buổi tập thành công và hoàn lại lượt tập cho hội viên.')
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Hủy buổi tập thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi hủy buổi tập.')
      }
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản Lý Lịch Hẹn PT 1:1 (WEB-COA-04)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Điểm danh hội viên, xác nhận hoàn tất buổi dạy hoặc xử lý hủy lịch đột xuất
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadBookings} disabled={isLoading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Chưa có lịch hẹn nào</h3>
          <p className="text-xs text-slate-400 mt-1">Các buổi tập PT 1:1 đã được hội viên đặt sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const memberName = (b as any).member?.user?.fullName || b.memberName || 'Hội viên đã đăng ký'
            const courseName = (b as any).purchase?.courseNameSnapshot || (b as any).slot?.offering?.course?.name || b.courseName || 'Khóa Huấn Luyện Cá Nhân PT 1:1'
            const startTime = b.startsAt || (b as any).slot?.startsAt
            const isProcessing = processingId === b.id

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white">{memberName}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-slate-400">{courseName}</p>
                  <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-cyan-300">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{startTime ? formatDateTime(startTime) : 'Chưa xếp thời gian'}</span>
                    {startTime && new Date(startTime) > new Date() && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-sans">
                        Chưa đến giờ hẹn
                      </span>
                    )}
                  </div>
                </div>

                {b.status === 'CONFIRMED' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-400 border-red-500/30 hover:bg-red-950/40"
                      onClick={() => setCancelModalBooking(b)}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Coach báo bận
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs text-amber-400 border-amber-500/30 hover:bg-amber-950/40"
                      onClick={() => handleMarkNoShow(b)}
                      disabled={isProcessing}
                    >
                      <UserX className="h-3.5 w-3.5 mr-1" />
                      Hội viên vắng
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs"
                      onClick={() => handleMarkCompleted(b)}
                      disabled={isProcessing}
                      isLoading={isProcessing}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Hoàn thành buổi tập
                    </Button>
                  </div>
                )}

                {b.status === 'COMPLETED' && (
                  <Link to="/coach/training-results">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 border-teal-500/30 text-teal-300 hover:bg-teal-950/40">
                      <span>Ghi Training Result</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Coach Cancel Modal */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => {
          if (!isSubmittingCancel) {
            setCancelModalBooking(null)
            setCoachCancelReason('')
          }
        }}
        title="Huấn luyện viên báo bận / Hủy buổi"
        description="Quy tắc: Khi Coach hủy, buổi tập được hoàn lại 100% cho hội viên"
      >
        <form onSubmit={handleConfirmCoachCancel} className="space-y-4">
          <Textarea
            label="Lý do hủy buổi tập (Bắt buộc)"
            required
            value={coachCancelReason}
            onChange={(e) => setCoachCancelReason(e.target.value)}
            placeholder="Ví dụ: Lịch thi đấu hoặc việc cá nhân đột xuất..."
            disabled={isSubmittingCancel}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCancelModalBooking(null)}
              disabled={isSubmittingCancel}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isSubmittingCancel}
              disabled={isSubmittingCancel || !coachCancelReason.trim()}
            >
              Xác nhận hủy buổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

