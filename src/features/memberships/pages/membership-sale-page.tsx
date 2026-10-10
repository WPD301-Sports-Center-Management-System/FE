import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, AlertCircle, RefreshCw, CreditCard, User, DollarSign, ShieldCheck } from 'lucide-react'
import { formatVND } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { Select, Input } from '@/shared/components/ui/input'
import { membersService } from '@/features/memberships/services/members.service'
import { membershipPlansService } from '@/features/memberships/services/membership-plans.service'
import { subscriptionsService } from '@/features/memberships/services/subscriptions.service'
import { paymentsService } from '@/features/payments-invoices/services/payments.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { PaymentMethod, MembershipPlan, MemberSummary, Subscription } from '@/shared/types/api'

export function MembershipSalePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMemberId = searchParams.get('memberId') || ''

  // Data states
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')

  // Submission & Response states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdSubscription, setCreatedSubscription] = useState<Subscription | null>(null)

  // Load members and plans on mount
  const loadInitialData = useCallback(async () => {
    setIsLoadingData(true)
    setErrorMessage(null)
    try {
      const [membersRes, plansRes] = await Promise.all([
        membersService.getMembers({ limit: 100 }),
        membershipPlansService.getPlans({ isActive: true }),
      ])

      const memberList = (membersRes.data as MemberSummary[]) || []
      const planList = plansRes.data || []

      setMembers(memberList)
      setPlans(planList)

      if (memberList.length > 0 && !selectedMemberId) {
        setSelectedMemberId(initialMemberId && memberList.some((m) => m.id === initialMemberId) ? initialMemberId : memberList[0].id)
      }
      if (planList.length > 0 && !selectedPlanId) {
        setSelectedPlanId(planList[0].id)
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách hội viên hoặc gói tập.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ khi chuẩn bị dữ liệu bán thẻ.')
      }
    } finally {
      setIsLoadingData(false)
    }
  }, [initialMemberId, selectedMemberId, selectedPlanId])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const selectedMember = members.find((m) => m.id === selectedMemberId)
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId) {
      setErrorMessage('Vui lòng chọn hội viên mua thẻ.')
      return
    }
    if (!selectedPlanId) {
      setErrorMessage('Vui lòng chọn gói thẻ tập.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const newSub = await subscriptionsService.createSubscription({
        memberId: selectedMemberId,
        planId: selectedPlanId,
        startDate: startDate || undefined,
      })

      const amount = selectedPlan ? parseFloat(selectedPlan.price) : 0

      if (paymentMethod === 'CASH' || paymentMethod === 'BANK_TRANSFER') {
        try {
          await paymentsService.payCounter({
            subscriptionId: newSub.id,
            method: paymentMethod,
            receivedAmount: amount,
          })
          newSub.status = 'ACTIVE'
        } catch (payErr) {
          console.warn('Counter payment settlement notice:', payErr)
        }
      } else if (paymentMethod === 'VNPAY') {
        try {
          const vnpayRes = await paymentsService.createVNPay({
            subscriptionId: newSub.id,
            returnTarget: 'web',
          })
          if (vnpayRes.paymentUrl) {
            window.location.href = vnpayRes.paymentUrl
            return
          }
        } catch (vnpayErr) {
          console.warn('VNPay initiation failed:', vnpayErr)
        }
      }

      setCreatedSubscription(newSub)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể đăng ký gói thẻ tập. Vui lòng kiểm tra lại thông tin.')
      } else {
        setErrorMessage('Lỗi máy chủ khi xử lý giao dịch đăng ký gói tập.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForNextSale = () => {
    setCreatedSubscription(null)
    setStartDate(new Date().toISOString().split('T')[0])
    setErrorMessage(null)
  }

  if (isLoadingData) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-text-muted">Đang tải danh mục gói tập và danh sách hội viên...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-primary" />
            <span>Đăng Ký & Bán Vé Gym (WEB-REC-05)</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Kích hoạt thẻ tập Gym không giới hạn khung giờ, kết nối API hệ thống và ghi nhận doanh thu
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {createdSubscription ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Giao Dịch Đăng Ký Gói Tập Đã Tạo Thành Công!</h2>
          <div className="max-w-md mx-auto rounded-2xl bg-bg-surface border border-border-subtle p-4 text-left text-xs space-y-2 text-text-muted shadow-sm">
            <div className="flex justify-between border-b border-border-subtle pb-2">
              <span className="text-text-muted">Hội viên:</span>
              <span className="font-bold text-text-primary">{selectedMember?.fullName} ({selectedMember?.memberCode})</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle pb-2">
              <span className="text-text-muted">Gói đăng ký:</span>
              <span className="font-bold text-primary">{createdSubscription.planNameSnapshot}</span>
            </div>
            <div className="flex justify-between border-b border-border-subtle pb-2">
              <span className="text-text-muted">Thời hạn sử dụng:</span>
              <span className="font-semibold text-text-primary">
                {formatDate(createdSubscription.startDate)} → {formatDate(createdSubscription.endDate)}
              </span>
            </div>
            <div className="flex justify-between border-b border-border-subtle pb-2">
              <span className="text-text-muted">Học phí:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatVND(createdSubscription.priceSnapshot)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-text-muted">Trạng thái gói:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {createdSubscription.status}
              </span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={handleResetForNextSale}>
              Bán thêm vé mới
            </Button>
            <Button variant="outline" onClick={() => navigate('/receptionist/check-in')}>
              Đến quầy check-in
            </Button>
            <Button variant="primary" onClick={() => navigate('/receptionist/members')}>
              Xem hồ sơ hội viên
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-6">
          {/* Step 1: Chọn Hội viên */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>1. Chọn Hội Viên Đăng Ký</span>
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/receptionist/members')}
                className="text-xs text-primary hover:underline h-7"
              >
                + Thêm hội viên mới
              </Button>
            </div>

            {members.length === 0 ? (
              <div className="p-4 rounded-xl bg-bg-surface-muted border border-border-subtle text-xs text-text-muted text-center">
                Chưa có hội viên nào trong hệ thống.{' '}
                <button
                  type="button"
                  onClick={() => navigate('/receptionist/members')}
                  className="text-primary underline font-semibold cursor-pointer"
                >
                  Tạo hồ sơ hội viên ngay
                </button>
              </div>
            ) : (
              <Select
                label="Hội viên"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                options={members.map((m) => ({
                  value: m.id,
                  label: `${m.fullName} (${m.memberCode}) ${m.phone ? `- SĐT: ${m.phone}` : ''}`,
                }))}
              />
            )}
          </div>

          {/* Step 2: Chọn Gói tập */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>2. Chọn Gói Thẻ Gym</span>
            </h3>

            {plans.length === 0 ? (
              <div className="p-4 rounded-xl bg-bg-surface-muted border border-border-subtle text-xs text-text-muted text-center">
                Không tìm thấy gói thẻ Gym đang hoạt động.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                          : 'border-border-subtle bg-bg-surface hover:border-border-strong hover:bg-bg-surface-muted/60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-text-primary text-sm">{p.name}</h4>
                          <p className="text-xs text-text-muted mt-1">
                            Thời hạn: {p.totalMonths} tháng ({p.paidMonths} tháng trả phí
                            {p.bonusMonths > 0 ? ` + ${p.bonusMonths} tháng ưu đãi` : ''})
                          </p>
                        </div>
                        {p.bonusMonths > 0 && (
                          <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Tặng +{p.bonusMonths}T
                          </span>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border-subtle flex justify-between items-center">
                        <span className="text-xs text-text-muted">Học phí niêm yết:</span>
                        <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{formatVND(p.price)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-2 max-w-xs">
              <Input
                label="Ngày bắt đầu kích hoạt"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Step 3: Phương thức & Xác nhận */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>3. Phương Thức Thanh Toán & Xác Nhận</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['CASH', 'BANK_TRANSFER', 'VNPAY'] as PaymentMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === m
                      ? 'border-primary bg-primary/15 text-text-primary shadow-sm'
                      : 'border-border-subtle bg-bg-surface-muted text-text-muted hover:text-text-primary hover:bg-border-subtle'
                  }`}
                >
                  {m === 'CASH' ? 'Tiền mặt' : m === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Cổng VNPay'}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 text-xs text-text-muted space-y-2">
              <div className="flex justify-between items-center text-text-primary font-bold">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                  {selectedPlan ? formatVND(selectedPlan.price) : '0 ₫'}
                </span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Thẻ tập gym áp dụng chính sách tập luyện không giới hạn, kích hoạt tức thì sau khi xác nhận.</span>
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm font-bold gap-2"
              isLoading={isSubmitting}
              disabled={isSubmitting || !selectedMemberId || !selectedPlanId}
            >
              <Check className="h-4 w-4" />
              <span>Xác nhận & Kích hoạt gói thẻ</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
