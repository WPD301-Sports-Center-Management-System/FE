import type { ReactNode } from 'react'
import { Modal } from './modal'
import { Button } from './button'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** "danger" for irreversible actions (delete, discard). */
  tone?: 'primary' | 'danger'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** In-app replacement for window.confirm: styled, keyboard accessible and states the consequence. */
export function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', tone = 'primary', isLoading, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="sm">
      <div className="space-y-5">
        <div className="text-sm text-text-secondary">{message}</div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>{cancelLabel}</Button>
          <Button type="button" variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
