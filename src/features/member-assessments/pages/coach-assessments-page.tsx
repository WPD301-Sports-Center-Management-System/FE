import { useState } from 'react'
import { Plus, Target, TrendingUp } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatDate } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import type { BodyAssessment, FitnessGoal } from '@/shared/types/api'

export function CoachAssessmentsPage() {
  const coach = db.coaches[0]
  const [assessments, setAssessments] = useState<BodyAssessment[]>([...db.assessments])
  const [goals] = useState<FitnessGoal[]>([...db.goals])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [form, setForm] = useState({
    memberId: db.members[0].id,
    weightKg: '72.50',
    heightCm: '175.00',
    bodyFatPercent: '19.20',
    muscleMassKg: '34.50',
    waistCm: '80.00',
    notes: 'Tiến độ rất tích cực',
  })

  const handleAddAssessment = (e: React.FormEvent) => {
    e.preventDefault()
    const newAsm: BodyAssessment = {
      id: 'asm-' + Date.now(),
      memberId: form.memberId,
      coachId: coach.id,
      assessedAt: new Date().toISOString(),
      weightKg: form.weightKg,
      heightCm: form.heightCm,
      bodyFatPercent: form.bodyFatPercent,
      muscleMassKg: form.muscleMassKg,
      waistCm: form.waistCm,
      notes: form.notes,
    }

    db.assessments.unshift(newAsm)
    setAssessments([...db.assessments])
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Chỉ Số InBody & Tiến Độ Thể Hình (WEB-COA-09)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi chép số đo cơ thể, tỷ lệ mỡ, khối lượng cơ và theo dõi mục tiêu của học viên
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Ghi nhận InBody mới</span>
        </Button>
      </div>

      {/* Goal Tracking Cards */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-400" />
          <span>Mục Tiêu Thể Hình Của Học Viên</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-white">{g.title}</h4>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {g.status}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span>Khởi đầu: {g.startValue} {g.unit}</span>
                <span className="font-bold text-orange-400">Hiện tại: {g.currentValue} {g.unit}</span>
                <span className="font-bold text-emerald-400">Mục tiêu: {g.targetValue} {g.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Records */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>Lịch Sử Đo InBody Theo Thời Gian</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Ngày đo</th>
                <th className="py-3 px-4">Cân nặng</th>
                <th className="py-3 px-4">Tỷ lệ mỡ (%)</th>
                <th className="py-3 px-4">Cơ nạc (kg)</th>
                <th className="py-3 px-4">Vòng eo (cm)</th>
                <th className="py-3 px-4">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{formatDate(a.assessedAt)}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{a.weightKg} kg</td>
                  <td className="py-3.5 px-4 text-orange-400 font-semibold">{a.bodyFatPercent}%</td>
                  <td className="py-3.5 px-4 text-cyan-300 font-semibold">{a.muscleMassKg} kg</td>
                  <td className="py-3.5 px-4">{a.waistCm} cm</td>
                  <td className="py-3.5 px-4 text-slate-400">{a.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Assessment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nhập Chỉ Số InBody"
        description="Điền các thông số đo được từ máy phân tích cơ thể"
      >
        <form onSubmit={handleAddAssessment} className="space-y-4">
          <Select
            label="Học viên"
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            options={db.members.map((m) => ({ value: m.id, label: m.fullName }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cân nặng (kg)"
              required
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            />
            <Input
              label="Chiều cao (cm)"
              required
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
            />
            <Input
              label="Tỷ lệ mỡ (%)"
              required
              value={form.bodyFatPercent}
              onChange={(e) => setForm({ ...form, bodyFatPercent: e.target.value })}
            />
            <Input
              label="Khối lượng cơ (kg)"
              required
              value={form.muscleMassKg}
              onChange={(e) => setForm({ ...form, muscleMassKg: e.target.value })}
            />
            <Input
              label="Vòng eo (cm)"
              value={form.waistCm}
              onChange={(e) => setForm({ ...form, waistCm: e.target.value })}
            />
          </div>
          <Input
            label="Ghi chú đánh giá"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Lưu kết quả InBody
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
