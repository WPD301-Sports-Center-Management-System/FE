import { useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, PageHeader, Pagination, inputCls, textareaCls, useFlash } from '@/features/workspace/ui'
import { centerDate, formatDateTime } from '@/shared/utils/date'
import { deskApi, type TrialSession, type TrialRequest } from '../api'
import { useDeskShell } from '../shell'
import { TrialRegistrationForm, type TrialRegistrationSeed } from './trial-registration-form'
import { TrialPTArrangement } from './trial-pt-arrangement'
import { oppositeTrialType, trialEnded, trialNextAction } from './trial-session-state'
import { TrialHistoryModal, TrialHistoryPanel } from './trial-history-panel'

type Update = Parameters<typeof deskApi.updateTrialSession>[1]
type View = 'sessions' | 'online' | 'history'
type Filter = 'all' | 'waiting' | 'inside' | 'closed'

export function TrialSessionsPanel() {
  const sessions = useLoad(() => deskApi.trialSessions(), [])
  const leads = useLoad(() => deskApi.trials(), [])
  const { refresh } = useDeskShell()
  const { node, flash } = useFlash()
  const [view, setView] = useState<View>('sessions')
  const [filter, setFilter] = useState<Filter>('waiting')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [registration, setRegistration] = useState<TrialRegistrationSeed | null>(null)
  const [active, setActive] = useState<TrialSession | null>(null)
  const [lead, setLead] = useState<TrialRequest | null>(null)
  const [historyPhone, setHistoryPhone] = useState<string | null>(null)
  const [today, setToday] = useState(centerDate())
  useEffect(() => { const timer = window.setInterval(() => setToday(centerDate()), 30_000); return () => window.clearInterval(timer) }, [])
  const isClosed = (s: TrialSession) => trialEnded(s, today)
  const list = sessions.data ?? []
  const term = query.trim().toLocaleLowerCase('vi')
  const counts = { all: list.length, waiting: list.filter(s => !isClosed(s) && s.status !== 'CHECKED_IN').length, inside: list.filter(s => s.status === 'CHECKED_IN').length, closed: list.filter(isClosed).length }
  const rows = list.filter(s => (filter === 'all' || filter === 'waiting' && !isClosed(s) && s.status !== 'CHECKED_IN' || filter === 'inside' && s.status === 'CHECKED_IN' || filter === 'closed' && isClosed(s)) && `${s.fullName} ${s.phone} ${s.coachName ?? ''}`.toLocaleLowerCase('vi').includes(term))
  const online = (leads.data ?? []).filter(t => `${t.fullName} ${t.phone}`.toLocaleLowerCase('vi').includes(term))
  const newLeads = (leads.data ?? []).filter(t => t.status === 'NEW').length
  const reload = () => { void sessions.reload(); void leads.reload(); refresh() }
  const receive = (t: TrialRequest) => { setLead(null); setRegistration({ id: t.id, fullName: t.fullName, phone: t.phone, coachId: t.coachId }) }
  const openExperience = (s: TrialSession) => {
    const mode = oppositeTrialType(s, today)
    if (mode) setRegistration({ fullName: s.fullName, phone: s.phone, mode })
  }
  return <div>
    {node}
    <PageHeader title="Đăng ký tập thử" subtitle="Tiếp nhận khách, chốt lịch PT và điểm danh." actions={<Btn variant="primary" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setRegistration({})}>Đăng ký khách</Btn>} />
    <nav aria-label="Nội dung tập thử" className="mb-5 flex gap-6 border-b border-border-subtle">
      {([{ key: 'sessions', label: 'Buổi tập thử' }, { key: 'online', label: 'Khách online' }, { key: 'history', label: 'Lịch sử' }] as const).map(tab => <button key={tab.key} type="button" aria-current={view === tab.key ? 'page' : undefined} onClick={() => { setView(tab.key); setQuery(''); setPage(1) }} className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 text-sm font-medium ${view === tab.key ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{tab.label}{tab.key === 'online' && newLeads > 0 && <Badge tone="warning">{newLeads}</Badge>}</button>)}
    </nav>
    {view === 'history' ? <TrialHistoryPanel onSelect={setHistoryPhone} /> : <Card flush title={view === 'sessions' ? 'Danh sách buổi thử' : 'Đăng ký từ website'} actions={<Btn size="sm" variant="ghost" aria-label="Làm mới danh sách tập thử" icon={<RefreshCw className="h-4 w-4" aria-hidden />} onClick={reload}>Làm mới</Btn>}>
      <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <input aria-label="Tìm khách tập thử" type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder="Tìm tên hoặc số điện thoại" className={`${inputCls} sm:max-w-80`} />
        {view === 'sessions' ? <select aria-label="Lọc buổi tập thử" value={filter} onChange={e => { setFilter(e.target.value as Filter); setPage(1) }} className={`${inputCls} sm:max-w-56`}><option value="waiting">Còn hạn / chờ xử lý ({counts.waiting})</option><option value="inside">Đang tập ({counts.inside})</option><option value="closed">Hết hạn / đã đóng ({counts.closed})</option><option value="all">Tất cả ({counts.all})</option></select> : <p className="text-sm text-text-muted">{online.length} đăng ký · tiếp nhận khi khách đến</p>}
      </div>
      {view === 'sessions' ? <Async state={sessions} rows={4} empty={() => !rows.length && <EmptyBox title={query ? 'Không tìm thấy khách' : 'Không có buổi thử trong mục này'} hint="Đăng ký khách mới hoặc chọn trạng thái khác để xem." />}>
        {() => <><ul className="divide-y divide-border-subtle px-5 xl:grid xl:grid-cols-[minmax(130px,1.1fr)_minmax(120px,0.9fr)_minmax(170px,1.1fr)_auto] xl:gap-x-3">{rows.slice((page - 1) * 10, page * 10).map(s => <li key={s.id} className="grid grid-cols-2 gap-3 py-4 xl:col-span-4 xl:grid-cols-subgrid xl:items-center">
          <div className="min-w-0"><button type="button" aria-label={`Xem lịch sử ${s.fullName}`} onClick={() => setHistoryPhone(s.phone)} className="break-words text-left font-semibold hover:underline focus-visible:outline-primary">{s.fullName}</button><a href={`tel:${s.phone}`} className="mt-1 block text-sm text-text-muted hover:text-primary">{s.phone}</a></div>
          <div className="text-sm"><p>{s.type === 'PT' ? 'Trải nghiệm PT' : 'Trải nghiệm phòng gym'}</p>{s.type === 'PT' && <><p className="mt-1 text-text-muted">{s.coachName || 'Chưa chọn PT'}</p><p className="mt-1 text-xs text-text-muted">Đã dùng {s.trial?.pt?.usedSessions ?? 0}/{s.trial?.pt?.totalSessions ?? 3} buổi PT</p></>}</div>
          <div className="col-span-2 min-w-0 space-y-1.5 xl:col-span-1"><Badge tone={s.status === 'CHECKED_IN' ? 'info' : s.status === 'REQUESTED' ? 'warning' : 'neutral'}>{s.status !== 'CHECKED_IN' && s.type === 'PT' && s.trial?.pt?.remainingSessions === 0 ? 'Đã dùng đủ 3 buổi PT' : s.status !== 'CHECKED_IN' && s.type === 'GYM' && s.trial?.expiresOn && s.trial.expiresOn < today ? 'Hết hạn gym' : sessionLabel(s)}</Badge><p className="text-sm text-text-muted">{s.status === 'COMPLETED' && s.checkedOutAt ? `Checkout ${formatDateTime(s.checkedOutAt)}` : s.scheduledAt ? formatDateTime(s.scheduledAt) : 'Chưa chốt giờ'}</p>{s.type === 'GYM' && s.trial?.expiresOn && <p className="text-xs text-text-muted">Gym đến hết {s.trial.expiresOn}</p>}</div>
          <div className="col-span-2 flex flex-wrap items-center gap-2 xl:col-span-1 xl:justify-end">{trialNextAction(s, today) ? <Btn size="sm" variant={s.status === 'REQUESTED' ? 'soft' : 'outline'} onClick={() => setActive(s)}>{trialNextAction(s, today)}</Btn> : <span className="text-sm text-text-muted">Đã kết thúc</span>}{oppositeTrialType(s, today) && <Btn size="sm" variant="outline" onClick={() => openExperience(s)}>{s.type === 'GYM' ? 'Đăng ký trải nghiệm PT' : 'Trải nghiệm thêm'}</Btn>}</div>
        </li>)}</ul><Pagination page={page} pageSize={10} total={rows.length} onChange={setPage} noun="buổi thử" /></>}
      </Async> : <Async state={leads} rows={4} empty={() => !online.length && <EmptyBox title="Chưa có khách đăng ký online" />}>
        {() => <><ul className="divide-y divide-border-subtle px-5">{online.slice((page - 1) * 10, page * 10).map(t => <li key={t.id} className="flex flex-wrap items-center gap-4 py-4"><div className="min-w-0 flex-1"><p className="font-semibold">{t.fullName}</p><p className="mt-1 text-sm text-text-muted">{t.phone}{t.interest ? ` · ${t.interest}` : ''}</p></div><Badge tone={t.status === 'NEW' ? 'warning' : 'neutral'}>{({ NEW: 'Chưa liên hệ', CONTACTED: 'Đã liên hệ', CONVERTED: 'Đã thành hội viên', CLOSED: 'Đã đóng' })[t.status]}</Badge><Btn size="sm" onClick={() => setLead(t)}>Xem đăng ký</Btn>{!['CLOSED', 'CONVERTED'].includes(t.status) && <Btn size="sm" variant="soft" onClick={() => receive(t)}>Tiếp nhận</Btn>}</li>)}</ul><Pagination page={page} pageSize={10} total={online.length} onChange={setPage} noun="đăng ký" /></>}
      </Async>}
    </Card>}
    {registration && <Modal isOpen title="Đăng ký khách tập thử" maxWidth="2xl" onClose={() => setRegistration(null)}><TrialRegistrationForm seed={registration} onClose={() => setRegistration(null)} onDone={message => { setRegistration(null); setView('sessions'); setFilter('waiting'); setQuery(''); setPage(1); flash(message); reload() }} /></Modal>}
    {active && <TrialAction session={active} onClose={() => setActive(null)} onDone={effect => { if (effect === 'out') setFilter('waiting'); else if (effect === 'in') setFilter('inside'); setActive(null); reload() }} />}
    {lead && <OnlineTrialDetail trial={lead} onClose={() => setLead(null)} onReceive={() => receive(lead)} onDone={() => { setLead(null); reload() }} />}
    {historyPhone && <TrialHistoryModal phone={historyPhone} onClose={() => setHistoryPhone(null)} />}
  </div>
}

