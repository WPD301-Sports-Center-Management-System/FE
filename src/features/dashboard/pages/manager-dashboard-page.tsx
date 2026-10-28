import { useState, useEffect, useCallback } from 'react'
import { Avatar } from '@/shared/components/ui/avatar'
import { DollarSign, Users, Calendar, AlertTriangle, TrendingUp, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react'
import { StatCard } from '@/shared/components/ui/stat-card'
import { formatVND } from '@/shared/utils/currency'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { ManagerDashboardData } from '@/features/dashboard/types/dashboard.types'
import type { CoachSummary } from '@/shared/types/api'

export function ManagerDashboardPage() {
  const [stats, setStats] = useState<ManagerDashboardData | null>(null)
  const [coaches, setCoaches] = useState<CoachSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [statsData, coachesRes] = await Promise.all([
        dashboardService.getManagerDashboardStats(),
        coachesService.getCoaches({ limit: 5 }),
      ])
      setStats(statsData)
      setCoaches(coachesRes.data || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải số liệu bảng điều khiển.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const totalGross = (stats?.revenue.membershipRevenue || 0) + (stats?.revenue.ptGross || 0)
  const gymTotalShare = (stats?.revenue.membershipRevenue || 0) + (stats?.revenue.ptGymShare || 0)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Bảng điều khiển Quản Lý (Manager)</h1>
          <p className="text-xs text-text-muted mt-1">
            Tổng quan doanh thu, chia sẻ doanh thu 60/40, hội viên và hoạt động phòng Gym thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={loadDashboard}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
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

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Tổng Doanh Thu"
          value={isLoading ? '...' : formatVND(totalGross)}
          change={`${stats?.revenue.paymentCount || 0} đơn thanh toán`}
          isPositive={true}
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="orange"
        />
        <StatCard
          title="Phần Hưởng Gym (40%)"
          value={isLoading ? '...' : formatVND(gymTotalShare)}
          description="Vé Gym 100% + 40% Gói PT"
          icon={<TrendingUp className="h-5 w-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Khoản HLV Cần Nhận (60%)"
          value={isLoading ? '...' : formatVND(stats?.revenue.coachPayable || 0)}
          description={`Chờ chuyển: ${formatVND(stats?.revenue.coachPending || 0)}`}
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Hội Viên Hệ Thống"
          value={isLoading ? '...' : stats?.members || 0}
          description={`Có ${stats?.coaches || 0} HLV chuyên trách`}
          isPositive={true}
          icon={<Users className="h-5 w-5" />}
          accentColor="purple"
        />
      </div>

      {/* Grid: Alerts & Top Coaches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): System Alerts */}
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-border-subtle bg-bg-surface p-6 backdrop-blur-md">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span>Tình Trạng Vận Hành & Hoạt Động</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/20 p-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">
                    Lịch tập PT 1:1 hôm nay: {stats?.bookingsToday || 0} buổi
                  </p>
                  <p className="text-xs text-text-muted">Được giám sát và cập nhật trực tiếp theo thời gian thực</p>
                </div>
              </div>
              <Link to="/receptionist/calendar">
                <Button size="sm" variant="outline" className="text-xs">
                  Xem lịch
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface-muted p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-bg-surface p-2 text-text-muted">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">
                    Sự cố thiết bị ghi nhận: {stats?.equipmentIssues || 0} mục
                  </p>
                  <p className="text-xs text-text-muted">Thiết bị & cơ sở vật chất phòng tập</p>
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
        <div className="space-y-4 rounded-2xl border border-border-subtle bg-bg-surface p-6 backdrop-blur-md">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Huấn Luyện Viên ({coaches.length})</span>
          </h2>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {coaches.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-border-subtle pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar src={c.avatarUrl} name={c.fullName} size={36} className="rounded-full" />
                  <div>
                    <p className="text-xs font-bold text-text-primary">{c.fullName}</p>
                    <p className="text-xs text-text-muted">{c.specialization || 'HLV Thể hình & PT'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-warning">★ {c.averageRating || 5.0}</span>
                  <p className="text-xs text-text-muted">{c.reviewCount || 0} đánh giá</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
