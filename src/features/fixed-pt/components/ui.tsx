import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { formatVND } from '@/shared/utils/currency'
import { Btn, Card, Field as WorkspaceField, PageHeader, Skeleton as WorkspaceSkeleton, Table as WorkspaceTable, td as workspaceTd } from '@/features/workspace/ui'

// PT screens share the staff workspace kit (features/workspace/ui): one typography, spacing, card and state
// system for every role (Docs/UX_AUDIT_IA_2026-11.md §2.5). These wrappers keep the existing call sites.
export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return <div><PageHeader title={title} subtitle={subtitle} actions={actions} /><div className="space-y-5">{children}</div></div>
}

export function Panel({ title, actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return <Card title={title} actions={actions}><div className="space-y-3">{children}</div></Card>
}

export function ErrorBanner({ message, onRetry }: { message: string | null; onRetry?: () => void }) {
  if (!message) return null
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
    <span className="inline-flex items-start gap-2"><AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />{message}</span>
    {onRetry && <Btn size="sm" variant="danger" icon={<RotateCw aria-hidden className="h-3.5 w-3.5" />} onClick={onRetry}>Thử lại</Btn>}
  </div>
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'success'; children: ReactNode }) {
  const cls = { info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200', warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200', success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200' }[tone]
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return <WorkspaceSkeleton rows={rows} className="p-0" />
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">
    <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-bg-surface-muted"><Inbox className="h-5 w-5" /></span>{children}
  </div>
}

// Loading → error (retry) → empty → content, in one place for every list.
export function Loadable<T>({ state, empty, children }: { state: { data: T | null; loading: boolean; error: string | null; reload: () => void }; empty?: string; children: (data: T) => ReactNode }) {
  if (state.loading && !state.data) return <Skeleton />
  if (state.error) return <ErrorBanner message={state.error} onRetry={state.reload} />
  if (!state.data || (Array.isArray(state.data) && state.data.length === 0)) return <Empty>{empty ?? 'Chưa có dữ liệu.'}</Empty>
  return <>{children(state.data)}</>
}

const LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động', COMPLETED: 'Đã hoàn thành', EXPIRED: 'Hết hạn', PENDING_PAYMENT: 'Chờ thanh toán', CANCELLED: 'Đã hủy',
  REQUESTED: 'Chờ Coach xác nhận', PROPOSED: 'Chờ Member đồng ý lịch', AWAITING_PAYMENT: 'Đang giữ chỗ – chờ thanh toán', PAID_NEEDS_SCHEDULE: 'Đã thanh toán – cần sắp lại lịch', WITHDRAWN: 'Member đã rút',
  CONFIRMED: 'Đã lên lịch', ARRIVED: 'Đã đến', IN_PROGRESS: 'Đang tập', RESCHEDULED: 'Đã đổi giờ', SENT: 'Đã gửi', SUPERSEDED: 'Phiên bản cũ', DECLINED: 'Bị từ chối', FULFILLED: 'Đã xác nhận',
  PENDING_CONFIRMATION: 'Chờ xác nhận', ELIGIBLE: 'Đủ điều kiện', ON_HOLD: 'Tạm giữ', INCLUDED: 'Trong kỳ chi', SETTLED_BY_ADVANCE: 'Đối trừ khoản ứng', VOIDED: 'Không tính',
  LOCKED: 'Đã khóa', OUTSTANDING: 'Còn phải xử lý', PARTIALLY_SETTLED: 'Đã xử lý một phần', SETTLED: 'Đã xử lý', WAIVED: 'Đã miễn', RESOLVED: 'Đã giải quyết',
  PUBLISHED: 'Đang nhận Member', PAUSED: 'Tạm ngưng nhận', AVAILABLE: 'Chưa xếp', SCHEDULED: 'Đã xếp', CONSUMED: 'Đã tính', REFUNDED: 'Thu hồi để hoàn tiền', PENDING_TRANSFER: 'Chờ chuyển tiền', AUTO_CLOSED: 'Đóng kỹ thuật (chưa xác minh giờ ra)', LEGACY_IMPORTED: 'Dữ liệu cũ', CLOSED: 'Đã ra',
  APPLIED: 'Đã áp dụng cho đơn', UNAPPLIED: 'Chưa áp dụng – đối soát', PENDING_REVIEW: 'Đang xử lý', MAKEUP: 'Học bù', RESCHEDULE: 'Đổi giờ', SCHEDULE_AVAILABLE: 'Xếp buổi còn trống',
}
export const label = (status?: string | null) => (status ? LABELS[status] ?? status : '-')
export function Status({ value }: { value?: string | null }) { return value ? <StatusBadge status={value} text={label(value)} /> : null }
export const money = (v: unknown) => formatVND(Number(v ?? 0))
export const WEEKDAYS = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

export function Field({ label: text, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <WorkspaceField label={text} hint={hint}>{children}</WorkspaceField>
}
// Same look as the workspace inputs; no fixed height so it also fits <textarea> and <select multiple>.
export const inputCls = 'min-h-9 w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30'

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return <WorkspaceTable head={head} minWidth={640} alignLast={false}>{children}</WorkspaceTable>
}
export const td = workspaceTd
