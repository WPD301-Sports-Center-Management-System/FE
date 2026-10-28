import { useState, useEffect, useCallback } from 'react'
import { Avatar } from '@/shared/components/ui/avatar'
import {
  CheckCircle2,
  Users,
  Calendar,
  DollarSign,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/shared/components/ui/stat-card'
import { Button } from '@/shared/components/ui/button'
import { formatTime } from '@/shared/utils/date'
import { dashboardService } from '../services/dashboard.service'
import type { ReceptionistDashboardData } from '../types/dashboard.types'
import { checkInsService } from '@/features/memberships/services/check-ins.service'
import type { CheckIn } from '@/shared/types/api'


export function ReceptionistDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashData, setDashData] = useState<ReceptionistDashboardData | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, checkInsRes] = await Promise.allSettled([
        dashboardService.getReceptionistDashboard(),
        checkInsService.getCheckIns(),
      ])

      if (dashRes.status === 'fulfilled') {
        setDashData(dashRes.value)
      }
      if (checkInsRes.status === 'fulfilled') {
        setCheckIns(checkInsRes.value.data || [])
      }

      // If all major requests failed, report an error
      if (
        dashRes.status === 'rejected' &&
        checkInsRes.status === 'rejected'
      ) {
        throw new Error('Không thể tải dữ liệu dashboard lễ tân. Vui lòng thử lại.')
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tải dữ liệu dashboard lễ tân.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Totals come from the server (whole center, today in UTC+7); "—" when they could not be loaded.
  const count = (value?: number) => (dashData ? value ?? 0 : '—')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Quầy Tiếp Đón Lễ Tân</h1>
          <p className="text-xs text-text-muted mt-1">
            Điểm danh hội viên ra vào phòng gym, bán vé tập và điều phối lịch hẹn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={loadData}
            disabled={loading}
            className="gap-2 border border-border-subtle text-text-primary hover:bg-bg-surface-muted"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Link to="/receptionist/check-in">
            <Button size="sm" variant="primary" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Quầy Check-in Nhanh</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-danger">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadData} className="border-danger/50 text-danger hover:bg-danger/20">
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-muted">Đang tải dữ liệu quầy lễ tân...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard
              title="Check-in hôm nay"
              value={count(dashData?.checkinsToday)}
              description={dashData ? `${dashData.insideGym} người đang trong phòng tập` : 'Chưa tải được số liệu'}
              icon={<CheckCircle2 className="h-5 w-5" />}
              accentColor="emerald"
            />
            <StatCard
              title="Chờ thanh toán"
              value={count(dashData?.pendingPayments)}
              description="Giao dịch chưa hoàn tất"
              icon={<DollarSign className="h-5 w-5" />}
              accentColor="orange"
            />
            <StatCard
              title="Vé gym sắp hết hạn"
              value={count(dashData?.expiringSubscriptions)}
              description="Trong 7 ngày tới"
              icon={<Clock className="h-5 w-5" />}
              accentColor="purple"
            />
            <StatCard
              title="Buổi PT hôm nay"
              value={count(dashData?.ptSessionsToday)}
              description="Đã đặt trong ngày"
              icon={<Calendar className="h-5 w-5" />}
              accentColor="cyan"
            />
            <StatCard
              title="Hội viên"
              value={count(dashData?.activeMembers)}
              description="Tài khoản đang hoạt động"
              icon={<Users className="h-5 w-5" />}
              accentColor="orange"
            />
            <StatCard
              title="Yêu cầu hỗ trợ"
              value={count(dashData?.openSupportRequests)}
              description="Đang chờ xử lý"
              icon={<HelpCircle className="h-5 w-5" />}
              accentColor="purple"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4">
            <h2 className="text-base font-bold text-text-primary">Thao Tác Nhanh Tại Quầy</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                to="/receptionist/check-in"
                className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface p-4 text-center hover:border-emerald-500/40 hover:bg-bg-surface-muted transition-colors"
              >
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
                <span className="text-xs font-bold text-text-primary">Check-in Thẻ Gym</span>
                <span className="text-xs text-text-muted">Quét mã / gõ số thẻ</span>
              </Link>

              <Link
                to="/receptionist/membership-sale"
                className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface p-4 text-center hover:border-orange-500/40 hover:bg-bg-surface-muted transition-colors"
              >
                <DollarSign className="h-6 w-6 text-primary mb-2" />
                <span className="text-xs font-bold text-text-primary">Bán / Gia Hạn Vé</span>
                <span className="text-xs text-text-muted">Gói 1 tháng & 3+1 tháng</span>
              </Link>

              <Link
                to="/receptionist/pt-sale"
                className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface p-4 text-center hover:border-sky-500/40 hover:bg-bg-surface-muted transition-colors"
              >
                <Users className="h-6 w-6 text-sky-500 mb-2" />
                <span className="text-xs font-bold text-text-primary">Bán Gói PT 1:1</span>
                <span className="text-xs text-text-muted">Chọn HLV & Khóa tập</span>
              </Link>

              <Link
                to="/receptionist/calendar"
                className="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-bg-surface p-4 text-center hover:border-purple-500/40 hover:bg-bg-surface-muted transition-colors"
              >
                <Calendar className="h-6 w-6 text-purple-500 mb-2" />
                <span className="text-xs font-bold text-text-primary">Đặt Lịch Hộ</span>
                <span className="text-xs text-text-muted">Xếp slot cho hội viên</span>
              </Link>
            </div>
          </div>

          {/* Recent Check-ins List */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">Lượt Check-in Gần Nhất</h2>
              <Link to="/receptionist/check-in" className="text-xs text-primary hover:underline flex items-center gap-1">
                <span>Đến bàn check-in</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {checkIns.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-xs">
                Chưa có lượt check-in nào trong ngày hôm nay.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {checkIns.slice(0, 5).map((chk) => (
                  <div key={chk.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={chk.member?.avatarUrl} name={chk.member?.fullName || 'Hội viên'} size={32} className="rounded-full" />
                      <div>
                        <p className="text-xs font-bold text-text-primary">{chk.member?.fullName || 'Hội viên'}</p>
                        <p className="text-xs font-mono text-text-muted">{chk.member?.memberCode || chk.memberId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-success font-semibold">{formatTime(chk.checkedInAt)}</span>
                      {chk.note && <p className="text-xs text-text-muted">{chk.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

