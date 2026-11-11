import { useEffect, useRef, useState, type ReactNode } from 'react'
import { isAppApiError } from '@/shared/api/api-error'
import { ConfirmDialog } from './confirm-dialog'

/** What the BE answered (already Vietnamese for business refusals such as "đang được sử dụng"). */
export function deleteErrorMessage(error: unknown): string {
  if (isAppApiError(error)) return error.errors?.[0]?.message ?? error.message
  return error instanceof Error && error.message ? error.message : 'Không thể xóa. Vui lòng thử lại.'
}

export interface DeleteDialogProps {
  /** Name of the record to delete; null keeps the dialog closed. */
  name: string | null
  /** Kind of record, lower case: "bài tập", "gói PT"… */
  noun: string
  /** What the deletion changes (and what it keeps). */
  impact: ReactNode
  /** Does the delete request and the list refresh; a thrown error is shown inside the dialog. */
  onConfirm: () => Promise<void>
  onClose: () => void
}

/** Confirmation for deleting a catalogue record: names it, explains the effect, blocks double submit, shows the BE refusal. */
export function DeleteDialog({ name, noun, impact, onConfirm, onClose }: DeleteDialogProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const running = useRef(false)
  useEffect(() => { setError(null) }, [name])
  const confirm = async () => {
    if (running.current) return
    running.current = true; setBusy(true); setError(null)
    try { await onConfirm(); onClose() }
    catch (e) { setError(deleteErrorMessage(e)) }
    finally { running.current = false; setBusy(false) }
  }
  return (
    <ConfirmDialog
      isOpen={name !== null}
      title={`Xóa ${noun}`}
      tone="danger"
      confirmLabel="Xóa"
      isLoading={busy}
      onCancel={() => { if (!busy) onClose() }}
      onConfirm={() => void confirm()}
      message={
        <div className="space-y-3">
          <p>Bạn sắp xóa {noun} <strong className="text-text-primary">“{name}”</strong>.</p>
          <div>{impact}</div>
          {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-danger">{error}</p>}
        </div>
      }
    />
  )
}
