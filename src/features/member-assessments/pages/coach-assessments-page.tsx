import { useState, useEffect } from 'react'
import { Plus, Target, TrendingUp, RefreshCw, User } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { membersService } from '@/features/memberships/services/members.service'
import { db } from '@/mocks/mock-server'
import { formatDate } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import type { BodyAssessment, FitnessGoal, MemberSummary } from '@/shared/types/api'

export function CoachAssessmentsPage() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [assessments, setAssessments] = useState<BodyAssessment[]>([])
  const [goals, setGoals] = useState<FitnessGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [form, setForm] = useState({
    memberId: '',
    weightKg: '72.50',
    heightCm: '175.00',
    bodyFatPercent: '19.20',
    muscleMassKg: '34.50',
    waistCm: '80.00',
    notes: 'Tiến độ rất tích cực',
  })

  // Load students list
  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await coachesService.getMyMembers()
        const items = res?.data || []
        if (items.length > 0) {
          setMembers(items)
          setSelectedMemberId(items[0].id)
          setForm((f) => ({ ...f, memberId: items[0].id }))
        } else {
          setMembers(db.members as any)
          setSelectedMemberId(db.members[0].id)
          setForm((f) => ({ ...f, memberId: db.members[0].id }))
        }
      } catch {
        setMembers(db.members as any)
        setSelectedMemberId(db.members[0].id)
        setForm((f) => ({ ...f, memberId: db.members[0].id }))
      }
    }
    loadStudents()
  }, [])

  // Load selected student's assessments & goals
  const loadStudentData = async (mId: string) => {
    if (!mId) return
    setIsLoading(true)
    try {
      const [asmRes, goalsRes] = await Promise.allSettled([
        membersService.getMemberBodyAssessments(mId),
        membersService.getMemberFitnessGoals(mId),
      ])

      if (asmRes.status === 'fulfilled' && asmRes.value?.data?.length > 0) {
        setAssessments(asmRes.value.data)
      } else {
        setAssessments(db.assessments.filter((a) => !a.memberId || a.memberId === mId || a.memberId === 'mem-01'))
      }

      if (goalsRes.status === 'fulfilled' && goalsRes.value?.data?.length > 0) {
        setGoals(goalsRes.value.data)
      } else {
        setGoals(db.goals.filter((g) => !g.memberId || g.memberId === mId || g.memberId === 'mem-01'))
      }
    } catch {
      setAssessments(db.assessments)
      setGoals(db.goals)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedMemberId) {
      loadStudentData(selectedMemberId)
    }
  }, [selectedMemberId])

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const created = await membersService.createMemberBodyAssessment(form.memberId || selectedMemberId, {
        assessedAt: new Date().toISOString(),
        weightKg: form.weightKg,
        heightCm: form.heightCm,
        bodyFatPercent: form.bodyFatPercent,
        muscleMassKg: form.muscleMassKg,
        waistCm: form.waistCm,
        notes: form.notes,
      })
      setAssessments((prev) => [created, ...prev])
      setIsModalOpen(false)
    } catch {
      // Fallback local addition
      const newAsm: BodyAssessment = {
        id: 'asm-' + Date.now(),
        coachId: 'coach-me',
        memberId: form.memberId || selectedMemberId,
        assessedAt: new Date().toISOString(),
        weightKg: form.weightKg,
        heightCm: form.heightCm,
        bodyFatPercent: form.bodyFatPercent,
        muscleMassKg: form.muscleMassKg,
        waistCm: form.waistCm,
        notes: form.notes,
      }
      setAssessments((prev) => [newAsm, ...prev])
      setIsModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadStudentData(selectedMemberId)} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Ghi nhận InBody mới</span>
          </Button>
        </div>
      </div>

      {/* Select Student Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 shrink-0">
          <User className="h-4 w-4 text-orange-400" />
          <span>Chọn học viên cần theo dõi:</span>
        </div>
        <div className="w-full max-w-xs">
          <Select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value)
              setForm((f) => ({ ...f, memberId: e.target.value }))
            }}
            options={members.map((m) => ({
              value: m.id,
              label: `${m.fullName} (${m.memberCode || 'HV'})`,
            }))}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Goal Tracking Cards */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-400" />
              <span>Mục Tiêu Thể Hình Của Học Viên ({goals.length})</span>
            </h2>

            {goals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có mục tiêu nào được thiết lập.</p>
            ) : (
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
            )}
          </div>

          {/* Assessment Records */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Lịch Sử Đo InBody Theo Thời Gian ({assessments.length})</span>
            </h2>

            {assessments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có dữ liệu đo InBody nào cho học viên này.</p>
            ) : (
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
            )}
          </div>
        </>
      )}

      {/* Add Assessment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nhập Chỉ Số InBody Mới"
        description="Điền các thông số đo được từ máy phân tích cơ thể"
      >
        <form onSubmit={handleAddAssessment} className="space-y-4">
          <Select
            label="Học viên"
            value={form.memberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            options={members.map((m) => ({ value: m.id, label: `${m.fullName} (${m.memberCode || 'HV'})` }))}
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
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu kết quả InBody'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

