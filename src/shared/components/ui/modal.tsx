import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  description?: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'md' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden ${widthStyles} rounded-2xl border border-border-subtle bg-bg-surface p-4 sm:p-6 shadow-2xl text-text-primary transition-all`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-bold leading-snug text-text-primary">{title}</h3>
            {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-bg-surface-muted hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}
