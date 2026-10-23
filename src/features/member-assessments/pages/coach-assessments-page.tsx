import { useState, useEffect, useCallback } from 'react'
import { Plus, Target, TrendingUp, RefreshCw, User, AlertTriangle } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { membersService } from '@/features/memberships/services/members.service'
import { formatDate } from '@/shared/utils/date'
import { isAppApiError } from '@/shared/api/api-error'
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null)

  // Form State
  const [form, setForm] = useState({
    memberId: '',
    weightKg: '70.00',
    heightCm: '170.00',
    bodyFatPercent: '18.00',
    muscleMassKg: '32.00',
    waistCm: '78.00',
    notes: 'Theo dõi chỉ số InBody định kỳ',
  })

  // Load students list
  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await coachesService.getMyMembers()
      const items = (res?.data || (Array.isArray(res) ? res : [])) as MemberSummary[]
      setMembers(items)
      if (items.length > 0) {
        setSelectedMemberId((prev) => prev || items[0].id)
        setForm((f) => ({ ...f, memberId: f.memberId || items[0].id }))
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi tải danh sách học viên.')
      } else {
        setErrorMessage('Không thể tải danh sách học viên từ máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Load selected student's assessments & goals
  const loadStudentData = useCallback(async (mId: string) => {
    if (!mId) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [asmRes, goalsRes] = await Promise.allSettled([
        membersService.getMemberBodyAssessments(mId),
        membersService.getMemberFitnessGoals(mId),
      ])

      if (asmRes.status === 'fulfilled') {
        const val = asmRes.value
        setAssessments((val as any)?.data || (Array.isArray(val) ? val : []))
      } else {
        setAssessments([])
        const reason = asmRes.reason
        if (isAppApiError(reason)) {
          setErrorMessage(reason.message || 'Không thể tải chỉ số InBody.')
        }
      }

      if (goalsRes.status === 'fulfilled') {
        const val = goalsRes.value
        setGoals((val as any)?.data || (Array.isArray(val) ? val : []))
      } else {
        setGoals([])
      }
    } catch {
      setErrorMessage('Lỗi hệ thống khi tải dữ liệu thể trạng của học viên.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedMemberId) {
      loadStudentData(selectedMemberId)
    }
  }, [selectedMemberId, loadStudentData])

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetMemberId = form.memberId || selectedMemberId
    if (!targetMemberId) {
      setModalErrorMessage('Vui lòng chọn học viên.')
      return
    }

    setIsSubmitting(true)
    setModalErrorMessage(null)
    try {
      const created = await membersService.createMemberBodyAssessment(targetMemberId, {
        assessedAt: new Date().toISOString(),
        weightKg: form.weightKg,
        heightCm: form.heightCm,
        bodyFatPercent: form.bodyFatPercent,
        muscleMassKg: form.muscleMassKg,
        waistCm: form.waistCm || undefined,
        notes: form.notes || undefined,
      })
      setAssessments((prev) => [created, ...prev])
      setIsModalOpen(false)
    } catch (err) {
      // Keep modal open and display error clearly!
      if (isAppApiError(err)) {
        setModalErrorMessage(err.message || 'Lỗi khi lưu chỉ số InBody lên máy chủ.')
      } else {
        setModalErrorMessage('Không thể kết nối máy chủ để lưu chỉ số InBody. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Chỉ số InBody & tiến độ thể hình</h1>
          <p className="text-xs text-text-muted mt-1">
            Ghi chép số đo cơ thể, tỷ lệ mỡ, khối lượng cơ và theo dõi mục tiêu của học viên
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStudentData(selectedMemberId)}
            disabled={isLoading || !selectedMemberId}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button
            onClick={() => {
              setModalErrorMessage(null)
              setIsModalOpen(true)
            }}
            disabled={members.length === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ghi nhận InBody mới</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Select Student Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary shrink-0">
          <User className="h-4 w-4 text-primary" />
          <span>Chọn học viên cần theo dõi:</span>
        </div>
        <div className="w-full max-w-xs">
          {members.length === 0 ? (
            <span className="text-xs text-text-muted">Chưa có học viên nào được phụ trách</span>
          ) : (
            <Select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(e.target.value)
                setForm((f) => ({ ...f, memberId: e.target.value }))
              }}
              options={members.map((m: any) => ({
                value: m.id,
                label: `${m.fullName || m.user?.fullName || 'Học viên'} (${m.memberCode || 'HV'})`,
              }))}
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-12 text-center text-xs text-text-muted">
          Hiện tại bạn chưa phụ trách học viên nào để xem hoặc nhập chỉ số InBody.
        </div>
      ) : (
        <>
          {/* Goal Tracking Cards */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>Mục Tiêu Thể Hình Của Học Viên ({goals.length})</span>
            </h2>

            {goals.length === 0 ? (
              <p className="text-xs text-text-muted italic">Chưa có mục tiêu nào được thiết lập cho học viên này.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((g) => (
                  <div key={g.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-text-primary">{g.title}</h4>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {g.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-text-muted pt-2 border-t border-border-subtle">
                      <span>Khởi đầu: {g.startValue} {g.unit}</span>
                      <span className="font-bold text-primary">Hiện tại: {g.currentValue} {g.unit}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Mục tiêu: {g.targetValue} {g.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Records */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Lịch Sử Đo InBody Theo Thời Gian ({assessments.length})</span>
            </h2>

            {assessments.length === 0 ? (
              <p className="text-xs text-text-muted italic">Chưa có dữ liệu đo InBody nào cho học viên này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text-muted">
                  <thead className="border-b border-border-subtle bg-bg-surface-muted text-text-muted uppercase">
                    <tr>
                      <th className="py-3 px-4">Ngày đo</th>
                      <th className="py-3 px-4">Cân nặng</th>
                      <th className="py-3 px-4">Tỷ lệ mỡ (%)</th>
                      <th className="py-3 px-4">Cơ nạc (kg)</th>
                      <th className="py-3 px-4">Vòng eo (cm)</th>
                      <th className="py-3 px-4">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {assessments.map((a) => (
                      <tr key={a.id} className="hover:bg-bg-surface-muted/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-text-primary">{formatDate(a.assessedAt)}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{a.weightKg} kg</td>
                        <td className="py-3.5 px-4 text-primary font-semibold">{a.bodyFatPercent}%</td>
                        <td className="py-3.5 px-4 text-text-primary font-semibold">{a.muscleMassKg} kg</td>
                        <td className="py-3.5 px-4">{a.waistCm || '—'} cm</td>
                        <td className="py-3.5 px-4 text-text-muted">{a.notes || '—'}</td>
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
          {modalErrorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{modalErrorMessage}</span>
            </div>
          )}

          <Select
            label="Học viên"
            value={form.memberId || selectedMemberId}
            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            options={members.map((m: any) => ({
              value: m.id,
              label: `${m.fullName || m.user?.fullName || 'Học viên'} (${m.memberCode || 'HV'})`,
            }))}
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
