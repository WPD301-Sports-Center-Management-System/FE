import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import type { MuscleGroup, TrainingCourse } from '@/shared/types/api'

interface CourseAssignMusclesModalProps {
  isOpen: boolean
  onClose: () => void
  course: TrainingCourse | null
  muscleGroups: MuscleGroup[]
  initialSelectedIds: string[]
  initialPrimaryId: string
  onSubmit: (data: { muscleGroups: Array<{ id: string; isPrimary: boolean }> }) => Promise<void>
  isSubmitting: boolean
}

export function CourseAssignMusclesModal({
  isOpen,
  onClose,
  course,
  muscleGroups,
  initialSelectedIds,
  initialPrimaryId,
  onSubmit,
  isSubmitting,
}: CourseAssignMusclesModalProps) {
  const [selectedMuscleIds, setSelectedMuscleIds] = useState<string[]>([])
  const [primaryMuscleId, setPrimaryMuscleId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedMuscleIds(initialSelectedIds)
    setPrimaryMuscleId(initialPrimaryId || initialSelectedIds[0] || '')
    setError(null)
  }, [initialSelectedIds, initialPrimaryId, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMuscleIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 nhóm cơ.')
      return
    }
    if (!primaryMuscleId || !selectedMuscleIds.includes(primaryMuscleId)) {
      setError('Vui lòng chỉ định một nhóm cơ chính trong danh sách đã chọn.')
      return
    }

    setError(null)
    await onSubmit({
      muscleGroups: selectedMuscleIds.map((id) => ({
        id,
        isPrimary: id === primaryMuscleId,
      })),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Gán Nhóm Cơ Cho Khóa Tập"
      description={`Cấu hình các nhóm cơ tác động chính & phụ cho khóa "${course?.name}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-2.5 text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="font-semibold text-slate-200">
            Chọn các nhóm cơ mục tiêu (Phải chọn ít nhất 1):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
            {muscleGroups.map((mg) => {
              const isSelected = selectedMuscleIds.includes(mg.id)
              return (
                <button
                  type="button"
                  key={mg.id}
                  onClick={() => {
                    if (isSelected) {
                      const next = selectedMuscleIds.filter((id) => id !== mg.id)
                      setSelectedMuscleIds(next)
                      if (primaryMuscleId === mg.id) {
                        setPrimaryMuscleId(next[0] || '')
                      }
                    } else {
                      const next = [...selectedMuscleIds, mg.id]
                      setSelectedMuscleIds(next)
                      if (!primaryMuscleId) {
                        setPrimaryMuscleId(mg.id)
                      }
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{mg.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-orange-400" />}
                </button>
              )
            })}
          </div>
        </div>

        {selectedMuscleIds.length > 0 && (
          <div className="space-y-2">
            <label className="font-semibold text-slate-200">
              Chỉ định nhóm cơ chính (Bắt buộc đúng 1 nhóm cơ chính):
            </label>
            <select
              value={primaryMuscleId}
              onChange={(e) => setPrimaryMuscleId(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              {selectedMuscleIds.map((id) => {
                const mg = muscleGroups.find((m) => m.id === id)
                return (
                  <option key={id} value={id}>
                    {mg?.name || id}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || selectedMuscleIds.length === 0}
          >
            Lưu nhóm cơ
          </Button>
        </div>
      </form>
    </Modal>
  )
}
