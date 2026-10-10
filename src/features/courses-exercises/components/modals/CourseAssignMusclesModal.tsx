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
          <div className="rounded-lg bg-danger/10 border border-danger/30 p-2.5 text-danger">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="font-semibold text-text-primary">
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
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border-primary/50 text-text-primary font-medium'
                      : 'bg-bg-surface-muted border-border-subtle text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>{mg.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              )
            })}
          </div>
        </div>

        {selectedMuscleIds.length > 0 && (
          <div className="space-y-2">
            <label className="font-semibold text-text-primary">
              Chỉ định nhóm cơ chính (Bắt buộc đúng 1 nhóm cơ chính):
            </label>
            <select
              value={primaryMuscleId}
              onChange={(e) => setPrimaryMuscleId(e.target.value)}
              className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {selectedMuscleIds.map((id) => {
                const mg = muscleGroups.find((m) => m.id === id)
                return (
                  <option key={id} value={id} className="bg-bg-surface text-text-primary">
                    {mg?.name || id}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
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
