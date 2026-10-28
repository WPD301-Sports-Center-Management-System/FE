import { useState } from 'react'
import { CheckCircle2, Hourglass, Landmark, Wallet } from 'lucide-react'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { StatCard } from '@/shared/components/ui/stat-card'
import { fixedPtApi } from '../api'
import { useLoad } from '../hooks'
import { Loadable, money, Notice, Page, Panel, Status, Table, td, label, inputCls } from '../components/ui'

// Coach: internal reconciliation of what each session earned and what was paid by period.
// This is not a wallet: there is no balance to withdraw; transfers happen outside the system.
export function CoachEarningsPage() {
  const summary = useLoad(() => fixedPtApi.myEarningSummary(), [])
  const [status, setStatus] = useState('')
  const lines = useLoad(() => fixedPtApi.myEarnings({ status: status || undefined, limit: 100 }), [status])
  const periods = useLoad(() => fixedPtApi.myPeriods(), [])
  const s = summary.data; const amount = (key: string) => s?.byStatus[key]?.amount ?? 0
  return (
    <Page title="Thu nhập và đối soát" subtitle="Khoản của bạn phát sinh theo từng buổi đủ điều kiện và được chi theo kỳ bên ngoài hệ thống.">
      <Notice>Ngân sách 60% của gói chỉ là phân bổ nội bộ; buổi chưa phục vụ chưa phải khoản được nhận. Không có số dư để rút.</Notice>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CheckCircle2 className="h-5 w-5" aria-hidden />} title="Đủ điều kiện, chưa chi" value={money(amount('ELIGIBLE') + amount('INCLUDED'))} />
        <StatCard icon={<Hourglass className="h-5 w-5" aria-hidden />} title="Chờ xác nhận / tạm giữ" value={money(amount('PENDING_CONFIRMATION') + amount('ON_HOLD'))} />
        <StatCard icon={<Landmark className="h-5 w-5" aria-hidden />} title="Đã chi theo kỳ" value={money(s?.paidOut)} />
        <StatCard icon={<Wallet className="h-5 w-5" aria-hidden />} title="Khoản ứng chưa đối trừ" value={money(s?.advanceRemaining)} />
      </div>
      {s && s.recoveryOutstanding > 0 && <Notice tone="warning">Khoản thu hồi/bù trừ còn lại: {money(s.recoveryOutstanding)} (chỉ được trừ khi Manager xác nhận chi kỳ).</Notice>}
      <Panel title="Dòng thu nhập theo buổi" actions={<select aria-label="Lọc" className={inputCls} value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{['PENDING_CONFIRMATION', 'ELIGIBLE', 'ON_HOLD', 'INCLUDED', 'PAID', 'SETTLED_BY_ADVANCE', 'VOIDED'].map(v => <option key={v} value={v}>{label(v)}</option>)}</select>}>
        <Loadable state={lines} empty="Chưa có khoản nào.">{items => (
          <Table head={['Buổi', 'Học viên / gói', 'Kết quả', 'Số tiền', 'Trạng thái']}>
            {items.map(l => <tr key={l.id}>
              <td className={td}>{formatDateTime(l.booking.plannedStartsAt)}<div className="text-xs text-text-muted">Buổi {l.credit.creditIndex}</div></td>
              <td className={td}>{l.purchase.member.user.fullName}<div className="text-xs text-text-muted">{l.purchase.packageNameSnapshot}</div></td>
              <td className={td}>{label(l.outcome)}{l.booking.outcomeReversedAt && <div className="text-xs text-text-muted">Đã đảo kết quả</div>}</td>
              <td className={td}>{money(l.amount)}</td>
              <td className={td}><Status value={l.status} />{l.holdReason && <div className="text-xs text-text-muted">{l.holdReason}</div>}</td>
            </tr>)}
          </Table>
        )}</Loadable>
      </Panel>
      <Panel title="Kỳ chi trả">
        <Loadable state={periods} empty="Chưa có kỳ chi trả.">{items => (
          <Table head={['Kỳ', 'Khoảng', 'Phải trả', 'Bù trừ', 'Thực chi', 'Trạng thái']}>
            {items.map(p => <tr key={p.id}><td className={td}>{p.code}</td><td className={td}>{formatDate(p.periodFrom)} – {formatDate(p.periodTo)}</td><td className={td}>{money(p.grossAmount)}</td><td className={td}>{money(p.offsetAmount)}</td><td className={td}>{money(p.netAmount)}</td><td className={td}><Status value={p.status} />{p.transferRef && <div className="text-xs text-text-muted">Ref {p.transferRef}</div>}</td></tr>)}
          </Table>
        )}</Loadable>
      </Panel>
    </Page>
  )
}
