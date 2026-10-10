import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
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
      title="Thiết Lập Giáo Án Bài Tập"
      description={`Cấu hình danh sách bài tập & thứ tự thực hiện cho khóa "${course?.name}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-orange-400 text-xs">Bài tập #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) => prev.filter((_, i) => i !== idx))
                  }}
                  className="text-rose-400 hover:text-rose-300 text-[11px]"
                >
                  Xóa
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={item.exerciseId}
                  onChange={(e) => {
                    const val = e.target.value
                    setItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, exerciseId: val } : it))
                    )
                  }}
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Chọn bài tập --</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.difficultyLevel || 'N/A'})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={item.coachNote}
                  onChange={(e) => {
                    const val = e.target.value
                    setItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, coachNote: val } : it))
                    )
                  }}
                  placeholder="Ghi chú kỹ thuật HLV (vd: 4 sets x 12 reps)"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
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
          className="w-full gap-1.5 text-xs py-2"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm bài tập vào giáo án</span>
        </Button>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            Lưu giáo án
          </Button>
        </div>
      </form>
    </Modal>
  )
}
