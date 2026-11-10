export type StatusContext = 'slot' | 'support' | 'maintenance' | 'session' | 'visit' | 'payment' | 'payout' | 'trial' | 'equipment' | 'enrollment'

export interface StatusBadgeProps {
  status?: string | null
  text?: string
  /** Where the status comes from. The same enum value means different things per domain (OPEN slot vs OPEN ticket). */
  context?: StatusContext
}

type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral'

const tones: Record<Tone, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  info: { bg: 'bg-sky-500/15 border-sky-500/30', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  danger: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  neutral: { bg: 'bg-bg-surface-muted border-border-subtle', text: 'text-text-muted', dot: 'bg-text-muted' },
}

type Entry = [label: string, tone: Tone]

/** Default meaning of every status value the API can return (all Prisma status enums). */
export const statusLabels: Record<string, Entry> = {
  TERMINATED: ['Đã chấm dứt', 'neutral'],
  INTERRUPTED: ['Buổi bị gián đoạn', 'warning'],
  PROTECTED_ABSENCE: ['Nghỉ được bảo toàn buổi', 'neutral'],
  AI_DRAFT: ['Bản nháp AI', 'neutral'],
  ACTIVE: ['Đang hoạt động', 'success'],
  INACTIVE: ['Tạm dừng', 'neutral'],
  SUSPENDED: ['Bị tạm khóa', 'danger'],
  PENDING: ['Chờ xử lý', 'warning'],
  PENDING_PAYMENT: ['Chờ thanh toán', 'warning'],
  PENDING_CONFIRMATION: ['Chờ xác nhận', 'warning'],
  AWAITING_PAYMENT: ['Chờ thanh toán', 'warning'],
  PAID: ['Đã thanh toán', 'success'],
  REFUNDED: ['Đã hoàn tiền', 'neutral'],
  PAID_NEEDS_SCHEDULE: ['Đã thanh toán – cần xếp lịch', 'warning'],
  FAILED: ['Thất bại', 'danger'],
  SUPERSEDED: ['Đã thay thế', 'neutral'],
  EXPIRED: ['Hết hạn', 'danger'],
  CANCELLED: ['Đã hủy', 'danger'],
  COMPLETED: ['Đã hoàn thành', 'success'],
  APPROVED: ['Đã duyệt', 'success'],
  REJECTED: ['Từ chối', 'danger'],
  OPEN: ['Đang mở', 'info'],
  BOOKED: ['Đã đặt', 'info'],
  BLOCKED: ['Đã khóa', 'neutral'],
  CONFIRMED: ['Đã xác nhận', 'info'],
  ARRIVED: ['Đã đến', 'info'],
  CHECKED_IN: ['Đã check-in', 'info'],
  NEEDS_INFO: ['Cần bổ sung', 'warning'],
  NEEDS_MANAGER: ['Chờ Manager', 'warning'],
  IN_PROGRESS: ['Đang diễn ra', 'warning'],
  RESCHEDULED: ['Đã dời lịch', 'neutral'],
  CANCELLED_EARLY: ['Hủy sớm (giữ buổi)', 'success'],
  CANCELLED_LATE: ['Hủy muộn (mất buổi)', 'danger'],
  COACH_CANCELLED: ['HLV hủy buổi', 'warning'],
  NO_SHOW: ['Vắng mặt', 'danger'],
  FROZEN: ['Tạm giữ', 'warning'],
  CONVERTED_TO_ADVANCE: ['Chuyển thành tạm ứng', 'neutral'],
  FORFEITED: ['Mất buổi bù', 'danger'],
  DRAFT: ['Bản nháp', 'warning'],
  ASSIGNED: ['Đã giao', 'info'],
  ARCHIVED: ['Đã lưu trữ', 'neutral'],
  PUBLISHED: ['Đã công bố', 'success'],
  PAUSED: ['Tạm ngưng', 'neutral'],
  ACHIEVED: ['Đã đạt', 'success'],
  // Goal progress (PRD goal v3.1) and voided session sheets.
  WISH: ['Mong muốn', 'neutral'],
  PARTIAL: ['Đạt một phần', 'warning'],
  NOT_ACHIEVED: ['Chưa đạt', 'danger'],
  REVISED: ['Đã điều chỉnh', 'neutral'],
  INSUFFICIENT_DATA: ['Chưa đủ dữ liệu', 'neutral'],
  UNTRACKED: ['Ngừng theo dõi', 'neutral'],
  COMPLETED_EARLY: ['Hoàn thành sớm', 'success'],
  VOID: ['Đã huỷ hiệu lực', 'neutral'],
  AVAILABLE: ['Sẵn sàng', 'success'],
  IN_USE: ['Đang sử dụng', 'info'],
  MAINTENANCE: ['Đang bảo trì', 'warning'],
  UNDER_MAINTENANCE: ['Đang bảo trì', 'warning'],
  OUT_OF_SERVICE: ['Ngừng sử dụng', 'danger'],
  OUT_OF_ORDER: ['Hỏng hóc', 'danger'],
  OPERATIONAL: ['Hoạt động tốt', 'success'],
  SCHEDULED: ['Đã lên lịch', 'info'],
  VISIBLE: ['Đang hiển thị', 'success'],
  HIDDEN: ['Đã ẩn', 'neutral'],
  RESOLVED: ['Đã giải quyết', 'success'],
  CLOSED: ['Đã đóng', 'neutral'],
  AUTO_CLOSED: ['Tự đóng', 'neutral'],
  LEGACY_IMPORTED: ['Dữ liệu cũ', 'neutral'],
  REQUESTED: ['Đã gửi yêu cầu', 'warning'],
  PROPOSED: ['Đã đề xuất lịch', 'info'],
  WITHDRAWN: ['Đã rút', 'neutral'],
  SENT: ['Đã gửi', 'info'],
  ACCEPTED: ['Đã chấp nhận', 'success'],
  DECLINED: ['Đã từ chối', 'danger'],
  FULFILLED: ['Đã thực hiện', 'success'],
  CONVERTED: ['Đã chuyển đổi', 'success'],
  RELEASED: ['Đã nhả giữ chỗ', 'neutral'],
  CONSUMED: ['Đã dùng', 'neutral'],
  ELIGIBLE: ['Đủ điều kiện chi', 'success'],
  ON_HOLD: ['Tạm giữ', 'warning'],
  INCLUDED: ['Đã vào kỳ', 'info'],
  SETTLED_BY_ADVANCE: ['Cấn trừ tạm ứng', 'neutral'],
  VOIDED: ['Đã hủy bỏ', 'neutral'],
  LOCKED: ['Đã chốt', 'info'],
  REMOVED: ['Đã loại khỏi kỳ', 'neutral'],
  OUTSTANDING: ['Còn nợ', 'warning'],
  PARTIALLY_SETTLED: ['Đã trừ một phần', 'warning'],
  SETTLED: ['Đã tất toán', 'success'],
  WAIVED: ['Đã miễn', 'neutral'],
  NEW: ['Mới', 'warning'],
  CONTACTED: ['Đã liên hệ', 'info'],
}

