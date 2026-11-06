import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Hourglass, PauseCircle } from 'lucide-react'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, Segmented, Table, inputCls, td, useFlash } from '@/features/workspace/ui'

type Purchase = { id: string; purchaseCode: string; packageNameSnapshot: string; pauseNote?: string | null; pausedAt?: string | null; coachNameSnapshot?: string }
type Ops = { longPaused: Purchase[]; pendingSchedule: Purchase[]; absences: { id: string; purchase: Purchase; fromDate: string; toDate: string; note: string }[] }
type Tab = 'absences' | 'paused' | 'pending'
const dmy = (iso?: string | null) => iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—'

/**
 * Manager exceptions of the PT series (PRD §5.6): long leaves to approve, packages paused long enough to review
 * (credits are never deleted) and packages with sessions waiting for the Coach to schedule.
 */
export function OperationsPanel() {
  const state = useLoad(() => hybridGet<Ops>('/pt-operations'))
  const [tab, setTab] = useState<Tab>('absences')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const act = useSubmit()
  const { flash, node } = useFlash()
  const d = state.data
  const review = (id: string, approve: boolean) => void act.run(async () => { await hybridSend('patch', `/member-absences/${id}/review`, { approve, note: notes[id]!.trim() }); flash(approve ? 'Đã duyệt bảo lưu; gói chuyển tạm ngưng, credit giữ nguyên.' : 'Đã từ chối bảo lưu.'); await state.reload() })
  return <Card flush title="Gói PT cần xử lý" subtitle="Ngoại lệ của lịch cố định: bảo lưu dài ngày, tạm ngưng lâu, buổi chờ xếp."
    actions={<Segmented label="Loại việc" value={tab} onChange={setTab} items={[
      { key: 'absences' as const, label: 'Bảo lưu > 30 ngày', count: d?.absences.length },
      { key: 'paused' as const, label: 'Tạm ngưng cần rà soát', count: d?.longPaused.length },
      { key: 'pending' as const, label: 'Buổi chờ xếp', count: d?.pendingSchedule.length },
    ]} />}>
    {node}
    <Async state={state} rows={3}>{data => <>
      {tab === 'absences' && (data.absences.length === 0 ? <EmptyBox icon={<Hourglass className="h-5 w-5" />} title="Không có yêu cầu bảo lưu dài ngày" /> : <Table head={['Gói', 'Khoảng nghỉ', 'Lý do của học viên', 'Quyết định']} minWidth={820}>
        {data.absences.map(a => <tr key={a.id} className="align-top">
          <td className={td}><Link to={`/manager/pt-purchases/${a.purchase.id}`} className="font-semibold hover:text-primary">{a.purchase.purchaseCode}</Link><p className="text-xs text-text-muted">{a.purchase.packageNameSnapshot}</p></td>
          <td className={`${td} tabular-nums`}>{dmy(a.fromDate)} – {dmy(a.toDate)}</td>
          <td className={`${td} max-w-64`}>{a.note}</td>
          <td className={td}><div className="flex min-w-72 flex-col gap-2">
            <Field label="Ghi chú quyết định"><input className={inputCls} value={notes[a.id] ?? ''} onChange={e => setNotes({ ...notes, [a.id]: e.target.value })} placeholder="VD: Có giấy khám bệnh" /></Field>
            <div className="flex justify-end gap-2"><Btn size="sm" variant="danger" busy={act.busy} disabled={!notes[a.id]?.trim()} onClick={() => review(a.id, false)}>Từ chối</Btn><Btn size="sm" variant="primary" busy={act.busy} disabled={!notes[a.id]?.trim()} onClick={() => review(a.id, true)}>Duyệt bảo lưu</Btn></div>
          </div></td>
        </tr>)}
      </Table>)}
      {tab === 'paused' && (data.longPaused.length === 0 ? <EmptyBox icon={<PauseCircle className="h-5 w-5" />} title="Không có gói tạm ngưng quá hạn" /> : <Table head={['Gói', 'Tạm ngưng từ', 'Ghi chú', '']} minWidth={640} alignLast={false}>
        {data.longPaused.map(p => <tr key={p.id}>
          <td className={td}><Link to={`/manager/pt-purchases/${p.id}`} className="font-semibold hover:text-primary">{p.purchaseCode}</Link><p className="text-xs text-text-muted">{p.packageNameSnapshot}</p></td>
          <td className={`${td} tabular-nums`}>{dmy(p.pausedAt)}</td>
          <td className={td}>{p.pauseNote ?? '—'}</td>
          <td className={td}><Badge tone="info">Credit được giữ</Badge></td>
        </tr>)}
      </Table>)}
      {tab === 'pending' && (data.pendingSchedule.length === 0 ? <EmptyBox icon={<CalendarClock className="h-5 w-5" />} title="Không có buổi chờ xếp" /> : <Table head={['Gói', 'Coach', '']} minWidth={560} alignLast={false}>
        {data.pendingSchedule.map(p => <tr key={p.id}>
          <td className={td}><Link to={`/manager/pt-purchases/${p.id}`} className="font-semibold hover:text-primary">{p.purchaseCode}</Link><p className="text-xs text-text-muted">{p.packageNameSnapshot}</p></td>
          <td className={td}>{p.coachNameSnapshot ?? '—'}</td>
          <td className={td}><Badge tone="warning">Coach cần đề xuất lịch</Badge></td>
        </tr>)}
      </Table>)}
      <div className="px-5 pb-4"><InlineError message={act.error} /></div>
    </>}</Async>
  </Card>
}