function OnlineTrialDetail({ trial: t, onClose, onReceive, onDone }: { trial: TrialRequest; onClose: () => void; onReceive: () => void; onDone: () => void }) {
  const submit = useSubmit()
  const [note, setNote] = useState(t.staffNote ?? '')
  return <Modal isOpen title={t.fullName} onClose={onClose}><div className="space-y-4"><a href={`tel:${t.phone}`} className="inline-block text-primary underline">{t.phone}</a><dl className="space-y-2 text-sm">{[['Quan tâm', t.interest], ['Mục tiêu', t.goal], ['Giờ mong muốn', t.preferredTime], ['PT khách chọn', t.coachName], ['Lời nhắn', t.note], ['Ngày đăng ký', formatDateTime(t.createdAt)]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-text-muted">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap">{value}</dd></div>)}</dl><Field label="Ghi chú liên hệ"><textarea rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} /></Field><InlineError message={submit.error} /><div className="flex flex-wrap justify-end gap-2">{!['CLOSED', 'CONVERTED'].includes(t.status) && <><Btn busy={submit.busy} onClick={async () => { if (await submit.run(() => deskApi.updateTrial(t.id, { status: 'CONTACTED', staffNote: note.trim() || undefined }))) onDone() }}>Lưu đã liên hệ</Btn><Btn variant="primary" onClick={onReceive}>Tiếp nhận tập thử</Btn></>}</div></div></Modal>
}

