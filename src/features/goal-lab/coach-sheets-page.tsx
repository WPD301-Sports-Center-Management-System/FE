import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useLoad } from '@/features/fixed-pt/hooks'
import { ptBookingsService } from '@/features/pt-bookings-schedule/services/pt-bookings.service'
import type { Booking } from '@/shared/types/api'
import { formatDateTime } from '@/shared/utils/date'
import { Box, LoadState } from './components'

/** One editor for every entry point, including old results URLs. */
export function CoachSheetsPage() {
  const [params] = useSearchParams()
  const bookingId = params.get('bookingId')
  const memberId = params.get('memberId')
  const state = useLoad(async () => {
    const response = await ptBookingsService.getMyCoachBookings({ status: 'COMPLETED', order: 'desc', limit: 100 })
    return (Array.isArray(response) ? response : response.data ?? []) as Booking[]
  }, [], !bookingId)
  if (bookingId) return <Navigate replace to={`/coach/goals/sheet/${encodeURIComponent(bookingId)}`} />
  const rows=(state.data??[]).filter(b=>!memberId||b.memberId===memberId)
  return <Box title="Đánh giá cuối buổi">
    <p className="text-sm text-text-muted">Chọn buổi đã hoàn thành để ghi số đo hôm nay và nhận xét. Bạn cũng có thể mở đánh giá ngay từ lịch dạy.</p>
    <LoadState state={state} empty={!!state.data && !rows.length}>
      <ul className="divide-y divide-border-subtle">{rows.map(b => <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{b.memberName ?? 'Học viên'} · {formatDateTime(b.startsAt)}</p><p className="text-sm text-text-muted">{b.bookingCode} · Buổi đã hoàn thành</p></div><Link className="rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:ring-2" to={`/coach/goals/sheet/${b.id}`}>Mở đánh giá cuối buổi</Link></li>)}</ul>
    </LoadState>
  </Box>
}
