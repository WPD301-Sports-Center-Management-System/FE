import { useState } from 'react'
import { AlertCircle, Utensils, Check } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'

export function CoachMealPlanPage() {
  const [memberId, setMemberId] = useState(db.members[0].id)
  const [title, setTitle] = useState('Thực Đơn Tăng Cơ Giảm Mỡ (High Protein - 2200 kcal)')
  const [targetCalories, setTargetCalories] = useState('2200')
  const [meals] = useState([
    { meal: 'Bữa sáng (07:30)', food: 'Yến mạch + 3 quả trứng luộc + 1 quả chuối', cal: 520, p: 35, c: 65, f: 14 },
    { meal: 'Bữa trưa (12:00)', food: '200g Ức gà áp chảo + 150g Cơm gạo lứt + Bông cải xanh', cal: 680, p: 55, c: 70, f: 12 },
    { meal: 'Bữa phụ trước tập (16:30)', food: '1 Muỗng Whey Protein Isolate + 1 lát Bánh mì ngũ cốc', cal: 260, p: 30, c: 25, f: 3 },
    { meal: 'Bữa tối (19:30)', food: '200g Cá hồi nướng + Khoai lang luộc + Xà lách sốt mè', cal: 640, p: 45, c: 50, f: 22 },
  ])
  const [isSaved, setIsSaved] = useState(false)

  const handleSaveMealPlan = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Thực Đơn Dinh Dưỡng Thể Hình (WEB-COA-10)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Lập kế hoạch dinh dưỡng, kiểm soát calo và macro (Đạm, Tinh bột, Chất béo)
        </p>
      </div>

      {isSaved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Đã lưu và gửi thực đơn dinh dưỡng cho học viên thành công!</span>
        </div>
      )}

      {/* Mandatory Medical Disclaimer Notice */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="font-bold">Cảnh báo pháp lý / Y tế (Medical Disclaimer):</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Thực đơn và chỉ số dinh dưỡng do Huấn luyện viên thể hình gợi ý nhằm mục tiêu tập luyện, không thay thế
            cho chỉ định của bác sĩ chuyên khoa hoặc chế độ điều trị y tế đối với bệnh lý đặc thù.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveMealPlan} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input label="Tên kế hoạch bữa ăn" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <Input
              label="Mục tiêu Calorie (kcal/ngày)"
              type="number"
              required
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
            />
          </div>

          <Select
            label="Học viên áp dụng"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            options={db.members.map((m) => ({ value: m.id, label: m.fullName }))}
          />
        </div>

        {/* Meal items */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Utensils className="h-4 w-4 text-orange-400" />
            <span>Thực Đơn Chi Tiết Theo Bữa</span>
          </h2>

          <div className="space-y-3">
            {meals.map((m, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white">{m.meal}</h4>
                  <span className="font-bold text-emerald-400 text-xs">{m.cal} kcal</span>
                </div>
                <p className="text-xs text-slate-300">{m.food}</p>
                <div className="flex gap-4 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Protein: <strong className="text-cyan-400">{m.p}g</strong></span>
                  <span>Carbs: <strong className="text-amber-400">{m.c}g</strong></span>
                  <span>Fat: <strong className="text-rose-400">{m.f}g</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" className="px-8">
              Lưu & Giao Thực Đơn
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
