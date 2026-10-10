import { useMemo } from 'react'
import { Search, BookOpen, Target, Eye, Edit2, Layers, ListOrdered, Power } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import type { TrainingCourse, MuscleGroup } from '@/shared/types/api'

interface CoursesTabProps {
  courses: TrainingCourse[]
  muscleGroups: MuscleGroup[]
  search: string
  onSearchChange: (val: string) => void
  muscleFilter: string
  onMuscleFilterChange: (val: string) => void
  difficultyFilter: string
  onDifficultyFilterChange: (val: string) => void
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  onStatusFilterChange: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void
  onOpenDetail: (course: TrainingCourse) => void
  onOpenEdit: (course: TrainingCourse) => void
  onOpenAssignMuscles: (course: TrainingCourse) => void
  onOpenAssignSyllabus: (course: TrainingCourse) => void
  onToggleStatus: (course: TrainingCourse) => void
  togglingCourseId: string | null
}

export function CoursesTab({
  courses,
  muscleGroups,
  search,
  onSearchChange,
  muscleFilter,
  onMuscleFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  statusFilter,
  onStatusFilterChange,
  onOpenDetail,
  onOpenEdit,
  onOpenAssignMuscles,
  onOpenAssignSyllabus,
  onToggleStatus,
  togglingCourseId,
}: CoursesTabProps) {
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const s = search.toLowerCase()
      const matchesSearch =
        c.name.toLowerCase().includes(s) ||
        (c.description && c.description.toLowerCase().includes(s)) ||
        (c.objective && c.objective.toLowerCase().includes(s))

      const cMuscles =
        (c as any).courseMuscleGroupsCourseId?.map(
          (cmg: any) => cmg.muscleGroupId || cmg.muscleGroup?.id
        ) ||
        c.muscleGroups?.map((mg) => mg.id) ||
        []

      const matchesMuscle = muscleFilter === 'ALL' || cMuscles.includes(muscleFilter)

      const matchesDifficulty =
        difficultyFilter === 'ALL' ||
        c.difficultyLevel?.toUpperCase() === difficultyFilter.toUpperCase()

      const isAct = c.isActive !== false
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isAct) ||
        (statusFilter === 'INACTIVE' && !isAct)

      return matchesSearch && matchesMuscle && matchesDifficulty && matchesStatus
    })
  }, [courses, search, muscleFilter, difficultyFilter, statusFilter])

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm khóa tập..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <select
            value={muscleFilter}
            onChange={(e) => onMuscleFilterChange(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tất cả nhóm cơ</option>
            {muscleGroups.map((mg) => (
              <option key={mg.id} value={mg.id}>
                {mg.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={difficultyFilter}
            onChange={(e) => onDifficultyFilterChange(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Mọi độ khó</option>
            <option value="BEGINNER">Cơ bản (Beginner)</option>
            <option value="INTERMEDIATE">Trung bình (Intermediate)</option>
            <option value="ADVANCED">Nâng cao (Advanced)</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm dừng</option>
          </select>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400 text-xs">
          {search || muscleFilter !== 'ALL' || difficultyFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'Không tìm thấy khóa tập phù hợp với bộ lọc.'
            : 'Chưa có khóa tập PT nào trong hệ thống.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map((c) => {
            const isAct = c.isActive !== false
            const attachedMuscles =
              (c as any).courseMuscleGroupsCourseId?.map((cmg: any) => ({
                name: cmg.muscleGroup?.name || 'Nhóm cơ',
                isPrimary: cmg.isPrimary,
              })) ||
              c.muscleGroups?.map((mg) => ({ name: mg.name, isPrimary: false })) ||
              []

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-black/40"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 shrink-0">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                          {c.difficultyLevel || 'Mọi cấp độ'}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{c.name}</h3>
                      </div>
                    </div>
                    <StatusBadge status={isAct ? 'ACTIVE' : 'INACTIVE'} />
                  </div>

                  {c.imageUrl && (
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 max-h-36">
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="h-32 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {c.description || 'Khóa huấn luyện chuyên sâu 1 kèm 1 cùng HLV chuyên trách.'}
                  </p>

                  {c.objective && (
                    <div className="rounded-xl bg-slate-800/60 p-3 text-xs text-slate-300 border border-slate-700/50">
                      <span className="font-semibold text-orange-400 flex items-center gap-1 mb-1">
                        <Target className="h-3.5 w-3.5" /> Mục tiêu khóa:
                      </span>
                      <span>{c.objective}</span>
                    </div>
                  )}

                  {attachedMuscles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {attachedMuscles.map((mg: any, idx: number) => (
                        <span
                          key={idx}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium border ${
                            mg.isPrimary
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-semibold'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700'
                          }`}
                        >
                          {mg.name} {mg.isPrimary && '(Chính)'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Course Action Toolbar */}
                <div className="border-t border-slate-800/80 pt-4 mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenDetail(c)}
                      className="text-[11px] h-7 px-2.5 gap-1 text-slate-300 hover:text-white"
                    >
                      <Eye className="h-3 w-3 text-sky-400" />
                      <span>Chi tiết</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenEdit(c)}
                      className="text-[11px] h-7 px-2.5 gap-1 text-slate-300 hover:text-white"
                    >
                      <Edit2 className="h-3 w-3 text-orange-400" />
                      <span>Sửa</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAssignMuscles(c)}
                      className="text-[11px] h-7 px-2.5 gap-1 text-slate-300 hover:text-white"
                    >
                      <Layers className="h-3 w-3 text-emerald-400" />
                      <span>Gán cơ</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAssignSyllabus(c)}
                      className="text-[11px] h-7 px-2.5 gap-1 text-slate-300 hover:text-white"
                    >
                      <ListOrdered className="h-3 w-3 text-purple-400" />
                      <span>Giáo án</span>
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleStatus(c)}
                    disabled={togglingCourseId === c.id}
                    className={`text-[11px] h-7 px-2.5 gap-1.5 ${
                      isAct
                        ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border-rose-500/20'
                        : 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    <Power className={`h-3 w-3 ${togglingCourseId === c.id ? 'animate-spin' : ''}`} />
                    <span>{isAct ? 'Tạm dừng' : 'Kích hoạt'}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
