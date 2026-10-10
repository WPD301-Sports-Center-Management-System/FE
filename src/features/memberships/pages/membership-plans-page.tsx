import { useState, useEffect } from 'react'
import { Edit2, ShieldAlert, Check, RefreshCw, AlertCircle } from 'lucide-react'
import { membershipPlansService } from '../services/membership-plans.service'
import { formatVND } from '@/shared/utils/currency'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input } from '@/shared/components/ui/input'
import type { MembershipPlan } from '@/shared/types/api'

export function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [newPrice, setNewPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const loadPlans = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await membershipPlansService.getPlans()
      setPlans(res.data || [])
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bảng giá gói tập.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const handleOpenEdit = (plan: MembershipPlan) => {
    setSelectedPlan(plan)
    setNewPrice(plan.price)
  }

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return

    setIsSubmitting(true)
    try {
      const updated = await membershipPlansService.updatePlan(selectedPlan.id, {
        price: newPrice,
      })
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setSelectedPlan(null)
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật giá gói.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (plan: MembershipPlan) => {
    setUpdatingStatusId(plan.id)
    try {
      const updated = await membershipPlansService.updatePlanStatus(plan.id, {
        isActive: !plan.isActive,
      })
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err: any) {
      alert(err?.message || 'Không thể đổi trạng thái gói.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Quản lý Bảng Giá Vé Gym (WEB-MAN-04)</h1>
          <p className="text-xs text-text-muted mt-1">
            Cấu hình gói hội viên tập tự do phòng Gym. Giá thay đổi chỉ áp dụng cho lượt mua mới.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPlans} disabled={isLoading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={loadPlans}>Thử lại</Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const bonusMonths = plan.bonusMonths || 0
            const paidMonths = plan.paidMonths || 0
            const totalMonths = plan.totalMonths ?? (paidMonths + bonusMonths)

            return (
              <div
                key={plan.id}
                className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-bg-surface p-6 shadow-md backdrop-blur-md relative overflow-hidden"
              >
                {bonusMonths > 0 && (
                  <span className="absolute top-4 right-4 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-500 border border-orange-500/30">
                    Ưu đãi: Tặng {bonusMonths} tháng
                  </span>
                )}

                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">{plan.code}</span>
                  <h2 className="text-xl font-bold text-text-primary">{plan.name}</h2>

                  <div className="space-y-1.5 py-3 text-xs text-text-primary">
                    <div className="flex justify-between border-b border-border-subtle pb-1.5">
                      <span className="text-text-muted">Thời hạn thanh toán:</span>
                      <span className="font-semibold text-text-primary">{paidMonths} Tháng</span>
                    </div>
                    {bonusMonths > 0 && (
                      <div className="flex justify-between border-b border-border-subtle pb-1.5">
                        <span className="text-text-muted">Tháng tặng kèm:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{bonusMonths} Tháng</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-border-subtle pb-1.5">
                      <span className="text-text-muted">Tổng thời gian sử dụng:</span>
                      <span className="font-bold text-orange-500">{totalMonths} Tháng</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] uppercase text-text-muted">Giá niêm yết hiện hành</p>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatVND(plan.price)}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
                  <button
                    type="button"
                    disabled={updatingStatusId === plan.id}
                    onClick={() => handleToggleActive(plan)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      plan.isActive
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'border-border-subtle bg-bg-surface-muted text-text-muted'
                    }`}
                  >
                    {updatingStatusId === plan.id
                      ? 'Đang xử lý...'
                      : plan.isActive
                      ? 'Đang mở bán'
                      : 'Tạm dừng bán'}
                  </button>

                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleOpenEdit(plan)}>
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Chỉnh giá vé</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
            <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-1">
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Xác nhận cập nhật'}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

