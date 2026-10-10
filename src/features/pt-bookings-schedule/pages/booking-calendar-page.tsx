import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  User,
  ShieldCheck,
  Check,
  UserX,
  Filter,
} from 'lucide-react'
import { isBeforeCutoff, formatDateTime, formatTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Select, Input } from '@/shared/components/ui/input'
import { ptBookingsService } from '../services/pt-bookings.service'
import { coachSlotService } from '@/features/coach-slots/services/coach-slot-service'
import { membersService } from '@/features/memberships/services/members.service'
import { ptPurchasesService } from '@/features/pt-packages-sales/services/pt-purchases.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { Booking, CoachSlot, MemberSummary, Purchase, PtBookingStatus } from '@/shared/types/api'

export function BookingCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [slots, setSlots] = useState<CoachSlot[]>([])
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Booking Modal State
  const [selectedSlot, setSelectedSlot] = useState<CoachSlot | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('')

  // Cancel Modal State
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('Hội viên bận đột xuất')
  const [cancelType, setCancelType] = useState<'MEMBER' | 'COACH'>('MEMBER')

  // Filter State
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL')
  const [slotStatusFilter, setSlotStatusFilter] = useState<string>('ALL')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [bookingsRes, slotsRes, membersRes, purchasesRes] = await Promise.all([
        ptBookingsService.getBookings({ limit: 100 }).catch(() => ({ data: [] })),
        coachSlotService.getSlots({ limit: 100 }).catch(() => []),
        membersService.getMembers({ limit: 100 }).catch(() => ({ data: [] })),
        ptPurchasesService.getPurchases({ status: 'ACTIVE', limit: 100 }).catch(() => ({ data: [] })),
      ])

      const bData = (bookingsRes as any)?.data || (Array.isArray(bookingsRes) ? bookingsRes : [])
      const sData = Array.isArray(slotsRes) ? slotsRes : (slotsRes as any)?.data || []
      const mData = (membersRes as any)?.data || (Array.isArray(membersRes) ? membersRes : [])
      const pData = (purchasesRes as any)?.data || (Array.isArray(purchasesRes) ? purchasesRes : [])

      setBookings(bData)
      setSlots(sData)
      setMembers(mData)
      setPurchases(pData)

      if (mData.length > 0) {
        setSelectedMemberId((prev) => prev || mData[0].id)
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi tải dữ liệu lịch PT')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Get active member & their purchases
  const activeMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId),
    [members, selectedMemberId]
  )

  const memberPurchases = useMemo(
    () => purchases.filter((p) => p.memberId === selectedMemberId && p.status === 'ACTIVE' && p.availableCredits > 0),
    [purchases, selectedMemberId]
  )

  useEffect(() => {
    if (memberPurchases.length > 0) {
      setSelectedPurchaseId(memberPurchases[0].id)
    } else {
      setSelectedPurchaseId('')
    }
  }, [memberPurchases])

  const selectedPurchase = useMemo(
    () => memberPurchases.find((p) => p.id === selectedPurchaseId) || memberPurchases[0],
    [memberPurchases, selectedPurchaseId]
  )

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !activeMember) return

    // 1. Check gym membership validity rule
    if (activeMember.membershipStatus !== 'ACTIVE') {
      alert('Hội viên chưa có thẻ tập Gym còn hiệu lực. Bắt buộc gia hạn thẻ Gym trước khi đặt lịch PT!')
      return
    }

    if (!selectedPurchase) {
      alert('Hội viên không có gói tập PT nào còn lượt buổi khả dụng!')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await ptBookingsService.createBooking({
        memberId: activeMember.id,
        purchaseId: selectedPurchase.id,
        slotId: selectedSlot.id,
      })

      setMessage(`Đã đặt lịch tập thành công cho ${activeMember.fullName}!`)
      setSelectedSlot(null)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể đặt lịch PT')
      } else {
        setErrorMessage('Lỗi hệ thống khi đặt lịch PT')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!cancelTarget) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      if (cancelType === 'COACH') {
        await ptBookingsService.coachCancelBooking(cancelTarget.id, {
          reason: cancelReason || 'HLV/Phòng tập hủy buổi đột xuất',
        })
        setMessage('Đã hủy lịch tập do sự cố HLV (buổi tập được tự động hoàn lại cho hội viên).')
      } else {
        const res = await ptBookingsService.cancelBooking(cancelTarget.id, {
          reason: cancelReason || 'Hội viên xin hủy lịch',
        })
        const effect = res?.data?.creditImpact === 'RETURNED' ? 'Đã hoàn lại buổi' : 'Đã trừ buổi (hủy muộn)'
        setMessage(`Đã hủy lịch tập thành công. Kết quả: ${effect}`)
      }
      setCancelTarget(null)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể hủy lịch PT')
      } else {
        setErrorMessage('Lỗi hệ thống khi hủy lịch PT')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteBooking = async (booking: Booking) => {
    if (!confirm(`Xác nhận hoàn thành buổi tập cho hội viên ${booking.memberName || ''}?`)) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await ptBookingsService.completeBooking(booking.id, { force: true })
      setMessage(`Đã đánh dấu hoàn thành buổi tập PT!`)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể hoàn thành buổi tập')
      } else {
        setErrorMessage('Lỗi hoàn thành buổi tập')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNoShowBooking = async (booking: Booking) => {
    if (!confirm(`Xác nhận đánh dấu hội viên vắng mặt không phép (No-show)? (Lượt tập sẽ bị trừ)`)) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await ptBookingsService.noShowBooking(booking.id, { reason: 'Hội viên không đến', force: true })
      setMessage(`Đã ghi nhận vắng mặt (No-show) cho buổi tập.`)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể đánh dấu No-show')
      } else {
        setErrorMessage('Lỗi khi đánh dấu No-show')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered views
  const filteredBookings = useMemo(() => {
    if (bookingStatusFilter === 'ALL') return bookings
    return bookings.filter((b) => b.status === bookingStatusFilter)
  }, [bookings, bookingStatusFilter])

  const filteredSlots = useMemo(() => {
    if (slotStatusFilter === 'ALL') return slots
    return slots.filter((s) => s.status === slotStatusFilter)
  }, [slots, slotStatusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Lịch Huấn Luyện & Đặt Lịch Hộ (WEB-REC-07)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy tắc nghiệp vụ: Bắt buộc thẻ Gym còn hạn • Cắt giờ hủy buổi tập trước 4 tiếng • Hoàn buổi khi HLV hủy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Available Slots Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span>Danh Sách Khung Giờ (Slots) Của Huấn Luyện Viên</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredSlots.length}
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={slotStatusFilter}
              onChange={(e) => setSlotStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Chỉ khung giờ mở (OPEN)</option>
              <option value="BOOKED">Đã được đặt (BOOKED)</option>
              <option value="BLOCKED">Bị khóa (BLOCKED)</option>
            </select>
          </div>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            Không tìm thấy khung giờ nào phù hợp bộ lọc.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSlots.map((s) => (
              <div
                key={s.id}
                className={`rounded-2xl border p-4 space-y-2.5 transition-all ${
                  s.status === 'OPEN'
                    ? 'border-cyan-500/30 bg-cyan-950/15 hover:border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                    : 'border-slate-800 bg-slate-900/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[150px]">
                    {s.coachName || 'Huấn luyện viên'}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-[11px] text-slate-400 truncate">{s.courseName || 'Khóa tập cá nhân'}</p>
                <div className="text-xs font-mono text-cyan-300 font-semibold">
                  {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                </div>
                {s.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs mt-2"
                    onClick={() => setSelectedSlot(s)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Đặt lịch cho hội viên
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>Danh Sách Buổi Hẹn PT 1:1 Đã Lên Lịch</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredBookings.length}
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
              <option value="CANCELLED_EARLY">Hủy sớm (CANCELLED_EARLY)</option>
              <option value="CANCELLED_LATE">Hủy muộn (CANCELLED_LATE)</option>
              <option value="COACH_CANCELLED">HLV hủy (COACH_CANCELLED)</option>
              <option value="NO_SHOW">Vắng mặt (NO_SHOW)</option>
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            Không tìm thấy buổi hẹn PT nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Hội viên</th>
                  <th className="py-3 px-4">HLV phụ trách</th>
                  <th className="py-3 px-4">Khóa tập</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {formatDateTime(b.startsAt)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{b.memberName || 'Hội viên'}</td>
                    <td className="py-3.5 px-4 text-orange-400">{b.coachName || 'Huấn luyện viên'}</td>
                    <td className="py-3.5 px-4">{b.courseName || 'Khóa PT'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {b.status === 'CONFIRMED' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => handleCompleteBooking(b)}
                            disabled={isSubmitting}
                            title="Xác nhận hoàn thành buổi tập"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Hoàn thành
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-amber-400 border-amber-600/40 hover:bg-amber-950/30"
                            onClick={() => handleNoShowBooking(b)}
                            disabled={isSubmitting}
                            title="Báo hội viên vắng mặt không phép (trừ credit)"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            No-show
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs"
                            onClick={() => {
                              setCancelTarget(b)
                              setCancelReason('Hội viên bận đột xuất')
                              setCancelType('MEMBER')
                            }}
                            disabled={isSubmitting}
                          >
                            Hủy lịch
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Đặt Lịch Hộ */}
      <Modal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title="Xác nhận đặt lịch tập PT 1:1"
        description={`HLV: ${selectedSlot?.coachName || 'Huấn luyện viên'} • Giờ tập: ${
          selectedSlot ? formatDateTime(selectedSlot.startsAt) : ''
        }`}
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <Select
            label="Chọn Hội viên"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            options={members.map((m) => ({
              value: m.id,
              label: `${m.fullName} (${m.memberCode}) – ${
                m.membershipStatus === 'ACTIVE' ? 'Thẻ Gym Còn hạn' : 'Thẻ Gym Hết hạn'
              }`,
            }))}
          />

          {/* Validation Status Notice */}
          {activeMember?.membershipStatus !== 'ACTIVE' ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold">Cảnh báo: Thẻ Gym chưa hợp lệ</p>
                <p className="text-[11px] text-slate-400">
                  Hội viên bắt buộc phải mua/gia hạn thẻ Gym trước khi được phép đặt lịch tập PT.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Thẻ Gym hợp lệ.</span>
            </div>
          )}

          {/* Package Selection for Member */}
          {memberPurchases.length > 0 ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Chọn Gói PT đã mua để cấn trừ lượt</label>
              <select
                value={selectedPurchaseId}
                onChange={(e) => setSelectedPurchaseId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {memberPurchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.courseNameSnapshot || 'Gói PT'} • Còn {p.availableCredits} / {p.totalCredits} buổi
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold">Chưa có gói PT khả dụng</p>
                <p className="text-[11px] text-slate-400">
                  Hội viên chưa mua gói PT nào hoặc đã dùng hết số buổi tập khả dụng.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setSelectedSlot(null)}>
              Đóng
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                activeMember?.membershipStatus !== 'ACTIVE' ||
                memberPurchases.length === 0 ||
                isSubmitting
              }
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt Lịch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Hủy Lịch - Áp dụng quy tắc 4 Giờ & HLV hủy */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Xác nhận hủy buổi tập PT 1:1"
        description="Quy tắc nghiệp vụ: Hệ thống tự động tính toán thời gian cắt giờ 4 tiếng"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-800/60 p-4 text-xs text-slate-300 space-y-1">
              <p>
                Hội viên: <strong className="text-white">{cancelTarget.memberName || 'Hội viên'}</strong>
              </p>
              <p>
                HLV: <strong className="text-white">{cancelTarget.coachName || 'Huấn luyện viên'}</strong>
              </p>
              <p>
                Giờ tập: <strong className="text-white">{formatDateTime(cancelTarget.startsAt)}</strong>
              </p>
            </div>

            {/* Selection between member cancel vs coach emergency cancel */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Đối tượng yêu cầu hủy</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCancelType('MEMBER')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    cancelType === 'MEMBER'
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <p className="font-bold">Hội viên / Lễ tân</p>
                  <p className="text-[10px] text-slate-400">Áp dụng mốc cắt giờ 4h</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCancelType('COACH')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    cancelType === 'COACH'
                      ? 'border-orange-500 bg-orange-950/40 text-orange-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <p className="font-bold">HLV / Phòng gym hủy</p>
                  <p className="text-[10px] text-slate-400">Luôn hoàn lại buổi tập</p>
                </button>
              </div>
            </div>

            {/* Dynamic 4-hour cancellation rule indicator */}
            {cancelType === 'MEMBER' ? (
              isBeforeCutoff(cancelTarget.startsAt, 4) ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Được hoàn buổi / cấp lượt bù (CANCELLED_EARLY)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Thời gian báo trước &ge; 4 giờ. Buổi tập sẽ được hoàn trả lại ngay vào tài khoản hội viên.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Hủy muộn: Trừ lượt tập (CANCELLED_LATE)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Thời gian báo trước &lt; 4 giờ. Buổi tập sẽ bị tính phí (CONSUME credit) và không được cấp bù.
                  </p>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-orange-500/30 bg-orange-950/30 p-4 text-xs text-orange-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-orange-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>HLV hủy buổi: Hoàn 100% lượt tập</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Do HLV hoặc phòng tập gặp sự cố khẩn cấp. Lượt tập được hoàn trả ngay cho hội viên.
                </p>
              </div>
            )}

            <Input
              label="Lý do hủy buổi"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCancelTarget(null)} disabled={isSubmitting}>
                Giữ lịch tập
              </Button>
              <Button variant="danger" onClick={handleCancelBooking} disabled={isSubmitting}>
                {isSubmitting ? 'Đang hủy...' : 'Đồng ý Hủy Buổi'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
