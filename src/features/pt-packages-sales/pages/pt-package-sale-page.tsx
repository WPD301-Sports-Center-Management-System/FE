import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, AlertTriangle, AlertCircle, RefreshCw, Sparkles, User, ShieldCheck, Search } from 'lucide-react'
import { formatVND } from '@/shared/utils/currency'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { membersService } from '@/features/memberships/services/members.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coachApprovalService } from '@/features/coach-approval/services/coach-approval.service'
import { ptPurchasesService } from '../services/pt-purchases.service'
import { RecurringScheduleModal } from '@/features/pt-bookings-schedule/components/recurring-schedule-modal'
import { paymentsService } from '@/features/payments-invoices/services/payments.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { PaymentMethod, MemberSummary, TrainingCourse, CoachSummary, PackageOption, Purchase } from '@/shared/types/api'

export function PtPackageSalePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramMemberId = searchParams.get('memberId') || ''

  const [members, setMembers] = useState<MemberSummary[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [coaches, setCoaches] = useState<CoachSummary[]>([])
  const [availableCoaches, setAvailableCoaches] = useState<CoachSummary[]>([])
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([])

  const [memberId, setMemberId] = useState(paramMemberId)
  const [courseId, setCourseId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [packageOptionId, setPackageOptionId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdPurchase, setCreatedPurchase] = useState<Purchase | null>(null)
  const [pendingPurchase, setPendingPurchase] = useState<Purchase | null>(null)
  const [purchaseCode, setPurchaseCode] = useState('')
  const [isSearchingPurchase, setIsSearchingPurchase] = useState(false)
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [membersRes, coursesRes, coachesRes, pkgRes] = await Promise.all([
        membersService.getMembers({ limit: 100 }),
        coursesExercisesService.getTrainingCourses({ limit: 100 }),
        coachesService.getCoaches({ limit: 100 }),
        coachApprovalService.getPtPackageOptions({ limit: 100 }),
      ])

      const memberList = membersRes.data || []
      const courseList = (coursesRes.data || []).filter((c) => c.isActive)
      const coachList = coachesRes.data || []
      const approvedPkgs = (pkgRes.data || []).filter((p) => p.approvalStatus === 'APPROVED' && p.isActive)

      setMembers(memberList)
      setCourses(courseList)
      setCoaches(coachList)
      setAvailableCoaches(coachList)
      setPackageOptions(approvedPkgs)

      if (paramMemberId && memberList.some((m) => m.id === paramMemberId)) {
        setMemberId(paramMemberId)
      } else if (memberList.length > 0) {
        setMemberId(memberList[0].id)
      }
      if (courseList.length > 0) setCourseId(courseList[0].id)
      if (coachList.length > 0) setCoachId(coachList[0].id)
      if (approvedPkgs.length > 0) setPackageOptionId(approvedPkgs[0].id)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách dữ liệu bán gói.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ khi chuẩn bị dữ liệu bán gói PT.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter coaches by selected courseId
  useEffect(() => {
    if (!courseId) return
    let isCancelled = false
    coachesService
      .getCoaches({ courseId, limit: 100 })
      .then((res) => {
        if (isCancelled) return
        const list = res.data || []
        setAvailableCoaches(list)
        if (list.length > 0) {
          if (!coachId || !list.some((c) => c.id === coachId)) {
            setCoachId(list[0].id)
          }
        } else {
          setCoachId('')
        }
      })
      .catch(() => {
        // keep fallback
      })
    return () => {
      isCancelled = true
    }
  }, [courseId])

  // Filter package options that match selected course and optionally coach
  const filteredPackageOptions = packageOptions.filter((p) => {
    const matchCourse = !courseId || p.courseId === courseId
    const matchCoach = !p.coachId || !coachId || p.coachId === coachId
    return matchCourse && matchCoach
  })

  // Selected entities for price display
  const selectedMember = members.find((m) => m.id === memberId)
  const selectedCoach = (availableCoaches.length > 0 ? availableCoaches : coaches).find((c) => c.id === coachId)
  const selectedPkg = filteredPackageOptions.find((p) => p.id === packageOptionId) || filteredPackageOptions[0]

  const priceNum = pendingPurchase ? Number(pendingPurchase.priceSnapshot) : selectedPkg ? Number(selectedPkg.price) : 0
  const gymShare = priceNum * 0.4
  const coachShare = priceNum * 0.6

  const handleFindPendingPurchase = async () => {
    const code = purchaseCode.trim().toUpperCase()
    if (!code) {
      setErrorMessage('Vui lòng nhập mã đơn PT của hội viên.')
      return
    }

    setIsSearchingPurchase(true)
    setErrorMessage(null)
    try {
      const response = await ptPurchasesService.getPurchases({
        purchaseCode: code,
        status: 'PENDING_PAYMENT',
        limit: 1,
      })
      const purchase = response.data?.[0]
      if (!purchase) {
        setErrorMessage('Không tìm thấy đơn PT đang chờ thanh toán với mã này.')
        return
      }

      setPendingPurchase(purchase)
      setMemberId(purchase.memberId)
      setCourseId(purchase.courseId)
      setCoachId(purchase.coachId)
      setPackageOptionId(purchase.packageOptionId)
      setPaymentMethod('CASH')
    } catch (err) {
      setErrorMessage(isAppApiError(err) ? err.message : 'Không thể tra cứu đơn PT. Vui lòng thử lại.')
    } finally {
      setIsSearchingPurchase(false)
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberId) {
      setErrorMessage('Vui lòng chọn hội viên đăng ký.')
      return
    }
    if (!courseId) {
      setErrorMessage('Vui lòng chọn khóa đào tạo PT.')
      return
    }
    if (!coachId) {
      setErrorMessage('Vui lòng chọn huấn luyện viên phụ trách.')
      return
    }
    if (!selectedPkg && !pendingPurchase) {
      setErrorMessage('Vui lòng chọn gói số lượng buổi tập.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const purchase = pendingPurchase ?? await ptPurchasesService.createPurchase({
        memberId,
        courseId,
        coachId,
        packageOptionId: selectedPkg!.id,
      })
      setPendingPurchase(purchase)

      // A previous payment can have succeeded even if its response was lost.
      if (pendingPurchase) {
        const current = await ptPurchasesService.getPurchaseById(purchase.id)
        if (current.status === 'ACTIVE') {
          setCreatedPurchase(current)
          setPendingPurchase(null)
          return
        }
        if (current.status !== 'PENDING_PAYMENT') {
          throw new Error('Đơn này không còn chờ thanh toán.')
        }
      }

      if (paymentMethod === 'VNPAY') {
        const payment = await paymentsService.createVNPay({
          ptPurchaseId: purchase.id,
          returnTarget: 'web',
        })
        if (!payment.paymentUrl) throw new Error('VNPay chưa trả về đường dẫn thanh toán.')
        window.location.assign(payment.paymentUrl)
        return
      }

      await paymentsService.payCounter({
          ptPurchaseId: purchase.id,
          method: paymentMethod,
          receivedAmount: Number(purchase.priceSnapshot),
      })
      const activePurchase = await ptPurchasesService.getPurchaseById(purchase.id)
      if (activePurchase.status !== 'ACTIVE') {
        throw new Error('Thanh toán chưa được xác nhận. Gói PT vẫn đang chờ kích hoạt.')
      }
      setCreatedPurchase(activePurchase)
      setPendingPurchase(null)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Đăng ký bán gói PT thất bại. Vui lòng kiểm tra lại thông tin.')
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Không thể hoàn tất thanh toán gói PT.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>Bán gói tập PT 1:1 tại quầy</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Ký hợp đồng huấn luyện viên cá nhân PT 1:1. Tự động phân bổ doanh thu: Gym 40% • HLV 60%.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="gap-2 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {errorMessage && (
        <div role="alert" className="flex items-center gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <Input
            label="Thanh toán đơn PT đã tạo từ Mobile"
            value={purchaseCode}
            onChange={(event) => setPurchaseCode(event.target.value.toUpperCase())}
            placeholder="Nhập mã đơn, ví dụ: PT-75BFC..."
            className="flex-1"
            disabled={isSearchingPurchase || isSubmitting}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 md:mb-0.5"
            onClick={handleFindPendingPurchase}
            isLoading={isSearchingPurchase}
            disabled={isSearchingPurchase || isSubmitting || !purchaseCode.trim()}
          >
            <Search className="h-4 w-4" />
            Tra cứu đơn
          </Button>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Nhập mã đơn do hội viên cung cấp. Chỉ đơn đang chờ thanh toán mới có thể được xác nhận tại quầy.
        </p>
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-muted">Đang tải danh mục hội viên, khóa học và gói PT mở bán...</p>
        </div>
      ) : createdPurchase ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Check className="h-8 w-8" />
          </div>
            <h2 className="text-xl font-bold text-text-primary">Đã thanh toán và kích hoạt gói PT</h2>
          <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
            Hội viên <strong className="text-text-primary">{selectedMember?.fullName || 'Hội viên'}</strong> ({selectedMember?.memberCode}) đã sở hữu{' '}
            <strong className="text-text-primary">{createdPurchase.totalCredits || selectedPkg?.sessionCount} buổi tập</strong> với HLV{' '}
            <strong className="text-text-primary">{selectedCoach?.fullName || (selectedCoach as any)?.user?.fullName || 'HLV'}</strong>.
            <br />
            Mã hợp đồng: <span className="font-mono text-primary font-bold">{createdPurchase.purchaseCode || createdPurchase.id}</span>
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Button variant="primary" onClick={() => setIsRecurringModalOpen(true)} className="gap-1.5 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Thiết lập lịch cố định ngay
            </Button>
            <Button variant="outline" onClick={() => navigate('/receptionist/calendar')}>
              Lịch tổng
            </Button>
            <Button variant="outline" onClick={() => navigate('/receptionist/payments')}>
              Xem biên lai thu ngân
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCreatedPurchase(null)
                loadData()
              }}
            >
              Bán tiếp hợp đồng mới
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-6">
          {pendingPurchase && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-text-primary">
              Đơn {pendingPurchase.purchaseCode || pendingPurchase.id} đang chờ thanh toán. Chọn phương thức và thử lại; hệ thống sẽ dùng chính đơn này.
            </div>
          )}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Thông Tin Khóa Học & Huấn Luyện Viên</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Hội viên đăng ký mua gói"
                value={memberId}
                disabled={Boolean(pendingPurchase)}
                onChange={(e) => setMemberId(e.target.value)}
                options={members.map((m: any) => ({
                  value: m.id,
                  label: `${m.fullName || m.user?.fullName || 'Hội viên'} (${m.memberCode || 'MEM'})`,
                }))}
                required
              />
              <Select
                label="Khóa đào tạo PT"
                value={courseId}
                disabled={Boolean(pendingPurchase)}
                onChange={(e) => {
                  setCourseId(e.target.value)
                  const matchingPkgs = packageOptions.filter((p) => p.courseId === e.target.value)
                  if (matchingPkgs.length > 0) setPackageOptionId(matchingPkgs[0].id)
                }}
                options={courses.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                required
              />
              <Select
                label="Huấn luyện viên phụ trách"
                value={coachId}
                disabled={Boolean(pendingPurchase)}
                onChange={(e) => setCoachId(e.target.value)}
                options={
                  availableCoaches.length > 0
                    ? availableCoaches.map((c: any) => ({
                        value: c.id,
                        label: `${c.fullName || c.user?.fullName || 'Huấn luyện viên'} ${
                          c.averageRating ? `(★ ${c.averageRating})` : ''
                        }`,
                      }))
                    : [{ value: '', label: 'Chưa có HLV cho khóa học này' }]
                }
                required
              />
              <Select
                label="Gói số lượng buổi tập"
                value={selectedPkg?.id || packageOptionId}
                disabled={Boolean(pendingPurchase)}
                onChange={(e) => setPackageOptionId(e.target.value)}
                options={(filteredPackageOptions.length > 0 ? filteredPackageOptions : packageOptions).map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.sessionCount} buổi - ${formatVND(p.price)})`,
                }))}
                required
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Phương Thức Thanh Toán & Quyết Toán HLV</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {(['BANK_TRANSFER', 'CASH', 'VNPAY'] as PaymentMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === m
                      ? 'border-primary bg-primary/15 text-text-primary ring-1 ring-primary/40'
                      : 'border-border-subtle bg-bg-surface-muted text-text-muted hover:text-text-primary hover:bg-border-subtle'
                  }`}
                >
                  {m === 'BANK_TRANSFER' ? 'Chuyển khoản' : m === 'CASH' ? 'Tiền mặt tại quầy' : 'VNPay QR'}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 text-xs text-text-muted space-y-2.5">
              <div className="flex justify-between font-bold text-text-primary text-sm">
                <span>Tổng học phí thu ngân:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">{formatVND(priceNum)}</span>
              </div>
              <div className="flex justify-between text-text-muted text-xs">
                <span>Phân bổ Doanh thu Trung tâm (40%):</span>
                <span className="font-semibold text-text-primary">{formatVND(gymShare)}</span>
              </div>
              <div className="flex justify-between text-text-muted text-xs">
                <span>Thù lao Huấn luyện viên (60%):</span>
                <span className="font-semibold text-primary">{formatVND(coachShare)}</span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-2 border-t border-border-subtle">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Chính sách không hoàn tiền (Non-refundable). Bắt buộc có thẻ Gym hợp lệ để đặt lịch tập.</span>
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-base"
              isLoading={isSubmitting}
              disabled={isSubmitting || !selectedPkg}
            >
              {pendingPurchase ? 'Thử lại thanh toán' : paymentMethod === 'VNPAY' ? 'Thanh toán qua VNPay' : 'Xác nhận thu tiền & Kích hoạt gói PT'}
            </Button>
          </div>
        </form>
      )}

      {/* Modal Thiết Lập Lịch Cố Định Gói PT 1:1 */}
      <RecurringScheduleModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        purchase={createdPurchase}
        onSuccess={() => navigate('/receptionist/calendar')}
      />
    </div>
  )
}
