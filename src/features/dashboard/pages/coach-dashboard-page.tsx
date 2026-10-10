import { useState, useEffect } from 'react'
import { Calendar, Users, DollarSign, Clock, Dumbbell, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/shared/components/ui/stat-card'
import { Button } from '@/shared/components/ui/button'
import { formatVND } from '@/shared/utils/currency'
import { formatTime, formatDateTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { useAuth } from '@/features/auth/context/auth-context'
import { coachesService } from '@/features/coaches/services/coaches.service'
import type { Booking, CoachSlot, Purchase, CoachPayout } from '@/shared/types/api'

export function CoachDashboardPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [slots, setSlots] = useState<CoachSlot[]>([])
  const [packages, setPackages] = useState<Purchase[]>([])
  const [payouts, setPayouts] = useState<CoachPayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadCoachDashboardData = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [bookingsRes, slotsRes, pkgsRes, payoutsRes] = await Promise.allSettled([
        coachesService.getMyBookings(),
        coachesService.getMySlots(),
        coachesService.getMyPackages(),
        coachesService.getMyPayouts(),
      ])

      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data || [])
      if (slotsRes.status === 'fulfilled') setSlots(slotsRes.value.data || [])
      if (pkgsRes.status === 'fulfilled') setPackages(pkgsRes.value.data || [])
      if (payoutsRes.status === 'fulfilled') setPayouts(payoutsRes.value.data || [])
    } catch {
      setErrorMessage('Không thể tải dữ liệu bảng điều khiển HLV.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCoachDashboardData()
  }, [])

  const todayBookings = bookings.filter((b) => b.status === 'CONFIRMED')
  const openSlotsCount = slots.filter((s) => s.status === 'OPEN').length
  const activeStudentsCount = packages.filter((p) => p.status === 'ACTIVE').length
  const pendingPayoutTotal = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((acc, curr) => acc + Number(curr.coachAmount || 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bảng Điều Khiển HLV (WEB-COA-01)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Chào mừng HLV {user?.fullName || 'Huấn luyện viên'} • Lịch giảng dạy và tiến độ học viên cá nhân
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={loadCoachDashboardData}
            disabled={isLoading}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Link to="/coach/slots">
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <Calendar className="h-4 w-4" />
              <span>Quản lý Slots</span>
            </Button>
          </Link>
          <Link to="/coach/ai-recommendation">
            <Button size="sm" variant="primary" className="gap-2 text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Gợi ý bài tập AI</span>
            </Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Lịch Dạy Sắp Tới"
          value={isLoading ? '...' : todayBookings.length}
          description="Buổi tập PT 1:1 đã xác nhận"
          icon={<Calendar className="h-5 w-5" />}
          accentColor="orange"
        />
        <StatCard
          title="Khung Giờ Trống (Slots)"
          value={isLoading ? '...' : openSlotsCount}
          description="Sẵn sàng cho học viên đặt"
          icon={<Clock className="h-5 w-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Học Viên Phụ Trách"
          value={isLoading ? '...' : (activeStudentsCount || packages.length)}
          description="Đang theo học gói cá nhân"
          icon={<Users className="h-5 w-5" />}
          accentColor="purple"
        />
        <StatCard
          title="Thu Nhập 60% Chờ Quyết Toán"
          value={isLoading ? '...' : formatVND(pendingPayoutTotal)}
          description="Từ các hợp đồng PT thành công"
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Today's Schedule */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span>Lịch Huấn Luyện PT 1:1 Gần Nhất</span>
          </h2>
          <Link to="/coach/bookings">
            <Button size="sm" variant="outline" className="text-xs">
              Xem tất cả lịch hẹn
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : bookings.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.memberName || (b as any).member?.fullName || 'Hội viên'}</h4>
                    <p className="text-xs text-slate-400">{b.courseName || 'Khóa PT 1:1'}</p>
                    <p className="text-[10px] font-mono text-cyan-300 mt-0.5">
                      {formatDateTime(b.startsAt || (b as any).slot?.startsAt)} – {formatTime(b.endsAt || (b as any).slot?.endsAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <Link to="/coach/training-results">
                    <Button size="sm" variant="primary" className="text-xs">
                      Ghi kết quả tập
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-8">
            Hiện tại bạn chưa có lịch hẹn PT 1:1 nào.
          </p>
        )}
      </div>
    </div>
  )
}
