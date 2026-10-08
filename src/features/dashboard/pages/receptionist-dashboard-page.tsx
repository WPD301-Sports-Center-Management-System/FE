import { CheckCircle2, Users, Calendar, DollarSign, HelpCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/shared/components/ui/stat-card'
import { Button } from '@/shared/components/ui/button'
import { mockCheckIns, mockMembers } from '@/mocks/fixtures-base'
import { mockBookings, mockSupportRequests } from '@/mocks/fixtures-training'
import { formatTime } from '@/shared/utils/date'

export function ReceptionistDashboardPage() {
  const todayCheckIns = mockCheckIns.length
  const upcomingBookings = mockBookings.filter((b) => b.status === 'CONFIRMED')
  const pendingTickets = mockSupportRequests.filter((t) => t.status !== 'RESOLVED').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quầy Tiếp Đón Lễ Tân (WEB-REC-01)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Điểm danh hội viên ra vào phòng gym, bán vé tập và điều phối lịch hẹn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/receptionist/check-in">
            <Button size="sm" variant="primary" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Quầy Check-in Nhanh</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Lượt Check-in Hôm Nay"
          value={todayCheckIns}
          description="Đang hoạt động trong phòng"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Lịch PT 1:1 Sắp Tới"
          value={upcomingBookings.length}
          description="Khung giờ chiều nay"
          icon={<Calendar className="h-5 w-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Tổng Hội Viên Quản Lý"
          value={mockMembers.length}
          description="Đang lưu trữ hồ sơ"
          icon={<Users className="h-5 w-5" />}
          accentColor="orange"
        />
        <StatCard
          title="Ticket Cần Hỗ Trợ"
          value={pendingTickets}
          description="Yêu cầu từ hội viên"
          icon={<HelpCircle className="h-5 w-5" />}
          accentColor="purple"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Thao Tác Nhanh Tại Quầy</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/receptionist/check-in"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center hover:border-emerald-500/40 hover:bg-slate-850 transition-colors"
          >
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
            <span className="text-xs font-bold text-white">Check-in Thẻ Gym</span>
            <span className="text-[10px] text-slate-500">Quét mã / gõ số thẻ</span>
          </Link>

          <Link
            to="/receptionist/membership-sale"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center hover:border-orange-500/40 hover:bg-slate-850 transition-colors"
          >
            <DollarSign className="h-6 w-6 text-orange-400 mb-2" />
            <span className="text-xs font-bold text-white">Bán / Gia Hạn Vé</span>
            <span className="text-[10px] text-slate-500">Gói 1 tháng & 3+1 tháng</span>
          </Link>

          <Link
            to="/receptionist/pt-sale"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center hover:border-sky-500/40 hover:bg-slate-850 transition-colors"
          >
            <Users className="h-6 w-6 text-sky-400 mb-2" />
            <span className="text-xs font-bold text-white">Bán Gói PT 1:1</span>
            <span className="text-[10px] text-slate-500">Chọn HLV & Khóa tập</span>
          </Link>

          <Link
            to="/receptionist/calendar"
            className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center hover:border-purple-500/40 hover:bg-slate-850 transition-colors"
          >
            <Calendar className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-xs font-bold text-white">Đặt Lịch Hộ</span>
            <span className="text-[10px] text-slate-500">Xếp slot cho hội viên</span>
          </Link>
        </div>
      </div>

      {/* Recent Check-ins List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Lượt Check-in Gần Nhất</h2>
          <Link to="/receptionist/check-in" className="text-xs text-orange-400 hover:underline flex items-center gap-1">
            <span>Đến bàn check-in</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          {mockCheckIns.map((chk) => (
            <div key={chk.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <img
                  src={chk.member?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'}
                  alt={chk.member?.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-xs font-bold text-white">{chk.member?.fullName}</p>
                  <p className="text-[10px] font-mono text-slate-400">{chk.member?.memberCode}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-emerald-400">{formatTime(chk.checkedInAt)}</span>
                <p className="text-[10px] text-slate-500">{chk.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
