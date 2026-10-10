import { useState, useEffect, useCallback } from 'react'
import {
  User,
  CreditCard,
  Dumbbell,
  Calendar,
  FileText,
  DollarSign,
  Activity,
  Utensils,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  Download,
} from 'lucide-react'

import { useAuth } from '@/features/auth/context/auth-context'
import { meService } from '@/features/auth/services/me.service'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'
import { paymentsService } from '@/features/payments-invoices/services/payments.service'
import { downloadBlob } from '@/shared/utils/download'
import { isAppApiError } from '@/shared/api/api-error'
import { formatVND } from '@/shared/utils/currency'
import { formatDateTime, formatDate } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import type {
  Subscription,
  Purchase,
  Booking,
  Payment,
  Invoice,
  TrainingPlan,
  MealPlan,
  SupportRequest,
} from '@/shared/types/api'
import type { MemberProgressData } from '@/features/auth/types/me.types'

export function MemberDashboardPage() {
  const { user } = useAuth()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [ptPackages, setPtPackages] = useState<Purchase[]>([])
  const [ptBookings, setPtBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([])
  const [progress, setProgress] = useState<MemberProgressData | null>(null)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'pt' | 'training' | 'billing' | 'support'>('overview')

  const loadMemberData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const results = await Promise.allSettled([
        dashboardService.getMemberDashboard(),
        meService.getMySubscriptions(),
        meService.getMyPtPackages(),
        meService.getMyPtBookings(),
        meService.getMyPayments(),
        meService.getMyInvoices(),
        meService.getMyTrainingPlans(),
        meService.getMyProgress(),
        meService.getMyMealPlans(),
        meService.getMySupportRequests(),
      ])

      const extractData = <T,>(res: PromiseSettledResult<any>, fallback: T): T => {
        if (res.status === 'fulfilled') {
          const val = res.value
          if (Array.isArray(val)) return val as T
          if (val && Array.isArray(val.data)) return val.data as T
          if (val && val.data) return val.data as T
          return val as T
        }
        return fallback
      }

      // If dashboard/member fulfilled, it provides membership, packages, upcomingBookings
      const dashOverview = results[0].status === 'fulfilled' ? results[0].value : null
      const subs = extractData<Subscription[]>(results[1], [])
      if (subs.length === 0 && dashOverview?.membership) {
        subs.push(dashOverview.membership)
      }

      setSubscriptions(subs)
      setPtPackages(extractData<Purchase[]>(results[2], dashOverview?.packages || []))
      setPtBookings(extractData<Booking[]>(results[3], dashOverview?.upcomingBookings || []))
      setPayments(extractData<Payment[]>(results[4], []))
      setInvoices(extractData<Invoice[]>(results[5], []))
      setTrainingPlans(extractData<TrainingPlan[]>(results[6], []))
      if (results[7].status === 'fulfilled') {
        setProgress(results[7].value)
      }
      setMealPlans(extractData<MealPlan[]>(results[8], []))
      setSupportRequests(extractData<SupportRequest[]>(results[9], []))

      // Check errors
      const criticalIndices = [0, 1, 2] // dashboard overview, subscriptions, pt packages
      const criticalFailures = results.filter((r, idx) => criticalIndices.includes(idx) && r.status === 'rejected') as PromiseRejectedResult[]
      const anyFailure = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined

      if (criticalFailures.length > 0) {
        const firstErr = criticalFailures[0].reason
        if (isAppApiError(firstErr)) {
          if (firstErr.status === 401) setErrorMessage('Hết phiên đăng nhập. Vui lòng đăng nhập lại.')
          else if (firstErr.status === 403) setErrorMessage('Bạn không có quyền truy cập trang hội viên (403 Forbidden).')
          else setErrorMessage(`Không thể tải dữ liệu hội viên: ${firstErr.message || 'Lỗi kết nối máy chủ'}`)
        } else {
          setErrorMessage('Không thể tải dữ liệu cốt lõi của hội viên. Vui lòng thử lại.')
        }
      } else if (anyFailure) {
        const err = anyFailure.reason
        if (isAppApiError(err)) {
          if (err.status === 401) setErrorMessage('Hết phiên đăng nhập. Vui lòng đăng nhập lại.')
          else if (err.status === 403) setErrorMessage('Bạn không có quyền truy cập một số mục (403 Forbidden).')
        }
      }

    } catch {
      setErrorMessage('Lỗi hệ thống khi tải trang cá nhân hội viên.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMemberData()
  }, [loadMemberData])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile Banner */}
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
            {user?.fullName?.charAt(0) || <User className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-text-primary">{user?.fullName || 'Hội viên'}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                MEMBER
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{user?.email} • {user?.phone || 'Chưa cập nhật SĐT'}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadMemberData}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </Button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            <span>{errorMessage}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={loadMemberData} className="h-7 text-xs text-danger hover:bg-danger/10">
            Thử lại
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary bg-bg-surface-muted'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Tổng quan Thẻ & PT</span>
        </button>
        <button
          onClick={() => setActiveTab('pt')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'pt'
              ? 'border-primary text-primary bg-bg-surface-muted'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Lịch Đặt PT ({ptBookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'training'
              ? 'border-primary text-primary bg-bg-surface-muted'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Giáo Án & Dinh Dưỡng</span>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'billing'
              ? 'border-primary text-primary bg-bg-surface-muted'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Thanh Toán & Hóa Đơn</span>
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'support'
              ? 'border-primary text-primary bg-bg-surface-muted'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Yêu Cầu Hỗ Trợ</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-xs flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Đang tải dữ liệu hồ sơ hội viên từ hệ thống...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Gym Membership Section */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Gói Thẻ Tập Gym Của Tôi</span>
                </h2>
                {subscriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Bạn hiện chưa có gói thẻ tập Gym nào còn hiệu lực.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-text-primary text-sm">{sub.planNameSnapshot || 'Gói thẻ tập'}</p>
                          <StatusBadge status={sub.status} />
                        </div>
                        <p className="text-xs text-text-muted flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-text-muted" />
                          <span>{formatDate(sub.startDate)} → {formatDate(sub.endDate)}</span>
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border-subtle">
                          {formatVND(sub.priceSnapshot)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PT 1:1 Packages Section */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Gói Tập Huấn Luyện Viên Cá Nhân (PT 1:1)</span>
                </h2>
                {ptPackages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Bạn chưa đăng ký mua gói huấn luyện viên cá nhân PT nào.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ptPackages.map((pkg) => (
                      <div key={pkg.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-text-primary text-sm">{pkg.courseNameSnapshot || 'Khóa PT'}</p>
                            <p className="text-xs text-text-muted">HLV: {pkg.coachNameSnapshot || 'Chuyên gia thể hình'}</p>
                          </div>
                          <StatusBadge status={pkg.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-bg-surface border border-border-subtle text-center text-[11px]">
                          <div>
                            <span className="text-text-muted block text-[10px]">Đã tập</span>
                            <span className="font-bold text-text-primary">{pkg.consumedCredits || 0}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Đang giữ</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{pkg.reservedCredits || 0}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Còn lại</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{pkg.availableCredits || 0}</span>
                          </div>
                        </div>
                        {pkg.expiresAt && (
                          <p className="text-[11px] text-text-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Hạn sử dụng: {formatDate(pkg.expiresAt)}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PT BOOKINGS */}
          {activeTab === 'pt' && (
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Lịch Đặt Buổi Tập PT 1:1 Của Tôi</span>
              </h2>
              {ptBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                  Chưa có buổi tập PT nào được lên lịch.
                </div>
              ) : (
                <div className="space-y-3">
                  {ptBookings.map((b) => (
                    <div key={b.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{b.courseName || 'Buổi tập PT'}</p>
                        <p className="text-xs text-text-muted mt-0.5">HLV: {b.coachName || 'Huấn luyện viên'}</p>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono mt-1">{formatDateTime(b.startsAt)} → {formatDateTime(b.endsAt)}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRAINING & NUTRITION */}
          {activeTab === 'training' && (
            <div className="space-y-6">
              {/* Training Plans */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Giáo Án Tập Luyện Được Giao</span>
                </h2>
                {trainingPlans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Huấn luyện viên chưa giao giáo án tập luyện riêng cho bạn.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trainingPlans.map((tp) => (
                      <div key={tp.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-text-primary text-sm">{tp.title}</p>
                            <p className="text-xs text-text-muted">Mục tiêu: {tp.goal || 'Tăng cơ giảm mỡ'}</p>
                          </div>
                          <StatusBadge status={tp.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meal Plans */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Thực Đơn Dinh Dưỡng</span>
                </h2>
                {mealPlans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Chưa có thực đơn dinh dưỡng nào được thiết lập.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mealPlans.map((mp) => (
                      <div key={mp.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-text-primary text-sm">{mp.title}</p>
                          <StatusBadge status={mp.status} />
                        </div>
                        <p className="text-xs text-text-muted">
                          Calo mục tiêu: {mp.dailyCalorieTarget ? `${mp.dailyCalorieTarget} kcal` : 'Chưa thiết lập'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress & Goals */}
              {progress && (progress.assessments?.length > 0 || progress.goals?.length > 0) && (
                <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Tiến Độ & Mục Tiêu Thể Hình</span>
                  </h2>
                  {progress.assessments && progress.assessments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-[11px] text-text-muted">Cân nặng gần nhất</p>
                        <p className="text-sm font-bold text-text-primary">{progress.assessments[0].weightKg} kg</p>
                      </div>
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-[11px] text-text-muted">Chiều cao</p>
                        <p className="text-sm font-bold text-text-primary">{progress.assessments[0].heightCm} cm</p>
                      </div>
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-[11px] text-text-muted">Tỷ lệ mỡ</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {progress.assessments[0].bodyFatPercent ? `${progress.assessments[0].bodyFatPercent}%` : '--'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-[11px] text-text-muted">Khối lượng cơ</p>
                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                          {progress.assessments[0].muscleMassKg ? `${progress.assessments[0].muscleMassKg} kg` : '--'}
                        </p>
                      </div>
                    </div>
                  )}
                  {progress.goals && progress.goals.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border-subtle">
                      <p className="text-xs font-semibold text-text-primary">Mục tiêu hiện tại:</p>
                      {progress.goals.map((g) => (
                        <div key={g.id} className="flex justify-between items-center text-xs text-text-muted bg-bg-surface-muted p-2.5 rounded-lg border border-border-subtle">
                          <span>{g.title}</span>
                          <span className="font-bold text-text-primary">{g.targetValue} {g.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BILLING & INVOICES */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Payments */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Lịch Sử Thanh Toán</span>
                </h2>
                {payments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Chưa có lịch sử thanh toán nào trên hệ thống.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-text-primary text-sm">{p.itemDescription || p.description || 'Dịch vụ Gym'}</p>
                          <p className="text-xs font-mono text-text-muted">Mã: {p.paymentCode || p.id.slice(0, 8)} • {p.method}</p>
                          {p.paidAt && <p className="text-[11px] text-text-muted mt-0.5">{formatDateTime(p.paidAt)}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatVND(p.amount)}</p>
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Hóa Đơn Thu Phí (Invoices)</span>
                </h2>
                {invoices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Chưa có hóa đơn nào được phát hành.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-mono font-bold text-primary text-xs">{inv.invoiceNumber}</p>
                          <p className="text-xs text-text-muted mt-0.5">{inv.itemNameSnapshot}</p>
                          <p className="text-[11px] text-text-muted">{formatDateTime(inv.issuedAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatVND(inv.total)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={async () => {
                              try {
                                const blob = await paymentsService.downloadInvoicePdf(inv.id)
                                await downloadBlob(blob, `hoa_don_${inv.invoiceNumber}.pdf`)
                              } catch {
                                setErrorMessage('Không thể tải file PDF hóa đơn.')
                              }
                            }}
                          >
                            <Download className="h-3 w-3" />
                            <span>PDF</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SUPPORT */}
          {activeTab === 'support' && (
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Yêu Cầu Hỗ Trợ Đã Gửi</span>
              </h2>
              {supportRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                  Bạn chưa có yêu cầu hỗ trợ nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {supportRequests.map((req) => (
                    <div key={req.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-text-primary text-sm">{req.subject || 'Yêu cầu hỗ trợ'}</p>
                          <p className="text-[10px] font-mono text-text-muted">{req.requestCode}</p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-text-muted">{req.message}</p>

                      {req.response && (
                        <div className="mt-2 p-3 rounded-lg bg-bg-surface border border-border-subtle text-xs">
                          <p className="font-semibold text-cyan-600 dark:text-cyan-400">Phản hồi từ lễ tân / quản trị:</p>
                          <p className="text-text-primary mt-1">{req.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
