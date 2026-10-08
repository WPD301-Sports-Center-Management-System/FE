import { useState } from 'react'
import { CheckCircle2, UserX, XCircle, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, handleMockBookingCancel } from '@/mocks/mock-server'
import { formatDateTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import type { Booking } from '@/shared/types/api'

export function CoachBookingDetailPage() {
  const coach = db.coaches[0]
  const [bookings, setBookings] = useState<Booking[]>(db.bookings.filter((b) => b.coachId === coach.id))
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null)
  const [coachCancelReason, setCoachCancelReason] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleMarkCompleted = (b: Booking) => {
    b.status = 'COMPLETED'
    const pur = db.purchases.find((p) => p.id === b.purchaseId)
    if (pur) {
      pur.consumedCredits += 1
      pur.reservedCredits = Math.max(0, pur.reservedCredits - 1)
    }
    setBookings([...db.bookings.filter((item) => item.coachId === coach.id)])
    setStatusMessage(`Đã đánh dấu hoàn thành buổi tập với ${b.memberName}!`)
  }

  const handleMarkNoShow = (b: Booking) => {
    b.status = 'NO_SHOW'
    const pur = db.purchases.find((p) => p.id === b.purchaseId)
    if (pur) {
      pur.consumedCredits += 1
      pur.reservedCredits = Math.max(0, pur.reservedCredits - 1)
    }
    setBookings([...db.bookings.filter((item) => item.coachId === coach.id)])
    setStatusMessage(`Đã ghi nhận vắng mặt (No-Show) cho ${b.memberName}. Lượt tập đã bị trừ.`)
  }

  const handleConfirmCoachCancel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancelModalBooking || !coachCancelReason.trim()) return

    const res = handleMockBookingCancel(cancelModalBooking.id, 'COACH', coachCancelReason)
    setBookings([...db.bookings.filter((item) => item.coachId === coach.id)])
    setCancelModalBooking(null)
    setCoachCancelReason('')
    setStatusMessage(res.message)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản Lý Lịch Hẹn PT 1:1 (WEB-COA-04)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Điểm danh hội viên, xác nhận hoàn tất buổi dạy hoặc xử lý hủy lịch đột xuất
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white">{b.memberName}</h3>
                <StatusBadge status={b.status} />
              </div>
              <p className="text-xs text-slate-400">{b.courseName}</p>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDateTime(b.startsAt)}</span>
              </div>
            </div>

            {b.status === 'CONFIRMED' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-400"
                  onClick={() => setCancelModalBooking(b)}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Coach báo bận
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs text-amber-400"
                  onClick={() => handleMarkNoShow(b)}
                >
                  <UserX className="h-3.5 w-3.5 mr-1" />
                  Hội viên vắng
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs"
                  onClick={() => handleMarkCompleted(b)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Hoàn thành buổi tập
                </Button>
              </div>
            )}

            {b.status === 'COMPLETED' && (
              <Link to="/coach/training-results">
                <Button size="sm" variant="outline" className="text-xs gap-1.5">
                  <span>Ghi Training Result</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Coach Cancel Modal */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
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
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCancelModalBooking(null)}>
              Đóng
            </Button>
            <Button type="submit" variant="danger">
              Xác nhận hủy buổi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
