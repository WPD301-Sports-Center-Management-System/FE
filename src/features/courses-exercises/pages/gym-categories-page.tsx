import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { MuscleGroup, Exercise, TrainingCourse } from '@/shared/types/api'
import type {
  TrainingCourseDetail,
  CreateTrainingCoursePayload,
  UpdateTrainingCoursePayload,
  CreateExercisePayload,
  UpdateExercisePayload,
  CreateMuscleGroupPayload,
  UpdateMuscleGroupPayload,
} from '../types/courses-exercises.types'

import { CoursesTab } from '../components/tabs/CoursesTab'
import { ExercisesTab } from '../components/tabs/ExercisesTab'
import { MuscleGroupsTab } from '../components/tabs/MuscleGroupsTab'

import { CourseFormModal } from '../components/modals/CourseFormModal'
import { CourseDetailModal } from '../components/modals/CourseDetailModal'
import { CourseAssignMusclesModal } from '../components/modals/CourseAssignMusclesModal'
import { CourseAssignSyllabusModal } from '../components/modals/CourseAssignSyllabusModal'
import { ExerciseFormModal } from '../components/modals/ExerciseFormModal'
import { MuscleGroupFormModal } from '../components/modals/MuscleGroupFormModal'

export function GymCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'course' | 'exercise' | 'muscle'>('course')
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter states
  const [courseSearch, setCourseSearch] = useState('')
  const [courseMuscleFilter, setCourseMuscleFilter] = useState('ALL')
  const [courseDifficultyFilter, setCourseDifficultyFilter] = useState('ALL')
  const [courseStatusFilter, setCourseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('ALL')
  const [exerciseDifficultyFilter, setExerciseDifficultyFilter] = useState('ALL')
  const [exerciseStatusFilter, setExerciseStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [muscleSearch, setMuscleSearch] = useState('')
  const [muscleStatusFilter, setMuscleStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Modals & form state: Courses
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null)
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false)
  const [togglingCourseId, setTogglingCourseId] = useState<string | null>(null)

  const [viewingCourseDetail, setViewingCourseDetail] = useState<TrainingCourseDetail | null>(null)
  const [isCourseDetailModalOpen, setIsCourseDetailModalOpen] = useState(false)
  const [isLoadingCourseDetail, setIsLoadingCourseDetail] = useState(false)

  const [assigningMuscleCourse, setAssigningMuscleCourse] = useState<TrainingCourse | null>(null)
  const [isAssignMuscleModalOpen, setIsAssignMuscleModalOpen] = useState(false)
  const [isSubmittingAssignMuscle, setIsSubmittingAssignMuscle] = useState(false)
  const [selectedMuscleIds, setSelectedMuscleIds] = useState<string[]>([])
  const [primaryMuscleId, setPrimaryMuscleId] = useState<string>('')

  const [assigningExerciseCourse, setAssigningExerciseCourse] = useState<TrainingCourse | null>(null)
  const [isAssignExerciseModalOpen, setIsAssignExerciseModalOpen] = useState(false)
  const [isSubmittingAssignExercise, setIsSubmittingAssignExercise] = useState(false)
  const [courseExerciseItems, setCourseExerciseItems] = useState<
    Array<{ exerciseId: string; sortOrder: number; coachNote: string }>
  >([])

  // Modals & form state: Exercises
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false)
  const [togglingExerciseId, setTogglingExerciseId] = useState<string | null>(null)

  // Modals & form state: Muscle Groups
  const [isMuscleModalOpen, setIsMuscleModalOpen] = useState(false)
  const [editingMuscleGroup, setEditingMuscleGroup] = useState<MuscleGroup | null>(null)
  const [isSubmittingMuscle, setIsSubmittingMuscle] = useState(false)
  const [togglingMuscleId, setTogglingMuscleId] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [tcRes, exRes, mgRes] = await Promise.all([
        coursesExercisesService.getTrainingCourses({ limit: 100 }),
        coursesExercisesService.getExercises({ limit: 100 }),
        coursesExercisesService.getMuscleGroups(),
      ])

      setCourses(tcRes.data || [])
      setExercises(exRes.data || [])
      setMuscleGroups(mgRes.data || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh mục khóa học & bài tập.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Course handlers
  const handleCourseSubmit = async (
    data: CreateTrainingCoursePayload | UpdateTrainingCoursePayload
  ) => {
    setIsSubmittingCourse(true)
    setErrorMessage(null)
    try {
      if (editingCourse) {
        const updated = await coursesExercisesService.updateTrainingCourse(editingCourse.id, data)
        showSuccess(`Đã cập nhật khóa tập "${updated.name}" thành công!`)
        setCourses((prev) =>
          prev.map((c) => (c.id === editingCourse.id ? { ...c, ...updated } : c))
        )
      } else {
        const created = await coursesExercisesService.createTrainingCourse(
          data as CreateTrainingCoursePayload
        )
        showSuccess(`Đã tạo thành công khóa tập "${created.name}"!`)
        const updatedTc = await coursesExercisesService.getTrainingCourses({ limit: 100 })
        setCourses(updatedTc.data || [])
      }
      setIsCourseModalOpen(false)
      setEditingCourse(null)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Thao tác khóa tập thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi xử lý khóa tập.')
      }
    } finally {
      setIsSubmittingCourse(false)
    }
  }

  const handleToggleCourseStatus = async (c: TrainingCourse) => {
    const nextStatus = !c.isActive
    setTogglingCourseId(c.id)
    setErrorMessage(null)
    try {
      const updated = await coursesExercisesService.updateTrainingCourseStatus(c.id, {
        isActive: nextStatus,
      })
      setCourses((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, isActive: updated.isActive } : item))
      )
      showSuccess(`Đã ${nextStatus ? 'kích hoạt' : 'tạm dừng'} khóa tập "${c.name}" thành công!`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể thay đổi trạng thái khóa tập.')
      } else {
        setErrorMessage('Lỗi kết nối khi cập nhật trạng thái khóa tập.')
      }
    } finally {
      setTogglingCourseId(null)
    }
  }

  const handleOpenCourseDetail = async (c: TrainingCourse) => {
    setIsLoadingCourseDetail(true)
    setIsCourseDetailModalOpen(true)
    setViewingCourseDetail(null)
    try {
      const detail = await coursesExercisesService.getTrainingCourseById(c.id)
      setViewingCourseDetail(detail)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải chi tiết khóa tập.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ khi lấy chi tiết khóa tập.')
      }
    } finally {
      setIsLoadingCourseDetail(false)
    }
  }

  const handleOpenAssignMuscles = async (c: TrainingCourse) => {
    setAssigningMuscleCourse(c)
    setIsAssignMuscleModalOpen(true)
    try {
      const detail = await coursesExercisesService.getTrainingCourseById(c.id)
      const currentMuscles = detail.courseMuscleGroupsCourseId || []
      const ids = currentMuscles
        .map((cmg) => cmg.muscleGroupId || cmg.muscleGroup?.id)
        .filter(Boolean) as string[]
      setSelectedMuscleIds(ids)
      const primary = currentMuscles.find((cmg) => cmg.isPrimary)
      setPrimaryMuscleId(primary?.muscleGroupId || primary?.muscleGroup?.id || ids[0] || '')
    } catch {
      setSelectedMuscleIds([])
      setPrimaryMuscleId('')
    }
  }

  const handleAssignMusclesSubmit = async (data: {
    muscleGroups: Array<{ id: string; isPrimary: boolean }>
  }) => {
    if (!assigningMuscleCourse) return
    setIsSubmittingAssignMuscle(true)
    setErrorMessage(null)
    try {
      await coursesExercisesService.updateCourseMuscleGroups(assigningMuscleCourse.id, data)
      showSuccess(`Đã cập nhật nhóm cơ cho khóa "${assigningMuscleCourse.name}"!`)
      setIsAssignMuscleModalOpen(false)
      setAssigningMuscleCourse(null)
      loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Gán nhóm cơ thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi cập nhật nhóm cơ.')
      }
    } finally {
      setIsSubmittingAssignMuscle(false)
    }
  }

  const handleOpenAssignSyllabus = async (c: TrainingCourse) => {
    setAssigningExerciseCourse(c)
    setIsAssignExerciseModalOpen(true)
    try {
      const detail = await coursesExercisesService.getTrainingCourseById(c.id)
      const currentExs = (detail.courseExercisesCourseId || [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
      setCourseExerciseItems(
        currentExs.map((item, idx) => ({
          exerciseId: item.exerciseId || item.exercise?.id || '',
          sortOrder: item.sortOrder ?? idx + 1,
          coachNote: item.coachNote || '',
        }))
      )
    } catch {
      setCourseExerciseItems([])
    }
  }

  const handleAssignSyllabusSubmit = async (data: {
    exercises: Array<{ id: string; sortOrder: number; coachNote?: string }>
  }) => {
    if (!assigningExerciseCourse) return
    setIsSubmittingAssignExercise(true)
    setErrorMessage(null)
    try {
      await coursesExercisesService.updateCourseExercises(assigningExerciseCourse.id, data)
      showSuccess(`Đã lưu mẫu buổi của "${assigningExerciseCourse.name}" vào thư viện giáo án chung.`)
      setIsAssignExerciseModalOpen(false)
      setAssigningExerciseCourse(null)
      loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Cập nhật giáo án bài tập thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi cập nhật giáo án bài tập.')
      }
    } finally {
      setIsSubmittingAssignExercise(false)
    }
  }

  // Exercise handlers
  const handleExerciseSubmit = async (data: CreateExercisePayload | UpdateExercisePayload) => {
    setIsSubmittingExercise(true)
    setErrorMessage(null)
    try {
      if (editingExercise) {
        const updated = await coursesExercisesService.updateExercise(editingExercise.id, data)
        showSuccess(`Đã cập nhật bài tập "${updated.name}" thành công!`)
        setExercises((prev) =>
          prev.map((item) => (item.id === editingExercise.id ? { ...item, ...updated } : item))
        )
      } else {
        const created = await coursesExercisesService.createExercise(
          data as CreateExercisePayload
        )
        showSuccess(`Đã tạo thành công bài tập "${created.name}"!`)
        const updatedEx = await coursesExercisesService.getExercises({ limit: 100 })
        setExercises(updatedEx.data || [])
      }
      setIsExerciseModalOpen(false)
      setEditingExercise(null)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Thao tác bài tập thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi xử lý bài tập.')
      }
    } finally {
      setIsSubmittingExercise(false)
    }
  }

  const handleToggleExerciseStatus = async (ex: Exercise) => {
    const nextStatus = ex.isActive === false ? true : false
    setTogglingExerciseId(ex.id)
    setErrorMessage(null)
    try {
      const updated = await coursesExercisesService.updateExerciseStatus(ex.id, {
        isActive: nextStatus,
      })
      setExercises((prev) =>
        prev.map((item) => (item.id === ex.id ? { ...item, isActive: updated.isActive } : item))
      )
      showSuccess(`Đã ${nextStatus ? 'kích hoạt' : 'tạm dừng'} bài tập "${ex.name}" thành công!`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể đổi trạng thái bài tập.')
      } else {
        setErrorMessage('Lỗi kết nối khi đổi trạng thái bài tập.')
      }
    } finally {
      setTogglingExerciseId(null)
    }
  }

  // Muscle Group handlers
  const handleMuscleSubmit = async (
    data: CreateMuscleGroupPayload | UpdateMuscleGroupPayload
  ) => {
    setIsSubmittingMuscle(true)
    setErrorMessage(null)
    try {
      if (editingMuscleGroup) {
        const updated = await coursesExercisesService.updateMuscleGroup(
          editingMuscleGroup.id,
          data
        )
        showSuccess(`Đã cập nhật nhóm cơ "${updated.name}" thành công!`)
        setMuscleGroups((prev) =>
          prev.map((item) => (item.id === editingMuscleGroup.id ? { ...item, ...updated } : item))
        )
      } else {
        const created = await coursesExercisesService.createMuscleGroup(
          data as CreateMuscleGroupPayload
        )
        showSuccess(`Đã tạo nhóm cơ "${created.name}" thành công!`)
        const updatedMgRes = await coursesExercisesService.getMuscleGroups()
        setMuscleGroups(updatedMgRes.data || [created, ...muscleGroups])
      }
      setIsMuscleModalOpen(false)
      setEditingMuscleGroup(null)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Thao tác nhóm cơ thất bại.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ khi xử lý nhóm cơ.')
      }
    } finally {
      setIsSubmittingMuscle(false)
    }
  }

  const handleToggleMuscleStatus = async (mg: MuscleGroup) => {
    const nextStatus = !mg.isActive
    setTogglingMuscleId(mg.id)
    setErrorMessage(null)
    try {
      const updated = await coursesExercisesService.updateMuscleGroupStatus(mg.id, {
        isActive: nextStatus,
      })
      setMuscleGroups((prev) =>
        prev.map((item) => (item.id === mg.id ? { ...item, isActive: updated.isActive } : item))
      )
      showSuccess(`Đã ${nextStatus ? 'kích hoạt' : 'tạm dừng'} nhóm cơ "${mg.name}" thành công!`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể đổi trạng thái nhóm cơ.')
      } else {
        setErrorMessage('Lỗi kết nối khi đổi trạng thái nhóm cơ.')
      }
    } finally {
      setTogglingMuscleId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <span>Danh Mục & Thư Viện Bài Tập</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý nhóm cơ giải phẫu, bài tập chuẩn hóa và các khóa đào tạo PT 1:1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          {activeTab === 'course' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingCourse(null)
                setIsCourseModalOpen(true)
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm khóa tập mới</span>
            </Button>
          )}

          {activeTab === 'exercise' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingExercise(null)
                setIsExerciseModalOpen(true)
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm bài tập mới</span>
            </Button>
          )}

          {activeTab === 'muscle' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingMuscleGroup(null)
                setIsMuscleModalOpen(true)
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nhóm cơ mới</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-success/30 bg-success/10 p-4 text-xs text-success">
          <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('course')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'course'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Khóa tập PT ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('exercise')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'exercise'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Thư viện Bài tập ({exercises.length})
        </button>
        <button
          onClick={() => setActiveTab('muscle')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'muscle'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Nhóm cơ ({muscleGroups.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-muted">Đang tải danh mục từ máy chủ...</p>
        </div>
      ) : (
        <>
          {activeTab === 'course' && (
            <CoursesTab
              courses={courses}
              muscleGroups={muscleGroups}
              search={courseSearch}
              onSearchChange={setCourseSearch}
              muscleFilter={courseMuscleFilter}
              onMuscleFilterChange={setCourseMuscleFilter}
              difficultyFilter={courseDifficultyFilter}
              onDifficultyFilterChange={setCourseDifficultyFilter}
              statusFilter={courseStatusFilter}
              onStatusFilterChange={setCourseStatusFilter}
              onOpenDetail={handleOpenCourseDetail}
              onOpenEdit={(c) => {
                setEditingCourse(c)
                setIsCourseModalOpen(true)
              }}
              onOpenAssignMuscles={handleOpenAssignMuscles}
              onOpenAssignSyllabus={handleOpenAssignSyllabus}
              onToggleStatus={handleToggleCourseStatus}
              togglingCourseId={togglingCourseId}
            />
          )}

          {activeTab === 'exercise' && (
            <ExercisesTab
              exercises={exercises}
              muscleGroups={muscleGroups}
              search={exerciseSearch}
              onSearchChange={setExerciseSearch}
              muscleFilter={exerciseMuscleFilter}
              onMuscleFilterChange={setExerciseMuscleFilter}
              difficultyFilter={exerciseDifficultyFilter}
              onDifficultyFilterChange={setExerciseDifficultyFilter}
              statusFilter={exerciseStatusFilter}
              onStatusFilterChange={setExerciseStatusFilter}
              onOpenEdit={(ex) => {
                setEditingExercise(ex)
                setIsExerciseModalOpen(true)
              }}
              onToggleStatus={handleToggleExerciseStatus}
              togglingExerciseId={togglingExerciseId}
            />
          )}

          {activeTab === 'muscle' && (
            <MuscleGroupsTab
              muscleGroups={muscleGroups}
              search={muscleSearch}
              onSearchChange={setMuscleSearch}
              statusFilter={muscleStatusFilter}
              onStatusFilterChange={setMuscleStatusFilter}
              onOpenEdit={(mg) => {
                setEditingMuscleGroup(mg)
                setIsMuscleModalOpen(true)
              }}
              onToggleStatus={handleToggleMuscleStatus}
              togglingMuscleId={togglingMuscleId}
            />
          )}
        </>
      )}

      {/* Modals */}
      <CourseFormModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false)
          setEditingCourse(null)
        }}
        editingCourse={editingCourse}
        onSubmit={handleCourseSubmit}
        isSubmitting={isSubmittingCourse}
      />

      <CourseDetailModal
        isOpen={isCourseDetailModalOpen}
        onClose={() => setIsCourseDetailModalOpen(false)}
        isLoading={isLoadingCourseDetail}
        courseDetail={viewingCourseDetail}
      />

      <CourseAssignMusclesModal
        isOpen={isAssignMuscleModalOpen}
        onClose={() => {
          setIsAssignMuscleModalOpen(false)
          setAssigningMuscleCourse(null)
        }}
        course={assigningMuscleCourse}
        muscleGroups={muscleGroups}
        initialSelectedIds={selectedMuscleIds}
        initialPrimaryId={primaryMuscleId}
        onSubmit={handleAssignMusclesSubmit}
        isSubmitting={isSubmittingAssignMuscle}
      />

      <CourseAssignSyllabusModal
        isOpen={isAssignExerciseModalOpen}
        onClose={() => {
          setIsAssignExerciseModalOpen(false)
          setAssigningExerciseCourse(null)
        }}
        course={assigningExerciseCourse}
        exercises={exercises}
        initialItems={courseExerciseItems}
        onSubmit={handleAssignSyllabusSubmit}
        isSubmitting={isSubmittingAssignExercise}
      />

      <ExerciseFormModal
        isOpen={isExerciseModalOpen}
        onClose={() => {
          setIsExerciseModalOpen(false)
          setEditingExercise(null)
        }}
        editingExercise={editingExercise}
        muscleGroups={muscleGroups}
        onSubmit={handleExerciseSubmit}
        isSubmitting={isSubmittingExercise}
      />

      <MuscleGroupFormModal
        isOpen={isMuscleModalOpen}
        onClose={() => {
          setIsMuscleModalOpen(false)
          setEditingMuscleGroup(null)
        }}
        editingMuscleGroup={editingMuscleGroup}
        onSubmit={handleMuscleSubmit}
        isSubmitting={isSubmittingMuscle}
      />
    </div>
  )
}
