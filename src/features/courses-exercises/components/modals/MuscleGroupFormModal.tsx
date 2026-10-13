import { useState, useEffect } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Textarea } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import type { MuscleGroup } from '@/shared/types/api'
import type { CreateMuscleGroupPayload, UpdateMuscleGroupPayload } from '../../types/courses-exercises.types'

interface MuscleGroupFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingMuscleGroup?: MuscleGroup | null
  onSubmit: (data: CreateMuscleGroupPayload | UpdateMuscleGroupPayload) => Promise<void>
  isSubmitting: boolean
}

export function MuscleGroupFormModal({
  isOpen,
  onClose,
  editingMuscleGroup,
  onSubmit,
  isSubmitting,
}: MuscleGroupFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [recoveryDays, setRecoveryDays] = useState(2)

  useEffect(() => {
    if (editingMuscleGroup) {
      setName(editingMuscleGroup.name || '')
      setDescription(editingMuscleGroup.description || '')
      setImageUrl(editingMuscleGroup.imageUrl || '')
      setRecoveryDays(editingMuscleGroup.recoveryDays ?? 2)
    } else {
      setName('')
      setDescription('')
      setImageUrl('')
      setRecoveryDays(2)
    }
  }, [editingMuscleGroup, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      recoveryDays,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={editingMuscleGroup ? 'Chỉnh Sửa Nhóm Cơ' : 'Thêm Nhóm Cơ Mới'}
      description={
        editingMuscleGroup
          ? `Cập nhật thông tin cho nhóm cơ "${editingMuscleGroup.name}"`
          : 'Định nghĩa nhóm cơ giải phẫu cho thư viện bài tập và phân loại giáo án'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên nhóm cơ"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            editingMuscleGroup
              ? 'Ví dụ: Cơ vai (Deltoids)'
              : 'Ví dụ: Cơ ngực (Pectoralis), Cơ lưng xô (Latissimus)...'
          }
          disabled={isSubmitting}
        />
        <Textarea
          label="Mô tả giải phẫu & tác động"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả các bó cơ, nhóm cơ phụ trợ và đặc tính chuyển động..."
          disabled={isSubmitting}
        />
        <Input
          label="Số ngày hồi phục"
          type="number"
          min={1}
          max={30}
          required
          value={recoveryDays}
          onChange={(e) => setRecoveryDays(Number(e.target.value))}
          disabled={isSubmitting}
        />
        <Input
          label="Link hình ảnh minh họa (URL)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {editingMuscleGroup ? 'Lưu thay đổi' : 'Tạo nhóm cơ'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
