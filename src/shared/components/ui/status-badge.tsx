export interface StatusBadgeProps {
  status?: string | null
  text?: string
}

const statusMap: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE: { label: 'Đang hoạt động', bg: 'bg-emerald-950/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  PAID: { label: 'Đã thanh toán', bg: 'bg-emerald-950/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  COMPLETED: { label: 'Đã hoàn thành', bg: 'bg-emerald-950/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  OPERATIONAL: { label: 'Hoạt động tốt', bg: 'bg-emerald-950/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  APPROVED: { label: 'Đã duyệt', bg: 'bg-emerald-950/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },

  PENDING: { label: 'Chờ xử lý', bg: 'bg-amber-950/60', text: 'text-amber-400', dot: 'bg-amber-400' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', bg: 'bg-amber-950/60', text: 'text-amber-400', dot: 'bg-amber-400' },
  IN_PROGRESS: { label: 'Đang xử lý', bg: 'bg-amber-950/60', text: 'text-amber-400', dot: 'bg-amber-400' },
  SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-amber-950/60', text: 'text-amber-400', dot: 'bg-amber-400' },
  UNDER_MAINTENANCE: { label: 'Đang bảo trì', bg: 'bg-amber-950/60', text: 'text-amber-400', dot: 'bg-amber-400' },

  CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-sky-950/60', text: 'text-sky-400', dot: 'bg-sky-400' },
  BOOKED: { label: 'Đã đặt', bg: 'bg-sky-950/60', text: 'text-sky-400', dot: 'bg-sky-400' },
  OPEN: { label: 'Khung giờ trống', bg: 'bg-cyan-950/60', text: 'text-cyan-400', dot: 'bg-cyan-400' },

  EXPIRED: { label: 'Hết hạn', bg: 'bg-red-950/60', text: 'text-red-400', dot: 'bg-red-400' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-red-950/60', text: 'text-red-400', dot: 'bg-red-400' },
  CANCELLED_EARLY: { label: 'Hủy sớm (Hoàn buổi)', bg: 'bg-emerald-950/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  CANCELLED_LATE: { label: 'Hủy muộn (Mất buổi)', bg: 'bg-red-950/60', text: 'text-red-400', dot: 'bg-red-400' },
  COACH_CANCELLED: { label: 'HLV báo bận', bg: 'bg-amber-950/60', text: 'text-amber-400', dot: 'bg-amber-400' },
  NO_SHOW: { label: 'Vắng mặt', bg: 'bg-rose-950/60', text: 'text-rose-400', dot: 'bg-rose-400' },
  REJECTED: { label: 'Từ chối', bg: 'bg-red-950/60', text: 'text-red-400', dot: 'bg-red-400' },
  SUSPENDED: { label: 'Bị tạm khóa', bg: 'bg-red-950/60', text: 'text-red-400', dot: 'bg-red-400' },
  OUT_OF_ORDER: { label: 'Hỏng hóc', bg: 'bg-red-950/60', text: 'text-red-400', dot: 'bg-red-400' },

  BLOCKED: { label: 'Đã khóa', bg: 'bg-slate-800', text: 'text-slate-400', dot: 'bg-slate-400' },
  INACTIVE: { label: 'Tạm dừng', bg: 'bg-slate-800', text: 'text-slate-400', dot: 'bg-slate-400' },
  DRAFT: { label: 'Bản nháp', bg: 'bg-slate-800', text: 'text-slate-400', dot: 'bg-slate-400' },
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  if (!status) return null
  const config = statusMap[status] || {
    label: status,
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border border-white/5 ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {text || config.label}
    </span>
  )
}
