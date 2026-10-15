import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Dumbbell,
  Check,
  CheckCircle2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Zap,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Sparkles,
  ShieldCheck,
  BookOpen,
  X,
  RotateCcw,
} from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { trainingPlansService } from '../services/training-plans.service'
import {
  WORKOUT_PRESETS,
  findMatchingExercise,
  type MemberLevel,
} from '../utils/training-presets'
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
  roleName?: string
  phase?: string
  rpe?: string
  targetMuscle?: string
  instructions?: string
}

export function TrainingPlanBuilderPage() {
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

  // Presets & Levels state (Không tự ý chọn mặc định khi mới vào trang)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [memberLevel, setMemberLevel] = useState<MemberLevel>('INTERMEDIATE')
  const [showWeeklySplit, setShowWeeklySplit] = useState(false)
  const [presetNotice, setPresetNotice] = useState<string | null>(null)
  const [isLoadingManagerSyllabus, setIsLoadingManagerSyllabus] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<{
    title: string
    memberName: string
    exerciseCount: number
  } | null>(null)

  const handleResetForm = () => {
    setTitle('')
    setGoal('')
    setMemberId('')
    setSelectedPurchaseId('')
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setExercises([])
    setSelectedPresetId(null)
    setErrorMessage(null)
    setSuccessNotice(null)
  }

  // Apply a preset to the exercises state
  const applyPreset = useCallback(
    (presetId: string, level: MemberLevel, exList: Exercise[], targetDate: string, showToast = true) => {
      const preset = WORKOUT_PRESETS.find((p) => p.id === presetId) || WORKOUT_PRESETS[0]
      if (!preset || exList.length === 0) return

      const newRows: ExerciseRow[] = []
      const usedIds = new Set<string>()

      preset.exercises.forEach((item) => {
        let matched = findMatchingExercise(
          item.candidateNames,
          exList.filter((e) => !usedIds.has(e.id))
        )
        if (!matched) {
          matched = exList.find((e) => !usedIds.has(e.id)) || exList[0]
        }
        if (matched) {
          usedIds.add(matched.id)
        }
        const exerciseToUse = matched || exList[0]
        const config = item.byLevel[level]

        newRows.push({
          exerciseId: exerciseToUse.id,
          name: exerciseToUse.name,
          scheduledDate: targetDate,
          sets: config.sets,
          reps: config.reps,
          weight: config.weight,
          rest: config.restSeconds,
          roleName: item.roleName,
          phase: item.phase,
          rpe: config.rpe,
          targetMuscle: item.targetMuscle,
          instructions: config.instructions,
        })
      })

      setExercises(newRows)
      // Giữ nguyên thông tin giáo án nếu người dùng đã nhập, không tự ý ghi đè/reset
      setTitle((prev) => (prev.trim() ? prev : preset.defaultTitle))
      setGoal((prev) => (prev.trim() ? prev : preset.defaultGoal))

      if (showToast) {
        setPresetNotice(
          `Đã nạp thành công ${newRows.length} bài tập mẫu theo phân bổ ${preset.name} (Mức độ: ${
            level === 'BEGINNER' ? 'Mới tập' : level === 'INTERMEDIATE' ? 'Trung bình' : 'Nâng cao'
          })`
        )
        setTimeout(() => setPresetNotice(null), 4000)
      }
    },
    []
  )

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

      // Khởi tạo form sạch sẽ, không tự ý chọn mặc định học viên hay bài tập
      setMemberId('')
      setSelectedPurchaseId('')
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

  // Nạp giáo án chuẩn từ Khóa học do Manager thiết lập trong Database
  const handleApplyManagerCourseSyllabus = async () => {
    const selectedPkg = packages.find((p) => p.id === selectedPurchaseId)
    if (!selectedPkg || !selectedPkg.courseId) {
      setErrorMessage('Chưa xác định được khóa học của gói PT này để nạp giáo án chuẩn.')
      return
    }

    setIsLoadingManagerSyllabus(true)
    setErrorMessage(null)
    try {
      const course = await coursesExercisesService.getTrainingCourseById(selectedPkg.courseId)
      const syllabusList = course.courseExercisesCourseId || []

      if (syllabusList.length === 0) {
        setPresetNotice(
          `Khóa học "${course.name}" chưa có bài tập mẫu do Manager thiết lập. Bạn có thể sử dụng các mẫu chuẩn bên dưới.`
        )
        setTimeout(() => setPresetNotice(null), 5000)
        return
      }

      // Map các bài tập chuẩn của Manager theo cấp độ học viên hiện tại
      const newRows: ExerciseRow[] = syllabusList.map((item, idx) => {
        const ex = item.exercise
        const levelConfig = {
          BEGINNER: { sets: 3, reps: 12, weight: '20.00', rest: 75, rpe: 'RPE 6.5 (An toàn)' },
          INTERMEDIATE: { sets: 4, reps: 10, weight: '40.00', rest: 60, rpe: 'RPE 8 (Chừa 2 rep)' },
          ADVANCED: { sets: 4, reps: 8, weight: '60.00', rest: 90, rpe: 'RPE 8.5 (Tạ nặng)' },
        }[memberLevel]

        return {
          exerciseId: item.exerciseId || ex?.id || '',
          name: ex?.name || `Động tác #${idx + 1}`,
          scheduledDate: startDate,
          sets: levelConfig.sets,
          reps: levelConfig.reps,
          weight: levelConfig.weight,
          rest: levelConfig.rest,
          roleName: `0${idx + 1}. Bài tập chuẩn Manager`,
          rpe: levelConfig.rpe,
          instructions: item.coachNote || 'Thực hiện động tác có kiểm soát nhịp thở và góc chuyển động.',
        }
      })

      setExercises(newRows)
      setTitle(`Giáo án ${course.name} (Chuẩn Trung Tâm)`)
      if (course.objective) setGoal(course.objective)

      setPresetNotice(
        `👑 Đã nạp thành công ${newRows.length} bài tập chuẩn từ Khóa học "${course.name}" do Manager thiết lập!`
      )
      setTimeout(() => setPresetNotice(null), 5000)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải giáo án khóa học của Manager.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ để lấy giáo án chuẩn.')
      }
    } finally {
      setIsLoadingManagerSyllabus(false)
    }
  }

  const handleAddExerciseRow = () => {
    if (availableExercises.length === 0) return
    const ex =
      availableExercises.find(
        (candidate) =>
          !exercises.some((row) => row.exerciseId === candidate.id && row.scheduledDate === startDate)
      ) ?? availableExercises[0]
    setExercises([
      ...exercises,
      {
        exerciseId: ex.id,
        name: ex.name,
        scheduledDate: startDate,
        sets: 3,
        reps: 10,
        weight: '40.00',
        rest: 60,
        roleName: `Động tác bổ sung #${exercises.length + 1}`,
        rpe: 'RPE 8 (Chừa 2 rep)',
        instructions: 'Thực hiện động tác có kiểm soát nhịp thở và góc chuyển động.',
      },
    ])
  }

  const handleRemoveExerciseRow = (index: number) => {
    if (exercises.length <= 1) return
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId)
    applyPreset(presetId, memberLevel, availableExercises, startDate, true)
  }

  const handleManualApplyPreset = () => {
    if (!selectedPresetId) return
    applyPreset(selectedPresetId, memberLevel, availableExercises, startDate, true)
  }

  const handleLevelChange = (newLevel: MemberLevel) => {
    setMemberLevel(newLevel)
    if (!selectedPresetId) return
    const currentPreset = WORKOUT_PRESETS.find((p) => p.id === selectedPresetId)
    if (!currentPreset) return

    setExercises((prev) =>
      prev.map((row, idx) => {
        const presetItem = currentPreset.exercises[idx]
        if (!presetItem) {
          // Tính tự động cho bài tập thêm thủ công
          const base = {
            BEGINNER: { sets: 3, reps: 12, weight: '20.00', rest: 75, rpe: 'RPE 6.5 (An toàn)' },
            INTERMEDIATE: { sets: 4, reps: 10, weight: '40.00', rest: 60, rpe: 'RPE 8 (Chừa 2 rep)' },
            ADVANCED: { sets: 4, reps: 8, weight: '60.00', rest: 90, rpe: 'RPE 8.5 (Tạ nặng)' },
          }[newLevel]
          return { ...row, ...base }
        }
        const cfg = presetItem.byLevel[newLevel]
        return {
          ...row,
          sets: cfg.sets,
          reps: cfg.reps,
          weight: cfg.weight,
          rest: cfg.restSeconds,
          rpe: cfg.rpe,
          instructions: cfg.instructions,
        }
      })
    )
    setPresetNotice(
      `Đã chuyển thông số bài tập sang cấp độ: ${
        newLevel === 'BEGINNER' ? 'Mới tập (Beginner)' : newLevel === 'INTERMEDIATE' ? 'Trung bình' : 'Nâng cao'
      }`
    )
    setTimeout(() => setPresetNotice(null), 3000)
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên giáo án huấn luyện.')
      return
    }

    if (!memberId) {
      setErrorMessage('Vui lòng chọn học viên nhận giáo án.')
      return
    }

    if (!selectedPurchaseId) {
      setErrorMessage('Vui lòng chọn gói tập PT còn hiệu lực của học viên để gán giáo án.')
      return
    }

    if (exercises.length === 0) {
      setErrorMessage('Giáo án phải có ít nhất 1 bài tập. Vui lòng bấm nạp giáo án mẫu hoặc thêm động tác.')
      return
    }

    if (
      exercises.some(
        (item) =>
          !item.scheduledDate ||
          item.scheduledDate < startDate ||
          (endDate && item.scheduledDate > endDate)
      )
    ) {
      setErrorMessage('Ngày của mỗi bài tập phải nằm trong thời gian giáo án.')
      return
    }

    // Kiểm tra trùng bài tập trong cùng một ngày tập
    const duplicateMap = new Set<string>()
    for (const item of exercises) {
      const key = `${item.scheduledDate}_${item.exerciseId}`
      if (duplicateMap.has(key)) {
        setErrorMessage(
          `Bài tập "${item.name}" bị trùng lặp trong ngày ${item.scheduledDate}. Mỗi bài tập chỉ xuất hiện tối đa 1 lần trong cùng một ngày.`
        )
        return
      }
      duplicateMap.add(key)
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    let draftId: string | null = null
    try {
      // Step 1: Create plan in DRAFT state
      const draftPlan = await trainingPlansService.createTrainingPlan({
        memberId,
        ptPurchaseId: selectedPurchaseId,
        title: title.trim(),
        goal: goal.trim() || undefined,
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
          restSeconds: Number(item.rest) || 60,
          sortOrder: i + 1,
          instructions: item.instructions || undefined,
        })
      }

      // Step 3: Assign the plan
      await trainingPlansService.assignTrainingPlan(draftPlan.id)
      draftId = null

      // Lưu lại thông tin để hiển thị thông báo chi tiết cho HLV
      const assignedMember = members.find((m) => m.id === memberId)
      const successTitle = title.trim()
      const totalExercises = exercises.length

      // Xóa toàn bộ dữ liệu form sau khi lưu thành công (Clear form hoàn toàn)
      setTitle('')
      setGoal('')
      setEndDate('')
      setMemberId('')
      setSelectedPurchaseId('')
      setExercises([])
      setSelectedPresetId(null)
      setErrorMessage(null)

      // Cập nhật thông báo thành công
      setSuccessNotice({
        title: successTitle,
        memberName: assignedMember?.fullName || (assignedMember as any)?.user?.fullName || 'học viên',
        exerciseCount: totalExercises,
      })

      // Cuộn mượt lên đầu trang
      window.scrollTo({ top: 0, behavior: 'smooth' })
      const scrollContainers = [
        document.documentElement,
        document.body,
        document.querySelector('main'),
      ]
      scrollContainers.forEach((el) => {
        if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
      })

      // Tự động đóng thông báo sau 8 giây
      setTimeout(() => {
        setSuccessNotice(null)
      }, 8000)
    } catch (err) {
      if (draftId) {
        try {
          await trainingPlansService.deleteTrainingPlan(draftId)
        } catch {
          /* Keep the original error visible. */
        }
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

  const selectedPackage = packages.find((p) => p.id === selectedPurchaseId)
  const activePreset = selectedPresetId ? WORKOUT_PRESETS.find((p) => p.id === selectedPresetId) : null

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 relative">
      {/* Floating Success Notification Toast */}
      {successNotice && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="rounded-2xl border-2 border-emerald-500 bg-bg-surface p-4.5 shadow-2xl ring-4 ring-emerald-500/20 flex items-start gap-3.5">
            <div className="rounded-full bg-emerald-500/15 p-2 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span>Lưu & Giao Giáo Án Thành Công!</span>
                <span className="text-base">🎉</span>
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Đã giao giáo án <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">"{successNotice.title}"</strong> ({successNotice.exerciseCount} động tác) cho học viên <strong className="text-text-primary font-semibold">{successNotice.memberName}</strong>.
              </p>
              <p className="text-[11px] text-text-muted/80 pt-0.5">
                Hội viên đã có thể xem lịch tập và bài tập trên ứng dụng di động. Form đã được làm mới sạch sẽ sẵn sàng tạo giáo án tiếp theo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg-surface-muted transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Trình Soạn Giáo Án Huấn Luyện (WEB-COA-07)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Kế thừa giáo án chuẩn của Manager, tùy biến sets, reps, tạ và thời gian nghỉ theo thể trạng học viên
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={handleResetForm}
            disabled={isLoading || isSubmitting}
            className="gap-1.5 cursor-pointer text-xs"
            title="Xóa dữ liệu đang nhập để làm lại từ đầu"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xóa trắng form</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading || isSubmitting}
            className="gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {presetNotice && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary flex items-center gap-2 animate-in fade-in">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span>{presetNotice}</span>
        </div>
      )}

      {successNotice && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-start justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">Đã lưu bài tập và giao giáo án thành công!</p>
              <p className="text-xs opacity-90">
                Giáo án <strong className="underline">"{successNotice.title}"</strong> ({successNotice.exerciseCount} bài tập) đã được giao thành công cho học viên <strong>{successNotice.memberName}</strong>. Toàn bộ form đã được xóa sạch để sẵn sàng tạo giáo án mới.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:opacity-75 cursor-pointer p-1"
          >
            <X className="h-4 w-4" />
          </button>
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
        <form onSubmit={handleSavePlan} noValidate className="space-y-6">
          {/* SECTION 1: Thông tin cơ bản giáo án */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Thông Tin Giáo Án</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên giáo án"
                required
                placeholder="Ví dụ: Giáo án Lưng & Bắp tay trước (Kéo - Hypertrophy)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Select
                label="Giao cho Học viên"
                required
                value={memberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                options={[
                  { value: '', label: '-- Chọn học viên nhận giáo án --' },
                  ...members.map((m: any) => ({
                    value: m.id,
                    label: `${m.fullName || m.user?.fullName || 'Học viên'} (${m.memberCode || 'HV'})`,
                  })),
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Select
                  label="Gói tập PT liên kết"
                  required
                  value={selectedPurchaseId}
                  onChange={(e) => setSelectedPurchaseId(e.target.value)}
                  options={
                    eligiblePackagesForMember.length > 0
                      ? [
                          { value: '', label: '-- Chọn gói PT của học viên --' },
                          ...eligiblePackagesForMember.map((pkg) => ({
                            value: pkg.id,
                            label: `${pkg.courseNameSnapshot || 'Gói PT'} (${pkg.purchaseCode || pkg.id.slice(0, 8)})`,
                          })),
                        ]
                      : [{ value: '', label: memberId ? 'Học viên chưa có gói PT khả dụng' : '-- Vui lòng chọn học viên trước --' }]
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
            />
          </div>

          {/* SECTION 2: Kế Thừa Giáo Án Chuẩn Manager & Cấp Độ Học Viên */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-bg-surface to-bg-surface p-6 space-y-5 shadow-sm">
            {/* Banner liên kết Khóa học của Manager */}
            {selectedPackage?.courseNameSnapshot && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="font-bold text-xs text-primary uppercase tracking-wide">
                      Khóa học của Manager: {selectedPackage.courseNameSnapshot}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Học viên đã đăng ký gói PT theo khóa này. Bạn có thể nạp ngay toàn bộ bài tập và hướng dẫn kỹ thuật chuẩn do Manager ban hành.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApplyManagerCourseSyllabus}
                  disabled={isLoadingManagerSyllabus}
                  className="gap-2 text-xs shrink-0 cursor-pointer shadow-sm"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>
                    {isLoadingManagerSyllabus
                      ? 'Đang tải giáo án...'
                      : `Nạp giáo án khóa ${selectedPackage.courseNameSnapshot}`}
                  </span>
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary fill-primary/20" />
                  <span>Mẫu Giáo Án Chuẩn Trung Tâm (Manager Curriculum)</span>
                </h2>
                <p className="text-xs text-text-muted">
                  Chọn phân vùng cơ thể và mức độ của học viên để tự động nạp cấu trúc 6 pha chuẩn thể hình:
                  Kích hoạt $\rightarrow$ Heavy Compound $\rightarrow$ Hypertrophy $\rightarrow$ Cô lập $\rightarrow$ Vai sau $\rightarrow$ Kéo giãn
                </p>
              </div>

              {/* Toggle Khung Chu Kỳ Tuần */}
              <button
                type="button"
                onClick={() => setShowWeeklySplit(!showWeeklySplit)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{showWeeklySplit ? 'Ẩn lịch phân bổ tuần' : 'Xem chu kỳ phân bổ tuần (PPL)'}</span>
                {showWeeklySplit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Collapsible Weekly Split Table */}
            {showWeeklySplit && (
              <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 text-xs space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 font-semibold text-text-primary">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Khung Phân Bổ Chu Kỳ Tuần Đảm Bảo Hồi Phục (Supercompensation)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-border-subtle text-text-muted">
                        <th className="py-2 px-3 font-medium">Thứ trong tuần</th>
                        <th className="py-2 px-3 font-medium">Nội dung buổi tập</th>
                        <th className="py-2 px-3 font-medium">Trạng thái cơ bắp & Hồi phục</th>
                        <th className="py-2 px-3 font-medium">Khung giờ gợi ý (Coach Slot)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      <tr className="bg-primary/5 font-medium">
                        <td className="py-2.5 px-3">Thứ 2</td>
                        <td className="py-2.5 px-3 text-primary">Giáo án Lưng & Tay trước (Pull Day)</td>
                        <td className="py-2.5 px-3">Tập cường độ cao (Stress cơ bắp)</td>
                        <td className="py-2.5 px-3">18:00 – 19:00 (Slot PT 1:1)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">Thứ 3</td>
                        <td className="py-2 px-3">Ngực & Tay sau (Push Day)</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                          Hồi phục mức 1 (24h - Tái tạo sợi cơ lưng)
                        </td>
                        <td className="py-2 px-3 text-text-muted">Nghỉ kéo hoàn toàn, chỉ dùng cơ đẩy</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-text-muted">Thứ 4</td>
                        <td className="py-2 px-3 text-text-muted">Nghỉ ngơi hoàn toàn (Rest Day) / Đi bộ nhẹ</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                          Hồi phục mức 2 (48h - Giảm đau mỏi DOMS ~80%)
                        </td>
                        <td className="py-2 px-3 text-text-muted">Tự tập nhẹ nhàng</td>
                      </tr>
                      <tr className="bg-emerald-500/5">
                        <td className="py-2 px-3">Thứ 5</td>
                        <td className="py-2 px-3 text-emerald-700 dark:text-emerald-300">Chân & Bụng (Leg Day)</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                          Sẵn sàng (72h - Hoàn tất hồi phục cơ lưng)
                        </td>
                        <td className="py-2 px-3 text-text-muted">Cơ lưng đã đầy đủ glycogen dự trữ</td>
                      </tr>
                      <tr className="bg-primary/5">
                        <td className="py-2 px-3">Thứ 6</td>
                        <td className="py-2 px-3 text-primary">Lưng biến thể nhẹ & Vai sau (Pull Day 2)</td>
                        <td className="py-2.5 px-3">Kích hoạt chu kỳ mới (Deload / Volume)</td>
                        <td className="py-2 px-3">19:15 – 20:15 (Slot PT 1:1)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-text-muted">Thứ 7 & CN</td>
                        <td className="py-2 px-3 text-text-muted">Nghỉ ngơi cuối tuần (Active Recovery)</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">Hồi phục toàn diện</td>
                        <td className="py-2 px-3 text-text-muted">Bơi lội hoặc giãn cơ nhẹ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {WORKOUT_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border-subtle bg-bg-surface hover:border-primary/50 hover:bg-bg-surface-muted/30'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-text-primary">{preset.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-2">{preset.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-text-muted">
                      <span>{preset.exercises.length} động tác</span>
                      <span>Hồi phục: {preset.recoveryDays} ngày</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Member Level Selector & Apply Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs font-semibold text-text-primary">Mức độ học viên:</span>
                <div className="flex items-center gap-1.5 bg-bg-surface p-1 rounded-xl border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => handleLevelChange('BEGINNER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      memberLevel === 'BEGINNER'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    🟢 Mới tập (Beginner)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLevelChange('INTERMEDIATE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      memberLevel === 'INTERMEDIATE'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    🟡 Trung bình (Intermediate)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLevelChange('ADVANCED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      memberLevel === 'ADVANCED'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    🔴 Nâng cao (Advanced)
                  </button>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                disabled={!selectedPresetId}
                onClick={handleManualApplyPreset}
                className="gap-2 text-xs shadow-sm cursor-pointer self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="h-4 w-4 fill-white" />
                <span>
                  {activePreset ? `Nạp lại giáo án ${activePreset.name.split('(')[0]}` : 'Bấm vào 1 mẫu giáo án ở trên để nạp'}
                </span>
              </Button>
            </div>
          </div>

          {/* SECTION 3: Danh Sách Động Tác & Hiệp Tập */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <span>Danh Sách Động Tác & Hiệp Tập ({exercises.length})</span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Bạn có thể tùy ý điều chỉnh số hiệp (sets), số lần (reps), tạ (kg), thời gian nghỉ và ghi chú kỹ thuật cho học viên
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddExerciseRow}
                disabled={availableExercises.length === 0}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm động tác</span>
              </Button>
            </div>

            {exercises.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-subtle bg-bg-surface-muted/30 p-8 text-center space-y-3">
                <Dumbbell className="h-8 w-8 text-text-muted/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary">Chưa có bài tập nào trong giáo án</p>
                  <p className="text-[11px] text-text-muted max-w-md mx-auto">
                    Vui lòng chọn một giáo án mẫu ở trên (hoặc bấm nút nạp từ khóa học của Manager), hoặc bấm nút bên dưới để thêm bài tập thủ công.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExerciseRow}
                  disabled={availableExercises.length === 0}
                  className="gap-1.5 text-xs cursor-pointer mx-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Thêm động tác đầu tiên</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border-subtle bg-bg-surface-muted/50 p-4 space-y-3 transition-colors hover:border-primary/40"
                >
                  {/* Top Bar: Phase, Muscle & RPE Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/60 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-xs text-text-primary bg-primary/10 text-primary px-2.5 py-0.5 rounded-md border border-primary/20">
                        {item.roleName || `Động tác #${idx + 1}`}
                      </span>
                      {item.targetMuscle && (
                        <span className="text-[11px] text-text-muted bg-bg-surface px-2 py-0.5 rounded-md border border-border-subtle">
                          Nhóm cơ: {item.targetMuscle}
                        </span>
                      )}
                    </div>
                    {item.rpe && (
                      <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        {item.rpe}
                      </span>
                    )}
                  </div>

                  {/* Main Grid: Select bài tập & Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
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
                      <p className="mt-1 text-[10px] text-text-muted truncate">
                        {(() => {
                          const groups =
                            availableExercises.find((ex) => ex.id === item.exerciseId)?.muscleGroups ?? []
                          const primary = groups.find((group) => group.isPrimary)
                          const secondary = groups
                            .filter((group) => !group.isPrimary)
                            .map((group) => group.name)
                            .join(', ')
                          return `Chính: ${primary?.name ?? 'chưa gán'}${
                            secondary ? ` · Phụ: ${secondary}` : ''
                          }${primary?.recoveryDays ? ` · Hồi phục: ${primary.recoveryDays} ngày` : ''}`
                        })()}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
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

                    <div className="sm:col-span-1">
                      <Input
                        label="Sets"
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

                    <div className="sm:col-span-1">
                      <Input
                        label="Reps"
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

                    <div className="sm:col-span-2">
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

                    <div className="sm:col-span-1">
                      <Input
                        label="Nghỉ (s)"
                        type="number"
                        min={0}
                        step={5}
                        value={item.rest}
                        onChange={(e) => {
                          const copy = [...exercises]
                          copy[idx].rest = Number(e.target.value)
                          setExercises(copy)
                        }}
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseRow(idx)}
                        disabled={exercises.length <= 1}
                        className="p-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Xóa động tác"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Technical Instruction Box */}
                  <div className="pt-1 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-text-muted mt-2 shrink-0" />
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Ghi chú kỹ thuật & Phục hồi (nhịp hạ eccentric 2s, siết cơ đỉnh, ngực tựa đệm...)"
                        value={item.instructions || ''}
                        onChange={(e) => {
                          const copy = [...exercises]
                          copy[idx].instructions = e.target.value
                          setExercises(copy)
                        }}
                        className="w-full text-xs bg-bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">
                  ✅ Đã lưu giáo án "{successNotice.title}" thành công cho {successNotice.memberName}! Form đã được làm mới sạch sẽ.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessNotice(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:opacity-75 cursor-pointer p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
            <p className="text-xs text-text-muted">
              Tổng cộng: <strong className="text-text-primary">{exercises.length} động tác</strong> · Thời gian dự kiến:{' '}
              <strong className="text-text-primary">
                {Math.round(exercises.reduce((acc, curr) => acc + curr.sets * (45 + curr.rest), 0) / 60)} phút
              </strong>
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {exercises.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExercises([])}
                  disabled={isSubmitting}
                  className="text-xs cursor-pointer text-text-muted hover:text-danger"
                >
                  Xóa tất cả bài tập
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="px-8 shadow-md cursor-pointer text-xs font-semibold py-2.5 flex-1 sm:flex-initial"
              >
                {isSubmitting ? 'Đang tạo & giao giáo án...' : 'Lưu & Giao Giáo Án'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    )}
  </div>
)
}
