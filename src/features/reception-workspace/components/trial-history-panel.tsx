import { useEffect, useState } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Async, Badge, Btn, Card, EmptyBox, Pagination, inputCls } from '@/features/workspace/ui'
import { formatDateTime } from '@/shared/utils/date'
import { deskApi } from '../api'

const typeName = (type: string) => type === 'GYM' ? 'Trải nghiệm phòng gym' : 'Trải nghiệm PT'

export function TrialHistoryPanel({ onSelect }: { onSelect: (phone: string) => void }) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(query.trim()); setPage(1) }, 250); return () => window.clearTimeout(timer) }, [query])
  const history = useLoad(() => deskApi.trialHistory({ search: search || undefined, page, limit: 10 }), [search, page])
  return <Card flush title="Lịch sử khách tập thử">
    <div className="border-b border-border-subtle px-5 py-4"><input type="search" aria-label="Tìm lịch sử tập thử" placeholder="Tìm tên hoặc số điện thoại" value={query} onChange={e => setQuery(e.target.value)} className={`${inputCls} sm:max-w-80`} /></div>
    <Async state={history} rows={4} empty={data => !data.items.length && <EmptyBox title="Chưa có lịch sử phù hợp" hint="Hồ sơ được giữ lại cả khi khách đã hết thời hạn tập thử." />}>
      {data => <><ul className="divide-y divide-border-subtle px-5">{data.items.map(item => <li key={item.id} className="grid grid-cols-2 items-center gap-3 py-4 md:grid-cols-[minmax(140px,1.2fr)_minmax(120px,1fr)_minmax(150px,1.2fr)_auto]">
        <div className="min-w-0"><p className="break-words font-semibold">{item.fullName}</p><a href={`tel:${item.phone}`} className="mt-1 inline-block text-sm text-text-muted hover:text-primary">{item.phone}</a></div>
        <div className="space-y-1 text-sm"><p>{item.types.map(typeName).join(' + ')}</p><p className="text-text-muted">{item.visitCount} lượt đến tập</p></div>
        <div className="space-y-1 text-sm"><p className="text-text-muted">Lần đến gần nhất</p><p>{item.lastVisitAt ? formatDateTime(item.lastVisitAt) : 'Chưa đến tập'}</p></div>
        <div className="text-right"><Btn size="sm" onClick={() => onSelect(item.phone)}>Xem lịch sử</Btn></div>
      </li>)}</ul><Pagination page={page} pageSize={10} total={data.total} onChange={setPage} noun="khách" /></>}
    </Async>
  </Card>
}

export function TrialHistoryModal({ phone, onClose }: { phone: string; onClose: () => void }) {
  const history = useLoad(() => deskApi.trialHistoryDetail(phone), [phone])
  return <Modal isOpen title="Lịch sử tập thử" maxWidth="2xl" onClose={onClose}>
    <Async state={history} rows={3}>{data => <div className="space-y-5">
      <div className="space-y-1"><p className="text-base font-semibold">{data.fullName}</p><a href={`tel:${data.phone}`} className="inline-block text-sm text-primary underline">{data.phone}</a><p className="text-sm text-text-muted">{data.types.map(typeName).join(' + ')} · đăng ký {formatDateTime(data.createdAt)}</p><p className="text-sm">Gym: {data.startsOn ? `${data.startsOn} → hết ngày ${data.expiresOn}` : 'chưa bắt đầu 3 ngày trải nghiệm'}</p><p className="text-sm">PT: đã dùng {data.pt?.usedSessions ?? 0}/3 buổi, còn {data.pt?.remainingSessions ?? 3} buổi. Tính riêng với gym.</p></div>
      <section><h4 className="mb-3 font-semibold">Các lần đến tập ({data.visitCount})</h4>{data.visits.length ? <ul className="divide-y divide-border-subtle">{data.visits.map(visit => <li key={visit.id} className="space-y-2 py-3 text-sm"><div className="flex flex-wrap items-center gap-2"><strong>{typeName(visit.type)}</strong>{visit.coachName && <span>· {visit.coachName}</span>}{visit.archived && <Badge tone="neutral">Từ đăng ký cũ đã gộp</Badge>}</div><div className="grid gap-1 sm:grid-cols-2"><p>Vào: {formatDateTime(visit.checkedInAt)}</p><p>Ra: {visit.checkedOutAt ? formatDateTime(visit.checkedOutAt) : visit.isOpen ? 'Đang tập' : 'Không ghi nhận giờ ra'}</p></div></li>)}</ul> : <p className="text-sm text-text-muted">Chưa ghi nhận lượt vào tập.</p>}</section>
      <details className="border-t border-border-subtle pt-4"><summary className="cursor-pointer text-sm font-medium">Thông tin các đăng ký ({data.sessions.length})</summary><ul className="mt-2 divide-y divide-border-subtle">{data.sessions.map(session => <li key={session.id} className="space-y-1 py-3 text-sm"><p className="font-medium">{typeName(session.type)}{session.archived ? ' · bản cũ đã gộp' : ''}</p><p className="text-text-muted">Đăng ký: {formatDateTime(session.createdAt)}</p>{session.coachName && <p>PT: {session.coachName}</p>}{session.scheduledAt && <p>Giờ hẹn: {formatDateTime(session.scheduledAt)}</p>}{session.coachResponse && <p>Phản hồi PT: {session.coachResponse}</p>}{session.note && <p className="whitespace-pre-wrap">Ghi chú lúc đăng ký: {session.note}</p>}</li>)}</ul></details>
    </div>}</Async>
  </Modal>
}
