import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { createSlotSchema } from '../schemas/coach-slot-schema'
import type { CreateSlotInput } from '../types/coach-slot-types'

interface CreateSlotDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSlotInput) => void
  initialValues?: Partial<CreateSlotInput>
  offerings: Array<{ id: string; name: string }>
  isSubmitting?: boolean
}

export function CreateSlotDialog({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  offerings,
  isSubmitting = false,
}: CreateSlotDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSlotInput>({
    resolver: zodResolver(createSlotSchema),
    defaultValues: {
      date: initialValues?.date || new Date().toISOString().split('T')[0],
      startTime: initialValues?.startTime || '08:00',
      endTime: initialValues?.endTime || '09:00',
      offeringId: initialValues?.offeringId || offerings[0]?.id || '',
      note: initialValues?.note || '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        date: initialValues?.date || new Date().toISOString().split('T')[0],
        startTime: initialValues?.startTime || '08:00',
        endTime: initialValues?.endTime || '09:00',
        offeringId: initialValues?.offeringId || offerings[0]?.id || '',
        note: initialValues?.note || '',
      })
    }
  }, [isOpen, initialValues, offerings, reset])

  const handleFormSubmit = (data: CreateSlotInput) => {
    onSubmit(data)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mở khung giờ làm việc mới"
      description="Đăng ký khung giờ khả dụng để học viên hoặc Lễ tân có thể đặt lịch hẹn"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Ngày áp dụng"
          type="date"
          min={new Date().toISOString().split('T')[0]}
          error={errors.date?.message}
          {...register('date')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Giờ bắt đầu"
            type="time"
            error={errors.startTime?.message}
            {...register('startTime')}
          />
          <Input
            label="Giờ kết thúc"
            type="time"
            error={errors.endTime?.message}
            {...register('endTime')}
          />
        </div>

        <Select
          label="Khóa học giảng dạy"
          error={errors.offeringId?.message}
          options={offerings.map((o) => ({ value: o.id, label: o.name }))}
          {...register('offeringId')}
        />

        <Input
          label="Ghi chú (tùy chọn)"
          placeholder="Ví dụ: Ưu tiên học viên cơ bản, phòng tạ 2..."
          error={errors.note?.message}
          {...register('note')}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu khung giờ'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
