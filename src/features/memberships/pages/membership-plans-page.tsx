import { useState } from 'react'
import { Edit2, ShieldAlert, Check } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input } from '@/shared/components/ui/input'
import type { MembershipPlan } from '@/shared/types/api'

export function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([...db.plans])
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [newPrice, setNewPrice] = useState('')

  const handleOpenEdit = (plan: MembershipPlan) => {
    setSelectedPlan(plan)
    setNewPrice(plan.price)
  }

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return
    selectedPlan.price = newPrice
    setPlans([...db.plans])
    setSelectedPlan(null)
  }

  const handleToggleActive = (plan: MembershipPlan) => {
    plan.isActive = !plan.isActive
    setPlans([...db.plans])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Bảng Giá Vé Gym (WEB-MAN-04)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cấu hình gói hội viên tập tự do phòng Gym. Giá thay đổi chỉ áp dụng cho lượt mua mới.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md relative overflow-hidden"
          >
            {plan.bonusMonths > 0 && (
              <span className="absolute top-4 right-4 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30">
                Ưu đãi: Tặng {plan.bonusMonths} tháng
              </span>
            )}

            <div className="space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">{plan.code}</span>
              <h2 className="text-xl font-bold text-white">{plan.name}</h2>

              <div className="space-y-1.5 py-3 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Thời hạn thanh toán:</span>
                  <span className="font-semibold text-slate-200">{plan.paidMonths} Tháng</span>
                </div>
                {plan.bonusMonths > 0 && (
                  <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="text-slate-400">Tháng tặng kèm:</span>
                    <span className="font-semibold text-emerald-400">+{plan.bonusMonths} Tháng</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Tổng thời gian sử dụng:</span>
                  <span className="font-bold text-orange-400">{plan.totalMonths} Tháng</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] uppercase text-slate-400">Giá niêm yết hiện hành</p>
                <p className="text-2xl font-extrabold text-emerald-400">{formatVND(plan.price)}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => handleToggleActive(plan)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  plan.isActive
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {plan.isActive ? 'Đang mở bán' : 'Tạm dừng bán'}
              </button>

              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleOpenEdit(plan)}>
                <Edit2 className="h-3.5 w-3.5" />
                <span>Chỉnh giá vé</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Chỉnh Giá */}
      <Modal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title={`Chỉnh giá gói: ${selectedPlan?.name}`}
        description="Quy tắc Snapshot: Giá mới chỉ áp dụng cho các giao dịch tạo mới."
      >
        <form onSubmit={handleSavePrice} className="space-y-4">
          <Input
            label="Giá niêm yết mới (VND)"
            type="number"
            required
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Quy tắc đóng băng giá (Price Snapshot): Toàn bộ thẻ tập hội viên đã thanh toán trong quá khứ sẽ không bị ảnh hưởng bởi việc đổi giá này.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setSelectedPlan(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" className="gap-1">
              <Check className="h-4 w-4" />
              <span>Xác nhận cập nhật</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
