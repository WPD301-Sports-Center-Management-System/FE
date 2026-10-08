import { Calendar, Users, DollarSign, Clock, Dumbbell, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/shared/components/ui/stat-card'
import { Button } from '@/shared/components/ui/button'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { formatTime, formatDateTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'

export function CoachDashboardPage() {
  const coach = db.coaches[0]
  const todayBookings = db.bookings.filter((b) => b.coachId === coach.id)
  const openSlots = db.slots.filter((s) => s.coachId === coach.id && s.status === 'OPEN').length
  const studentsCount = db.purchases.filter((p) => p.coachId === coach.id).length
  const pendingPayout = db.payouts.find((p) => p.coachId === coach.id && p.status === 'PENDING')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bảng Điều Khiển HLV (WEB-COA-01)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Chào mừng HLV {coach.fullName} • Lịch giảng dạy và tiến độ học viên cá nhân
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/coach/slots">
            <Button size="sm" variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span>Quản lý Slots</span>
            </Button>
          </Link>
          <Link to="/coach/ai-recommendation">
            <Button size="sm" variant="primary" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Gợi ý bài tập từ AI</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Lịch Dạy Hôm Nay"
          value={todayBookings.length}
          description="Buổi tập PT 1:1 đã chốt"
          icon={<Calendar className="h-5 w-5" />}
          accentColor="orange"
        />
        <StatCard
          title="Khung Giờ Trống (Slots)"
          value={openSlots}
          description="Sẵn sàng cho học viên đặt"
          icon={<Clock className="h-5 w-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Học Viên Phụ Trách"
          value={studentsCount}
          description="Đang theo học gói cá nhân"
          icon={<Users className="h-5 w-5" />}
          accentColor="purple"
        />
        <StatCard
          title="Thu Nhập 60% Chờ Quyết Toán"
          value={formatVND(pendingPayout?.coachAmount || 0)}
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
            <span>Lịch Huấn Luyện Sắp Diễn Ra</span>
          </h2>
          <Link to="/coach/bookings">
            <Button size="sm" variant="outline" className="text-xs">
              Xem tất cả lịch hẹn
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          {todayBookings.map((b) => (
            <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{b.memberName}</h4>
                  <p className="text-xs text-slate-400">{b.courseName}</p>
                  <p className="text-[10px] font-mono text-cyan-300 mt-0.5">
                    {formatDateTime(b.startsAt)} – {formatTime(b.endsAt)}
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
      </div>
    </div>
  )
}