/** Overrides where a value means something else in a given domain. */
const contextLabels: Record<StatusContext, Record<string, Entry>> = {
  slot: { OPEN: ['Khung giờ trống', 'info'], COMPLETED: ['Đã dạy', 'success'] },
  support: { OPEN: ['Mới gửi', 'warning'], IN_PROGRESS: ['Đang xử lý', 'warning'], RESOLVED: ['Đã phản hồi', 'success'] },
  maintenance: { IN_PROGRESS: ['Đang bảo trì', 'warning'], COMPLETED: ['Đã bảo trì xong', 'success'] },
  session: { IN_PROGRESS: ['Đang tập', 'warning'], SCHEDULED: ['Đã xếp lịch', 'info'], CONFIRMED: ['Đã xếp lịch', 'info'], COMPLETED: ['Đã tập', 'success'] },
  visit: { OPEN: ['Đang trong phòng tập', 'info'], CLOSED: ['Đã ra về', 'neutral'] },
  payment: { PENDING: ['Chờ thanh toán', 'warning'], CANCELLED: ['Đã hủy giao dịch', 'neutral'] },
  payout: { PENDING: ['Chờ chi trả', 'warning'], PAID: ['Đã chi trả', 'success'], DRAFT: ['Đang lập', 'warning'], CANCELLED: ['Đã hủy kỳ', 'neutral'] },
  trial: { NEW: ['Chưa liên hệ', 'warning'], CONTACTED: ['Đã liên hệ', 'info'], CONVERTED: ['Đã thành hội viên', 'success'], CLOSED: ['Đã đóng', 'neutral'] },
  equipment: { MAINTENANCE: ['Đang bảo trì', 'warning'] },
  enrollment: { CONFIRMED: ['Đã xác nhận lịch', 'success'], EXPIRED: ['Quá hạn', 'danger'] },
}

export function statusLabel(status: string, context?: StatusContext) {
  return (context && contextLabels[context][status]?.[0]) ?? statusLabels[status]?.[0] ?? status
}

export function StatusBadge({ status, text, context }: StatusBadgeProps) {
  if (!status) return null
  const [label, tone] = (context && contextLabels[context][status]) || statusLabels[status] || [status, 'neutral']
  const config = tones[tone]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {text || label}
    </span>
  )
}
