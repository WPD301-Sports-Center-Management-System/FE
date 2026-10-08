import { useState } from 'react'
import { Sparkles, Check, RefreshCw, AlertTriangle } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import type { TrainingPlan } from '@/shared/types/api'

export function CoachAiRecommendationPage() {
  const coach = db.coaches[0]
  const [memberId, setMemberId] = useState(db.members[0].id)
  const [targetFocus, setTargetFocus] = useState('Phát triển nhóm cơ Ngực & Vai, giảm mỡ vòng eo')
  const [fitnessLevel, setFitnessLevel] = useState('Trung bình (Đã tập 6 tháng)')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

  // AI draft recommendation state
  const [draftPlan, setDraftPlan] = useState<{
    title: string
    rationale: string
    exercises: Array<{ name: string; sets: number; reps: number; rest: number; weight: string; note: string }>
  } | null>({
    title: 'AI Smart Plan: Hypertrophy Chest & Shoulder Focus',
    rationale:
      'Dựa trên số đo InBody của hội viên (Cơ nạc 34.5kg, mỡ 19.2%), hệ thống tối ưu hóa khối lượng tạ mức 70-75% 1RM để kích thích phì đại cơ bắp mà không gây quá tải khớp vai.',
    exercises: [
      { name: 'Barbell Incline Bench Press', sets: 4, reps: 10, rest: 90, weight: '55.00', note: 'Góc nghiêng ghế 30 độ' },
      { name: 'Dumbbell Lateral Raise', sets: 4, reps: 12, rest: 60, weight: '10.00', note: 'Giữ khuỷu tay hơi cong nhẹ' },
      { name: 'Cable Flyes (Crossover)', sets: 3, reps: 15, rest: 60, weight: '15.00', note: 'Siết cơ ngực 1 giây ở đỉnh' },
      { name: 'Overhead Tricep Rope Extension', sets: 3, reps: 12, rest: 60, weight: '25.00', note: 'Khóa chặt khớp khuỷu' },
    ],
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setIsApproved(false)
    setTimeout(() => {
      setIsGenerating(false)
      setDraftPlan({
        title: 'AI Smart Plan: ' + targetFocus,
        rationale:
          'Hệ thống AI đã phân tích thể trạng và gợi ý các bài tập Compound phối hợp Isolation phù hợp nhất.',
        exercises: [
          { name: 'Barbell Back Squat', sets: 4, reps: 8, rest: 120, weight: '70.00', note: 'Kỹ thuật sâu qua gối' },
          { name: 'Romanian Deadlift', sets: 4, reps: 10, rest: 90, weight: '60.00', note: 'Căng cơ đùi sau' },
          { name: 'Walking Lunges', sets: 3, reps: 12, rest: 60, weight: '14.00', note: 'Bước chân cân đối' },
        ],
      })
    }, 1200)
  }

  const handleApproveToPlan = () => {
    if (!draftPlan) return
    const student = db.members.find((m) => m.id === memberId)
    const newPlan: TrainingPlan = {
      id: 'tp-ai-' + Date.now(),
      coachId: coach.id,
      memberId,
      ptPurchaseId: 'pur-01',
      title: draftPlan.title,
      goal: draftPlan.rationale,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
      memberName: student?.fullName,
      exercises: draftPlan.exercises.map((item, idx) => ({
        id: 'pe-ai-' + Date.now() + idx,
        exerciseId: 'ex-01',
        exerciseName: item.name,
        sets: item.sets,
        reps: item.reps,
        targetWeight: item.weight,
        restSeconds: item.rest,
        sortOrder: idx + 1,
      })),
    }

    db.trainingPlans.unshift(newPlan)
    setIsApproved(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Gợi Ý Bài Tập Từ Trí Tuệ Nhân Tạo (WEB-COA-11)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Ứng dụng mô hình AI kết hợp dữ liệu InBody và mục tiêu của học viên để phác thảo giáo án thông minh
        </p>
      </div>

      {isApproved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Giáo án AI đã được duyệt và chuyển thành Giáo Án Chính Thức thành công!</span>
        </div>
      )}

      {/* Input parameters */}
      <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-400" />
          <span>Thông Số Huấn Luyện Đầu Vào</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Học viên mục tiêu"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            options={db.members.map((m) => ({ value: m.id, label: m.fullName }))}
          />
          <Input
            label="Thể lực & Trình độ hiện tại"
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value)}
          />
        </div>

        <Input
          label="Mục tiêu bài tập muốn AI tối ưu"
          required
          value={targetFocus}
          onChange={(e) => setTargetFocus(e.target.value)}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isGenerating} className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Tạo Gợi Ý Thông Minh</span>
          </Button>
        </div>
      </form>

      {/* Draft Result */}
      {draftPlan && (
        <div className="rounded-2xl border border-orange-500/30 bg-slate-900/80 p-6 space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                Bản Phác Thảo AI Đề Xuất
              </span>
              <h3 className="text-lg font-bold text-white mt-2">{draftPlan.title}</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleGenerate} className="text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Tạo lại</span>
              </Button>
              <Button size="sm" variant="primary" onClick={handleApproveToPlan} className="text-xs gap-1.5">
                <Check className="h-3.5 w-3.5" />
                <span>Duyệt thành Giáo án</span>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
            <span className="font-bold text-orange-400">Cơ sở khoa học (Rationale):</span> {draftPlan.rationale}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Danh Sách Động Tác</h4>
            {draftPlan.exercises.map((ex, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs"
              >
                <div>
                  <p className="font-bold text-white">{ex.name}</p>
                  <p className="text-[11px] text-slate-400">{ex.note}</p>
                </div>
                <div className="flex gap-4 font-mono">
                  <span>Sets: <strong className="text-cyan-400">{ex.sets}</strong></span>
                  <span>Reps: <strong className="text-orange-400">{ex.reps}</strong></span>
                  <span>Tạ: <strong className="text-emerald-400">{ex.weight}kg</strong></span>
                  <span>Nghỉ: <strong className="text-slate-400">{ex.rest}s</strong></span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-amber-400/80 italic flex items-center gap-1.5 pt-2 border-t border-slate-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>HLV cần kiểm tra tình trạng chấn thương và độ an toàn của học viên trước khi áp dụng thực tế.</span>
          </p>
        </div>
      )}
    </div>
  )
}
