import { MemberPurchasePayment } from '../components/member-purchase-payment'
import { MemberProposals } from '../components/member-proposals'
import { DisruptionPanel } from './manager-sessions-page'
import { RefundsPanel } from './refunds-panel'
import { PurchaseLifecycle } from '../components/operations-panel'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fixedPtApi } from '../api'
import { hybridGet } from '../hybrid-api'
import { useLoad } from '../hooks'
import { Loadable, money, Notice, Page, Panel, Status } from '../components/ui'
import { formatDateTime } from '@/shared/utils/date'
import { useAuth } from '@/features/auth/context/auth-context'
import { SessionTable } from './coach-sessions-page'

export function LinkedSessionPage() {
  const { id = '' } = useParams()
  const state = useLoad(() => fixedPtApi.session(id), [id], !!id)
  const { role } = useAuth()
  const [params] = useSearchParams()
  return (
    <Page title="Chi tiết buổi tập" actions={<Link to={role === 'COACH' ? '/coach/schedule' : role === 'MANAGER' ? '/manager/pt-board' : role === 'RECEPTIONIST' ? '/receptionist/calendar' : '/member'} className="text-sm font-semibold text-primary">Quay lại lịch tập</Link>}>
      <Loadable state={state}>
        {(s) => (
          <Panel title={s.bookingCode}>
            <p>
              {s.memberName} · Coach {s.coachName}
            </p>
            <p>
              {formatDateTime(s.startsAt)} – {formatDateTime(s.endsAt)}
            </p>
            <Status value={s.status} />{role === 'MANAGER' && <details><summary className="cursor-pointer font-semibold">Xử lý gián đoạn buổi này</summary><DisruptionPanel initialPurchaseId={s.purchaseId} bookingId={s.id} from={new Date(Date.parse(s.startsAt) + 7 * 3600000).toISOString().slice(0,16)} to={new Date(Date.parse(s.endsAt) + 7 * 3600000).toISOString().slice(0,16)} supportRequestId={params.get('ticketId') ?? undefined} /></details>}
            {role === 'COACH' ? (
              <>
                <SessionTable sessions={[s]} onChanged={() => void state.reload()} />
                <Link className="text-primary underline" to={`/coach/sessions/${s.id}`}>
                  Mở buổi dạy và đánh giá cuối buổi
                </Link>
              </>
            ) : (
              <Notice>
                Buổi tập thuộc gói{' '}
                <Link className="underline" to={`/pt-purchases/${s.purchaseId}`}>
                  {s.purchase?.purchaseCode}
                </Link>
                . Mở gói để xem số buổi và thông tin lịch tập.
              </Notice>
            )}
          </Panel>
        )}
      </Loadable>
    </Page>
  )
}

interface PurchaseDetail {
  seriesMode?: boolean
  expectedCompletionAt?: string | null
  autoRescheduleCount?: number
  id: string
  purchaseCode: string
  packageNameSnapshot: string
  coachNameSnapshot: string
  status: string
  priceSnapshot: string
  totalCredits: number
  reservedCredits: number
  consumedCredits: number
  availableCredits: number
  activationDeadline: string | null
  expiresAt: string | null
}
export function LinkedPurchasePage() {
  const { id = '' } = useParams()
  const { role } = useAuth()
  const [params] = useSearchParams()
  const state = useLoad(() => hybridGet<PurchaseDetail>(`/pt-package-purchases/${id}`), [id], !!id)
  return (
    <Page title="Chi tiết gói PT" actions={<Link className="text-sm font-semibold text-primary hover:underline" to={role === 'COACH' ? '/coach/packages?view=sold' : role === 'MANAGER' ? '/manager/members' : role === 'RECEPTIONIST' ? '/receptionist/members' : '/member'}>Quay lại danh sách gói</Link>}>
      <Loadable state={state}>
        {(p) => (
          <Panel title={p.packageNameSnapshot}>
            {(role === 'MANAGER' || (p.status === 'PAUSED' && ['MEMBER','COACH'].includes(role ?? ''))) && <PurchaseLifecycle id={id} status={p.status} onChanged={() => void state.reload()} />}
            <p>Mã gói: {p.purchaseCode} · Coach: {p.coachNameSnapshot}</p>
            <Status value={p.status} />{p.seriesMode && <p>Dự kiến hoàn thành: {p.expectedCompletionAt ? formatDateTime(p.expectedCompletionAt) : 'Chờ xếp lịch'} · Đã tự dời: {p.autoRescheduleCount ?? 0} lần</p>}
            <p>{money(p.priceSnapshot)}</p>
            <p>
              Đã xếp lịch {p.reservedCredits} buổi · Đã tính vào gói {p.consumedCredits} buổi · {p.availableCredits} buổi chưa có lịch.
            </p>
            {role === 'MEMBER' && p.status === 'PENDING_PAYMENT' && <MemberPurchasePayment purchaseId={id} />}
            {role === 'MEMBER' && <MemberProposals purchaseId={id} available={p.availableCredits} onChanged={() => void state.reload()} />}
            {['MEMBER','RECEPTIONIST'].includes(role ?? '') && ['ACTIVE','PAUSED','COMPLETED'].includes(p.status) && <Link className="inline-flex min-h-11 items-center font-semibold underline" to={(role === 'MEMBER' ? '/member' : '/receptionist') + '/pt-sale?renewFrom=' + id}>Mua tiếp với Coach này</Link>}
            {role === 'MANAGER' && <details><summary className="cursor-pointer font-semibold">Gián đoạn hoặc hoàn phần chưa dùng</summary><DisruptionPanel initialPurchaseId={id} supportRequestId={params.get('ticketId') ?? undefined} /><RefundsPanel initialPurchaseId={id} /></details>}
            {!p.seriesMode && p.activationDeadline && (
              <p>Hạn đặt buổi đầu: {formatDateTime(p.activationDeadline)}</p>
            )}
            {!p.seriesMode && p.expiresAt && <p>Hạn sử dụng: {formatDateTime(p.expiresAt)}</p>}
            {p.seriesMode && <p className="text-sm text-text-muted">Coach điều phối các thay đổi lịch. Ngày hoàn thành dự kiến không phải hạn mất buổi.</p>}
            {role === 'COACH' && (
              <div className="flex flex-wrap gap-3">
                <Link className="text-primary underline" to={`/coach/library?tab=packages&purchaseId=${id}`}>Xem chương trình của gói</Link>
                {p.availableCredits > 0 && <Link className="text-primary underline" to={`/coach/schedule?tab=changes&tool=SCHEDULE_PENDING&purchaseId=${id}`}>Xếp lịch buổi chờ</Link>}
              </div>
            )}
          </Panel>
        )}
      </Loadable>
    </Page>
  )
}
