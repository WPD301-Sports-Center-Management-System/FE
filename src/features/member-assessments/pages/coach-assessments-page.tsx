import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Plus, Target, TrendingUp, RefreshCw, User, AlertTriangle, PencilLine } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { membersService } from '@/features/memberships/services/members.service'
import { centerDate, formatDate } from '@/shared/utils/date'
import { isAppApiError } from '@/shared/api/api-error'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import type { BodyAssessment, FitnessGoal, MemberSummary } from '@/shared/types/api'

// Forms start empty: pre-filled sample numbers were easy to save by mistake as a member's real data.
const EMPTY_ASSESSMENT = { memberId: '', assessedAt: '', weightKg: '', heightCm: '', bodyFatPercent: '', muscleMassKg: '', waistCm: '', notes: '' }
const EMPTY_GOAL = { title: '', metricName: '', unit: '', startValue: '', currentValue: '', targetValue: '', targetDate: '', status: 'ACTIVE' as FitnessGoal['status'] }

const memberLabel = (m: MemberSummary & { user?: { fullName?: string } }) => `${m.fullName || m.user?.fullName || 'Học viên'} (${m.memberCode || 'HV'})`
const toNumberText = (v?: string | number | null) => (v === undefined || v === null ? '' : String(Number(v)))
const blankToUndefined = (v: string) => (v.trim() === '' ? undefined : v.trim())
const errorText = (err: unknown, fallback: string) => (isAppApiError(err) ? err.message || fallback : fallback)

