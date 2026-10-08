import { DollarSign, Users, Calendar, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'
import { StatCard } from '@/shared/components/ui/stat-card'
import { formatVND } from '@/shared/utils/currency'
import { mockCoaches, mockMembers } from '@/mocks/fixtures-base'
import { mockBookings, mockEquipment } from '@/mocks/fixtures-training'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'

export function ManagerDashboardPage() {
  const activeMembersCount = mockMembers.filter((m) => m.membershipStatus === 'ACTIVE').length
  const todayBookingsCount = mockBookings.length
  const underMaintenanceCount = mockEquipment.filter((e) => e.status === 'UNDER_MAINTENANCE').length

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bảng điều khiển Quản Lý (Manager)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tổng quan doanh thu, chia sẻ doanh thu 60/40, hội viên và hoạt động phòng Gym
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/manager/reports">
            <Button size="sm" variant="outline">
              Báo cáo tài chính
            </Button>
          </Link>
          <Link to="/manager/approvals">
            <Button size="sm" variant="primary">
              Duyệt HLV & Gói tập
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Tổng Doanh Thu Tháng"
          value={formatVND(5490000)}
          change="+18.5% so với tháng trước"
          isPositive={true}
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="orange"
        />
        <StatCard
          title="Phần Hưởng Gym (40%)"
          value={formatVND(2790000)}
          description="Vé Gym 100% + 40% Gói PT"
          icon={<TrendingUp className="h-5 w-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Khoản HLV Chờ Nhận (60%)"
          value={formatVND(2700000)}
          description="1 khoản cần quyết toán"
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Hội Viên Hoạt Động"
          value={activeMembersCount}
          description={`Có ${todayBookingsCount} lịch PT hôm nay`}
          isPositive={true}
          icon={<Users className="h-5 w-5" />}
          accentColor="purple"
        />
      </div>

      {/* Grid: Alerts & Top Coaches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): System Alerts */}
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>Cảnh Báo Vận Hành & Chờ Xử Lý</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">1 Gói tập PT HLV đề xuất đang chờ duyệt</p>
                  <p className="text-[10px] text-slate-400">Đỗ Thùy Trang • 12 Buổi Pilates Cải Thiện Vóc Dáng</p>
                </div>
              </div>
              <Link to="/manager/approvals">
                <Button size="sm" variant="outline" className="text-xs">
                  Xem & Duyệt
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/20 p-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {underMaintenanceCount} Thiết bị đang trong trạng thái cần bảo trì
                  </p>
                  <p className="text-[10px] text-slate-400">Reformer Pilates Allegro 2 • Studio Pilates & Yoga</p>
                </div>
              </div>
              <Link to="/manager/equipment">
                <Button size="sm" variant="outline" className="text-xs">
                  Kiểm tra
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Top Coaches */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-400" />
            <span>Top Huấn Luyện Viên</span>
          </h2>

          <div className="space-y-4">
            {mockCoaches.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <img src={c.avatarUrl} alt={c.fullName} className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">{c.fullName}</p>
                    <p className="text-[10px] text-slate-400">{c.specialization}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400">★ {c.averageRating}</span>
                  <p className="text-[10px] text-slate-500">{c.reviewCount} đánh giá</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
