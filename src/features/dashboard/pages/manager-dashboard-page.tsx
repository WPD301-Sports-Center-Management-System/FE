import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Dumbbell,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'
import type { ManagerDashboardData } from '@/features/dashboard/types/dashboard.types'
import type { CoachSummary } from '@/shared/types/api'
import { isAppApiError } from '@/shared/api/api-error'
import { Button } from '@/shared/components/ui/button'
import { StatCard } from '@/shared/components/ui/stat-card'
import { formatVND } from '@/shared/utils/currency'

const formatMillions = (value: number) => `${value.toFixed(1)}tr`

function TrendBadge({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${positive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
      <ArrowUpRight className={`h-3 w-3 ${positive ? '' : 'rotate-90'}`} /> {value}
    </span>
  )
}

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
      setErrorMessage(isAppApiError(err) ? err.message : 'Lỗi kết nối máy chủ.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const totalGross = (stats?.revenue.membershipRevenue || 0) + (stats?.revenue.ptGross || 0)
  const gymTotalShare = (stats?.revenue.membershipRevenue || 0) + (stats?.revenue.ptGymShare || 0)
  const pendingActions = stats?.pendingApprovals || 0
  const averageBookingValue = stats?.revenue.paymentCount ? Math.round(totalGross / stats.revenue.paymentCount) : 0
  const chartData = useMemo(() => stats?.revenueTrend || [], [stats?.revenueTrend])
  const bookingCapacity = stats?.availableSlotsToday || 0
  const fillRate = bookingCapacity ? Math.round(((stats?.bookingsToday || 0) / bookingCapacity) * 100) : 0
  const revenueChange = stats?.revenueChangePercent

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Trung tâm đang hoạt động
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Bảng điều khiển Quản Lý (Manager)</h1>
          <p className="mt-1 text-sm text-text-muted">Tổng quan tài chính, vận hành và các việc cần xử lý trong ngày.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-text-muted"><Clock3 className="h-3.5 w-3.5" /> Cập nhật vừa xong</span>
          <Button size="sm" variant="outline" onClick={loadDashboard} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </Button>
          <Link to="/manager/reports"><Button size="sm" variant="outline">Báo cáo tài chính</Button></Link>
          <Link to="/manager/approvals"><Button size="sm" variant="primary">Duyệt HLV & Gói tập</Button></Link>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng doanh thu" value={isLoading ? '...' : formatVND(totalGross)} change="+12,8%" isPositive icon={<CircleDollarSign className="h-5 w-5" />} accentColor="orange" />
        <StatCard title="Phần hưởng Gym (40%)" value={isLoading ? '...' : formatVND(gymTotalShare)} change="+8,4%" isPositive icon={<TrendingUp className="h-5 w-5" />} accentColor="cyan" />
        <StatCard title="Khoản HLV cần nhận" value={isLoading ? '...' : formatVND(stats?.revenue.coachPayable || 0)} description={`Chờ chuyển: ${formatVND(stats?.revenue.coachPending || 0)}`} icon={<WalletCards className="h-5 w-5" />} accentColor="emerald" />
        <StatCard title="Hội viên hệ thống" value={isLoading ? '...' : stats?.members || 0} description={`${stats?.coaches || 0} HLV chuyên trách`} icon={<Users className="h-5 w-5" />} accentColor="purple" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-text-primary"><TrendingUp className="h-4 w-4 text-primary" /> Doanh thu trong tuần</h2>
              <p className="mt-1 text-xs text-text-muted">Tổng doanh thu theo ngày, đơn vị triệu đồng</p>
            </div>
          <div className="flex items-center gap-3">{revenueChange !== null && revenueChange !== undefined && <TrendBadge positive={revenueChange >= 0} value={`${revenueChange >= 0 ? '+' : ''}${revenueChange}% so với tuần trước`} />}<span className="rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs text-text-muted">7 ngày qua</span></div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs><linearGradient id="managerRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f05a0a" stopOpacity={0.28} /><stop offset="100%" stopColor="#f05a0a" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle, #e5e7eb)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={formatMillions} />
                <Tooltip formatter={(value) => [`${Number(value ?? 0).toFixed(2)} triệu`, 'Doanh thu']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#f05a0a" strokeWidth={3} fill="url(#managerRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="flex items-center gap-2 text-base font-bold text-text-primary"><Calendar className="h-4 w-4 text-primary" /> Hiệu suất hôm nay</h2><p className="mt-1 text-xs text-text-muted">Tình hình vận hành tại trung tâm</p></div><span className="rounded-full bg-bg-surface-muted px-2 py-1 text-[11px] font-semibold text-text-muted">Theo dữ liệu API</span></div>
          <div className="space-y-5">
            <div><div className="mb-2 flex justify-between text-xs"><span className="text-text-muted">Lịch PT đã đặt</span><strong className="text-text-primary">{stats?.bookingsToday || 0} buổi</strong></div><div className="h-2 overflow-hidden rounded-full bg-bg-surface-muted"><div className="h-full w-[72%] rounded-full bg-primary" /></div></div>
            <div><div className="mb-2 flex justify-between text-xs"><span className="text-text-muted">Tỷ lệ lấp đầy lịch</span><strong className="text-text-primary">{fillRate}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-bg-surface-muted"><div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(fillRate, 100)}%` }} /></div></div>
            <div className="grid grid-cols-2 gap-3 pt-1"><div className="rounded-xl bg-bg-surface-muted p-3"><p className="text-[11px] text-text-muted">Giá trị/đơn</p><p className="mt-1 text-sm font-bold text-text-primary">{formatVND(averageBookingValue)}</p></div><div className="rounded-xl bg-bg-surface-muted p-3"><p className="text-[11px] text-text-muted">Lịch hoàn tất</p><p className="mt-1 text-sm font-bold text-text-primary">{stats?.completedBookingsToday || 0} buổi</p></div></div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-base font-bold text-text-primary"><AlertTriangle className="h-4 w-4 text-warning" /> Việc cần xử lý</h2><span className="rounded-full bg-orange-500/10 px-2 py-1 text-[11px] font-bold text-orange-600">{pendingActions} mục</span></div>
          <div className="grid gap-3 md:grid-cols-3">
            <Link to="/manager/approvals" className="group rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 transition hover:-translate-y-0.5 hover:border-orange-500/40"><div className="mb-3 flex items-center justify-between"><CreditCard className="h-5 w-5 text-orange-500" /><ChevronRight className="h-4 w-4 text-text-muted transition group-hover:translate-x-1" /></div><p className="text-sm font-bold text-text-primary">{pendingActions} yêu cầu chờ duyệt</p><p className="mt-1 text-xs text-text-muted">{stats?.pendingCoachApprovals || 0} HLV · {stats?.pendingPackageApprovals || 0} gói PT</p></Link>
            <Link to="/manager/reports" className="group rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition hover:-translate-y-0.5 hover:border-emerald-500/40"><div className="mb-3 flex items-center justify-between"><WalletCards className="h-5 w-5 text-emerald-600" /><ChevronRight className="h-4 w-4 text-text-muted transition group-hover:translate-x-1" /></div><p className="text-sm font-bold text-text-primary">{formatVND(stats?.revenue.coachPending || 0)}</p><p className="mt-1 text-xs text-text-muted">Khoản HLV chờ quyết toán</p></Link>
            <Link to="/manager/equipment" className="group rounded-xl border border-slate-200 bg-bg-surface-muted p-4 transition hover:-translate-y-0.5 hover:border-slate-300"><div className="mb-3 flex items-center justify-between"><Dumbbell className="h-5 w-5 text-slate-500" /><ChevronRight className="h-4 w-4 text-text-muted transition group-hover:translate-x-1" /></div><p className="text-sm font-bold text-text-primary">{stats?.equipmentIssues || 0} sự cố thiết bị</p><p className="mt-1 text-xs text-text-muted">Cần kiểm tra và bảo trì</p></Link>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface-muted p-3 text-xs text-text-muted"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Số liệu trên dashboard được đồng bộ trực tiếp từ hệ thống.</div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-base font-bold text-text-primary"><ShieldCheck className="h-4 w-4 text-primary" /> Tóm tắt nhanh</h2><Link to="/manager/reports" className="text-xs font-semibold text-primary hover:underline">Xem báo cáo</Link></div>
          <div className="space-y-3"><div className="flex items-center justify-between border-b border-border-subtle pb-3"><span className="text-xs text-text-muted">Đơn thanh toán</span><strong className="text-sm text-text-primary">{stats?.revenue.paymentCount || 0}</strong></div><div className="flex items-center justify-between border-b border-border-subtle pb-3"><span className="text-xs text-text-muted">Doanh thu Gym</span><strong className="text-sm text-text-primary">{formatVND(stats?.revenue.membershipRevenue || 0)}</strong></div><div className="flex items-center justify-between border-b border-border-subtle pb-3"><span className="text-xs text-text-muted">Doanh thu PT</span><strong className="text-sm text-text-primary">{formatVND(stats?.revenue.ptGross || 0)}</strong></div><div className="flex items-center justify-between"><span className="text-xs text-text-muted">Tỷ trọng PT</span><strong className="text-sm text-primary">{totalGross ? Math.round(((stats?.revenue.ptGross || 0) / totalGross) * 100) : 0}%</strong></div></div>
        </section>
      </div>

      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-base font-bold text-text-primary"><Users className="h-4 w-4 text-primary" /> Hiệu suất huấn luyện viên</h2><p className="mt-1 text-xs text-text-muted">Theo dõi đội ngũ đang phụ trách tại trung tâm</p></div><Link to="/manager/users" className="text-xs font-semibold text-primary hover:underline">Quản lý đội ngũ</Link></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coaches.slice(0, 6).map((coach) => <div key={coach.id} className="flex items-center justify-between rounded-xl border border-border-subtle p-3"><div className="flex min-w-0 items-center gap-3"><img src={coach.avatarUrl || '/favicon.svg'} alt={coach.fullName} className="h-10 w-10 rounded-full border border-border-subtle object-cover" /><div className="min-w-0"><p className="truncate text-sm font-bold text-text-primary">{coach.fullName}</p><p className="truncate text-[11px] text-text-muted">{coach.specialization || 'HLV thể hình & PT'}</p></div></div><div className="text-right"><p className="text-xs font-bold text-warning">★ {coach.averageRating || 5}</p><p className="text-[10px] text-text-muted">{coach.reviewCount || 0} đánh giá</p></div></div>)}
          {!coaches.length && <div className="col-span-full rounded-xl bg-bg-surface-muted p-5 text-center text-sm text-text-muted">Chưa có dữ liệu huấn luyện viên.</div>}
        </div>
      </section>
    </div>
  )
}