export function CoachAssessmentsPage() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [assessments, setAssessments] = useState<BodyAssessment[]>([])
  const [goals, setGoals] = useState<FitnessGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null)

  // Assessment modal: null = closed, 'new' = create, otherwise the record being corrected.
  const [assessmentEditing, setAssessmentEditing] = useState<BodyAssessment | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY_ASSESSMENT)
  const [goalEditing, setGoalEditing] = useState<FitnessGoal | 'new' | null>(null)
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL)
  const selectedMember = members.find((m) => m.id === selectedMemberId)
  const orderedAssessments = [...assessments].sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())
  const latestAssessment = orderedAssessments[0]
  const previousAssessment = orderedAssessments[1]
  const weightDelta = latestAssessment?.weightKg != null && previousAssessment?.weightKg != null
    ? Number(latestAssessment.weightKg) - Number(previousAssessment.weightKg)
    : null
  const fatDelta = latestAssessment?.bodyFatPercent != null && previousAssessment?.bodyFatPercent != null
    ? Number(latestAssessment.bodyFatPercent) - Number(previousAssessment.bodyFatPercent)
    : null

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await coachesService.getMyMembers()
      const items = (res?.data || (Array.isArray(res) ? res : [])) as MemberSummary[]
      setMembers(items)
      if (items.length > 0) setSelectedMemberId((prev) => prev || items[0].id)
    } catch (err) {
      setErrorMessage(errorText(err, 'Không thể tải danh sách học viên từ máy chủ.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

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
        setErrorMessage(errorText(asmRes.reason, 'Không thể tải chỉ số InBody.'))
      }
      if (goalsRes.status === 'fulfilled') {
        const val = goalsRes.value
        setGoals((val as any)?.data || (Array.isArray(val) ? val : []))
      } else {
        setGoals([])
        setErrorMessage(errorText(goalsRes.reason, 'Không thể tải mục tiêu của học viên.'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedMemberId) loadStudentData(selectedMemberId)
  }, [selectedMemberId, loadStudentData])

  const openAssessment = (record: BodyAssessment | 'new') => {
    setModalErrorMessage(null)
    setForm(
      record === 'new'
        ? { ...EMPTY_ASSESSMENT, memberId: selectedMemberId, assessedAt: centerDate() }
        : {
            memberId: record.memberId,
            assessedAt: record.assessedAt.slice(0, 10),
            weightKg: toNumberText(record.weightKg),
            heightCm: toNumberText(record.heightCm),
            bodyFatPercent: toNumberText(record.bodyFatPercent),
            muscleMassKg: toNumberText(record.muscleMassKg),
            waistCm: toNumberText(record.waistCm),
            notes: record.notes ?? '',
          },
    )
    setAssessmentEditing(record)
  }

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetMemberId = form.memberId || selectedMemberId
    if (!targetMemberId) {
      setModalErrorMessage('Vui lòng chọn học viên.')
      return
    }
    setIsSubmitting(true)
    setModalErrorMessage(null)
    const payload = {
      // Measured on a center day; noon keeps the calendar date stable across time zones.
      assessedAt: new Date(`${form.assessedAt || centerDate()}T12:00:00+07:00`).toISOString(),
      weightKg: blankToUndefined(form.weightKg),
      heightCm: blankToUndefined(form.heightCm),
      bodyFatPercent: blankToUndefined(form.bodyFatPercent),
      muscleMassKg: blankToUndefined(form.muscleMassKg),
      waistCm: blankToUndefined(form.waistCm),
      notes: blankToUndefined(form.notes),
    }
    try {
      if (assessmentEditing && assessmentEditing !== 'new') {
        const updated = await membersService.updateBodyAssessment(assessmentEditing.id, payload)
        setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      } else {
        const created = await membersService.createMemberBodyAssessment(targetMemberId, payload)
        if (targetMemberId === selectedMemberId) setAssessments((prev) => [created, ...prev])
      }
      setAssessmentEditing(null)
    } catch (err) {
      setModalErrorMessage(errorText(err, 'Không thể kết nối máy chủ để lưu chỉ số InBody. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openGoal = (goal: FitnessGoal | 'new') => {
    setModalErrorMessage(null)
    setGoalForm(
      goal === 'new'
        ? EMPTY_GOAL
        : {
            title: goal.title,
            metricName: goal.metricName ?? '',
            unit: goal.unit ?? '',
            startValue: toNumberText(goal.startValue),
            currentValue: toNumberText(goal.currentValue),
            targetValue: toNumberText(goal.targetValue),
            targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
            status: goal.status,
          },
    )
    setGoalEditing(goal)
  }

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalForm.title.trim()) {
      setModalErrorMessage('Vui lòng nhập tên mục tiêu.')
      return
    }
    setIsSubmitting(true)
    setModalErrorMessage(null)
    const payload = {
      title: goalForm.title.trim(),
      metricName: blankToUndefined(goalForm.metricName),
      unit: blankToUndefined(goalForm.unit),
      startValue: blankToUndefined(goalForm.startValue),
      currentValue: blankToUndefined(goalForm.currentValue),
      targetValue: blankToUndefined(goalForm.targetValue),
      targetDate: blankToUndefined(goalForm.targetDate),
    }
    try {
      if (goalEditing && goalEditing !== 'new') {
        const updated = await membersService.updateFitnessGoal(goalEditing.id, { ...payload, status: goalForm.status })
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
      } else {
        const created = await membersService.createMemberFitnessGoal(selectedMemberId, payload)
        setGoals((prev) => [created, ...prev])
      }
      setGoalEditing(null)
    } catch (err) {
      setModalErrorMessage(errorText(err, 'Không lưu được mục tiêu. Vui lòng thử lại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalError = modalErrorMessage && (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{modalErrorMessage}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Chỉ số InBody & mục tiêu</h1>
          <p className="text-sm text-text-muted mt-1">Ghi số đo cơ thể và theo dõi mục tiêu của từng học viên.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadStudentData(selectedMemberId)} disabled={isLoading || !selectedMemberId} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button onClick={() => openAssessment('new')} disabled={members.length === 0} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Ghi nhận InBody mới</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary shrink-0">
          <User className="h-4 w-4 text-primary" />
          <span>Học viên:</span>
        </div>
        <div className="w-full max-w-xs">
          {members.length === 0 ? (
            <span className="text-sm text-text-muted">Chưa có học viên nào được phụ trách</span>
          ) : (
            <Select
              aria-label="Chọn học viên"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              options={members.map((m) => ({ value: m.id, label: memberLabel(m) }))}
            />
          )}
        </div>
        {selectedMember && <p className="text-xs text-text-muted sm:border-l sm:border-border-subtle sm:pl-4">Mã học viên: {selectedMember.memberCode || 'Chưa có mã'}</p>}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-12 text-center text-sm text-text-muted">
          Hiện tại bạn chưa phụ trách học viên nào để xem hoặc nhập chỉ số InBody.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>Mục tiêu ({goals.length})</span>
              </h2>
              <Button size="sm" variant="outline" onClick={() => openGoal('new')} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Thêm mục tiêu
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-subtle bg-bg-surface-muted p-5 text-sm text-text-muted">
                <p>Chưa có mục tiêu nào cho học viên này.</p>
                <p className="mt-1 text-xs">Thiết lập mục tiêu cân nặng, tỷ lệ mỡ hoặc vòng eo để theo dõi tiến độ.</p>
                <Button size="sm" variant="outline" onClick={() => openGoal('new')} className="mt-3">Tạo mục tiêu đầu tiên</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((g) => (
                  <div key={g.id} className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">{g.title}</h3>
                        {g.targetDate && <p className="text-xs text-text-muted">Hạn: {formatDate(g.targetDate)}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={g.status} />
                        <Button size="sm" variant="ghost" onClick={() => openGoal(g)} aria-label={`Cập nhật mục tiêu ${g.title}`}>
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between gap-2 text-sm text-text-muted pt-2 border-t border-border-subtle">
                      <span>Khởi đầu: {g.startValue ?? '—'} {g.unit}</span>
                      <span className="font-bold text-primary">Hiện tại: {g.currentValue ?? '—'} {g.unit}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Mục tiêu: {g.targetValue ?? '—'} {g.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Lịch sử đo InBody ({assessments.length})</span>
              </h2>
              {latestAssessment && <p className="text-xs text-text-muted">Lần đo gần nhất: {formatDate(latestAssessment.assessedAt)}</p>}
            </div>

            {latestAssessment && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-bg-surface-muted p-3"><p className="text-xs text-text-muted">Cân nặng hiện tại</p><p className="mt-1 font-bold text-text-primary">{latestAssessment.weightKg != null ? `${latestAssessment.weightKg} kg` : 'Chưa ghi nhận'}</p>{weightDelta !== null && <p className="text-xs text-text-muted">{weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg so với lần trước</p>}</div>
              <div className="rounded-xl bg-bg-surface-muted p-3"><p className="text-xs text-text-muted">Tỷ lệ mỡ hiện tại</p><p className="mt-1 font-bold text-text-primary">{latestAssessment.bodyFatPercent != null ? `${latestAssessment.bodyFatPercent}%` : 'Chưa ghi nhận'}</p>{fatDelta !== null && <p className="text-xs text-text-muted">{fatDelta > 0 ? '+' : ''}{fatDelta.toFixed(1)} điểm % so với lần trước</p>}</div>
              <div className="rounded-xl bg-bg-surface-muted p-3"><p className="text-xs text-text-muted">Dữ liệu theo dõi</p><p className="mt-1 font-bold text-text-primary">{assessments.length} lần đo</p><p className="text-xs text-text-muted">Cần ít nhất 2 lần đo để xem thay đổi</p></div>
            </div>}

            {assessments.length === 0 ? (
              <p className="text-sm text-text-muted">Chưa có dữ liệu đo InBody nào cho học viên này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-muted">
                  <thead className="border-b border-border-subtle bg-bg-surface-muted text-xs text-text-muted uppercase">
                    <tr>
                      <th className="py-3 px-4">Ngày đo</th>
                      <th className="py-3 px-4">Cân nặng (kg)</th>
                      <th className="py-3 px-4">Tỷ lệ mỡ (%)</th>
                      <th className="py-3 px-4">Cơ nạc (kg)</th>
                      <th className="py-3 px-4">Vòng eo (cm)</th>
                      <th className="py-3 px-4">Ghi chú</th>
                      <th className="py-3 px-4"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {orderedAssessments.map((a) => (
                      <tr key={a.id} className="hover:bg-bg-surface-muted/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-text-primary">{formatDate(a.assessedAt)}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">{a.weightKg != null ? `${a.weightKg} kg` : 'Chưa ghi nhận'}</td>
                        <td className="py-3.5 px-4 text-primary font-semibold">{a.bodyFatPercent != null ? `${a.bodyFatPercent}%` : 'Chưa ghi nhận'}</td>
                        <td className="py-3.5 px-4 text-text-primary font-semibold">{a.muscleMassKg != null ? `${a.muscleMassKg} kg` : 'Chưa ghi nhận'}</td>
                        <td className="py-3.5 px-4">{a.waistCm != null ? `${a.waistCm} cm` : 'Chưa ghi nhận'}</td>
                        <td className="py-3.5 px-4 text-text-muted">{a.notes || 'Không có ghi chú'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => openAssessment(a)} className="gap-1" aria-label={`Chỉnh sửa lần đo ${formatDate(a.assessedAt)}`}>
                            <PencilLine className="h-3.5 w-3.5" />
                            Sửa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={!!assessmentEditing}
        onClose={() => setAssessmentEditing(null)}
        title={assessmentEditing === 'new' ? 'Nhập chỉ số InBody mới' : 'Sửa chỉ số InBody'}
        description="Điền các thông số đo được từ máy phân tích cơ thể. Để trống ô không đo."
      >
        <form onSubmit={handleSaveAssessment} className="space-y-4">
          {modalError}
          {assessmentEditing === 'new' && (
            <Select
              label="Học viên"
              value={form.memberId || selectedMemberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              options={members.map((m) => ({ value: m.id, label: memberLabel(m) }))}
            />
          )}
          <Input label="Ngày đo" type="date" required max={centerDate()} value={form.assessedAt} onChange={(e) => setForm({ ...form, assessedAt: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cân nặng (kg)" type="number" step="0.1" min="0" inputMode="decimal" required value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
            <Input label="Chiều cao (cm)" type="number" step="0.1" min="0" inputMode="decimal" required value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
            <Input label="Tỷ lệ mỡ (%)" type="number" step="0.1" min="0" max="100" inputMode="decimal" value={form.bodyFatPercent} onChange={(e) => setForm({ ...form, bodyFatPercent: e.target.value })} />
            <Input label="Khối lượng cơ (kg)" type="number" step="0.1" min="0" inputMode="decimal" value={form.muscleMassKg} onChange={(e) => setForm({ ...form, muscleMassKg: e.target.value })} />
            <Input label="Vòng eo (cm)" type="number" step="0.1" min="0" inputMode="decimal" value={form.waistCm} onChange={(e) => setForm({ ...form, waistCm: e.target.value })} />
          </div>
          <Input label="Ghi chú" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setAssessmentEditing(null)}>Hủy</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {assessmentEditing === 'new' ? 'Lưu kết quả InBody' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!goalEditing} onClose={() => setGoalEditing(null)} title={goalEditing === 'new' ? 'Thêm mục tiêu' : 'Cập nhật mục tiêu'}>
        <form onSubmit={handleSaveGoal} className="space-y-4">
          {modalError}
          <Input label="Tên mục tiêu" required maxLength={180} placeholder="VD: Giảm 5 kg mỡ" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Chỉ số theo dõi" placeholder="VD: Cân nặng" value={goalForm.metricName} onChange={(e) => setGoalForm({ ...goalForm, metricName: e.target.value })} />
            <Input label="Đơn vị" placeholder="VD: kg" value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} />
            <Input label="Khởi đầu" type="number" step="any" value={goalForm.startValue} onChange={(e) => setGoalForm({ ...goalForm, startValue: e.target.value })} />
            <Input label="Hiện tại" type="number" step="any" value={goalForm.currentValue} onChange={(e) => setGoalForm({ ...goalForm, currentValue: e.target.value })} />
            <Input label="Mục tiêu" type="number" step="any" value={goalForm.targetValue} onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })} />
            <Input label="Hạn hoàn thành" type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
          </div>
          {goalEditing !== 'new' && (
            <Select
              label="Trạng thái"
              value={goalForm.status}
              onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value as FitnessGoal['status'] })}
              options={[
                { value: 'ACTIVE', label: 'Đang theo đuổi' },
                { value: 'ACHIEVED', label: 'Đã đạt' },
                { value: 'CANCELLED', label: 'Đã hủy' },
              ]}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setGoalEditing(null)}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting}>Lưu mục tiêu</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