function sessionLabel(s: TrialSession) {
  if (s.status === 'REQUESTED') return s.coachDecision === 'DECLINED' ? 'PT từ chối' : s.coachDecision === 'ACCEPTED' ? 'Chờ chốt giờ' : 'Chờ PT phản hồi'
  return ({ SCHEDULED: 'Đã lên lịch', CHECKED_IN: 'Đang tập', COMPLETED: 'Đã checkout', NO_SHOW: 'Không đến', CANCELLED: 'Đã hủy', CONVERTED: 'Đã chuyển đổi' })[s.status]
}

function TrialAction({ session: s, onClose, onDone }: { session: TrialSession; onClose: () => void; onDone: (effect?: 'in' | 'out') => void }) {
  const submit = useSubmit()
  const allowance = useLoad(() => deskApi.trialAllowance(s.phone), [s.phone])
  const update = async (body: Update) => { if (await submit.run(() => deskApi.updateTrialSession(s.id, body))) onDone() }
  return <Modal isOpen title={s.status === 'COMPLETED' ? s.type === 'PT' ? 'Xếp buổi PT tiếp' : 'Khách quay lại tập' : sessionLabel(s)} onClose={onClose}><div className="space-y-4">
    <p className="font-semibold">{s.fullName} · <a href={`tel:${s.phone}`} className="underline">{s.phone}</a>{s.coachName ? ` · PT ${s.coachName}` : ''}</p>
    {s.coachResponse && <p className="rounded-lg bg-bg-surface-muted p-3 text-sm">Phản hồi PT: {s.coachResponse}</p>}
    {s.note && <details className="text-sm"><summary className="cursor-pointer text-text-muted">Ghi chú buổi thử</summary><p className="mt-2 whitespace-pre-wrap">{s.note}</p></details>}
    {s.type === 'PT' && ['REQUESTED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(s.status) && <Async state={allowance} rows={1}>{data => <><p className="text-sm">PT: đã dùng {data.pt?.usedSessions ?? 0}/3 buổi, còn {data.pt?.remainingSessions ?? 3} buổi. Không phụ thuộc hạn trải nghiệm gym.</p>{data.pt?.canCheckIn !== false ? <TrialPTArrangement session={s} busy={submit.busy} onSave={update} /> : <p className="text-sm">Khách đã dùng đủ 3 buổi trải nghiệm PT.</p>}</>}</Async>}
    {(s.status === 'SCHEDULED' || s.status === 'COMPLETED' && s.type === 'GYM') && <Async state={allowance} rows={1}>{data => {
      const gym = data.gym ?? data
      const canCheckIn = s.type === 'PT' ? data.pt?.canCheckIn !== false : gym.canCheckIn
      return <><p className="text-sm">{s.type === 'PT' ? `PT: còn ${data.pt?.remainingSessions ?? 3}/3 buổi. Không phụ thuộc hạn gym.` : gym.startsOn ? `Gym: ${gym.startsOn} → hết ngày ${gym.expiresOn}. ${gym.canCheckIn ? 'Khách còn hạn trải nghiệm.' : 'Đã hết hạn trải nghiệm gym.'}` : 'Gym: 3 ngày liên tiếp bắt đầu từ lần check-in này.'}</p>{s.type === 'PT' && s.scheduledAt && centerDate(s.scheduledAt) !== centerDate() && <p className="text-sm">Buổi PT hẹn ngày {centerDate(s.scheduledAt)}. Check-in đúng ngày hẹn.</p>}<Btn variant="primary" busy={submit.busy} disabled={!canCheckIn || s.type === 'PT' && !!s.scheduledAt && centerDate(s.scheduledAt) !== centerDate()} onClick={async () => { if (await submit.run(() => deskApi.checkInTrialSession(s.id))) onDone('in') }}>Check-in khách</Btn></>
    }}</Async>}
    {s.status === 'CHECKED_IN' && <Btn variant="primary" busy={submit.busy} onClick={async () => { if (await submit.run(() => deskApi.checkOutTrialSession(s.id))) onDone('out') }}>Xác nhận checkout</Btn>}
    {s.status !== 'CHECKED_IN' && s.status !== 'COMPLETED' && <Btn busy={submit.busy} onClick={() => void update({ status: 'CANCELLED' })}>Hủy đăng ký</Btn>}
    <InlineError message={submit.error} />
  </div></Modal>
}
