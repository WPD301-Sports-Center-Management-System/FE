import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Chưa có bản ghi nào được tìm thấy.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-surface-muted/40 p-10 text-center">
      <div className="mb-3 rounded-2xl bg-bg-surface-muted p-3.5 text-text-muted">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
