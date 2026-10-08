import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, AlertTriangle } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/input'
import type { PaymentMethod } from '@/shared/types/api'

export function PtPackageSalePage() {
  const navigate = useNavigate()
  const [memberId, setMemberId] = useState(db.members[0].id)
  const [courseId, setCourseId] = useState(db.courses[0].id)
  const [coachId, setCoachId] = useState(db.coaches[0].id)
  const [packageOptionId, setPackageOptionId] = useState(db.packageOptions[0].id)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [isSuccess, setIsSuccess] = useState(false)

  const member = db.members.find((m) => m.id === memberId) || db.members[0]
  const course = db.courses.find((c) => c.id === courseId) || db.courses[0]
  const coach = db.coaches.find((c) => c.id === coachId) || db.coaches[0]
  const pkg = db.packageOptions.find((p) => p.id === packageOptionId) || db.packageOptions[0]

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault()

    const priceNum = parseFloat(pkg.price)
    const gymShare = (priceNum * 0.4).toFixed(2)
    const coachShare = (priceNum * 0.6).toFixed(2)

    // 1. Create Purchase
    const newPurchase = {
      id: 'pur-' + Date.now(),
      memberId: member.id,
      coachId: coach.id,
      courseId: course.id,
      packageOptionId: pkg.id,
      courseNameSnapshot: course.name,
      coachNameSnapshot: coach.fullName,
      priceSnapshot: pkg.price,
      gymSharePercentSnapshot: 40,
      coachSharePercentSnapshot: 60,
      totalCredits: pkg.sessionCount,
      reservedCredits: 0,
      consumedCredits: 0,
      availableCredits: pkg.sessionCount,
      status: 'ACTIVE' as const,
      pendingMakeupCount: 0,
      memberCode: member.memberCode,
      memberName: member.fullName,
    }
    db.purchases.unshift(newPurchase)
    member.activePackageCount = (member.activePackageCount || 0) + 1

    // 2. Create Payment
    const newPayment = {
      id: 'pay-' + Date.now(),
      paymentCode: 'PAY-PT-' + Math.floor(Math.random() * 900000 + 100000),
      memberId: member.id,
      ptPurchaseId: newPurchase.id,
      amount: pkg.price,
      method: paymentMethod,
      status: 'PAID' as const,
      paidAt: new Date().toISOString(),
      memberName: member.fullName,
      itemDescription: `${pkg.name} (${coach.fullName})`,
    }
    db.payments.unshift(newPayment)

    // 3. Create Pending Coach Payout (60% Coach, 40% Gym)
    const newPayout = {
      id: 'payout-' + Date.now(),
      paymentId: newPayment.id,
      purchaseId: newPurchase.id,
      coachId: coach.id,
      grossAmount: pkg.price,
      gymAmount: gymShare,
      coachAmount: coachShare,
      status: 'PENDING' as const,
      coachName: coach.fullName,
    }
    db.payouts.unshift(newPayout)

    // 4. Create Invoice
    const newInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: 'INV-PT-' + Math.floor(Math.random() * 900000 + 100000),
      paymentId: newPayment.id,
      memberNameSnapshot: member.fullName,
      itemNameSnapshot: `${pkg.name} - HLV ${coach.fullName}`,
      subtotal: pkg.price,
      total: pkg.price,
      issuedAt: new Date().toISOString(),
      paymentMethod,
    }
    db.invoices.unshift(newInvoice)

    setIsSuccess(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Bán Gói Tập PT 1:1 Tại Quầy (WEB-REC-06)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Hợp đồng kèm HLV cá nhân. Quy tắc chia sẻ: Gym 40% • HLV 60%.
        </p>
      </div>

      {isSuccess ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/30 p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Đã Tạo Hợp Đồng & Thanh Toán Thành Công!</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Hội viên <strong>{member.fullName}</strong> đã sở hữu <strong>{pkg.sessionCount} buổi tập</strong> cùng HLV <strong>{coach.fullName}</strong>.
            Khoản thù lao 60% đã được ghi nhận tự động vào bảng kê quyết toán HLV.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/receptionist/calendar')}>
              Xếp lịch tập ngay
            </Button>
            <Button variant="primary" onClick={() => navigate('/receptionist/payments')}>
              Xem biên lai thu ngân
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Thông Tin Khóa Học & Huấn Luyện Viên</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Hội viên đăng ký"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                options={db.members.map((m) => ({
                  value: m.id,
                  label: `${m.fullName} (${m.memberCode})`,
                }))}
              />
              <Select
                label="Khóa đào tạo PT"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                options={db.courses.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <Select
                label="Huấn luyện viên phụ trách"
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                options={db.coaches.map((c) => ({
                  value: c.id,
                  label: `${c.fullName} (Đánh giá: ★ ${c.averageRating})`,
                }))}
              />
              <Select
                label="Gói số lượng buổi tập"
                value={packageOptionId}
                onChange={(e) => setPackageOptionId(e.target.value)}
                options={db.packageOptions
                  .filter((p) => p.approvalStatus === 'APPROVED')
                  .map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.sessionCount} buổi - ${formatVND(p.price)})`,
                  }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Thanh Toán & Ký Hợp Đồng</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['BANK_TRANSFER', 'CASH', 'VNPAY'] as PaymentMethod[]).map((m) => (
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
                  {m === 'BANK_TRANSFER' ? 'Chuyển khoản' : m === 'CASH' ? 'Tiền mặt' : 'VNPay QR'}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300 space-y-2">
              <div className="flex justify-between font-bold text-slate-100">
                <span>Tổng học phí:</span>
                <span className="text-emerald-400 text-base">{formatVND(pkg.price)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Phân bổ Gym (40%):</span>
                <span>{formatVND(parseFloat(pkg.price) * 0.4)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Thù lao HLV (60%):</span>
                <span>{formatVND(parseFloat(pkg.price) * 0.6)}</span>
              </div>
              <p className="text-[11px] text-amber-400 flex items-center gap-1.5 pt-2 border-t border-slate-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Chính sách không hoàn tiền (Non-refundable). Bắt buộc có thẻ Gym hợp lệ để đặt lịch tập.</span>
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full py-3 text-base">
              Xác nhận thu tiền & Kích hoạt gói PT
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
