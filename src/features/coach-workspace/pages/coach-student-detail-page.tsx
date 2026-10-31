import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, Check, Flag, MessageSquareText, Pencil, Phone, Play, Ruler, Target, Utensils } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { coachWs, type Assessment } from '../api'
import { Badge, Btn, Card, EmptyBox, ErrorBox, Field, InlineError, LinkBtn, PageHeader, Person, ProgressBar, Skeleton, inputCls, textareaCls, useFlash } from '@/features/workspace/ui'
import { fmtNumber, isUpcoming, num, PURCHASE_LABEL, relativeSlot, SESSION_LABEL, SESSION_TONE, signed } from '@/features/workspace/utils'

const dmy = (iso?: string | null) => iso ? centerDate(iso).split('-').reverse().join('/') : '—'
const age = (dob?: string | null) => { if (!dob) return null; const d = new Date(dob); const n = new Date(); return n.getFullYear() - d.getFullYear() - (n < new Date(n.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0) }

export function CoachStudentDetailPage() {
  const { memberId = '' } = useParams()
  const { flash, node } = useFlash()
  const member = useLoad(() => coachWs.member(memberId), [memberId])
  const progress = useLoad(() => coachWs.progress(memberId), [memberId])
  const purchases = useLoad(async () => (await coachWs.purchases()).filter(p => p.memberId === memberId), [memberId])
  const purchaseIds = (purchases.data ?? []).filter(p => ['ACTIVE', 'COMPLETED', 'EXPIRED'].includes(p.status)).map(p => p.id).join(',')
  const sessions = useLoad(async () => (await Promise.all(purchaseIds.split(',').filter(Boolean).map(id => coachWs.sessions({ purchaseId: id }, 2)))).flat(), [purchaseIds], !!purchases.data)
  const results = useLoad(() => coachWs.results(memberId), [memberId])
  const [dialog, setDialog] = useState<null | 'assessment' | 'goal' | 'notes'>(null)

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
  const assessments = progress.data?.assessments ?? []
  const delta = (k: keyof Assessment) => { const v = assessments.map(a => num(a[k])).filter((x): x is number => x !== null); return v.length > 1 ? v.at(-1)! - v[0]! : null }
  const goals = (progress.data?.goals ?? []).filter(g => g.status === 'ACTIVE')
  const active = (purchases.data ?? []).find(p => p.status === 'ACTIVE')
  const reloadProgress = (msg: string) => { flash(msg); setDialog(null); void progress.reload() }
  const facts = [m.memberCode, m.user.phone, age(m.dateOfBirth) !== null ? `${age(m.dateOfBirth)} tuổi` : null, m.gender, m.fitnessLevel ? `Trình độ: ${m.fitnessLevel}` : null, `Tham gia ${dmy(m.createdAt).slice(3)}`].filter(Boolean)

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
            {goals.slice(0, 2).map(g => <Badge key={g.id} tone="info">Mục tiêu: {g.title}</Badge>)}
            {m.medicalNotes && <Badge tone="warning"><AlertTriangle aria-hidden className="h-3.5 w-3.5" />Có lưu ý sức khỏe</Badge>}
          </div>
        </div>
        <dl className="flex flex-wrap gap-6 text-right">
          <Stat label="Buổi hoàn thành" value={sessions.data ? String(done) : 'Đang tải'} />
          <Stat label="Chuyên cần" value={attendance === null ? 'Chưa có dữ liệu' : `${attendance}%`} />
          <Stat label={`Cân nặng · ${assessments.length} lần đo`} value={delta('weightKg') === null ? 'Chưa có dữ liệu' : `${signed(delta('weightKg')!)} kg`} />
          <Stat label="% mỡ" value={delta('bodyFatPercent') === null ? 'Chưa có dữ liệu' : `${signed(delta('bodyFatPercent')!)}%`} />
        </dl>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border-subtle px-5 py-4">
        {next && <LinkBtn variant="primary" to={`/coach/sessions/${next.id}`} icon={<Play aria-hidden className="h-4 w-4" />}>{live ? 'Buổi đang diễn ra' : `Buổi tiếp theo (${relativeSlot(next.startsAt)})`}</LinkBtn>}
        <Btn icon={<Ruler aria-hidden className="h-4 w-4" />} onClick={() => setDialog('assessment')} disabled={!active}>Ghi chỉ số cơ thể</Btn>
        <Btn icon={<Target aria-hidden className="h-4 w-4" />} onClick={() => setDialog('goal')} disabled={!active}>Đặt mục tiêu</Btn>
        <LinkBtn to="/coach/meal-plans" icon={<Utensils aria-hidden className="h-4 w-4" />}>Thực đơn</LinkBtn>
        {m.user.phone && <a href={`tel:${m.user.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle px-3.5 text-sm font-semibold hover:bg-bg-surface-muted"><Phone aria-hidden className="h-4 w-4" />Gọi</a>}
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card title={`Xu hướng chỉ số`} subtitle={assessments.length ? `${assessments.length} lần đo · gần nhất ${dmy(assessments.at(-1)!.assessedAt)}` : 'Chưa có lần đo nào'}>
          {progress.error ? <InlineError message={progress.error} /> : !progress.data ? <Skeleton rows={4} className="p-0" /> : assessments.length < 2
            ? <EmptyBox icon={<Ruler className="h-5 w-5" />} title={assessments.length ? 'Cần ít nhất 2 lần đo để vẽ xu hướng' : 'Chưa có số đo cơ thể'} action={active && <Btn size="sm" onClick={() => setDialog('assessment')}>Ghi chỉ số</Btn>} />
            : <TrendChart data={assessments} />}
        </Card>
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
              <Link to={`/coach/pt-purchases/${p.id}`} className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">Xem chi tiết gói</Link>
            </li>)}</ul>}
        </Card>
        <Card title="Ghi chú chuyên môn" actions={<Btn size="sm" variant="ghost" icon={<Pencil aria-hidden className="h-3.5 w-3.5" />} onClick={() => setDialog('notes')}>Sửa lưu ý sức khỏe</Btn>}>
          <ul className="space-y-4 text-sm">
            <NoteRow icon={m.medicalNotes ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />} tone={m.medicalNotes ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'} title="Lưu ý sức khỏe / chấn thương" text={m.medicalNotes || 'Chưa ghi nhận lưu ý sức khỏe.'} />
            {goals.map(g => <NoteRow key={g.id} icon={<Flag className="h-4 w-4" />} tone="text-sky-600 bg-sky-50 dark:bg-sky-500/10" title={g.title}
              text={[g.metricName && g.targetValue ? `${g.metricName}: ${g.currentValue ?? g.startValue ?? '?'} → ${g.targetValue} ${g.unit ?? ''}` : null, g.targetDate ? `hạn ${dmy(g.targetDate)}` : null, g.description].filter(Boolean).join(' · ') || 'Mục tiêu đang theo dõi'} />)}
            {(results.data ?? []).filter(r => r.coachComment).slice(0, 3).map(r => <NoteRow key={r.id} icon={<MessageSquareText className="h-4 w-4" />} tone="text-violet-600 bg-violet-50 dark:bg-violet-500/10"
              title={`Nhận xét buổi ${dmy(r.performedAt)}${r.status === 'DRAFT' ? ' (nháp)' : ''}`} text={r.coachComment!} />)}
          </ul>
        </Card>
      </div>
    </div>

    {active && <AssessmentModal open={dialog === 'assessment'} memberId={memberId} purchaseId={active.id} last={assessments.at(-1)} onClose={() => setDialog(null)} onDone={reloadProgress} />}
    {active && <GoalModal open={dialog === 'goal'} memberId={memberId} purchaseId={active.id} onClose={() => setDialog(null)} onDone={reloadProgress} />}
    <NotesModal open={dialog === 'notes'} memberId={memberId} value={m.medicalNotes ?? ''} onClose={() => setDialog(null)} onDone={msg => { flash(msg); setDialog(null); void member.reload() }} />
  </div>
}

const Stat = ({ label, value }: { label: string; value: string }) => <div><dd className="text-lg font-bold tabular-nums">{value}</dd><dt className="text-xs text-text-muted">{label}</dt></div>
const NoteRow = ({ icon, tone, title, text }: { icon: ReactNode; tone: string; title: string; text: string }) => <li className="flex gap-3"><span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span><div><p className="font-semibold">{title}</p><p className="whitespace-pre-line text-text-muted">{text}</p></div></li>
const SessionRow = ({ s }: { s: Session }) => <li><Link to={`/coach/sessions/${s.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-bg-surface-muted/40">
  <span><span className="block text-sm font-semibold">{s.credit ? `Buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : 'Buổi PT'} · {s.courseName}</span><span className="text-xs text-text-muted">{relativeSlot(s.startsAt)}</span></span>
  <Badge tone={SESSION_TONE[s.status]}>{SESSION_LABEL[s.status]}</Badge></Link></li>

/** Weight (solid) and body-fat % (dashed), each on its own scale, with a data table for screen readers. */
function TrendChart({ data }: { data: Assessment[] }) {
  const pts = data.slice(-10)
  const W = 640, H = 240, L = 44, R = 44, T = 16, B = 30
  const series = useMemo(() => [
    { key: 'weightKg' as const, label: 'Cân nặng', unit: 'kg', cls: 'text-primary', dash: undefined },
    { key: 'bodyFatPercent' as const, label: '% mỡ', unit: '%', cls: 'text-sky-600 dark:text-sky-400', dash: '6 5' },
  ].map(s => { const vals = pts.map(p => num(p[s.key])); const real = vals.filter((v): v is number => v !== null); return { ...s, vals, min: Math.min(...real), max: Math.max(...real), real } }).filter(s => s.real.length > 1), [pts])
  const x = (i: number) => L + (i / Math.max(1, pts.length - 1)) * (W - L - R)
  const y = (v: number, s: { min: number; max: number }) => { const span = s.max - s.min || 1; return T + (1 - (v - s.min) / span) * (H - T - B) }
  return <figure>
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Biểu đồ xu hướng cân nặng và phần trăm mỡ">
      {[0, 0.5, 1].map(f => <line key={f} x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} className="stroke-border-subtle" strokeWidth={1} />)}
      {series[0] && <><text x={L - 6} y={T + 4} textAnchor="end" className="fill-text-muted text-[11px]">{fmtNumber(series[0].max, 1)}</text><text x={L - 6} y={H - B + 4} textAnchor="end" className="fill-text-muted text-[11px]">{fmtNumber(series[0].min, 1)}</text></>}
      {series[1] && <><text x={W - R + 6} y={T + 4} className="fill-text-muted text-[11px]">{fmtNumber(series[1].max, 1)}%</text><text x={W - R + 6} y={H - B + 4} className="fill-text-muted text-[11px]">{fmtNumber(series[1].min, 1)}%</text></>}
      {pts.map((p, i) => <text key={p.id} x={x(i)} y={H - 8} textAnchor="middle" className="fill-text-muted text-[11px]">{dmy(p.assessedAt).slice(0, 5)}</text>)}
      {series.map(s => { const d = s.vals.map((v, i) => v === null ? null : `${x(i).toFixed(1)},${y(v, s).toFixed(1)}`).filter(Boolean).join(' L'); return <g key={s.key} className={s.cls}>
        <path d={`M${d}`} fill="none" stroke="currentColor" strokeWidth={2.4} strokeDasharray={s.dash} strokeLinecap="round" strokeLinejoin="round" />
        {s.vals.map((v, i) => v === null ? null : <circle key={i} cx={x(i)} cy={y(v, s)} r={4} fill="currentColor"><title>{`${s.label} ${dmy(pts[i]!.assessedAt)}: ${fmtNumber(v, 1)} ${s.unit}`}</title></circle>)}
      </g> })}
    </svg>
    <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">{series.map(s => <span key={s.key} className="inline-flex items-center gap-1.5"><span aria-hidden className={`h-0.5 w-5 ${s.cls} bg-current`} />{s.label} ({fmtNumber(s.real[0]!, 1)} → {fmtNumber(s.real.at(-1)!, 1)} {s.unit})</span>)}</figcaption>
    <table className="sr-only"><caption>Số đo theo ngày</caption><thead><tr><th>Ngày</th><th>Cân nặng</th><th>% mỡ</th></tr></thead><tbody>{pts.map(p => <tr key={p.id}><td>{dmy(p.assessedAt)}</td><td>{p.weightKg ?? '—'}</td><td>{p.bodyFatPercent ?? '—'}</td></tr>)}</tbody></table>
  </figure>
}

function AssessmentModal({ open, memberId, purchaseId, last, onClose, onDone }: { open: boolean; memberId: string; purchaseId: string; last?: Assessment; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [v, setV] = useState<Record<string, string>>({ assessedAt: centerDate(), heightCm: last?.heightCm ?? '' })
  const fields: [string, string, string][] = [['weightKg', 'Cân nặng', 'kg'], ['heightCm', 'Chiều cao', 'cm'], ['bodyFatPercent', 'Mỡ cơ thể', '%'], ['muscleMassKg', 'Khối cơ', 'kg'], ['waistCm', 'Vòng eo', 'cm'], ['hipCm', 'Vòng mông', 'cm']]
  return <Modal isOpen={open} onClose={onClose} maxWidth="lg" title="Ghi chỉ số cơ thể" description="BMI được tính tự động từ cân nặng và chiều cao.">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const body: Record<string, unknown> = { ptPurchaseId: purchaseId, assessedAt: new Date(`${v.assessedAt}T12:00:00+07:00`).toISOString() }
      for (const [k] of fields) if (v[k]) body[k] = Number(v[k])
      if (v.notes?.trim()) body.notes = v.notes.trim()
      if (await submit.run(() => coachWs.addAssessment(memberId, body))) onDone('Đã lưu chỉ số cơ thể.')
    }}>
      <Field label="Ngày đo" required><input type="date" required max={centerDate()} value={v.assessedAt} onChange={e => setV({ ...v, assessedAt: e.target.value })} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{fields.map(([k, l, u]) => <Field key={k} label={`${l} (${u})`}><input type="number" inputMode="decimal" min={0} step={0.1} value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} className={inputCls} /></Field>)}</div>
      <Field label="Ghi chú"><textarea rows={2} value={v.notes ?? ''} onChange={e => setV({ ...v, notes: e.target.value })} className={textareaCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!fields.some(([k]) => v[k])}>Lưu chỉ số</Btn></div>
    </form>
  </Modal>
}

function GoalModal({ open, memberId, purchaseId, onClose, onDone }: { open: boolean; memberId: string; purchaseId: string; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [v, setV] = useState<Record<string, string>>({})
  return <Modal isOpen={open} onClose={onClose} maxWidth="lg" title="Đặt mục tiêu cho học viên">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const body: Record<string, unknown> = { ptPurchaseId: purchaseId, title: v.title!.trim() }
      for (const k of ['description', 'metricName', 'unit']) if (v[k]?.trim()) body[k] = v[k]!.trim()
      for (const k of ['startValue', 'targetValue']) if (v[k]) body[k] = Number(v[k])
      if (v.targetDate) body.targetDate = v.targetDate
      if (await submit.run(() => coachWs.addGoal(memberId, body))) onDone('Đã tạo mục tiêu.')
    }}>
      <Field label="Mục tiêu" required><input required maxLength={160} value={v.title ?? ''} onChange={e => setV({ ...v, title: e.target.value })} className={inputCls} placeholder="VD: Giảm mỡ – lên form" /></Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Chỉ số"><input value={v.metricName ?? ''} onChange={e => setV({ ...v, metricName: e.target.value })} className={inputCls} placeholder="Cân nặng" /></Field>
        <Field label="Hiện tại"><input type="number" step={0.1} value={v.startValue ?? ''} onChange={e => setV({ ...v, startValue: e.target.value })} className={inputCls} /></Field>
        <Field label="Mục tiêu"><input type="number" step={0.1} value={v.targetValue ?? ''} onChange={e => setV({ ...v, targetValue: e.target.value })} className={inputCls} /></Field>
        <Field label="Đơn vị"><input value={v.unit ?? ''} onChange={e => setV({ ...v, unit: e.target.value })} className={inputCls} placeholder="kg" /></Field>
      </div>
      <Field label="Hạn hoàn thành"><input type="date" min={centerDate()} value={v.targetDate ?? ''} onChange={e => setV({ ...v, targetDate: e.target.value })} className={inputCls} /></Field>
      <Field label="Mô tả"><textarea rows={2} value={v.description ?? ''} onChange={e => setV({ ...v, description: e.target.value })} className={textareaCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!v.title?.trim()}>Tạo mục tiêu</Btn></div>
    </form>
  </Modal>
}

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
