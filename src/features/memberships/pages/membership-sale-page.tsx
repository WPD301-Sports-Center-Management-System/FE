import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, AlertCircle } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { Button } from '@/shared/components/ui/button'
import { Select, Input } from '@/shared/components/ui/input'
import type { PaymentMethod } from '@/shared/types/api'

export function MembershipSalePage() {
  const navigate = useNavigate()
  const [selectedMemberId, setSelectedMemberId] = useState(db.members[0].id)
  const [selectedPlanId, setSelectedPlanId] = useState(db.plans[1].id) // Default 3+1M
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [isSuccess, setIsSuccess] = useState(false)

  const member = db.members.find((m) => m.id === selectedMemberId) || db.members[0]
  const plan = db.plans.find((p) => p.id === selectedPlanId) || db.plans[0]

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Create subscription
    const newSub = {
      id: 'sub-' + Date.now(),
      memberId: member.id,
      planId: plan.id,
      planNameSnapshot: plan.name,
      paidMonthsSnapshot: plan.paidMonths,
      bonusMonthsSnapshot: plan.bonusMonths,
      priceSnapshot: plan.price,
      startDate,
      endDate: '2026-12-31',
      status: 'ACTIVE' as const,
    }
    db.subscriptions.unshift(newSub)

    // 2. Activate member status
    member.membershipStatus = 'ACTIVE'

    // 3. Create payment
    const newPayment = {
      id: 'pay-' + Date.now(),
      paymentCode: 'PAY-GYM-' + Math.floor(Math.random() * 900000 + 100000),
      memberId: member.id,
      subscriptionId: newSub.id,
      amount: plan.price,
      method: paymentMethod,
      status: 'PAID' as const,
      paidAt: new Date().toISOString(),
      memberName: member.fullName,
      itemDescription: plan.name,
    }
    db.payments.unshift(newPayment)

    // 4. Create Invoice
    const newInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: 'INV-GYM-' + Math.floor(Math.random() * 900000 + 100000),
      paymentId: newPayment.id,
      memberNameSnapshot: member.fullName,
      itemNameSnapshot: plan.name,
      subtotal: plan.price,
      total: plan.price,
      issuedAt: new Date().toISOString(),
      paymentMethod,
    }
    db.invoices.unshift(newInvoice)

    setIsSuccess(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Đăng Ký & Bán Vé Gym (WEB-REC-05)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Kích hoạt hoặc gia hạn thẻ tập thể hình không giới hạn khung giờ
        </p>
      </div>

      {isSuccess ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/30 p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Giao Dịch Đã Hoàn Tất Thành Công!</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Hội viên <strong>{member.fullName}</strong> đã được kích hoạt <strong>{plan.name}</strong>.
            Đơn thanh toán và hóa đơn đã được lập tự động.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/receptionist/check-in')}>
              Đến quầy check-in
            </Button>
            <Button variant="primary" onClick={() => navigate('/receptionist/payments')}>
              Xem hóa đơn thu tiền
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-8">
          {/* Step 1: Chọn Hội viên */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">1. Chọn Hội Viên Mua Thẻ</h3>
            <Select
              label="Hội viên"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              options={db.members.map((m) => ({
                value: m.id,
                label: `${m.fullName} (${m.memberCode}) - SĐT: ${m.phone || 'Chưa có'}`,
              }))}
            />
          </div>

          {/* Step 2: Chọn Gói tập */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">2. Chọn Gói Thẻ Gym</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    selectedPlanId === p.id
                      ? 'border-orange-500 bg-orange-950/20 shadow-lg shadow-orange-500/10'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{p.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">Tổng hạn: {p.totalMonths} tháng</p>
                    </div>
                    {p.bonusMonths > 0 && (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                        Tặng +{p.bonusMonths} tháng
                      </span>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Học phí:</span>
                    <span className="text-lg font-extrabold text-emerald-400">{formatVND(p.price)}</span>
                  </div>
                </div>
              ))}
            </div>

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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">3. Thanh Toán & Điều Khoản</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['CASH', 'BANK_TRANSFER', 'VNPAY'] as PaymentMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-xl border p-3 text-xs font-bold transition-all ${
                    paymentMethod === m
                      ? 'border-orange-500 bg-orange-950/30 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'CASH' ? 'Tiền mặt' : m === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Cổng VNPay'}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between text-slate-200 font-bold">
                <span>Tổng tiền thanh toán:</span>
                <span className="text-emerald-400 text-base">{formatVND(plan.price)}</span>
              </div>
              <p className="text-[11px] text-amber-400 flex items-center gap-1.5 pt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Chính sách không hoàn tiền đối với các gói thẻ đã thanh toán.</span>
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full py-3 text-base">
              Xác nhận thu tiền & Kích hoạt gói
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
