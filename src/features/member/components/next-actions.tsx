import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { hybridGet } from '@/features/fixed-pt/hybrid-api'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Async, Btn, Card } from '@/features/workspace/ui'
import { formatDateTime } from '@/shared/utils/date'

export interface MemberAction { kind: string; label: string; purchaseId?: string; bookingId?: string; scheduleRequestId?: string; paymentId?: string; packageName?: string; coachName?: string; creditCount?: number; remainingCredits?: number; uncoveredSessions?: number; at?: string }
function actionLink(a: MemberAction) {
  if (a.bookingId) return `/pt-sessions/${a.bookingId}`
  if (a.purchaseId) return `/pt-purchases/${a.purchaseId}${a.scheduleRequestId ? '?requestId=' + a.scheduleRequestId : ''}`
  return a.kind === 'MEMBERSHIP_GAP' ? '/member/membership-sale' : '/member?tab=billing'
}
export function MemberNextActions() {
  const state = useLoad(() => hybridGet<{ items: MemberAction[] }>('/me/next-actions'))
  const { reload } = state
  useEffect(() => { const refresh = () => void reload(); window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh) }, [reload])
  return <Card title="Việc tiếp theo" actions={<Btn size="sm" busy={state.loading} onClick={() => void state.reload()}>Làm mới</Btn>}>
    <Async state={state} rows={3}>{data => !data.items.length ? <p className="text-sm text-text-muted">Bạn chưa có việc cần xử lý. Xem gói tập và lịch bên dưới.</p> : <ul className="divide-y divide-border-subtle">{data.items.map((a, i) => <li key={[a.kind, a.purchaseId, a.bookingId, a.paymentId, a.scheduleRequestId, i].join(':')} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0 flex-1"><p className="font-semibold">{a.kind === 'AWAITING_SCHEDULE' ? `${a.creditCount} buổi chưa có lịch. Đang chờ Coach sắp xếp.` : a.label}</p><p className="text-text-muted">{[a.packageName, a.coachName].filter(Boolean).join(' · ')}{a.at ? ` · ${formatDateTime(a.at)}` : ''}</p>{a.remainingCredits != null && <p>Còn {a.remainingCredits} buổi, gồm buổi đã có lịch và chưa có lịch.</p>}{a.uncoveredSessions != null && <p>{a.uncoveredSessions} buổi PT chưa có vé gym phù hợp. Liên hệ quầy để gia hạn.</p>}</div>
      <Link className="min-h-11 inline-flex items-center font-semibold underline" to={actionLink(a)}>{a.kind === 'SCHEDULE_PROPOSAL' ? 'Xem và phản hồi' : a.kind === 'PAYMENT_PROCESSING' ? 'Theo dõi xử lý' : a.kind === 'AWAITING_SCHEDULE' ? 'Xem gói' : 'Xem chi tiết'}</Link>
    </li>)}</ul>}</Async>
  </Card>
}
