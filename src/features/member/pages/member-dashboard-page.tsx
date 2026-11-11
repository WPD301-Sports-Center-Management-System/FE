import { MemberNextActions } from '../components/next-actions'
import { openReceipt } from '@/features/workspace/receipt-events'
import { MemberGoalSummary } from '@/features/goal-lab/member-goal-summary'
import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ErrorBox } from '@/features/workspace/ui'
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
  Eye,
  Flame,
  AlertCircle,
} from 'lucide-react'

import { useAuth } from '@/features/auth/context/auth-context'
import { meService } from '@/features/auth/services/me.service'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'
import { isAppApiError } from '@/shared/api/api-error'
import { formatVND } from '@/shared/utils/currency'
import { formatDateTime, formatDate } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
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
  const location = useLocation()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [ptPackages, setPtPackages] = useState<Purchase[]>([])
  const [ptBookings, setPtBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([])
  const [progress, setProgress] = useState<MemberProgressData | null>(null)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])

  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null)
  const [selectedMealDay, setSelectedMealDay] = useState<number>(1)
  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState<TrainingPlan | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('tab')
  const activeTab = requestedTab && ['overview','pt','training','billing','support'].includes(requestedTab) ? requestedTab : 'overview'
  const setActiveTab = (tab: string) => { const next = new URLSearchParams(params); next.set('tab',tab); setParams(next) }
  const [failedSections, setFailedSections] = useState<string[]>([])

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
      const groups: Record<string, number[]> = { overview:[0,1,2], pt:[3], training:[6,7,8], billing:[4,5], support:[9] }
      setFailedSections(Object.keys(groups).filter(key => groups[key]!.some(i => results[i]!.status === 'rejected')))

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
          else setErrorMessage('Một số thông tin chưa tải được. Dữ liệu trống bên dưới có thể chưa phản ánh đúng hồ sơ của bạn. Bấm Làm mới dữ liệu để thử lại.')
        }
        else setErrorMessage('Một số thông tin chưa tải được. Bấm Làm mới dữ liệu để thử lại trước khi thực hiện giao dịch.')
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
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                Hội viên
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

      <MemberNextActions />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4"><p className="text-sm text-text-muted">Có mục tiêu hoặc phiếu mới từ Coach? Mở để đọc đề xuất và phản hồi kết quả.</p><Link className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" to="/member/goals">Mục tiêu và phiếu sau buổi</Link></div>

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

      {!!(location.state as { ptDraft?: unknown } | null)?.ptDraft && <div className="rounded-lg bg-bg-surface-muted p-4 text-sm"><p>Phương án PT của bạn đang được giữ để xem lại. Liên hệ quầy nếu cần mua hoặc gia hạn vé gym.</p><Link className="inline-flex min-h-11 items-center font-semibold underline" to="/member/pt-sale" state={location.state}>Quay lại phương án PT</Link></div>}
      {/* Tabs */}
      <div className="flex border-b border-border-subtle gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
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
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'pt'
              ? 'border-primary text-primary bg-bg-surface-muted'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Lịch tập PT ({failedSections.includes('pt') ? '—' : ptBookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
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
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
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
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-t-xl transition-colors border-b-2 ${
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
      ) : failedSections.includes(activeTab) ? <ErrorBox message="Chưa tải được đầy đủ thông tin ở mục này. Hãy thử lại để xem đúng hồ sơ của bạn." onRetry={() => void loadMemberData()} /> : (
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
                  <div className={ptPackages.length > 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
                    {ptPackages.map((pkg) => (
                      <div key={pkg.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-text-primary text-sm">{pkg.courseNameSnapshot || 'Khóa PT'}</p>
                            <p className="text-xs text-text-primary">HLV: {pkg.coachNameSnapshot || 'Chuyên gia thể hình'}</p>
                          </div>
                          <StatusBadge status={pkg.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-bg-surface border border-border-subtle text-center text-xs">
                          <div>
                            <span className="text-text-muted block text-xs">Đã tính vào gói</span>
                            <span className="font-bold text-text-primary">{pkg.consumedCredits || 0}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-xs">Đã có lịch</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{pkg.reservedCredits || 0}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-xs">Chưa có lịch</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{pkg.availableCredits || 0}</span>
                          </div>
                        </div>
                        <p className="text-sm">Buổi còn lại: {(pkg.reservedCredits ?? 0) + (pkg.availableCredits ?? 0)}</p>
                        {pkg.status === 'COMPLETED' && <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">Bạn đã hoàn tất khóa tập. Hãy chia sẻ đánh giá về Coach.</p>}
                        <Link className="inline-flex min-h-11 items-center text-sm font-semibold underline" to={'/pt-purchases/' + pkg.id}>{pkg.status === 'COMPLETED' ? 'Xem kết quả và đánh giá Coach' : 'Xem gói và lịch tập'}</Link>
                        {pkg.expiresAt && (
                          <p className="text-xs text-text-muted flex items-center gap-1">
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
            <div className="space-y-4"><MemberGoalSummary /><div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
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
                      <StatusBadge status={b.status} context="session" />
                    </div>
                  ))}
                </div>
              )}
            </div></div>
          )}

          {/* TAB 3: TRAINING & NUTRITION */}
          {activeTab === 'training' && (
            <div className="space-y-6">
              {/* Training Plans */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span>Giáo Án Tập Luyện Được Giao</span>
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {trainingPlans.length} giáo án
                  </span>
                </div>

                {trainingPlans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Huấn luyện viên chưa giao giáo án tập luyện riêng cho bạn.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trainingPlans.map((tp) => {
                      const exercises = tp.trainingPlanExercisesTrainingPlanId || tp.exercises || []
                      return (
                        <div
                          key={tp.id}
                          className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3 hover:border-primary/40 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-bold text-text-primary text-sm line-clamp-1">{tp.title}</p>
                              <StatusBadge status={tp.status} />
                            </div>
                            <p className="text-xs text-text-muted line-clamp-1">
                              Mục tiêu: <strong className="text-text-primary">{tp.goal || 'Tăng cường thể lực'}</strong>
                            </p>
                            <div className="flex items-center gap-3 text-xs text-text-muted">
                              <span>{exercises.length} bài tập</span>
                              <span>•</span>
                              <span>Bắt đầu: {formatDate(tp.startDate)}</span>
                              {tp.endDate && (
                                <>
                                  <span>•</span>
                                  <span>Kết thúc: {formatDate(tp.endDate)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTrainingPlan(tp)}
                            className="w-full gap-1.5 text-xs mt-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem chi tiết bài tập</span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Meal Plans */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Thực Đơn Dinh Dưỡng Được Giao</span>
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {mealPlans.length} thực đơn
                  </span>
                </div>

                {mealPlans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                    Huấn luyện viên chưa thiết lập thực đơn dinh dưỡng nào cho bạn.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mealPlans.map((mp) => {
                      const items = mp.mealPlanItemsMealPlanId || mp.items || []
                      return (
                        <div
                          key={mp.id}
                          className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3 hover:border-primary/40 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-bold text-text-primary text-sm line-clamp-1">{mp.title}</p>
                              <StatusBadge status={mp.status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                              <span>Mục tiêu calo: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{mp.dailyCalorieTarget ? `${mp.dailyCalorieTarget} kcal/ngày` : 'Chưa đặt'}</strong></span>
                              <span>•</span>
                              <span>{items.length} món ăn</span>
                            </div>
                            <p className="text-xs text-text-muted">Áp dụng từ: {formatDate(mp.startDate)}</p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMealPlan(mp)
                              const planItems = mp.mealPlanItemsMealPlanId || mp.items || []
                              if (planItems.length > 0) {
                                const days = Array.from(new Set(planItems.map((i) => i.dayNumber))).sort((a, b) => a - b)
                                setSelectedMealDay(days[0] || 1)
                              } else {
                                setSelectedMealDay(1)
                              }
                            }}
                            className="w-full gap-1.5 text-xs mt-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem chi tiết thực đơn</span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Progress & Goals */}
              {progress && progress.assessments?.length > 0 && (
                <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Tiến Độ & Mục Tiêu Thể Hình</span>
                  </h2>
                  {progress.assessments && progress.assessments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-xs text-text-muted">Cân nặng gần nhất</p>
                        <p className="text-sm font-bold text-text-primary">{progress.assessments[0].weightKg} kg</p>
                      </div>
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-xs text-text-muted">Chiều cao</p>
                        <p className="text-sm font-bold text-text-primary">{progress.assessments[0].heightCm} cm</p>
                      </div>
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-xs text-text-muted">Tỷ lệ mỡ</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {progress.assessments[0].bodyFatPercent ? `${progress.assessments[0].bodyFatPercent}%` : '--'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3">
                        <p className="text-xs text-text-muted">Khối lượng cơ</p>
                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                          {progress.assessments[0].muscleMassKg ? `${progress.assessments[0].muscleMassKg} kg` : '--'}
                        </p>
                      </div>
                    </div>
                  )}
                  <a href="/member/goals" className="block pt-2 text-xs font-semibold text-primary underline">Xem mục tiêu & tiến độ</a>
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
                          <p className="text-xs font-mono text-text-muted">{p.paymentCode ? 'Mã thanh toán: ' + p.paymentCode : 'Chưa có mã thanh toán'} • {({ CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', VNPAY: 'VNPay' } as Record<string,string>)[p.method] ?? 'Phương thức khác'}</p>
                          {p.paidAt && <p className="text-xs text-text-muted mt-0.5">{formatDateTime(p.paidAt)}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatVND(p.amount)}</p>
                          <StatusBadge status={p.status} context="payment" />
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
                          <p className="text-xs text-text-muted">{formatDateTime(inv.issuedAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatVND(inv.total)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={async () => {
                              try {
                                openReceipt({ invoiceId: inv.id })
                              } catch {
                                setErrorMessage('Không thể tải file PDF hóa đơn.')
                              }
                            }}
                          >
                            <Download className="h-3 w-3" />
                            <span>Xem hóa đơn</span>
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
                          <p className="text-xs font-mono text-text-muted">{req.requestCode}</p>
                        </div>
                        <StatusBadge status={req.status} context="support" />
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

      {/* Modal: View Member Meal Plan Detail */}
      <Modal
        isOpen={!!selectedMealPlan}
        onClose={() => setSelectedMealPlan(null)}
        title={selectedMealPlan?.title || 'Thực Đơn Dinh Dưỡng'}
        description={`Mục tiêu: ${selectedMealPlan?.dailyCalorieTarget ? `${selectedMealPlan.dailyCalorieTarget} kcal/ngày` : 'Chưa đặt'} • Bắt đầu: ${formatDate(selectedMealPlan?.startDate)}`}
        maxWidth="lg"
      >
        {selectedMealPlan && (() => {
          const items = selectedMealPlan.mealPlanItemsMealPlanId || selectedMealPlan.items || []
          const days = Array.from(new Set(items.map((i) => i.dayNumber))).sort((a, b) => a - b)
          const currentDayItems = items.filter((i) => i.dayNumber === selectedMealDay)
          const dayCal = currentDayItems.reduce((acc, m) => acc + (Number(m.estimatedCalories) || 0), 0)
          const dayP = currentDayItems.reduce((acc, m) => acc + (Number(m.proteinGrams) || 0), 0)
          const dayC = currentDayItems.reduce((acc, m) => acc + (Number(m.carbsGrams) || 0), 0)
          const dayF = currentDayItems.reduce((acc, m) => acc + (Number(m.fatGrams) || 0), 0)

          return (
            <div className="space-y-4 text-xs">
              {/* Medical disclaimer alert */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  {selectedMealPlan.medicalDisclaimer ||
                    'Thực đơn thể hình mang tính tham khảo nhằm phục vụ tập luyện, không thay thế chỉ định y khoa.'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-6 text-center text-text-muted border border-dashed border-border-subtle rounded-xl">
                  Chưa có danh sách món ăn chi tiết trong thực đơn này.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Day Tabs */}
                  {days.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {days.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedMealDay(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                            selectedMealDay === d
                              ? 'bg-primary text-white border-primary'
                              : 'bg-bg-surface-muted text-text-muted border-border-subtle'
                          }`}
                        >
                          Ngày {d}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Day Macro Overview */}
                  <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-bg-surface-muted border border-border-subtle text-center text-xs">
                    <div>
                      <span className="text-xs text-text-muted block flex items-center justify-center gap-1">
                        <Flame className="h-3 w-3 text-amber-500" />
                        <span>Calo</span>
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{dayCal} kcal</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block">Protein</span>
                      <span className="font-bold text-primary">{dayP}g</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block">Carbs</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{dayC}g</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted block">Fat</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">{dayF}g</span>
                    </div>
                  </div>

                  {/* Meals list */}
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {currentDayItems.map((meal) => (
                      <div
                        key={meal.id}
                        className="p-3 rounded-xl border border-border-subtle bg-bg-surface space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {meal.mealType}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {meal.estimatedCalories || 0} kcal
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-text-primary">{meal.foodName}</p>
                        {meal.quantity && (
                          <p className="text-xs text-text-muted">Định lượng: {meal.quantity}</p>
                        )}
                        <div className="flex gap-4 text-xs text-text-muted border-t border-border-subtle pt-1">
                          <span>Đạm: <strong className="text-primary">{meal.proteinGrams || 0}g</strong></span>
                          <span>Carbs: <strong className="text-amber-600 dark:text-amber-400">{meal.carbsGrams || 0}g</strong></span>
                          <span>Béo: <strong className="text-rose-600 dark:text-rose-400">{meal.fatGrams || 0}g</strong></span>
                          {meal.note && <span className="italic">Lưu ý: {meal.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border-subtle">
                <Button variant="outline" onClick={() => setSelectedMealPlan(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Modal: View Member Training Plan Detail */}
      <Modal
        isOpen={!!selectedTrainingPlan}
        onClose={() => setSelectedTrainingPlan(null)}
        title={selectedTrainingPlan?.title || 'Giáo Án Tập Luyện'}
        description={`Mục tiêu: ${selectedTrainingPlan?.goal || 'Tăng cường thể lực'} • Thời gian: ${formatDate(selectedTrainingPlan?.startDate)} → ${formatDate(selectedTrainingPlan?.endDate) || 'Dài hạn'}`}
        maxWidth="lg"
      >
        {selectedTrainingPlan && (() => {
          const exercises =
            selectedTrainingPlan.trainingPlanExercisesTrainingPlanId || selectedTrainingPlan.exercises || []

          return (
            <div className="space-y-4 text-xs">
              {/* Header summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-bg-surface-muted border border-border-subtle text-xs">
                <div>
                  <span className="text-text-muted block text-xs">Trạng thái:</span>
                  <StatusBadge status={selectedTrainingPlan.status} />
                </div>
                <div>
                  <span className="text-text-muted block text-xs">Số lượng bài tập:</span>
                  <span className="font-bold text-primary">{exercises.length} động tác</span>
                </div>
                <div>
                  <span className="text-text-muted block text-xs">Ngày bắt đầu:</span>
                  <span className="font-medium text-text-primary">{formatDate(selectedTrainingPlan.startDate)}</span>
                </div>
              </div>

              {/* Coach notes if any */}
              {selectedTrainingPlan.notes && (
                <div className="p-3 rounded-xl bg-bg-surface-muted border border-border-subtle space-y-1">
                  <span className="text-xs text-text-muted font-bold uppercase tracking-wider block">
                    Lời dặn của Huấn luyện viên:
                  </span>
                  <p className="text-text-primary leading-relaxed">{selectedTrainingPlan.notes}</p>
                </div>
              )}

              {/* Exercises List */}
              {exercises.length === 0 ? (
                <div className="p-8 text-center text-text-muted border border-dashed border-border-subtle rounded-xl">
                  Giáo án này chưa có bài tập cụ thể nào.
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {exercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="p-3.5 rounded-xl border border-border-subtle bg-bg-surface space-y-2 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-text-primary text-xs">
                              {ex.exercise?.name || ex.exerciseName || 'Bài tập thể hình'}
                            </p>
                            {ex.exercise?.targetMuscle && (
                              <span className="text-xs text-primary font-medium">
                                Nhóm cơ: {ex.exercise.targetMuscle}
                              </span>
                            )}
                          </div>
                        </div>

                        {ex.scheduledDate && (
                          <span className="text-xs font-mono text-text-muted">
                            Lịch: {formatDate(ex.scheduledDate)}
                          </span>
                        )}
                      </div>

                      {/* Reps/Sets/Weight Grid */}
                      <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-bg-surface-muted text-center text-xs">
                        <div>
                          <span className="text-xs text-text-muted block">Số hiệp</span>
                          <span className="font-bold text-text-primary">{ex.sets || 3} sets</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-muted block">Lặp lại</span>
                          <span className="font-bold text-text-primary">{ex.reps || 12} reps</span>
                        </div>
                        <div>
                          <span className="text-xs text-text-muted block">Mức tạ</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {ex.targetWeight || 'Bodyweight'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-text-muted block">Nghỉ</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {ex.restSeconds || 60}s
                          </span>
                        </div>
                      </div>

                      {/* Instructions */}
                      {(ex.instructions || ex.exercise?.instructions) && (
                        <p className="text-xs text-text-muted border-t border-border-subtle pt-1.5 leading-relaxed">
                          <strong className="text-text-primary font-medium">Hướng dẫn: </strong>
                          {ex.instructions || ex.exercise?.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border-subtle">
                <Button variant="outline" onClick={() => setSelectedTrainingPlan(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
