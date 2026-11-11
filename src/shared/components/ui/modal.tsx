import { type ReactNode, useId } from 'react'
import { createPortal } from 'react-dom'
import { useDialog } from '@/shared/hooks/use-dialog'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  description?: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
  placement?: 'center' | 'right'
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'md', placement = 'center' }: ModalProps) {
  const dialog = useDialog(isOpen, onClose)
  const titleId = useId()

  if (!isOpen) return null

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth]

  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${placement === 'right' ? 'items-stretch justify-end' : 'items-center justify-center p-4'}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        ref={dialog}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${widthStyles} ${placement === 'right' ? 'h-full overflow-y-auto' : 'max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl'} border border-border-subtle bg-bg-surface p-6 shadow-2xl text-text-primary transition-all`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h3 id={titleId} className="text-lg font-bold text-text-primary">{title}</h3>
            {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface-muted hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>, document.body
  )
}
