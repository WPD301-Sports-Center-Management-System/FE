export interface StatusBadgeProps {
  status?: string | null
  text?: string
}

const statusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE: { label: 'Đang hoạt động', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  PAID: { label: 'Đã thanh toán', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  COMPLETED: { label: 'Đã hoàn thành', bg: 'bg-sky-500/15 border-sky-500/30', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  OPERATIONAL: { label: 'Hoạt động tốt', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  APPROVED: { label: 'Đã duyệt', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },

  PENDING: { label: 'Chờ xử lý', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'Đang xử lý', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  UNDER_MAINTENANCE: { label: 'Đang bảo trì', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },

  CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-sky-500/15 border-sky-500/30', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  BOOKED: { label: 'Đã đặt', bg: 'bg-sky-500/15 border-sky-500/30', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  OPEN: { label: 'Khung giờ trống', bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },

  EXPIRED: { label: 'Hết hạn', bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  CANCELLED_EARLY: { label: 'Hủy sớm (Hoàn buổi)', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  CANCELLED_LATE: { label: 'Hủy muộn (Mất buổi)', bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  COACH_CANCELLED: { label: 'HLV báo bận', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  NO_SHOW: { label: 'Vắng mặt', bg: 'bg-rose-500/15 border-rose-500/30', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  REJECTED: { label: 'Từ chối', bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  SUSPENDED: { label: 'Bị tạm khóa', bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  OUT_OF_ORDER: { label: 'Hỏng hóc', bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },

  BLOCKED: { label: 'Đã khóa', bg: 'bg-bg-surface-muted border-border-subtle', text: 'text-text-muted', dot: 'bg-text-muted' },
  INACTIVE: { label: 'Tạm dừng', bg: 'bg-bg-surface-muted border-border-subtle', text: 'text-text-muted', dot: 'bg-text-muted' },
  DRAFT: { label: 'Bản nháp', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  ARCHIVED: { label: 'Đã lưu trữ', bg: 'bg-bg-surface-muted border-border-subtle', text: 'text-text-muted', dot: 'bg-text-muted' },
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  if (!status) return null
  const config = statusMap[status] || {
    label: status,
    bg: 'bg-bg-surface-muted border-border-subtle',
    text: 'text-text-muted',
    dot: 'bg-text-muted',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {text || config.label}
    </span>
  )
}
