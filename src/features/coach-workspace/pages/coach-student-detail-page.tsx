import { ScheduleTools } from '@/features/fixed-pt/components/schedule-tools'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Check, MessageSquareText, NotebookPen, Pencil, Phone, Play, Sparkles, Target, Utensils } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { coachWs } from '../api'
import { JourneyForPurchase } from '@/features/goal-lab/journey-pages'
import { Badge, Btn, Card, EmptyBox, ErrorBox, InlineError, LinkBtn, PageHeader, Person, ProgressBar, Skeleton, textareaCls, useFlash } from '@/features/workspace/ui'
import { isUpcoming, PURCHASE_LABEL, relativeSlot, SESSION_LABEL, SESSION_TONE } from '@/features/workspace/utils'

const dmy = (iso?: string | null) => iso ? centerDate(iso).split('-').reverse().join('/') : '—'
const age = (dob?: string | null) => { if (!dob) return null; const d = new Date(dob); const n = new Date(); return n.getFullYear() - d.getFullYear() - (n < new Date(n.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0) }

export function CoachStudentDetailPage() {
  const navigate = useNavigate()
  const { memberId = '' } = useParams()
  const { flash, node } = useFlash()
  const member = useLoad(() => coachWs.member(memberId), [memberId])
  const purchases = useLoad(async () => (await coachWs.purchases()).filter(p => p.memberId === memberId), [memberId])
  const purchaseIds = (purchases.data ?? []).filter(p => ['ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED'].includes(p.status)).map(p => p.id).join(',')
  const sessions = useLoad(async () => (await Promise.all(purchaseIds.split(',').filter(Boolean).map(id => coachWs.sessions({ purchaseId: id }, 2)))).flat(), [purchaseIds], !!purchases.data)
  const results = useLoad(() => coachWs.results(memberId), [memberId])
  const [dialog, setDialog] = useState<null | 'notes'>(null)

  if (member.error) return <ErrorBox message={member.error} onRetry={() => void member.reload()} />
  if (!member.data) return <Skeleton rows={8} />
  const m = member.data
  const list = sessions.data ?? []
  const now = Date.now()
  const done = list.filter(s => s.status === 'COMPLETED').length
  const past = list.filter(s => ['COMPLETED', 'NO_SHOW', 'CANCELLED_LATE'].includes(s.status))
  const attendance = past.length ? Math.round((done / past.length) * 100) : null
  const upcoming = list.filter(s => isUpcoming(s) && new Date(s.endsAt).getTime() > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const live = list.find(s => s.status === 'IN_PROGRESS')
  const next = live ?? upcoming[0]
  const active = (purchases.data ?? []).find(p => p.status === 'ACTIVE')
  const goalPurchases = (purchases.data ?? []).filter(p => p.status === 'ACTIVE' || p.status === 'PAUSED')
  const goalPurchase = goalPurchases.length === 1 ? goalPurchases[0] : undefined
  const facts = [m.memberCode, m.user.phone, age(m.dateOfBirth) !== null ? `${age(m.dateOfBirth)} tuổi` : null, m.gender, m.fitnessLevel ? `Trình độ: ${m.fitnessLevel}` : null, `Tham gia ${dmy(m.createdAt).slice(3)}`].filter(Boolean)

  // The package the scheduling tools act on: the active one, else a paused one (to resume it).
  const workPackage = active ?? purchases.data?.find(p => p.status === 'PAUSED')
  return <div>
    {node}
    <PageHeader title={m.user.fullName} crumbs={[{ label: 'Danh sách học viên', to: '/coach/students' }, { label: `${m.user.fullName} · ${m.memberCode}` }]} />
    <section className="mb-6 rounded-xl border border-border-subtle bg-bg-surface shadow-sm">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <Person name={m.user.fullName} src={m.user.avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold">{m.user.fullName}{active && <Badge tone="violet">{active.packageNameSnapshot}</Badge>}</h1>
          <p className="mt-1 text-sm text-text-muted">{facts.join(' · ')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.medicalNotes && <Badge tone="warning"><AlertTriangle aria-hidden className="h-3.5 w-3.5" />Có lưu ý sức khỏe</Badge>}
          </div>
        </div>
        <dl className="flex flex-wrap gap-6 text-right">
          <Stat label="Buổi hoàn thành" value={sessions.data ? String(done) : 'Đang tải'} />
          <Stat label="Chuyên cần" value={attendance === null ? 'Chưa có dữ liệu' : `${attendance}%`} />
        </dl>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border-subtle px-5 py-4">
        {next && <LinkBtn variant="primary" to={`/coach/sessions/${next.id}`} icon={<Play aria-hidden className="h-4 w-4" />}>{live ? 'Buổi đang diễn ra' : `Buổi tiếp theo (${relativeSlot(next.startsAt)})`}</LinkBtn>}
        <Btn icon={<Target aria-hidden className="h-4 w-4" />} onClick={() => navigate(`/coach/goals?memberId=${memberId}${goalPurchase ? `&purchaseId=${goalPurchase.id}` : ''}`)}>Lộ trình & tiến độ</Btn>
        {workPackage && <LinkBtn to={`/coach/library?tab=packages&purchaseId=${workPackage.id}`} icon={<NotebookPen aria-hidden className="h-4 w-4" />}>Giáo án</LinkBtn>}
        {workPackage && <LinkBtn to={`/coach/library?tab=ai&memberId=${memberId}&purchaseId=${workPackage.id}`} icon={<Sparkles aria-hidden className="h-4 w-4" />}>AI soạn giáo án</LinkBtn>}
        <LinkBtn to={`/coach/meal-plans?memberId=${memberId}`} icon={<Utensils aria-hidden className="h-4 w-4" />}>Thực đơn</LinkBtn>
        {m.user.phone && <a href={`tel:${m.user.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle px-3.5 text-sm font-semibold hover:bg-bg-surface-muted"><Phone aria-hidden className="h-4 w-4" />Gọi</a>}
      </div>
    </section>
    {workPackage && <div className="mb-6"><ScheduleTools key={workPackage.id} initialPurchaseId={workPackage.id} /></div>}

    {(workPackage ?? purchases.data?.[0]) && <div className="mb-6"><JourneyForPurchase purchaseId={(workPackage ?? purchases.data![0])!.id} coach /></div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card flush title="Lịch sử buổi tập" subtitle="Các buổi của học viên với bạn">
          {sessions.error ? <ErrorBox message={sessions.error} /> : !sessions.data ? <Skeleton rows={4} /> : !list.length ? <EmptyBox title="Chưa có buổi nào" /> :
            <ul className="divide-y divide-border-subtle">{[...upcoming.slice(0, 3), ...list.filter(s => !isUpcoming(s)).sort((a, b) => b.startsAt.localeCompare(a.startsAt)).slice(0, 7)].map(s => <SessionRow key={s.id} s={s} />)}</ul>}
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Gói & lịch">
          {!purchases.data ? <Skeleton rows={2} className="p-0" /> : !purchases.data.length ? <p className="text-sm text-text-muted">Không có gói nào với bạn.</p> :
            <ul className="space-y-4">{purchases.data.map(p => <li key={p.id}>
              <div className="flex flex-wrap gap-1.5"><Badge tone="success">{p.packageNameSnapshot}</Badge><Badge tone={p.status === 'ACTIVE' ? 'info' : 'neutral'}>{PURCHASE_LABEL[p.status] ?? p.status}</Badge>
                {p.status === 'ACTIVE' && <Badge tone="info">Còn {p.totalCredits - p.consumedCredits} buổi</Badge>}{p.expiresAt && p.status !== 'COMPLETED' && <Badge tone="warning">Hạn gói {dmy(p.expiresAt)}</Badge>}</div>
              <p className="mt-1 text-xs text-text-muted">Mã gói: {p.purchaseCode} · Tạo ngày {dmy(p.createdAt)}</p>
              <div className="mt-2 flex items-center gap-3"><ProgressBar className="flex-1" value={p.consumedCredits} max={p.totalCredits} tone="warning" /><span className="text-xs tabular-nums text-text-muted">{p.consumedCredits}/{p.totalCredits} buổi đã dùng · còn {Math.max(0, p.totalCredits - p.consumedCredits)}</span></div>
              {p.seriesMode && <p className="mt-1 text-xs text-text-muted">Dự kiến hoàn thành: {dmy(p.expectedCompletionAt)} · Tự dời: {p.autoRescheduleCount ?? 0} lần</p>}<Link to={`/coach/pt-purchases/${p.id}`} className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">Xem chi tiết gói</Link>
            </li>)}</ul>}
        </Card>
        <Card title="Ghi chú chuyên môn" actions={<Btn size="sm" variant="ghost" icon={<Pencil aria-hidden className="h-3.5 w-3.5" />} onClick={() => setDialog('notes')}>Sửa lưu ý sức khỏe</Btn>}>
          <ul className="space-y-4 text-sm">
            <NoteRow icon={m.medicalNotes ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />} tone={m.medicalNotes ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'} title="Lưu ý sức khỏe / chấn thương" text={m.medicalNotes || 'Chưa ghi nhận lưu ý sức khỏe.'} />
            {(results.data ?? []).filter(r => r.coachComment).slice(0, 3).map(r => <NoteRow key={r.id} icon={<MessageSquareText className="h-4 w-4" />} tone="text-violet-600 bg-violet-50 dark:bg-violet-500/10"
              title={`Nhận xét buổi ${dmy(r.performedAt)}${r.status === 'DRAFT' ? ' (nháp)' : ''}`} text={r.coachComment!} />)}
          </ul>
        </Card>
      </div>
    </div>

    <NotesModal open={dialog === 'notes'} memberId={memberId} value={m.medicalNotes ?? ''} onClose={() => setDialog(null)} onDone={msg => { flash(msg); setDialog(null); void member.reload() }} />
  </div>
}

const Stat = ({ label, value }: { label: string; value: string }) => <div><dd className="text-lg font-bold tabular-nums">{value}</dd><dt className="text-xs text-text-muted">{label}</dt></div>
const NoteRow = ({ icon, tone, title, text }: { icon: ReactNode; tone: string; title: string; text: string }) => <li className="flex gap-3"><span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span><div><p className="font-semibold">{title}</p><p className="whitespace-pre-line text-text-muted">{text}</p></div></li>
const SessionRow = ({ s }: { s: Session }) => <li><Link to={`/coach/sessions/${s.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-bg-surface-muted/40">
  <span><span className="block text-sm font-semibold">{s.credit ? `Buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : 'Buổi PT'} · {s.courseName}</span><span className="text-xs text-text-muted">{relativeSlot(s.startsAt)}</span></span>
  <Badge tone={SESSION_TONE[s.status]}>{SESSION_LABEL[s.status]}</Badge></Link></li>

function NotesModal({ open, memberId, value, onClose, onDone }: { open: boolean; memberId: string; value: string; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [text, setText] = useState(value)
  return <Modal isOpen={open} onClose={onClose} title="Lưu ý sức khỏe / chấn thương" description="Chỉ Coach phụ trách và chính học viên xem được nội dung này.">
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => coachWs.updateMedicalNotes(memberId, text.trim()))) onDone('Đã cập nhật lưu ý sức khỏe.') }}>
      <textarea aria-label="Lưu ý sức khỏe" rows={5} value={text} onChange={e => setText(e.target.value)} className={textareaCls} placeholder="VD: Chấn thương cổ tay phải 10/2026 — hạn chế push-up, plank cao tay." />
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy}>Lưu</Btn></div>
    </form>
  </Modal>
}
