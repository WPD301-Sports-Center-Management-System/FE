import { useState, useEffect } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select, Textarea } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import type { TrainingCourse } from '@/shared/types/api'
import type { CreateTrainingCoursePayload, UpdateTrainingCoursePayload } from '../../types/courses-exercises.types'

interface CourseFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingCourse?: TrainingCourse | null
  onSubmit: (data: CreateTrainingCoursePayload | UpdateTrainingCoursePayload) => Promise<void>
  isSubmitting: boolean
}

export function CourseFormModal({
  isOpen,
  onClose,
  editingCourse,
  onSubmit,
  isSubmitting,
}: CourseFormModalProps) {
  const [name, setName] = useState('')
  const [difficultyLevel, setDifficultyLevel] = useState('INTERMEDIATE')
  const [objective, setObjective] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    if (editingCourse) {
      setName(editingCourse.name || '')
      setDifficultyLevel(editingCourse.difficultyLevel || 'INTERMEDIATE')
      setObjective(editingCourse.objective || '')
      setDescription(editingCourse.description || '')
      setImageUrl(editingCourse.imageUrl || '')
    } else {
      setName('')
      setDifficultyLevel('INTERMEDIATE')
      setObjective('')
      setDescription('')
      setImageUrl('')
    }
  }, [editingCourse, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onSubmit({
      name: name.trim(),
      difficultyLevel: difficultyLevel || undefined,
      objective: objective.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={editingCourse ? 'Chỉnh Sửa Khóa Đào Tạo' : 'Thêm Khóa Huấn Luyện Mới'}
      description={
        editingCourse
          ? `Cập nhật thông tin cơ bản cho khóa "${editingCourse.name}"`
          : 'Tạo khóa đào tạo PT 1:1 trong hệ thống (POST /training-courses)'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên khóa đào tạo"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            editingCourse ? 'Ví dụ: Kickboxing PT Giảm mỡ' : 'Ví dụ: Kickboxing PT Giảm mỡ Cấp tốc'
          }
          disabled={isSubmitting}
        />
        <Select
          label="Độ khó yêu cầu"
          value={difficultyLevel}
          onChange={(e) => setDifficultyLevel(e.target.value)}
          options={[
            { value: 'BEGINNER', label: 'Cơ bản (Beginner)' },
            { value: 'INTERMEDIATE', label: 'Trung bình (Intermediate)' },
            { value: 'ADVANCED', label: 'Nâng cao (Advanced)' },
          ]}
          disabled={isSubmitting}
        />
        <Input
          label="Mục tiêu khóa học"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder={
            editingCourse
              ? 'Mục tiêu đạt được sau khóa học...'
              : 'Ví dụ: Tăng 2kg cơ bắp và đốt 3% mỡ trong 8 tuần'
          }
          disabled={isSubmitting}
        />
        <Textarea
          label="Mô tả tổng quan khóa học"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Giới thiệu lộ trình, đối tượng học viên phù hợp..."
          disabled={isSubmitting}
        />
        <Input
          label="Link ảnh banner khóa học (URL)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
