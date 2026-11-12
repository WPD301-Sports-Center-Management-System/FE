import { useState } from 'react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { fixedPtApi } from '../api'
import { useLoad } from '../hooks'
import { WithdrawalsPanel } from './wallet-page'
import { Async, Badge, Card, EmptyBox, PageHeader, inputCls } from '@/features/workspace/ui'
import { fmtMoney } from '@/features/workspace/utils'
import { formatDateTime } from '@/shared/utils/date'
export function ManagerLedgerPage() {
  const [coachId, setCoach] = useState('')
  const coaches = useLoad(async () => (await coachesService.getCoaches({ limit: 100 })).data ?? [])
  const lines = useLoad(() => fixedPtApi.earnings({ coachId: coachId || undefined, limit: 100 }), [coachId])
  return <div className="space-y-5"><PageHeader title="Chi trả Coach" actions={<label><span className="sr-only">Lọc Coach</span><select className={inputCls} value={coachId} onChange={e => setCoach(e.target.value)}><option value="">Tất cả Coach</option>{coaches.data?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></label>} />
    <WithdrawalsPanel coachId={coachId || undefined} onChanged={() => void lines.reload()} /><Card title="Thu nhập theo buổi"><Async state={lines} rows={4}>{rows => !rows.length ? <EmptyBox title="Chưa có thu nhập theo buổi" /> : <ul className="divide-y divide-border-subtle">{rows.map(l => <li key={l.id} className="flex flex-wrap justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="font-medium">{l.coach?.user.fullName ?? 'Coach'} · {l.purchase?.member?.user?.fullName ?? 'Dữ liệu lịch sử'}</p><p className="mt-1 text-sm text-text-muted">{l.booking?.plannedStartsAt ? formatDateTime(l.booking.plannedStartsAt) : 'Điều chỉnh kết quả'} · {l.purchase?.purchaseCode ?? '—'} · buổi {l.credit?.creditIndex ?? '—'}</p></div><div className="flex items-center gap-3"><span className="tabular-nums">{fmtMoney(l.amount)}</span><Badge tone={l.effective ? 'success' : 'neutral'}>{l.effective ? 'Đã ghi nhận' : 'Đã đảo kết quả'}</Badge></div></li>)}</ul>}</Async></Card>
  </div>
}
