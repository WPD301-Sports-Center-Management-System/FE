import { openReceipt } from '@/features/workspace/receipt-events'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarCheck, Dumbbell, FileDown, LogIn, Phone, Ticket, Wallet } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Badge, Btn, Card, EmptyBox, ErrorBox, InlineError, LinkBtn, PageHeader, Person, ProgressBar, Skeleton, StatTile, Table, td, useFlash } from '@/features/workspace/ui'
import { addDays, dayEnd, fmtMoney, fmtNumber, hhmm, isUpcoming, PURCHASE_LABEL, relativeSlot } from '@/features/workspace/utils'
import { deskApi, type Payment } from '../api'
import { daysUntil, dmy, memberState, METHOD_LABEL, PAYMENT_LABEL, SUB_LABEL } from '../labels'
import { ApptRow, stayed } from './desk-home-page'

export function DeskMemberPage() {
  const { id = '' } = useParams()
  const { role } = useAuth()
  const desk = role !== 'MANAGER'
  const base = desk ? '/receptionist' : '/manager'
  const { flash, node } = useFlash()
  const today = centerDate()
  const member = useLoad(() => deskApi.member(id), [id])
  const subs = useLoad(() => deskApi.subscriptions({ memberId: id }, 2), [id])
  const purchases = useLoad(() => deskApi.purchases({ memberId: id }), [id])
  const sessions = useLoad(() => deskApi.sessions({ memberId: id, from: new Date().toISOString(), to: dayEnd(addDays(today, 30)) }, 1), [id, today])
  const visits = useLoad(() => deskApi.visits({ memberId: id }, 1), [id])
  const payments = useLoad(() => deskApi.payments({ memberId: id }, 2), [id])
  const submit = useSubmit()

  if (member.error) return <ErrorBox message={member.error} onRetry={() => void member.reload()} />
  if (!member.data) return <Skeleton rows={8} />
  const m = member.data
  const st = subs.data ? memberState(subs.data) : null
  const open = (visits.data ?? []).find(v => v.status === 'OPEN')
  const active = (purchases.data ?? []).filter(p => p.status === 'ACTIVE')
  const ptLeft = active.reduce((n, p) => n + p.totalCredits - p.consumedCredits, 0)
  const ptTotal = active.reduce((n, p) => n + p.totalCredits, 0)
  const visits30 = (visits.data ?? []).filter(v => centerDate(v.checkedInAt) >= addDays(today, -30)).length
  const spent = (payments.data ?? []).filter(p => p.status === 'PAID').reduce((n, p) => n + Number(p.amount), 0)
  const upcoming = (sessions.data ?? []).filter(s => isUpcoming(s) || s.status === 'IN_PROGRESS')
  const checkIn = async () => { if (await submit.run(() => deskApi.checkIn(id))) { flash(`Đã check-in ${m.user.fullName}.`); void visits.reload() } }

  return <div>
    {node}
    <PageHeader title={m.user.fullName} crumbs={[{ label: desk ? 'Danh sách hội viên' : 'Hội viên & vé', to: `${base}/members` }, { label: `${m.user.fullName} · ${m.memberCode}` }]} />
    <section className="mb-6 rounded-xl border border-border-subtle bg-bg-surface shadow-sm">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <Person name={m.user.fullName} src={m.user.avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{m.user.fullName}</h1>
          <p className="mt-1 text-sm text-text-muted">{[m.memberCode, m.user.phone, m.user.email, `Tham gia ${dmy(m.createdAt)}`].filter(Boolean).join(' · ')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{st && <Badge tone={st.tone}>{st.label}</Badge>}{open && <Badge tone="success" dot>Đang trong phòng từ {hhmm(open.checkedInAt)}</Badge>}{active.length > 0 && <Badge tone="violet">{active.length} gói PT đang tập</Badge>}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border-subtle px-5 py-4">
        {desk && <><Btn variant="primary" icon={<LogIn aria-hidden className="h-4 w-4" />} busy={submit.busy} disabled={!!open} onClick={() => void checkIn()}>{open ? 'Đang trong phòng' : 'Check-in'}</Btn>
        <LinkBtn to={`/receptionist/membership-sale?memberId=${id}`} icon={<Ticket aria-hidden className="h-4 w-4" />}>{st?.key === 'active' || st?.key === 'expiring' ? 'Gia hạn vé gym' : st?.key === 'pending' ? 'Thu tiền vé' : 'Bán vé gym'}</LinkBtn>
        <LinkBtn to={`/receptionist/pt-sale?memberId=${id}`} icon={<Dumbbell aria-hidden className="h-4 w-4" />}>Bán gói PT</LinkBtn></>}
        {m.user.phone && <a href={`tel:${m.user.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle px-3.5 text-sm font-semibold hover:bg-bg-surface-muted"><Phone aria-hidden className="h-4 w-4" />Gọi</a>}
        <div className="basis-full"><InlineError message={submit.code === 'MEMBERSHIP_REQUIRED' ? 'Hội viên chưa có vé gym còn hiệu lực hôm nay.' : submit.error} /></div>
      </div>
    </section>

    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Vé gym hiện tại" icon={<Ticket className="h-[18px] w-[18px]" />} iconTone="success" value={st?.sub && st.key !== 'pending' && st.key !== 'expired' ? `${daysUntil(st.sub.endDate)}` : '—'} unit={st?.sub && (st.key === 'active' || st.key === 'expiring') ? 'ngày còn lại' : undefined}
        hint={st?.sub ? `${st.sub.planNameSnapshot} · đến ${dmy(st.sub.endDate)}` : 'Chưa có vé'} />
      <StatTile label="Buổi PT còn lại" icon={<Dumbbell className="h-[18px] w-[18px]" />} iconTone="violet" value={purchases.data ? ptLeft : '—'} unit={ptTotal ? `/${ptTotal} buổi` : undefined} hint={active[0] ? `HLV ${active[0].coachNameSnapshot ?? ''}` : 'Không có gói PT đang tập'} />
      <StatTile label="Check-in 30 ngày" icon={<CalendarCheck className="h-[18px] w-[18px]" />} iconTone="info" value={visits.data ? visits30 : '—'} unit="lượt" hint={visits.data?.[0] ? `Gần nhất ${dmy(visits.data[0].checkedInAt)} ${hhmm(visits.data[0].checkedInAt)}` : undefined} />
      <StatTile label="Tổng đã thanh toán" icon={<Wallet className="h-[18px] w-[18px]" />} iconTone="warning" value={payments.data ? fmtNumber(spent) : '—'} unit="₫" hint={payments.data ? `${payments.data.filter(p => p.status === 'PAID').length} giao dịch` : undefined} />
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Thông tin cá nhân">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[['Họ tên', m.user.fullName], ['Ngày sinh / Giới tính', [m.dateOfBirth ? dmy(m.dateOfBirth) : null, m.gender].filter(Boolean).join(' · ') || '—'], ['Số điện thoại', m.user.phone ?? '—'], ['Email', m.user.email ?? '—'],
            ['Liên hệ khẩn cấp', m.emergencyPhone ?? '—'], ['Địa chỉ', m.address ?? '—']].map(([k, v]) => <div key={k}><dt className="text-xs text-text-muted">{k}</dt><dd className="mt-0.5 font-medium [overflow-wrap:anywhere]">{v}</dd></div>)}
        </dl>
      </Card>
      <Card flush title="Lịch PT sắp tới" badge={sessions.data ? <Badge>{upcoming.length}</Badge> : null}>
        {sessions.error ? <ErrorBox message={sessions.error} /> : !sessions.data ? <Skeleton rows={3} /> : !upcoming.length ? <EmptyBox title="Không có buổi PT trong 30 ngày tới" /> :
          <ul className="divide-y divide-border-subtle">{upcoming.slice(0, 5).map(s => centerDate(s.startsAt) === today ? <ApptRow key={s.id} s={s} onDone={msg => { flash(msg); void sessions.reload() }} />
            : <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><span><span className="font-semibold">{relativeSlot(s.startsAt)}</span><span className="block text-xs text-text-muted">với {s.coachName} · {s.courseName}</span></span>{s.credit && <Badge>buổi {s.credit.creditIndex}/{s.purchase?.totalCredits}</Badge>}</li>)}</ul>}
      </Card>
      <Card flush title="Vé gym">
        {subs.error ? <ErrorBox message={subs.error} /> : !subs.data ? <Skeleton rows={3} /> : !subs.data.length ? <EmptyBox title="Chưa mua vé gym" action={<LinkBtn size="sm" variant="primary" to={`/receptionist/membership-sale?memberId=${id}`}>Bán vé</LinkBtn>} /> :
          <Table head={['Vé', 'Hiệu lực', 'Giá', 'Trạng thái']} minWidth={560} alignLast={false}>{subs.data.map(s => <tr key={s.id}>
            <td className={`${td} font-semibold`}>{s.planNameSnapshot}{s.bonusMonthsSnapshot > 0 && <p className="text-xs font-normal text-text-muted">{s.paidMonthsSnapshot} tháng + tặng {s.bonusMonthsSnapshot}</p>}</td>
            <td className={`${td} tabular-nums`}>{dmy(s.startDate)} → {dmy(s.endDate)}</td><td className={`${td} tabular-nums`}>{fmtMoney(s.priceSnapshot)}</td>
            <td className={td}><Badge tone={SUB_LABEL[s.status].tone}>{SUB_LABEL[s.status].label}</Badge>{s.status === 'PENDING' && <Link to={`/receptionist/membership-sale?memberId=${id}`} className="ml-2 text-xs font-semibold text-primary hover:underline">Thu tiền</Link>}</td>
          </tr>)}</Table>}
      </Card>
      <Card flush title="Gói PT">
        {purchases.error ? <ErrorBox message={purchases.error} /> : !purchases.data ? <Skeleton rows={3} /> : !purchases.data.length ? <EmptyBox title="Chưa có gói PT" /> :
          <ul className="divide-y divide-border-subtle">{purchases.data.map(p => <li key={p.id} className="px-5 py-3">
            <div className="flex flex-wrap items-center gap-2"><Link to={`${base}/pt-purchases/${p.id}`} className="font-semibold hover:text-primary">{p.packageNameSnapshot}</Link><Badge tone={p.status === 'ACTIVE' ? 'info' : p.status === 'PENDING_PAYMENT' ? 'warning' : 'neutral'}>{PURCHASE_LABEL[p.status] ?? p.status}</Badge></div>
            <p className="text-xs text-text-muted">{p.courseNameSnapshot ?? 'PT 1:1'}{p.coachNameSnapshot ? ` · HLV ${p.coachNameSnapshot}` : ''}{p.expiresAt ? ` · hạn ${dmy(p.expiresAt)}` : ''}</p>
            <div className="mt-2 flex items-center gap-3"><ProgressBar className="flex-1" value={p.consumedCredits} max={p.totalCredits} /><span className="text-xs tabular-nums text-text-muted">{p.consumedCredits}/{p.totalCredits} buổi</span></div>
          </li>)}</ul>}
      </Card>
      <Card flush title="Check-in gần đây">
        {visits.error ? <ErrorBox message={visits.error} /> : !visits.data ? <Skeleton rows={3} /> : !visits.data.length ? <EmptyBox title="Chưa có lượt check-in" /> :
          <Table head={['Thời điểm', 'Ra', 'Thời lượng']} minWidth={420} alignLast={false}>{visits.data.slice(0, 8).map(v => <tr key={v.id}>
            <td className={`${td} tabular-nums`}>{dmy(v.checkedInAt)} {hhmm(v.checkedInAt)}</td><td className={`${td} tabular-nums`}>{v.checkedOutAt ? hhmm(v.checkedOutAt) : v.status === 'OPEN' ? <Badge tone="success">đang tập</Badge> : '—'}</td>
            <td className={`${td} tabular-nums`}>{v.status === 'OPEN' || v.checkedOutAt ? stayed(v.checkedInAt, v.checkedOutAt ?? undefined) : '—'}</td></tr>)}</Table>}
      </Card>
      <Card flush title="Giao dịch gần đây" className="xl:col-span-2">
        {payments.error ? <ErrorBox message={payments.error} /> : !payments.data ? <Skeleton rows={3} /> : !payments.data.length ? <EmptyBox title="Chưa có giao dịch" /> :
          <Table head={['Mã', 'Nội dung', 'Số tiền', 'Trạng thái', '']} minWidth={620}>{payments.data.slice(0, 8).map(p => <PaymentMiniRow key={p.id} p={p} />)}</Table>}
      </Card>
    </div>
  </div>
}

function PaymentMiniRow({ p }: { p: Payment }) {
  const [busy, setBusy] = useState(false)
  return <tr>
    <td className={td}><p className="font-semibold">{p.paymentCode}</p><p className="text-xs text-text-muted">{dmy(p.paidAt ?? p.createdAt)} · {METHOD_LABEL[p.method]}</p></td>
    <td className={td}>{p.itemDescription}</td><td className={`${td} whitespace-nowrap tabular-nums`}>{fmtMoney(p.amount)}</td>
    <td className={td}><Badge tone={PAYMENT_LABEL[p.status].tone}>{PAYMENT_LABEL[p.status].label}</Badge></td>
    <td className={`${td} text-right`}>{p.invoiceId && <Btn size="sm" variant="ghost" busy={busy} icon={<FileDown aria-hidden className="h-4 w-4" />} aria-label={`Tải hóa đơn ${p.paymentCode}`}
      onClick={async () => { setBusy(true); try { openReceipt({ invoiceId: p.invoiceId! }) } finally { setBusy(false) } }}>Hóa đơn</Btn>}</td>
  </tr>
}
