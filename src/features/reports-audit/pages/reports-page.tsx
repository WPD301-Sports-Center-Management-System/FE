import { centerDate } from '@/shared/utils/date'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  RefreshCw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Package,
  Calendar,
  Users,
  BookOpen,
} from 'lucide-react'
import { formatVND } from '@/shared/utils/currency'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { reportsService } from '@/features/reports-audit/services/reports.service'
import { downloadBlob } from '@/shared/utils/download'
import { isAppApiError } from '@/shared/api/api-error'
import { withdrawalLabel, type Withdrawal } from '@/features/fixed-pt/wallet-api'
import type {
  RevenueReportData,
  PtPackagesReportData,
  BookingReportItem,
  CoachReportItem,
  CourseReportItem,
  ReportType,
} from '@/features/reports-audit/types/reports.types'

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('revenue')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Tab Data States
  const [revenue, setRevenue] = useState<RevenueReportData | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [ptPackages, setPtPackages] = useState<PtPackagesReportData | null>(null)
  const [bookings, setBookings] = useState<BookingReportItem[]>([])
  const [coaches, setCoaches] = useState<CoachReportItem[]>([])
  const [courses, setCourses] = useState<CourseReportItem[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)


  const loadTabData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    const dateParams = {
      from: dateFrom ? dateFrom : undefined,
      to: dateTo ? dateTo : undefined,
    }

    try {
      if (activeTab === 'revenue') {
        const [revData, payoutsRes] = await Promise.all([
          reportsService.getRevenueReport(dateParams),
          reportsService.getCoachWithdrawals({ limit: 50 }),
        ])
        setRevenue(revData)
        setWithdrawals(payoutsRes.data || [])
      } else if (activeTab === 'pt-packages') {
        const ptData = await reportsService.getPtPackagesReport(dateParams)
        setPtPackages(ptData)
      } else if (activeTab === 'bookings') {
        const bookingData = await reportsService.getBookingsReport(dateParams)
        setBookings(bookingData)
      } else if (activeTab === 'coaches') {
        const coachesData = await reportsService.getCoachesReport()
        setCoaches(coachesData)
      } else if (activeTab === 'courses') {
        const coursesData = await reportsService.getCoursesReport()
        setCourses(coursesData)
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải báo cáo từ máy chủ.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, dateFrom, dateTo])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true)
    setErrorMessage(null)
    try {
      const blob = await reportsService.exportReport({
        reportType: activeTab,
        format,
        from: dateFrom ? dateFrom : undefined,
        to: dateTo ? dateTo : undefined,
      })
      const ext = format === 'csv' ? 'csv' : 'xlsx'
      const filename = `bao_cao_${activeTab}_${centerDate()}.${ext}`
      await downloadBlob(blob, filename)
      setSuccessMessage(`Đã xuất báo cáo ${filename} thành công!`)
    } catch (err: any) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể xuất báo cáo.')
      } else {
        setErrorMessage(err.message || 'Lỗi khi tải file báo cáo.')
      }
    } finally {
      setIsExporting(false)
    }
  }


  const totalPtGross = revenue?.ptGross || 0
  const gymShare = revenue?.ptGymShare || 0
  const coachPayable = revenue?.coachPayable || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Báo Cáo Tài Chính & Quyết Toán HLV</h1>
          <p className="text-xs text-text-muted mt-1">
            Tổng hợp dữ liệu doanh thu, gói PT, lịch tập, HLV, khóa học và thiết bị
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadTabData}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất CSV'}</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-border-subtle gap-1">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'revenue'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Doanh thu & Quyết toán</span>
        </button>
        <button
          onClick={() => setActiveTab('pt-packages')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'pt-packages'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Gói tập PT</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'bookings'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Lịch tập PT</span>
        </button>
        <button
          onClick={() => setActiveTab('coaches')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'coaches'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Huấn luyện viên</span>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'courses'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Khóa tập</span>
        </button>
      </div>

      {/* Date Filter Bar (Applies to time-filtered reports) */}
      {['revenue', 'pt-packages', 'bookings'].includes(activeTab) && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border-subtle bg-bg-surface-muted text-xs">
          <span className="text-text-muted font-semibold">Khoảng thời gian:</span>
          <div className="flex items-center gap-2">
            <label className="text-text-muted">Từ:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-input px-2.5 py-1 text-xs text-text-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-text-muted">Đến:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-input px-2.5 py-1 text-xs text-text-primary"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="text-xs h-7 text-text-muted hover:text-text-primary"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {/* Tab Contents */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-muted">Đang tổng hợp dữ liệu báo cáo...</p>
        </div>
      ) : activeTab === 'revenue' ? (
        <div className="space-y-6">
          {/* Revenue Split Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-muted uppercase">Tổng Doanh Thu Hợp Đồng PT</p>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary">{formatVND(totalPtGross)}</h3>
              <p className="text-xs text-text-muted">
                {revenue?.paymentCount || 0} đơn thanh toán • Membership: {formatVND(revenue?.membershipRevenue || 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase">Phần Gym Giữ Lại (40%)</p>
                <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-300">{formatVND(gymShare)}</h3>
              <p className="text-xs text-text-muted">Chi phí vận hành mặt bằng & máy móc</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Phần Quyết Toán HLV (60%)</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{formatVND(coachPayable)}</h3>
              <p className="text-xs text-text-muted">
                Còn chờ chi trả: {formatVND(revenue?.coachPending || 0)}
              </p>
            </div>
          </div>

          {/* Coach withdrawals */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-text-primary">Yêu cầu rút tiền của Huấn Luyện Viên</h2>

            {withdrawals.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-xs">
                Chưa có yêu cầu rút tiền nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text-primary">
                  <thead className="border-b border-border-subtle text-text-muted uppercase bg-bg-surface-muted">
                    <tr>
                      <th className="py-3 px-4">Huấn Luyện Viên</th>
                      <th className="py-3 px-4">Mã</th>
                      <th className="py-3 px-4">Ngày yêu cầu</th>
                      <th className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Số tiền</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Mã tham chiếu NH</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-bg-surface-muted/50">
                        <td className="py-3.5 px-4 font-semibold text-text-primary">{w.coach?.user.fullName || w.coachId.slice(0, 8)}</td>
                        <td className="py-3.5 px-4 font-mono">{w.code}</td>
                        <td className="py-3.5 px-4">{w.createdAt.slice(0, 10)}</td>
                        <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-300 font-bold">{formatVND(w.amount)}</td>
                        <td className="py-3.5 px-4">{withdrawalLabel[w.status] ?? w.status}</td>
                        <td className="py-3.5 px-4 font-mono text-text-muted">{w.transferRef ? w.transferRef : '—'}</td>
                        <td className="py-3.5 px-4 text-right">
                          {w.status === 'REQUESTED' && (
                            <Link to="/manager/coach-ledger" className="text-sm font-semibold text-primary hover:underline">Xác nhận tại Đối soát Coach</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'pt-packages' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-1 shadow-sm">
              <p className="text-xs text-text-muted">Gói đã bán</p>
              <h3 className="text-2xl font-bold text-text-primary">{ptPackages?.sold ?? 0}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-1 shadow-sm">
              <p className="text-xs text-text-muted">Tổng tín chỉ</p>
              <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-300">{ptPackages?.creditsTotal ?? 0}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-1 shadow-sm">
              <p className="text-xs text-text-muted">Tín chỉ đã tập</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{ptPackages?.creditsConsumed ?? 0}</h3>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-1 shadow-sm">
              <p className="text-xs text-text-muted">Tín chỉ khả dụng</p>
              <h3 className="text-2xl font-bold text-primary">{ptPackages?.creditsAvailable ?? 0}</h3>
            </div>
          </div>
        </div>
      ) : activeTab === 'bookings' ? (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-text-primary">Thống kê Lịch tập PT theo Trạng thái</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs">
              Chưa có dữ liệu đặt lịch tập nào trong khoảng thời gian này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-primary">
                <thead className="border-b border-border-subtle text-text-muted uppercase bg-bg-surface-muted">
                  <tr>
                    <th className="py-3 px-4">Trạng thái đặt lịch</th>
                    <th className="py-3 px-4 text-right">Số lượng buổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {bookings.map((b) => (
                    <tr key={b.status} className="hover:bg-bg-surface-muted/50">
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} context="session" />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-text-primary text-sm">
                        {b.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'coaches' ? (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-text-primary">Hiệu suất và Đánh giá Huấn luyện viên</h2>
          {coaches.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs">
              Chưa có dữ liệu huấn luyện viên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-primary">
                <thead className="border-b border-border-subtle text-text-muted uppercase bg-bg-surface-muted">
                  <tr>
                    <th className="py-3 px-4">Huấn Luyện Viên</th>
                    <th className="py-3 px-4 text-center">Đánh giá trung bình</th>
                    <th className="py-3 px-4 text-center">Số lượt nhận xét</th>
                    <th className="py-3 px-4 text-right">Khung giờ mở</th>
                    <th className="py-3 px-4 text-right">Số buổi đã nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {coaches.map((c) => (
                    <tr key={c.id} className="hover:bg-bg-surface-muted/50">
                      <td className="py-3.5 px-4 font-semibold text-text-primary">{c.user?.fullName || c.id}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                        {Number(c.averageRating).toFixed(1)} / 5.0
                      </td>
                      <td className="py-3.5 px-4 text-center text-text-muted">{c.reviewCount}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-cyan-600 dark:text-cyan-300">
                        {c._count?.coachAvailabilitySlotsCoachId ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-300">
                        {c._count?.ptBookingsCoachId ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'courses' ? (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-text-primary">Nhu cầu Khóa tập Gym & PT</h2>
          {courses.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs">
              Chưa có dữ liệu khóa tập.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-primary">
                <thead className="border-b border-border-subtle text-text-muted uppercase bg-bg-surface-muted">
                  <tr>
                    <th className="py-3 px-4">Tên khóa học</th>
                    <th className="py-3 px-4 text-right">Số gói đã mua</th>
                    <th className="py-3 px-4 text-right">Số buổi đã đặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {courses.map((cr) => (
                    <tr key={cr.id} className="hover:bg-bg-surface-muted/50">
                      <td className="py-3.5 px-4 font-semibold text-text-primary">{cr.name}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-600 dark:text-cyan-300">
                        {cr._count?.ptPackagePurchasesCourseId ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300">
                        {cr._count?.ptBookingsCourseId ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

    </div>
  )
}
