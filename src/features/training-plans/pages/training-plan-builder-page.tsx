import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Dumbbell, Check, FileText, AlertTriangle, RefreshCw } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { trainingPlansService } from '../services/training-plans.service'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { isAppApiError } from '@/shared/api/api-error'
import type { MemberSummary, Exercise, Purchase } from '@/shared/types/api'

interface ExerciseRow {
  exerciseId: string
  name: string
  scheduledDate: string
  sets: number
  reps: number
  weight: string
  rest: number
}

export function TrainingPlanBuilderPage() {
  const preselectedMemberId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('memberId') : null
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [packages, setPackages] = useState<Purchase[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])

  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [memberId, setMemberId] = useState('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')

  const [exercises, setExercises] = useState<ExerciseRow[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [membersRes, exercisesRes, packagesRes] = await Promise.all([
        coachesService.getMyMembers(),
        coursesExercisesService.getExercises({ limit: 100 }),
        coachesService.getMyPackages({ limit: 100 }),
      ])


      const items = (membersRes?.data || (Array.isArray(membersRes) ? membersRes : [])) as MemberSummary[]
      const exList = (exercisesRes?.data || (Array.isArray(exercisesRes) ? exercisesRes : [])) as Exercise[]
      const pkgs = (packagesRes?.data || (Array.isArray(packagesRes) ? packagesRes : [])) as Purchase[]

      setMembers(items)
      setAvailableExercises(exList)
      setPackages(pkgs)

      if (items.length > 0) {
        const targetMember = (preselectedMemberId && items.find((m) => m.id === preselectedMemberId)) || items[0]
        const initialMemberId = targetMember.id
        setMemberId(initialMemberId)

        // Find package for this member
        const memberPkg = pkgs.find(
          (p) => p.memberId === initialMemberId && (p.status === 'ACTIVE' || p.status === 'COMPLETED')
        )
        if (memberPkg) {
          setSelectedPurchaseId(memberPkg.id)
        }
      }

      if (exList.length > 0) {
        setExercises([
          {
            exerciseId: exList[0].id,
            name: exList[0].name,
            scheduledDate: new Date().toISOString().split('T')[0],
            sets: 4,
            reps: 10,
            weight: '50.00',
            rest: 90,
          },
        ])
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải danh sách học viên và bài tập.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Update selected purchase when member changes
  const handleMemberChange = (newMemberId: string) => {
    setMemberId(newMemberId)
    const memberPkg = packages.find(
      (p) => p.memberId === newMemberId && (p.status === 'ACTIVE' || p.status === 'COMPLETED')
    )
    if (memberPkg) {
      setSelectedPurchaseId(memberPkg.id)
    } else {
      setSelectedPurchaseId('')
    }
  }

  const handleAddExerciseRow = () => {
    if (availableExercises.length === 0) return
    const ex = availableExercises.find((candidate) =>
      !exercises.some((row) => row.exerciseId === candidate.id && row.scheduledDate === startDate)
    ) ?? availableExercises[0]
    setExercises([
      ...exercises,
      { exerciseId: ex.id, name: ex.name, scheduledDate: startDate, sets: 3, reps: 10, weight: '40.00', rest: 60 },
    ])
  }

  const handleRemoveExerciseRow = (index: number) => {
    if (exercises.length <= 1) return
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!memberId) {
      setErrorMessage('Vui lòng chọn học viên nhận giáo án.')
      return
    }

    if (!selectedPurchaseId) {
      setErrorMessage('Học viên được chọn chưa có gói PT còn hiệu lực để gán giáo án.')
      return
    }

    if (exercises.length === 0) {
      setErrorMessage('Giáo án phải có ít nhất 1 bài tập.')
      return
    }

    if (exercises.some((item) => !item.scheduledDate || item.scheduledDate < startDate || (endDate && item.scheduledDate > endDate))) {
      setErrorMessage('Ngày của mỗi bài tập phải nằm trong thời gian giáo án.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    let draftId: string | null = null
    try {
      // Step 1: Create plan in DRAFT state
      const draftPlan = await trainingPlansService.createTrainingPlan({
        memberId,
        ptPurchaseId: selectedPurchaseId,
        title,
        goal,
        startDate,
        endDate: endDate ? endDate : undefined,
      })
      draftId = draftPlan.id

      // Step 2: Add all exercises to the draft plan
      for (let i = 0; i < exercises.length; i++) {
        const item = exercises[i]
        await trainingPlansService.addExercise(draftPlan.id, {
          exerciseId: item.exerciseId,
          scheduledDate: item.scheduledDate,
          sets: Number(item.sets),
          reps: Number(item.reps),
          targetWeight: Number(item.weight) || 0,
          restSeconds: Number(item.rest),
          sortOrder: i + 1,
        })
      }

      // Step 3: Assign the plan
      await trainingPlansService.assignTrainingPlan(draftPlan.id)
      draftId = null

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 4000)
    } catch (err) {
      if (draftId) {
        try { await trainingPlansService.deleteTrainingPlan(draftId) } catch { /* Keep the original error visible. */ }
      }
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi lưu và giao giáo án.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ khi tạo giáo án.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const exerciseOptions = availableExercises.map((ex) => ({
    value: ex.id,
    label: `${ex.name} · ${ex.muscleGroups?.find((group) => group.isPrimary)?.name ?? 'Chưa có nhóm cơ chính'}`,
  }))

  const eligiblePackagesForMember = packages.filter(
    (p) => p.memberId === memberId && (p.status === 'ACTIVE' || p.status === 'COMPLETED')
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Trình Soạn Giáo Án Huấn Luyện (WEB-COA-07)</h1>
          <p className="text-xs text-text-muted mt-1">
            Thiết kế bài tập, hiệp tập (sets), số lần (reps) và thời gian nghỉ cá nhân hóa cho học viên
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
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
          <span>Đã lưu bài tập và giao giáo án thành công cho học viên!</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-xs flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Đang tải danh sách học viên và thư viện bài tập từ máy chủ...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-8 text-center text-xs text-text-muted">
          Bạn hiện chưa có học viên nào trong danh sách phụ trách.
        </div>
      ) : (
        <form onSubmit={handleSavePlan} className="space-y-6">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Thông Tin Giáo Án</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên giáo án"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Giáo án Tăng Cơ Toàn Thân..."
              />
              <Select
                label="Giao cho Học viên"
                value={memberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                options={members.map((m: any) => ({
                  value: m.id,
                  label: `${m.fullName || m.user?.fullName || 'Học viên'} (${m.memberCode || 'HV'})`,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Select
                  label="Gói tập PT liên kết"
                  value={selectedPurchaseId}
                  onChange={(e) => setSelectedPurchaseId(e.target.value)}
                  options={
                    eligiblePackagesForMember.length > 0
                      ? eligiblePackagesForMember.map((pkg) => ({
                          value: pkg.id,
                          label: `${pkg.courseNameSnapshot || 'Gói PT'} (${pkg.purchaseCode || pkg.id.slice(0, 8)})`,
                        }))
                      : [{ value: '', label: 'Học viên chưa có gói PT khả dụng' }]
                  }
                />
              </div>
              <div>
                <Input
                  label="Ngày bắt đầu"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Ngày kết thúc (tùy chọn)"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Input
              label="Mục tiêu trọng tâm của buổi tập"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ví dụ: Tối ưu hóa phom tạ Barbell và kiểm soát nhịp hạ tạ..."
            />
          </div>

          {/* Exercises list */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span>Danh Sách Động Tác & Hiệp Tập ({exercises.length})</span>
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddExerciseRow}
                disabled={availableExercises.length === 0}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm động tác</span>
              </Button>
            </div>

            <div className="space-y-3">
              {exercises.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 flex flex-col sm:flex-row sm:flex-wrap items-center gap-3"
                >
                  <div className="w-full sm:w-1/3">
                    <Select
                      label="Bài tập"
                      value={item.exerciseId}
                      onChange={(e) => {
                        const found = availableExercises.find((ex) => ex.id === e.target.value)
                        const copy = [...exercises]
                        copy[idx].exerciseId = e.target.value
                        copy[idx].name = found?.name || 'Bài tập'
                        setExercises(copy)
                      }}
                      options={exerciseOptions}
                    />
                    <p className="mt-1 text-[11px] text-text-muted">
                      {(() => {
                        const groups = availableExercises.find((ex) => ex.id === item.exerciseId)?.muscleGroups ?? []
                        const primary = groups.find((group) => group.isPrimary)
                        const secondary = groups.filter((group) => !group.isPrimary).map((group) => group.name).join(', ')
                        return `Chính: ${primary?.name ?? 'chưa gán'}${secondary ? ` · Phụ: ${secondary}` : ''}${primary?.recoveryDays ? ` · Hồi phục: ${primary.recoveryDays} ngày` : ''}`
                      })()}
                    </p>
                  </div>

                  <div className="w-full sm:w-1/4">
                    <Input
                      label="Ngày tập"
                      type="date"
                      required
                      min={startDate}
                      max={endDate || undefined}
                      value={item.scheduledDate}
                      onChange={(e) => {
                        const copy = [...exercises]
                        copy[idx].scheduledDate = e.target.value
                        setExercises(copy)
                      }}
                    />
                  </div>

                  <div className="w-full sm:w-1/6">
                    <Input
                      label="Số Sets"
                      type="number"
                      min={1}
                      value={item.sets}
                      onChange={(e) => {
                        const copy = [...exercises]
                        copy[idx].sets = Number(e.target.value)
                        setExercises(copy)
                      }}
                    />
                  </div>

                  <div className="w-full sm:w-1/6">
                    <Input
                      label="Số Reps"
                      type="number"
                      min={1}
                      value={item.reps}
                      onChange={(e) => {
                        const copy = [...exercises]
                        copy[idx].reps = Number(e.target.value)
                        setExercises(copy)
                      }}
                    />
                  </div>

                  <div className="w-full sm:w-1/6">
                    <Input
                      label="Tạ (Kg)"
                      type="number"
                      min={0}
                      step={0.5}
                      value={item.weight}
                      onChange={(e) => {
                        const copy = [...exercises]
                        copy[idx].weight = e.target.value
                        setExercises(copy)
                      }}
                    />
                  </div>

                  <div className="w-full sm:w-1/6 flex items-end gap-2 pt-5">
                    <button
                      type="button"
                      onClick={() => handleRemoveExerciseRow(idx)}
                      disabled={exercises.length <= 1}
                      className="p-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Xóa hiệp"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedPurchaseId || exercises.length === 0}
                className="px-8"
              >
                {isSubmitting ? 'Đang tạo & giao giáo án...' : 'Lưu & Giao Giáo Án'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
