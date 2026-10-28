import { useState, useEffect } from 'react'
import { Plus, Zap, Trash2, Info } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import { WORKOUT_PRESETS, findMatchingExercise } from '@/features/training-plans/utils/training-presets'
import type { Exercise, TrainingCourse } from '@/shared/types/api'

interface SyllabusItem {
  exerciseId: string
  sortOrder: number
  coachNote: string
}

interface CourseAssignSyllabusModalProps {
  isOpen: boolean
  onClose: () => void
  course: TrainingCourse | null
  exercises: Exercise[]
  initialItems: SyllabusItem[]
  onSubmit: (data: {
    exercises: Array<{ id: string; sortOrder: number; coachNote?: string }>
  }) => Promise<void>
  isSubmitting: boolean
}

export function CourseAssignSyllabusModal({
  isOpen,
  onClose,
  course,
  exercises,
  initialItems,
  onSubmit,
  isSubmitting,
}: CourseAssignSyllabusModalProps) {
  const [items, setItems] = useState<SyllabusItem[]>([])

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems, isOpen])

  const handleApplyPresetToSyllabus = (presetId: string) => {
    const preset = WORKOUT_PRESETS.find((p) => p.id === presetId)
    if (!preset || exercises.length === 0) return

    const newItems: SyllabusItem[] = []
    preset.exercises.forEach((pEx, idx) => {
      // No arbitrary substitute: an unmatched preset item stays empty for the Manager to choose.
      const matched = findMatchingExercise(pEx.candidateNames, exercises)
      const note = `${matched ? '' : '[Chưa có bài khớp – chọn bài] '}[${pEx.roleName}] ${pEx.byLevel.INTERMEDIATE.instructions} (Gợi ý: ${pEx.byLevel.INTERMEDIATE.rpe})`

      newItems.push({
        exerciseId: matched?.id ?? '',
        sortOrder: idx + 1,
        coachNote: note,
      })
    })
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter((it) => it.exerciseId)
    await onSubmit({
      exercises: validItems.map((it, idx) => ({
        id: it.exerciseId,
        sortOrder: idx + 1,
        coachNote: it.coachNote.trim() || undefined,
      })),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Thiết Lập Giáo Án Chuẩn Của Trung Tâm (Manager Only)"
      description={`Cấu hình danh sách bài tập khung, thứ tự thực hiện & ghi chú kỹ thuật chuẩn cho khóa "${course?.name}". HLV sẽ kế thừa mẫu này khi giao bài cho học viên.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Quick Presets for Manager */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-text-primary text-xs">
            <Zap className="h-3.5 w-3.5 text-primary fill-primary/20" />
            <span>Nạp nhanh khung bài tập mẫu 6 pha chuẩn thể hình:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPresetToSyllabus('pull_day_hypertrophy')}
              className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-medium transition-colors cursor-pointer text-xs"
            >
              🏋️ Mẫu Lưng (Pull Day)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetToSyllabus('push_day_strength')}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-medium transition-colors cursor-pointer text-xs"
            >
              💪 Mẫu Ngực (Push Day)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetToSyllabus('leg_day_power')}
              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium transition-colors cursor-pointer text-xs"
            >
              🦵 Mẫu Chân (Leg Day)
            </button>
          </div>
        </div>

        {/* Exercises list */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border-subtle bg-bg-surface-muted p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-primary text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span>Động tác #{idx + 1}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) => prev.filter((_, i) => i !== idx))
                  }}
                  className="text-danger hover:underline text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa</span>
                </button>
              </div>

              <div className="space-y-2">
                <select
                  value={item.exerciseId}
                  onChange={(e) => {
                    const val = e.target.value
                    setItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, exerciseId: val } : it))
                    )
                  }}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="" className="bg-bg-surface text-text-primary">-- Chọn bài tập --</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id} className="bg-bg-surface text-text-primary">
                      {ex.name} ({ex.difficultyLevel || 'N/A'})
                    </option>
                  ))}
                </select>

                <div className="flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 text-text-muted mt-2 shrink-0" />
                  <input
                    type="text"
                    value={item.coachNote}
                    onChange={(e) => {
                      const val = e.target.value
                      setItems((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, coachNote: val } : it))
                      )
                    }}
                    placeholder="Ghi chú kỹ thuật chuẩn (vd: [Compound] ngực tựa đệm, nhịp hạ eccentric 2s)"
                    className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setItems((prev) => [
              ...prev,
              { exerciseId: exercises[0]?.id || '', sortOrder: prev.length + 1, coachNote: '' },
            ])
          }}
          className="w-full gap-1.5 text-xs py-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm bài tập vào giáo án khung</span>
        </Button>

        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            Lưu giáo án chuẩn
          </Button>
        </div>
      </form>
    </Modal>
  )
}
