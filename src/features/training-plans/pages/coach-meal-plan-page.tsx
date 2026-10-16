import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Utensils, Check, RefreshCw, AlertTriangle } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { mealPlansService } from '../services/meal-plans.service'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { isAppApiError } from '@/shared/api/api-error'
import type { MemberSummary } from '@/shared/types/api'

interface MealItemState {
  dayNumber: number
  mealType: string
  foodName: string
  quantity: string
  estimatedCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  sortOrder: number
}

const DEFAULT_MEALS: MealItemState[] = [
  { dayNumber: 1, mealType: 'Bữa sáng (07:30)', foodName: 'Yến mạch + 3 quả trứng luộc + 1 quả chuối', quantity: '1 phần', estimatedCalories: 520, proteinGrams: 35, carbsGrams: 65, fatGrams: 14, sortOrder: 1 },
  { dayNumber: 1, mealType: 'Bữa trưa (12:00)', foodName: '200g Ức gà áp chảo + 150g Cơm gạo lứt + Bông cải xanh', quantity: '1 phần', estimatedCalories: 680, proteinGrams: 55, carbsGrams: 70, fatGrams: 12, sortOrder: 2 },
  { dayNumber: 1, mealType: 'Bữa phụ trước tập (16:30)', foodName: '1 Muỗng Whey Protein Isolate + 1 lát Bánh mì ngũ cốc', quantity: '1 phần', estimatedCalories: 260, proteinGrams: 30, carbsGrams: 25, fatGrams: 3, sortOrder: 3 },
  { dayNumber: 1, mealType: 'Bữa tối (19:30)', foodName: '200g Cá hồi nướng + Khoai lang luộc + Xà lách sốt mè', quantity: '1 phần', estimatedCalories: 640, proteinGrams: 45, carbsGrams: 50, fatGrams: 22, sortOrder: 4 },
]

export function CoachMealPlanPage() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [memberId, setMemberId] = useState('')
  const [title, setTitle] = useState('')
  const [targetCalories, setTargetCalories] = useState('')
  const [meals] = useState<MealItemState[]>(DEFAULT_MEALS)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await coachesService.getMyMembers()
      const items = (res?.data || (Array.isArray(res) ? res : [])) as MemberSummary[]
      setMembers(items)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải danh sách học viên.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const handleSaveMealPlan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!memberId) {
      setErrorMessage('Vui lòng chọn học viên nhận thực đơn.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Step 1: Create DRAFT meal plan
      const disclaimer =
        'Thực đơn và chỉ số dinh dưỡng do Huấn luyện viên thể hình gợi ý nhằm mục tiêu tập luyện, không thay thế cho chỉ định của bác sĩ chuyên khoa hoặc chế độ điều trị y tế.'

      const plan = await mealPlansService.createMealPlan({
        memberId,
        title,
        dailyCalorieTarget: Number(targetCalories) || 2000,
        startDate: new Date().toISOString().split('T')[0],
        medicalDisclaimer: disclaimer,
      })

      // Step 2: Add all meal items to the draft plan
      for (const m of meals) {
        await mealPlansService.addMealItem(plan.id, {
          dayNumber: m.dayNumber,
          mealType: m.mealType,
          foodName: m.foodName,
          quantity: m.quantity,
          estimatedCalories: m.estimatedCalories,
          proteinGrams: m.proteinGrams,
          carbsGrams: m.carbsGrams,
          fatGrams: m.fatGrams,
          sortOrder: m.sortOrder,
        })
      }

      // Step 3: Assign the meal plan
      await mealPlansService.assignMealPlan(plan.id)

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 4000)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tạo và giao thực đơn.')
      } else {
        setErrorMessage('Không thể kết nối máy chủ để lưu thực đơn dinh dưỡng.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Thực Đơn Dinh Dưỡng Thể Hình (WEB-COA-10)</h1>
          <p className="text-xs text-text-muted mt-1">
            Lập kế hoạch dinh dưỡng, kiểm soát calo và macro (Đạm, Tinh bột, Chất béo)
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadMembers}
          disabled={isLoading || isSubmitting}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Đã lưu và gửi thực đơn dinh dưỡng cho học viên thành công!</span>
        </div>
      )}

      {/* Mandatory Medical Disclaimer Notice */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="font-bold">Cảnh báo pháp lý / Y tế (Medical Disclaimer):</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Thực đơn và chỉ số dinh dưỡng do Huấn luyện viên thể hình gợi ý nhằm mục tiêu tập luyện, không thay thế
            cho chỉ định của bác sĩ chuyên khoa hoặc chế độ điều trị y tế đối với bệnh lý đặc thù.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-xs flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Đang tải danh sách học viên từ máy chủ...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-8 text-center text-xs text-text-muted">
          Bạn hiện chưa có học viên nào để giao thực đơn dinh dưỡng.
        </div>
      ) : (
        <form onSubmit={handleSaveMealPlan} className="space-y-6">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Tên kế hoạch bữa ăn"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Thực Đơn Tăng Cơ Giảm Mỡ (High Protein)..."
                />
              </div>
              <Input
                label="Mục tiêu Calorie (kcal/ngày)"
                type="number"
                required
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                placeholder="Ví dụ: 2000"
              />
            </div>

            <Select
              label="Học viên áp dụng"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              options={[
                { value: '', label: '-- Chọn học viên --' },
                ...members.map((m: any) => ({
                  value: m.id,
                  label: `${m.fullName || m.user?.fullName || 'Hội viên'} (${m.memberCode || 'HV'})`,
                })),
              ]}
            />
          </div>

          {/* Meal items */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <span>Thực Đơn Chi Tiết Theo Bữa (Ngày 1)</span>
            </h2>

            <div className="space-y-3">
              {meals.map((m, idx) => (
                <div key={idx} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-text-primary">{m.mealType}</h4>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{m.estimatedCalories} kcal</span>
                  </div>
                  <p className="text-xs text-text-primary">{m.foodName}</p>
                  <div className="flex gap-4 text-[10px] text-text-muted border-t border-border-subtle pt-2">
                    <span>Protein: <strong className="text-primary">{m.proteinGrams}g</strong></span>
                    <span>Carbs: <strong className="text-amber-600 dark:text-amber-400">{m.carbsGrams}g</strong></span>
                    <span>Fat: <strong className="text-danger">{m.fatGrams}g</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" variant="primary" disabled={isSubmitting || !memberId} className="px-8">
                {isSubmitting ? 'Đang lưu & giao thực đơn...' : 'Lưu & Giao Thực Đơn'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
