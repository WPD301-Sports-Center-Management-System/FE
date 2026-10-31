import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { formatVND } from '@/shared/utils/currency'

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  )
}

export function Panel({ title, actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-sm">
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-text-primary">{title}</h2>}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string | null; onRetry?: () => void }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      {onRetry && <Button size="sm" variant="ghost" onClick={onRetry}><RefreshCw className="h-3.5 w-3.5" aria-hidden />Thử lại</Button>}
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'success'; children: ReactNode }) {
  const cls = { info: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200', warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200', success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' }[tone]
  return <div role="status" className={`rounded-xl border px-3 py-2 text-sm ${cls}`}>{children}</div>
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-2" aria-busy="true" aria-label="Đang tải">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-bg-surface-muted motion-reduce:animate-none" />)}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-muted">{children}</p>
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
  PUBLISHED: 'Đang nhận Member', PAUSED: 'Tạm ngưng nhận', AVAILABLE: 'Chưa xếp', SCHEDULED: 'Đã xếp', CONSUMED: 'Đã tính', AUTO_CLOSED: 'Đóng kỹ thuật (chưa xác minh giờ ra)', LEGACY_IMPORTED: 'Dữ liệu cũ', CLOSED: 'Đã ra',
  APPLIED: 'Đã áp dụng cho đơn', UNAPPLIED: 'Chưa áp dụng – đối soát', PENDING_REVIEW: 'Đang xử lý', MAKEUP: 'Học bù', RESCHEDULE: 'Đổi giờ', SCHEDULE_AVAILABLE: 'Xếp buổi còn trống',
}
export const label = (status?: string | null) => (status ? LABELS[status] ?? status : '-')
export function Status({ value }: { value?: string | null }) { return value ? <StatusBadge status={value} text={label(value)} /> : null }
export const money = (v: unknown) => formatVND(Number(v ?? 0))
export const WEEKDAYS = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

export function Field({ label: text, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">{text}</span>
      {children}
      {hint && <span className="block text-xs text-text-muted">{hint}</span>}
    </label>
  )
}
export const inputCls = 'w-full rounded-xl border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/40'

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead><tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">{head.map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-border-subtle">{children}</tbody>
      </table>
    </div>
  )
}
export const td = 'px-3 py-2 align-top text-text-primary'
