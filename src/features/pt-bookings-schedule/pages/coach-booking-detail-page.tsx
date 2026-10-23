import { useState, useEffect, useCallback, useMemo } from 'react'
import { CheckCircle2, UserX, XCircle, Clock, ArrowRight, RefreshCw, Calendar, AlertCircle, Search, X, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { formatDateTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import { isAppApiError } from '@/shared/api/api-error'
import type { Booking } from '@/shared/types/api'
import { STANDARD_TEMPLATE_SLOTS } from '@/features/coach-slots/constants/coach-slot.constants'

function getSlotBadge(startTimeStr?: string) {
  if (!startTimeStr) return null
  const d = new Date(startTimeStr)
  const h = d.getHours()
  const m = d.getMinutes()
  const totalMin = h * 60 + m

  const matched = STANDARD_TEMPLATE_SLOTS.find((s) => {
    const [sH, sM] = s.startTime.split(':').map(Number)
    const [eH, eM] = s.endTime.split(':').map(Number)
    const startMin = (sH ?? 0) * 60 + (sM ?? 0)
    const endMin = (eH ?? 0) * 60 + (eM ?? 0)
    return totalMin >= startMin - 15 && totalMin < endMin
  })

  if (!matched) return null

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${matched.colorBadge}`}
    >
      Slot {matched.index} ({matched.periodLabel}: {matched.startTime} – {matched.endTime})
    </span>
  )
}

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'NO_SHOW', label: 'Vắng mặt' },
  { value: 'CANCELLED_EARLY', label: 'Hủy sớm (Hoàn buổi)' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
]

type DateFilter = 'TODAY' | 'UPCOMING' | 'PAST' | 'ALL'

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'UPCOMING', label: 'Sắp tới' },
  { value: 'PAST', label: 'Đã qua' },
  { value: 'ALL', label: 'Tất cả' },
]

function getBookingStartTime(booking: Booking) {
  return booking.startsAt || (booking as any).slot?.startsAt
}

function getLocalDateKey(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatBookingTime(value?: string) {
  if (!value) return 'Chưa xếp thời gian'
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function CoachBookingDetailPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('TODAY')
  const [visibleCount, setVisibleCount] = useState(20)

  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null)
  const [coachCancelReason, setCoachCancelReason] = useState('')
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredBookings = useMemo(() => {
    const now = new Date()
    const today = getLocalDateKey(now.toISOString())

    return bookings.filter((b) => {
      const memberName = ((b as any).member?.user?.fullName || b.memberName || '').toLowerCase()
      const courseName = (
        (b as any).purchase?.courseNameSnapshot ||
        (b as any).slot?.offering?.course?.name ||
        b.courseName ||
        ''
      ).toLowerCase()
      const search = searchTerm.trim().toLowerCase()

      const matchesSearch = !search || memberName.includes(search) || courseName.includes(search)
      if (!matchesSearch) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'CONFIRMED') return b.status === 'CONFIRMED'
      if (statusFilter === 'NO_SHOW') return b.status === 'NO_SHOW'
      if (statusFilter === 'CANCELLED_EARLY') {
        return (
          b.status === 'CANCELLED_EARLY' ||
          b.status === 'COACH_CANCELLED' ||
          b.status === 'CANCELLED_LATE'
        )
      }
      if (statusFilter === 'COMPLETED') return b.status === 'COMPLETED'

      return b.status === statusFilter
    }).filter((b) => {
      const startTime = getBookingStartTime(b)
      if (!startTime || dateFilter === 'ALL') return true

      const start = new Date(startTime)
      if (dateFilter === 'TODAY') return getLocalDateKey(startTime) === today
      if (dateFilter === 'UPCOMING') return start.getTime() > now.getTime()
      return start.getTime() < now.getTime()
    }).sort((a, b) => {
      const aStart = getBookingStartTime(a)
      const bStart = getBookingStartTime(b)
      return new Date(aStart || 0).getTime() - new Date(bStart || 0).getTime()
    })
  }, [bookings, searchTerm, statusFilter, dateFilter])

  useEffect(() => {
    setVisibleCount(20)
  }, [searchTerm, statusFilter, dateFilter])

  const visibleBookings = filteredBookings.slice(0, visibleCount)
  const confirmedCount = filteredBookings.filter((booking) => booking.status === 'CONFIRMED').length

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
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Quản lý lịch hẹn PT 1:1</h1>
          <p className="text-xs text-text-muted mt-1">
            Điểm danh hội viên, xác nhận hoàn tất buổi dạy hoặc xử lý hủy lịch đột xuất
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadBookings} disabled={isLoading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Bộ lọc xử lý hoàn toàn ở client để không thay đổi API hiện có. */}
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-3 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input by member name */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên hội viên hoặc khóa học..."
            className="w-full rounded-xl border border-border-subtle bg-bg-surface pl-10 pr-9 py-2.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown status filter */}
        <div className="sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-bg-surface px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-all cursor-pointer font-medium"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-text-muted ml-1" />
          {DATE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDateFilter(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${dateFilter === option.value ? 'bg-primary text-white shadow-sm' : 'bg-bg-surface-muted text-text-muted hover:text-text-primary hover:bg-bg-surface'}`}
            >
              {option.label}
            </button>
          ))}
          <span className="ml-auto mr-1 text-xs text-text-muted">
            {filteredBookings.length} lịch {confirmedCount > 0 ? `• ${confirmedCount} cần xử lý` : ''}
          </span>
        </div>
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
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-12 text-center">
          <Calendar className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-text-primary">Chưa có lịch hẹn nào</h3>
          <p className="text-xs text-text-muted mt-1">Các buổi tập PT 1:1 đã được hội viên đặt sẽ hiển thị tại đây.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-12 text-center space-y-3">
          <Search className="h-10 w-10 text-text-muted mx-auto opacity-40" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Không tìm thấy lịch hẹn phù hợp</h3>
            <p className="text-xs text-text-muted mt-1">
              {searchTerm
                ? `Không có lịch hẹn nào khớp với từ khóa "${searchTerm}"`
                : 'Không có lịch hẹn nào thuộc trạng thái đã chọn.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('ALL')
              setDateFilter('ALL')
            }}
            className="text-xs mt-2"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleBookings.map((b) => {
            const memberName = (b as any).member?.user?.fullName || b.memberName || 'Hội viên đã đăng ký'
            const courseName = (b as any).purchase?.courseNameSnapshot || (b as any).slot?.offering?.course?.name || b.courseName || 'Khóa Huấn Luyện Cá Nhân PT 1:1'
            const startTime = b.startsAt || (b as any).slot?.startsAt
            const isProcessing = processingId === b.id
            const isNotStartedYet = Boolean(startTime && new Date(startTime).getTime() > Date.now())

            return (
              <div
                key={b.id}
                className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm hover:border-primary/25 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-bold text-text-primary">{memberName}</h3>
                    <StatusBadge status={b.status} />
                    {getSlotBadge(startTime)}
                  </div>
                  <p className="text-xs text-text-muted truncate">{courseName}</p>
                  <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-primary">
                    <Clock className="h-3.5 w-3.5" />
                    {startTime && <span className="font-bold text-sm">{formatBookingTime(startTime)}</span>}
                    <span>{startTime ? formatDateTime(startTime) : 'Chưa xếp thời gian'}</span>
                    {startTime && isNotStartedYet && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-sans">
                        Chưa đến giờ hẹn
                      </span>
                    )}
                  </div>
                </div>

                {b.status === 'CONFIRMED' && (
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                      onClick={() => setCancelModalBooking(b)}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Coach báo bận
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleMarkNoShow(b)}
                      disabled={isProcessing || isNotStartedYet}
                      title={isNotStartedYet ? 'Chỉ kích hoạt khi thời gian thực tế chạm mốc giờ hẹn trở đi' : 'Báo hội viên vắng mặt'}
                    >
                      <UserX className="h-3.5 w-3.5 mr-1" />
                      Hội viên vắng
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleMarkCompleted(b)}
                      disabled={isProcessing || isNotStartedYet}
                      isLoading={isProcessing}
                      title={isNotStartedYet ? 'Chỉ kích hoạt khi thời gian thực tế chạm mốc giờ hẹn trở đi' : 'Đánh dấu hoàn thành buổi tập'}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Hoàn thành buổi tập
                    </Button>
                  </div>
                )}

                {b.status === 'COMPLETED' && (
                  <Link to={`/coach/training-results?bookingId=${b.id}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 border-teal-500/30 text-teal-600 dark:text-teal-300 hover:bg-teal-500/10">
                      <span>Ghi kết quả buổi tập</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
          {visibleBookings.length < filteredBookings.length && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((count) => count + 20)}
                className="gap-1.5 text-xs"
              >
                Xem thêm {Math.min(20, filteredBookings.length - visibleBookings.length)} lịch
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
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
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
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

