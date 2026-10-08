import { useState, useEffect } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { formatDateTime } from '@/shared/utils/date'
import type { CoachSlot } from '@/shared/types/api'

interface BlockSlotDialogProps {
  isOpen: boolean
  onClose: () => void
  slot: CoachSlot | null
  onConfirm: (slotId: string, reason: string) => void
  isSubmitting?: boolean
}

export function BlockSlotDialog({
  isOpen,
  onClose,
  slot,
  onConfirm,
  isSubmitting = false,
}: BlockSlotDialogProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('')
    }
  }, [isOpen])

  if (!slot) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(slot.id, reason.trim())
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Khóa bận khung giờ làm việc"
      description="Chặn khung giờ này để hội viên và Lễ tân không thể xếp lịch"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Thời gian:</span>
            <span className="font-semibold text-white">{formatDateTime(slot.startsAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Khóa học:</span>
            <span className="text-slate-200">{slot.courseName || 'PT 1:1'}</span>
          </div>
        </div>

        <Input
          label="Lý do khóa slot"
          placeholder="Ví dụ: Bận việc riêng, khám sức khỏe, họp..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="outline"
            className="text-amber-400 border-amber-500/40 hover:bg-amber-950/40"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang khóa...' : 'Xác nhận khóa slot'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
