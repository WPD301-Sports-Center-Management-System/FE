import { Link, useParams } from 'react-router-dom'
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
  return (
    <Page title="Buổi PT từ thông báo">
      <Loadable state={state}>
        {(s) => (
          <Panel title={s.bookingCode}>
            <p>
              {s.memberName} · Coach {s.coachName}
            </p>
            <p>
              {formatDateTime(s.startsAt)} – {formatDateTime(s.endsAt)}
            </p>
            <Status value={s.status} />
            {role === 'COACH' ? (
              <>
                <SessionTable sessions={[s]} onChanged={() => void state.reload()} />
                <Link className="text-primary underline" to={`/coach/slots?sessionId=${s.id}`}>
                  Mở chi tiết trong lịch làm việc
                </Link>
              </>
            ) : (
              <Notice>
                Buổi tập thuộc gói{' '}
                <Link className="underline" to={`/pt-purchases/${s.purchaseId}`}>
                  {s.purchase?.purchaseCode}
                </Link>
                . Quyền thao tác và dữ liệu được máy chủ kiểm tra theo tài khoản.
              </Notice>
            )}
          </Panel>
        )}
      </Loadable>
    </Page>
  )
}

interface PurchaseDetail {
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
  const state = useLoad(() => hybridGet<PurchaseDetail>(`/pt-package-purchases/${id}`), [id], !!id)
  return (
    <Page title="Gói PT từ thông báo">
      <Loadable state={state}>
        {(p) => (
          <Panel title={p.packageNameSnapshot}>
            <p>
              {p.purchaseCode} · Coach {p.coachNameSnapshot}
            </p>
            <Status value={p.status} />
            <p>{money(p.priceSnapshot)}</p>
            <p>
              {p.reservedCredits} buổi đã đặt · {p.consumedCredits} đã tính · {p.availableCredits}{' '}
              còn có thể đặt.
            </p>
            {p.activationDeadline && (
              <p>Hạn đặt buổi đầu: {formatDateTime(p.activationDeadline)}</p>
            )}
            {p.expiresAt && <p>Hạn sử dụng: {formatDateTime(p.expiresAt)}</p>}
            {role === 'COACH' && (
              <Link
                className="text-primary underline"
                to={`/coach/training-plans?purchaseId=${id}`}
              >
                Xem chương trình và các buổi của gói
              </Link>
            )}
          </Panel>
        )}
      </Loadable>
    </Page>
  )
}
