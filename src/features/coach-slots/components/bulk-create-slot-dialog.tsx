import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { bulkCreateSlotSchema } from '../schemas/coach-slot-schema'
import type { BulkCreateSlotInput } from '../types/coach-slot-types'

interface BulkCreateSlotDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BulkCreateSlotInput) => void
  offerings: Array<{ id: string; name: string }>
  isSubmitting?: boolean
}

const WEEKDAYS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 7, label: 'Chủ nhật' },
]

export function BulkCreateSlotDialog({
  isOpen,
  onClose,
  onSubmit,
  offerings,
  isSubmitting = false,
}: BulkCreateSlotDialogProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]) // Default Mon, Wed, Fri

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BulkCreateSlotInput>({
    resolver: zodResolver(bulkCreateSlotSchema),
    defaultValues: {
      startTime: '08:00',
      endTime: '09:00',
      offeringId: offerings[0]?.id || '',
      daysOfWeek: [1, 3, 5],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      note: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      reset({
        startTime: '08:00',
        endTime: '09:00',
        offeringId: offerings[0]?.id || '',
        daysOfWeek: [1, 3, 5],
        startDate: today,
        endDate: twoWeeksLater,
        note: '',
      })
      setSelectedDays([1, 3, 5])
    }
  }, [isOpen, offerings, reset])

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort()
    setSelectedDays(next)
    setValue('daysOfWeek', next, { shouldValidate: true })
  }

  const handleFormSubmit = (data: BulkCreateSlotInput) => {
    onSubmit(data)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mở hàng loạt khung giờ lặp lại"
      description="Tự động sinh các khung giờ theo lịch định kỳ trong tuần"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
          label="Khóa học áp dụng"
          error={errors.offeringId?.message}
          options={offerings.map((o) => ({ value: o.id, label: o.name }))}
          {...register('offeringId')}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Các ngày áp dụng trong tuần
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {WEEKDAYS.map((w) => {
              const isChecked = selectedDays.includes(w.value)
              return (
                <button
                  type="button"
                  key={w.value}
                  onClick={() => toggleDay(w.value)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isChecked
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {w.label}
                </button>
              )
            })}
          </div>
          {errors.daysOfWeek && (
            <p className="text-xs text-red-400">{errors.daysOfWeek.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Từ ngày"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Đến ngày"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        <Input
          label="Ghi chú chung"
          placeholder="Ví dụ: Khung giờ cố định kỳ huấn luyện..."
          error={errors.note?.message}
          {...register('note')}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Đang tạo hàng loạt...' : 'Tạo hàng loạt'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
