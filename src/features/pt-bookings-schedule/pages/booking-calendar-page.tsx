import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle2, XCircle, Plus } from 'lucide-react'
import { db, handleMockBookingCancel } from '@/mocks/mock-server'
import { isBeforeCutoff, formatDateTime, formatTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Select } from '@/shared/components/ui/input'
import type { Booking, CoachSlot } from '@/shared/types/api'

export function BookingCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([...db.bookings])
  const [slots, setSlots] = useState<CoachSlot[]>([...db.slots])
  const [selectedSlot, setSelectedSlot] = useState<CoachSlot | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState(db.members[0].id)
  const [message, setMessage] = useState<string | null>(null)

  const activeMember = db.members.find((m) => m.id === selectedMemberId)
  const memberPurchase = db.purchases.find(
    (p) => p.memberId === selectedMemberId && p.status === 'ACTIVE' && p.availableCredits > 0
  )

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !activeMember || !memberPurchase) return

    // 1. Check gym membership validity rule
    if (activeMember.membershipStatus !== 'ACTIVE') {
      alert('Hội viên chưa có thẻ tập Gym còn hiệu lực. Bắt buộc gia hạn thẻ Gym trước khi đặt lịch PT!')
      return
    }

    const newBooking: Booking = {
      id: 'bkg-' + Date.now(),
      purchaseId: memberPurchase.id,
      slotId: selectedSlot.id,
      memberId: activeMember.id,
      coachId: selectedSlot.coachId,
      courseId: memberPurchase.courseId,
      status: 'CONFIRMED',
      startsAt: selectedSlot.startsAt,
      endsAt: selectedSlot.endsAt,
      creditReturned: false,
      memberName: activeMember.fullName,
      coachName: selectedSlot.coachName,
      courseName: selectedSlot.courseName,
      cancellationPolicy: {
        cutoffAt: new Date(new Date(selectedSlot.startsAt).getTime() - 4 * 3600000).toISOString(),
        creditEffect: 'RETURN',
        makeupEligible: true,
      },
    }

    selectedSlot.status = 'BOOKED'
    memberPurchase.availableCredits -= 1
    memberPurchase.reservedCredits += 1

    db.bookings.unshift(newBooking)
    setBookings([...db.bookings])
    setSlots([...db.slots])
    setSelectedSlot(null)
    setMessage(`Đã đặt lịch tập thành công cho ${activeMember.fullName}!`)
  }

  const handleCancelBooking = () => {
    if (!cancelTarget) return
    const result = handleMockBookingCancel(cancelTarget.id, 'RECEPTIONIST')
    setBookings([...db.bookings])
    setCancelTarget(null)
    setMessage(result.message)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Lịch Huấn Luyện & Đặt Lịch Hộ (WEB-REC-07)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy tắc nghiệp vụ: Bắt buộc thẻ Gym còn hạn • Cắt giờ hủy buổi tập trước 4 tiếng
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Available Slots Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-400" />
          <span>Danh Sách Khung Giờ (Slots) Của Huấn Luyện Viên</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border p-4 space-y-2.5 transition-all ${
                s.status === 'OPEN'
                  ? 'border-cyan-500/30 bg-cyan-950/15 hover:border-cyan-500/60'
                  : 'border-slate-800 bg-slate-900/60 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{s.coachName}</span>
                <StatusBadge status={s.status} />
              </div>
              <p className="text-[11px] text-slate-400">{s.courseName}</p>
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
      </div>

      {/* Bookings List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span>Danh Sách Buổi Hẹn PT 1:1 Đã Lên Lịch</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Hội viên</th>
                <th className="py-3 px-4">HLV phụ trách</th>
                <th className="py-3 px-4">Khóa tập</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-semibold text-white">
                    {formatDateTime(b.startsAt)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-200">{b.memberName}</td>
                  <td className="py-3.5 px-4 text-orange-400">{b.coachName}</td>
                  <td className="py-3.5 px-4">{b.courseName}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {b.status === 'CONFIRMED' && (
                      <Button
                        size="sm"
                        variant="danger"
                        className="text-xs"
                        onClick={() => setCancelTarget(b)}
                      >
                        Hủy lịch
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Đặt Lịch Hộ */}
      <Modal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title="Xác nhận đặt lịch tập PT 1:1"
        description={`HLV: ${selectedSlot?.coachName} • Giờ tập: ${formatDateTime(selectedSlot?.startsAt)}`}
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <Select
            label="Chọn Hội viên"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            options={db.members.map((m) => ({
              value: m.id,
              label: `${m.fullName} (${m.membershipStatus === 'ACTIVE' ? 'Vé Gym Hợp lệ' : 'Vé Gym Hết Hạn'})`,
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
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Thẻ Gym hợp lệ. Số buổi PT còn lại: {memberPurchase?.availableCredits || 0} buổi.</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setSelectedSlot(null)}>
              Đóng
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={activeMember?.membershipStatus !== 'ACTIVE' || !memberPurchase}
            >
              Xác nhận Đặt Lịch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Hủy Lịch - Áp dụng quy tắc 4 Giờ */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Xác nhận hủy buổi tập PT 1:1"
        description="Quy tắc nghiệp vụ: Hệ thống tự động tính toán thời gian cắt giờ 4 tiếng"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-800/60 p-4 text-xs text-slate-300 space-y-1">
              <p>Hội viên: <strong className="text-white">{cancelTarget.memberName}</strong></p>
              <p>HLV: <strong className="text-white">{cancelTarget.coachName}</strong></p>
              <p>Giờ tập: <strong className="text-white">{formatDateTime(cancelTarget.startsAt)}</strong></p>
            </div>

            {/* Dynamic 4-hour cancellation rule indicator */}
            {isBeforeCutoff(cancelTarget.startsAt, 4) ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Được hoàn buổi / cấp lượt bù (CANCELLED_EARLY)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Thời gian báo trước $\ge 4$ giờ. Buổi tập sẽ được cộng trả lại ngay vào tài khoản hội viên.
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
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCancelTarget(null)}>
                Giữ lịch tập
              </Button>
              <Button variant="danger" onClick={handleCancelBooking}>
                Đồng ý Hủy Buổi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
