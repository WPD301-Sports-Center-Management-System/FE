import { useMemo } from 'react'
import { Search, Dumbbell, Edit2, Power } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import type { Exercise, MuscleGroup } from '@/shared/types/api'

interface ExercisesTabProps {
  exercises: Exercise[]
  muscleGroups: MuscleGroup[]
  search: string
  onSearchChange: (val: string) => void
  muscleFilter: string
  onMuscleFilterChange: (val: string) => void
  difficultyFilter: string
  onDifficultyFilterChange: (val: string) => void
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  onStatusFilterChange: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void
  onOpenEdit: (exercise: Exercise) => void
  onToggleStatus: (exercise: Exercise) => void
  togglingExerciseId: string | null
}

export function ExercisesTab({
  exercises,
  muscleGroups,
  search,
  onSearchChange,
  muscleFilter,
  onMuscleFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  statusFilter,
  onStatusFilterChange,
  onOpenEdit,
  onToggleStatus,
  togglingExerciseId,
}: ExercisesTabProps) {
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const s = search.toLowerCase()
      const matchesSearch =
        ex.name.toLowerCase().includes(s) ||
        (ex.instructions && ex.instructions.toLowerCase().includes(s)) ||
        (ex.description && ex.description.toLowerCase().includes(s)) ||
        (ex.equipmentRequired && ex.equipmentRequired.toLowerCase().includes(s))

      const primaryMgId =
        (ex as any).exerciseMuscleGroupsExerciseId?.[0]?.muscleGroup?.id ||
        ex.muscleGroups?.[0]?.id

      const matchesMuscle = muscleFilter === 'ALL' || primaryMgId === muscleFilter

      const matchesDifficulty =
        difficultyFilter === 'ALL' ||
        ex.difficultyLevel?.toUpperCase() === difficultyFilter.toUpperCase()

      const isAct = ex.isActive !== false
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isAct) ||
        (statusFilter === 'INACTIVE' && !isAct)

      return matchesSearch && matchesMuscle && matchesDifficulty && matchesStatus
    })
  }, [exercises, search, muscleFilter, difficultyFilter, statusFilter])

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-bg-surface p-3.5 rounded-2xl border border-border-subtle shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm bài tập..."
            className="w-full pl-9 pr-3.5 py-2 bg-bg-input border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <select
            value={muscleFilter}
            onChange={(e) => onMuscleFilterChange(e.target.value)}
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">Tất cả nhóm cơ</option>
            {muscleGroups.map((mg) => (
              <option key={mg.id} value={mg.id} className="bg-bg-surface text-text-primary">
                {mg.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={difficultyFilter}
            onChange={(e) => onDifficultyFilterChange(e.target.value)}
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
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
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm dừng</option>
          </select>
        </div>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle p-12 text-center text-text-muted text-xs">
          {search || muscleFilter !== 'ALL' || difficultyFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'Không tìm thấy bài tập phù hợp với bộ lọc.'
            : 'Chưa có bài tập nào trong thư viện.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredExercises.map((ex) => {
            const mgName =
              (ex as any).exerciseMuscleGroupsExerciseId?.[0]?.muscleGroup?.name ||
              ex.muscleGroups?.[0]?.name ||
              'Toàn thân'
            const isAct = ex.isActive !== false

            return (
              <div
                key={ex.id}
                className="group relative rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-3 transition-all hover:border-border-strong hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                          {ex.name}
                        </h4>
                        <p className="text-[10px] text-text-muted">
                          Thiết bị: {ex.equipmentRequired || 'Tự do / Bodyweight'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={isAct ? 'ACTIVE' : 'INACTIVE'} />
                  </div>

                  {ex.imageUrl && (
                    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface-muted max-h-32">
                      <img
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {ex.instructions ||
                      ex.description ||
                      'Thực hiện động tác chuẩn xác theo giáo án HLV.'}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-border-subtle pt-2.5">
                    <span>
                      Nhóm cơ: <strong className="text-text-primary">{mgName}</strong>
                    </span>
                    <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 font-semibold text-primary">
                      {ex.difficultyLevel || 'Tiêu chuẩn'}
                    </span>
                  </div>
                </div>

                {/* Exercise Card Actions */}
                <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenEdit(ex)}
                    className="text-[11px] h-7 px-2.5 gap-1.5"
                  >
                    <Edit2 className="h-3 w-3 text-primary" />
                    <span>Chỉnh sửa</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleStatus(ex)}
                    disabled={togglingExerciseId === ex.id}
                    className={`text-[11px] h-7 px-2.5 gap-1.5 ${
                      isAct
                        ? 'text-danger hover:bg-danger/10 hover:text-danger border-danger/30'
                        : 'text-success hover:bg-success/10 hover:text-success border-success/30'
                    }`}
                  >
                    <Power
                      className={`h-3 w-3 ${
                        togglingExerciseId === ex.id ? 'animate-spin' : ''
                      }`}
                    />
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
