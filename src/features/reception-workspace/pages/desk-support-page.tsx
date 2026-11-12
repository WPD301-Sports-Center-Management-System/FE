import { SupportLinks } from '../components/support-links'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock3, Inbox, LifeBuoy, MessageSquareReply, RotateCcw, Timer } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useAuth } from '@/features/auth/context/auth-context'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, PageHeader, Pagination, Person, Segmented, StatTile, Table, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { hhmm, minutesBetween, mondayOf, relativeAgo } from '@/features/workspace/utils'
import { deskApi, type SupportRequest, type SupportStatus } from '../api'
import { useDeskShell } from '../shell'
import { dmy, SUPPORT_CATEGORY, SUPPORT_LABEL } from '../labels'

const PAGE = 10
type Tab = 'open' | SupportStatus | 'all'

export function DeskSupportPage() {
  const base = useAuth().role === 'MANAGER' ? '/manager' : '/receptionist'
  const { refresh } = useDeskShell()
  const { flash, node } = useFlash()
  const tickets = useLoad(() => deskApi.support(), [])
  const [tab, setTab] = useState<Tab>('open')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<SupportRequest | null>(null)
  const all = tickets.data ?? []
  const test = (t: SupportRequest) => tab === 'all' || (tab === 'open' ? t.status === 'OPEN' || t.status === 'IN_PROGRESS' : t.status === tab)
  const rows = all.filter(test)
  const week = mondayOf(centerDate())
  const answered = all.filter(t => t.respondedAt)
  const avg = answered.length ? Math.round(answered.reduce((n, t) => n + minutesBetween(t.createdAt, t.respondedAt!), 0) / answered.length) : null
  const done = (m: string) => { flash(m); setOpen(null); void tickets.reload(); refresh() }

  return <div>
    {node}
    <PageHeader title="Hỗ trợ hội viên" />
    <p className="mb-2 text-sm text-text-muted">Số liệu từ tối đa 300 yêu cầu đã tải</p>
    <div className="mb-6 grid grid-cols-2 rounded-xl border border-border-subtle bg-bg-surface xl:grid-cols-4 [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-4">
      <StatTile label="Yêu cầu mới" icon={<Inbox className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={tickets.data ? all.filter(t => t.status === 'OPEN').length : '—'} hint="Chưa ai nhận xử lý" />
      <StatTile label="Đang xử lý" icon={<Clock3 className="h-[18px] w-[18px]" />} iconTone="info" value={tickets.data ? all.filter(t => t.status === 'IN_PROGRESS').length : '—'} />
      <StatTile label="Giải quyết tuần này" icon={<CheckCircle2 className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={tickets.data ? all.filter(t => (t.status === 'RESOLVED' || t.status === 'CLOSED') && centerDate(t.updatedAt) >= week).length : '—'} />
      <StatTile label="Thời gian phản hồi TB" icon={<Timer className="h-[18px] w-[18px]" />} iconTone="violet" value={avg === null ? '—' : avg >= 60 ? `${Math.round(avg / 6) / 10}` : avg} unit={avg === null ? undefined : avg >= 60 ? 'giờ' : 'phút'} hint={answered.length ? `Trên ${answered.length} yêu cầu đã phản hồi` : undefined} />
    </div>
    <Card flush title="Hộp thư hỗ trợ" actions={<Segmented label="Lọc yêu cầu" value={tab} onChange={t => { setTab(t); setPage(1) }} items={[
      { key: 'open' as Tab, label: 'Cần xử lý', count: all.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length },
      { key: 'RESOLVED' as Tab, label: 'Đã giải quyết', count: all.filter(t => t.status === 'RESOLVED').length },
      { key: 'CLOSED' as Tab, label: 'Đã đóng', count: all.filter(t => t.status === 'CLOSED').length },
      { key: 'all' as Tab, label: 'Tất cả', count: all.length }]} />}>
      <Async state={tickets} rows={6} empty={() => !rows.length && <EmptyBox icon={<LifeBuoy className="h-5 w-5" />} title={tab === 'open' ? 'Không có yêu cầu cần xử lý' : 'Không có yêu cầu'} />}>
        {() => <><Table head={['Mã', 'Hội viên', 'Nội dung', 'Loại', 'Gửi lúc', 'Trạng thái', '']} minWidth={980}>
          {rows.slice((page - 1) * PAGE, page * PAGE).map(t => <tr key={t.id} className="align-top hover:bg-bg-surface-muted/40">
            <td className={`${td} font-semibold`}>{t.requestCode}</td>
            <td className={td}><Link to={`${base}/members/${t.memberId}`} className="flex items-center gap-2 hover:text-primary"><Person name={t.memberName} size={30} /><span className="whitespace-nowrap font-medium">{t.memberName ?? '—'}</span></Link></td>
            <td className={`${td} max-w-80`}><p className="font-medium">{t.subject}</p><p className="line-clamp-2 text-xs text-text-muted">{t.message}</p></td>
            <td className={td}><Badge>{SUPPORT_CATEGORY[t.category] ?? t.category}</Badge></td>
            <td className={`${td} tabular-nums`}>{hhmm(t.createdAt)}<p className="text-xs text-text-muted">{relativeAgo(t.createdAt) === 'hôm nay' ? 'hôm nay' : dmy(t.createdAt)}</p></td>
            <td className={td}><Badge tone={SUPPORT_LABEL[t.status].tone}>{SUPPORT_LABEL[t.status].label}</Badge></td>
            <td className={`${td} text-right`}><Btn size="sm" variant={t.status === 'OPEN' || t.status === 'IN_PROGRESS' ? 'soft' : 'outline'} icon={<MessageSquareReply aria-hidden className="h-3.5 w-3.5" />} onClick={() => setOpen(t)}>{base === '/manager' ? 'Xem & xử lý' : t.status === 'OPEN' || t.status === 'IN_PROGRESS' ? 'Phản hồi' : 'Xem'}</Btn></td>
          </tr>)}
        </Table><Pagination page={page} pageSize={PAGE} total={rows.length} onChange={setPage} noun="yêu cầu" /></>}
      </Async>
    </Card>
    {open && <TicketModal t={open} onClose={() => setOpen(null)} onDone={done} />}
  </div>
}

function TicketModal({ t, onClose, onDone }: { t: SupportRequest; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const readOnly = useAuth().role === 'MANAGER'
  const closed = t.status === 'RESOLVED' || t.status === 'CLOSED'
  const [status, setStatus] = useState<SupportStatus>(t.status === 'OPEN' ? 'IN_PROGRESS' : t.status)
  const [response, setResponse] = useState(t.response ?? '')
  const [blocked, setBlocked] = useState(true)
  return <Modal isOpen onClose={onClose} maxWidth="xl" title={`${t.requestCode} · ${t.subject}`} description={`${t.memberName ?? ''} · ${SUPPORT_CATEGORY[t.category] ?? t.category} · gửi ${dmy(t.createdAt)} ${hhmm(t.createdAt)}`}>
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm font-semibold"><Link className="underline" to={(readOnly ? '/manager' : '/receptionist') + '/members/' + t.memberId + '?ticketId=' + t.id}>Mở hồ sơ học viên</Link>{t.ptPurchaseId && <Link className="underline" to={(readOnly ? '/manager' : '/receptionist') + '/pt-purchases/' + t.ptPurchaseId + '?ticketId=' + t.id}>Mở gói liên quan</Link>}{t.bookingId && <Link className="underline" to={'/pt-sessions/' + t.bookingId + '?ticketId=' + t.id}>Mở buổi liên quan</Link>}</div>
      <p className="whitespace-pre-line rounded-lg bg-bg-surface-muted p-3 text-sm">{t.message}</p>
      <SupportLinks ticketId={t.id} manager={readOnly} onBlockedChange={setBlocked} />
      {t.attachmentUrls.length > 0 && <div className="flex flex-wrap gap-2">{t.attachmentUrls.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border-subtle"><img src={u} alt={`Ảnh đính kèm ${i + 1}`} className="h-24 w-24 object-cover" /></a>)}</div>}
      {t.response && <div className="rounded-lg border border-border-subtle p-3 text-sm"><p className="text-xs font-semibold text-text-muted">Phản hồi trước{t.respondedAt ? ` · ${dmy(t.respondedAt)} ${hhmm(t.respondedAt)}` : ''}</p><p className="mt-1 whitespace-pre-line">{t.response}</p></div>}
      {readOnly ? null : closed ? <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
        <span className="text-sm text-text-muted">Yêu cầu đã {SUPPORT_LABEL[t.status].label.toLowerCase()}.</span>
        <div className="flex gap-2"><Btn onClick={onClose}>Đóng</Btn><Btn variant="soft" busy={submit.busy} icon={<RotateCcw aria-hidden className="h-4 w-4" />} onClick={async () => { if (await submit.run(() => deskApi.reopenSupport(t.id))) onDone('Đã mở lại yêu cầu.') }}>Mở lại</Btn></div>
        <div className="basis-full"><InlineError message={submit.error} /></div>
      </div> : <form className="space-y-4 border-t border-border-subtle pt-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => deskApi.updateSupport(t.id, { status, response: response.trim() || undefined }))) onDone('Đã cập nhật yêu cầu và báo cho hội viên.') }}>
        <Field label="Phản hồi cho hội viên" hint="Hội viên nhận nội dung này qua thông báo trong app."><textarea rows={4} value={response} onChange={e => setResponse(e.target.value)} className={textareaCls} /></Field>
        <fieldset><legend className="mb-1.5 text-sm font-medium">Chuyển trạng thái</legend>
          {blocked && <p className="mb-2 text-sm text-text-muted">Chỉ giải quyết hoặc đóng sau khi kiểm tra kết quả, tiền hoàn đã chuyển và hồ sơ gián đoạn đã xử lý. Bạn vẫn có thể gửi phản hồi đang xử lý.</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(SUPPORT_LABEL) as SupportStatus[]).map(k => <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${status === k ? 'border-primary bg-primary/5 font-semibold' : 'border-border-subtle'}`}>
            <input type="radio" name="support-status" checked={status === k} disabled={blocked && ['RESOLVED', 'CLOSED'].includes(k)} onChange={() => setStatus(k)} className="accent-[var(--primary)]" />{SUPPORT_LABEL[k].label}</label>)}</div>
        </fieldset>
        <InlineError message={submit.error} />
        <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={['RESOLVED', 'CLOSED'].includes(status) && (blocked || (!response.trim() && !t.response))}>Lưu & gửi</Btn></div>
      </form>}
    </div>
  </Modal>
}
