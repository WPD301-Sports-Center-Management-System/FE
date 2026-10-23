import { useState, useEffect } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select, Textarea } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import type { Exercise, MuscleGroup } from '@/shared/types/api'
import type { CreateExercisePayload, UpdateExercisePayload } from '../../types/courses-exercises.types'

interface ExerciseFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingExercise?: Exercise | null
  muscleGroups: MuscleGroup[]
  onSubmit: (data: CreateExercisePayload | UpdateExercisePayload) => Promise<void>
  isSubmitting: boolean
}

export function ExerciseFormModal({
  isOpen,
  onClose,
  editingExercise,
  muscleGroups,
  onSubmit,
  isSubmitting,
}: ExerciseFormModalProps) {
  const [name, setName] = useState('')
  const [muscleGroupId, setMuscleGroupId] = useState('')
  const [equipmentRequired, setEquipmentRequired] = useState('')
  const [difficultyLevel, setDifficultyLevel] = useState('INTERMEDIATE')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    if (editingExercise) {
      const primaryMgId =
        (editingExercise as any).exerciseMuscleGroupsExerciseId?.[0]?.muscleGroup?.id ||
        editingExercise.muscleGroups?.[0]?.id ||
        muscleGroups[0]?.id ||
        ''

      setName(editingExercise.name || '')
      setMuscleGroupId(primaryMgId)
      setEquipmentRequired(editingExercise.equipmentRequired || '')
      setDifficultyLevel(editingExercise.difficultyLevel || 'INTERMEDIATE')
      setDescription(editingExercise.description || '')
      setInstructions(editingExercise.instructions || '')
      setImageUrl(editingExercise.imageUrl || '')
      setVideoUrl(editingExercise.videoUrl || '')
    } else {
      setName('')
      setMuscleGroupId(muscleGroups[0]?.id || '')
      setEquipmentRequired('')
      setDifficultyLevel('INTERMEDIATE')
      setDescription('')
      setInstructions('')
      setImageUrl('')
      setVideoUrl('')
    }
  }, [editingExercise, muscleGroups, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !muscleGroupId) return

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      equipmentRequired: equipmentRequired.trim() || undefined,
      difficultyLevel,
      imageUrl: imageUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      muscleGroups: [{ id: muscleGroupId, isPrimary: true }],
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={editingExercise ? 'Chỉnh Sửa Bài Tập' : 'Thêm Bài Tập Mới'}
      description={
        editingExercise
          ? `Cập nhật kỹ thuật và thông số bài tập "${editingExercise.name}"`
          : 'Thêm động tác vào thư viện bài tập huấn luyện hệ thống'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên bài tập"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Dumbbell Incline Bench Press"
          disabled={isSubmitting}
        />
        <Select
          label="Nhóm cơ chính"
          value={muscleGroupId}
          onChange={(e) => setMuscleGroupId(e.target.value)}
          options={muscleGroups.map((m) => ({ value: m.id, label: m.name }))}
          disabled={isSubmitting}
        />
        <Input
          label="Thiết bị yêu cầu (tùy chọn)"
          value={equipmentRequired}
          onChange={(e) => setEquipmentRequired(e.target.value)}
          placeholder="Ví dụ: Tạ đơn, Ghế dốc, Máy kéo cáp..."
          disabled={isSubmitting}
        />
        <Select
          label="Độ khó"
          value={difficultyLevel}
          onChange={(e) => setDifficultyLevel(e.target.value)}
          options={[
            { value: 'BEGINNER', label: 'Cơ bản (Beginner)' },
            { value: 'INTERMEDIATE', label: 'Trung bình (Intermediate)' },
            { value: 'ADVANCED', label: 'Nâng cao (Advanced)' },
          ]}
          disabled={isSubmitting}
        />
        <Textarea
          label="Hướng dẫn thực hiện"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Mô tả kỹ thuật chuyển động, nhịp thở và lưu ý an toàn..."
          disabled={isSubmitting}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Link hình ảnh minh họa (URL)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/anh-bai-tap.jpg"
            disabled={isSubmitting}
          />
          <Input
            label="Link video kỹ thuật (URL)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {editingExercise ? 'Lưu thay đổi' : 'Lưu bài tập'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
