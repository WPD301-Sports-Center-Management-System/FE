import { savePtContinuation } from '@/shared/utils/pt-continuation'
import { openReceipt } from '@/features/workspace/receipt-events'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Banknote, Check, CheckCircle2, CreditCard, FileDown, RotateCcw, Ticket, UserPlus, X } from 'lucide-react'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { PersonSearch, type PersonHit } from '@/features/workspace/person-search'
import { Badge, Btn, Card, Dot, EmptyBox, ErrorBox, Field, InlineError, LinkBtn, PageHeader, Person, Skeleton, inputCls } from '@/features/workspace/ui'
import { fmtMoney, fmtNumber } from '@/features/workspace/utils'
import { deskApi, type Plan, type Subscription } from '../api'
import { useDeskShell } from '../shell'
import { useAuth } from '@/features/auth/context/auth-context'
import { dmy, memberState } from '../labels'
import { CreateMemberModal } from './desk-members-page'

// Counter collects cash only; online payment is VNPay (PRD 2026-11 §5.7).
type Method = 'CASH' | 'VNPAY'
const METHODS: { key: Method; label: string; icon: typeof Banknote }[] = [
  { key: 'CASH', label: 'Tiền mặt', icon: Banknote },
  { key: 'VNPAY', label: 'VNPay', icon: CreditCard },
]
type Done = { memberId: string; name: string; plan: string; amount: number; method: Method; change: number; paymentId: string; application?: string | null }

export function DeskPosPage() {
  const { refresh } = useDeskShell()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const plans = useLoad(() => deskApi.plans(), [])
  const [customer, setCustomer] = useState<PersonHit | null>(null)
  const [renewId, setRenewId] = useState(params.get('renewSubscriptionId') ?? '')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [pending, setPending] = useState<Subscription | null>(null)
  const [startDate, setStartDate] = useState('')
  const [method, setMethod] = useState<Method>('CASH')
  const [received, setReceived] = useState('')
  const [create, setCreate] = useState(false)
  const [done, setDone] = useState<Done | null>(null)
  const submit = useSubmit()
  // BE: POST /payments/counter is Receptionist-only; a Manager browsing the desk must not be offered it.
  const { role, user } = useAuth()
  const desk = role !== 'MANAGER'
  const memberId = params.get('memberId')
  useEffect(() => {
    let active = true
    setPending(null)
    if (!memberId) setCustomer(null)
    else if (customer?.id !== memberId) {
      setCustomer(null)
      deskApi.member(memberId).then(m => {
        if (active) setCustomer({ id: m.id, name: m.user.fullName, sub: `${m.memberCode}${m.user.phone ? ` · ${m.user.phone}` : ''}`, avatarUrl: m.user.avatarUrl })
      }).catch(() => undefined)
    }
    return () => { active = false }
  }, [memberId]) // eslint-disable-line react-hooks/exhaustive-deps
  const subs = useLoad(() => deskApi.subscriptions({ memberId: customer!.id }, 1), [customer?.id], !!customer)
  const st = subs.data ? memberState(subs.data) : null
  const pendings = (subs.data ?? []).filter(s => s.status === 'PENDING')
  const find = useCallback(async (term: string) => (await deskApi.members({ search: term, limit: 8 })).items.map(m => ({ id: m.id, name: m.user.fullName, sub: `${m.memberCode}${m.user.phone ? ` · ${m.user.phone}` : ''}`, avatarUrl: m.user.avatarUrl })), [])
  const amount = pending ? Number(pending.priceSnapshot) : plan ? Number(plan.price) : 0
  const cash = Number(received.replace(/\D/g, '')) || 0
  const ready = !!customer && amount > 0 && (method !== 'CASH' || cash >= amount)
  const nextStep = !customer ? 'Chọn hội viên để tiếp tục.' : amount <= 0 ? 'Chọn vé gym muốn mua.' : method === 'CASH' && cash < amount ? `Cần nhập đủ tiền khách đưa. Còn thiếu ${fmtMoney(amount - cash)}.` : null
  const pick = (h: PersonHit | null) => { setCustomer(h); setPending(null); setRenewId(''); const p = new URLSearchParams(params); if (h) p.set('memberId', h.id); else p.delete('memberId'); setParams(p, { replace: true }) }
  const reset = () => { setDone(null); setPlan(null); setPending(null); setReceived(''); setStartDate(''); submit.clear(); void subs.reload() }

  const pay = async () => {
    if (!customer) return
    const r = await submit.run(async () => {
      if (renewId && !subs.data?.some(s => s.id === renewId && s.memberId === customer.id)) throw new Error('Vé gia hạn đã thay đổi. Hãy chọn lại vé của học viên.');
      const sub = pending ?? (renewId ? await deskApi.renewSubscription(renewId, { planId: plan!.id, startDate: startDate || undefined }) : await deskApi.createSubscription({ memberId: customer.id, planId: plan!.id, startDate: startDate || undefined }))
      setPending(sub)
      if (method === 'VNPAY') { const v = await deskApi.payVnpay({ subscriptionId: sub.id }); if (params.get('returnToPt') && (location.state as { ptDraft?: unknown } | null)?.ptDraft && (!user || !savePtContinuation({ ownerId: user.id, role: 'RECEPTIONIST', paymentId: v.paymentId, subscriptionId: sub.id, draft: location.state.ptDraft }))) throw new Error('Chưa lưu được phương án PT để tiếp tục sau thanh toán. Hãy thử lại trước khi mở VNPay.'); window.location.href = v.paymentUrl; return null }
      const p = await deskApi.payCounter({ subscriptionId: sub.id, method, receivedAmount: cash })
      return { memberId: customer.id, name: customer.name, plan: sub.planNameSnapshot, amount: Number(sub.priceSnapshot), method, change: p.changeAmount ?? 0, paymentId: p.id, application: p.application }
    })
    if (r) { setDone(r); refresh() }
  }

  return <div>
    <PageHeader title="Bán vé gym" subtitle={<><span>Quầy bán hàng</span><Dot /><span>Giá đã gồm thuế · tạo vé rồi thu tiền ngay tại quầy</span></>}
      actions={<><Link className="text-sm font-semibold underline" state={params.get('returnToPt') ? location.state : undefined} to={memberId ? '/receptionist/pt-sale?memberId=' + memberId : '/receptionist/pt-sale'}>{params.get('returnToPt') ? 'Quay lại phương án PT' : 'Bán gói PT'}</Link><LinkBtn to="/receptionist/payments">Giao dịch hôm nay</LinkBtn></>} />
    {customer && <section className="mb-4 rounded-lg bg-bg-surface-muted p-4 text-sm"><h2 className="font-semibold">Vé gym của học viên</h2>{(subs.data ?? []).filter(s => ['ACTIVE','EXPIRED'].includes(s.status)).map(s => <div key={s.id} className="mt-2 flex flex-wrap items-center gap-3"><span>{s.planNameSnapshot} · {dmy(s.startDate)} → {dmy(s.endDate)}</span><Btn size="sm" disabled={submit.busy} onClick={() => { setRenewId(s.id); setPending(null); setPlan(plans.data?.find(p => p.id === s.planId) ?? null); setStartDate('') }}>{renewId === s.id ? 'Đã chọn gia hạn vé này' : 'Gia hạn vé này'}</Btn></div>)}{renewId && <Btn size="sm" disabled={submit.busy} onClick={() => { setRenewId(''); setPending(null) }}>Chọn mua vé mới</Btn>}<InlineError message={subs.error} /></section>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <Card title="1. Chọn vé gym" subtitle="Các vé đang được trung tâm mở bán">
        {plans.error ? <ErrorBox message={plans.error} onRetry={() => void plans.reload()} /> : !plans.data ? <Skeleton rows={4} className="p-0" /> : !plans.data.length ? <EmptyBox title="Chưa có vé nào mở bán" /> :
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{plans.data.map(p => { const sel = plan?.id === p.id && !pending; return <button key={p.id} type="button" disabled={submit.busy} aria-pressed={sel} onClick={() => { setPlan(p); setPending(null) }}
            className={`relative rounded-xl border p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50 ${sel ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border-subtle bg-bg-surface'}`}>
            {sel && <span aria-hidden className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-white"><Check className="h-3.5 w-3.5" /></span>}
            <span aria-hidden className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Ticket className="h-5 w-5" /></span>
            <p className="font-semibold">{p.name}</p>
            <p className="mt-0.5 text-xs text-text-muted">{p.paidMonths} tháng{p.bonusMonths ? ` + tặng ${p.bonusMonths} tháng` : ''}{p.description ? ` · ${p.description}` : ''}</p>
            {p.bonusMonths > 0 && <Badge tone="success" className="mt-2">Tặng {p.bonusMonths} tháng</Badge>}
            <p className="mt-3 text-lg font-bold tabular-nums text-primary">{fmtMoney(p.price)}</p>
          </button> })}</div>}
      </Card>

      <Card title="2. Hội viên & thanh toán" subtitle="Kiểm tra thông tin trước khi thu tiền" className="xl:sticky xl:top-20 xl:self-start">
        {done ? <Receipt done={done} onNew={reset} /> : <fieldset disabled={submit.busy} className="min-w-0 space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Khách hàng <span className="text-red-600" aria-hidden>*</span></p>
            {customer ? <div className="flex items-center gap-3 rounded-lg border border-border-subtle p-3">
              <Person name={customer.name} src={customer.avatarUrl} /><div className="min-w-0 flex-1"><Link to={`/receptionist/members/${customer.id}`} className="font-semibold hover:text-primary">{customer.name}</Link><p className="text-xs text-text-muted">{customer.sub}</p>
                {st && <div className="mt-1 flex flex-wrap gap-1"><Badge tone={st.tone}>{st.label}</Badge>{st.sub && st.key !== 'pending' && <Badge>đến {dmy(st.sub.endDate)}</Badge>}</div>}</div>
              <button type="button" aria-label="Đổi khách hàng" onClick={() => pick(null)} className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted"><X className="h-4 w-4" /></button>
            </div> : <div className="space-y-2"><PersonSearch className="" label="Tìm khách hàng" placeholder="Tìm hội viên theo tên / SĐT…" find={find} onPick={pick} />
              <Btn size="sm" variant="ghost" icon={<UserPlus aria-hidden className="h-4 w-4" />} onClick={() => setCreate(true)}>Tạo hội viên mới</Btn></div>}
          </div>
          {pendings.length > 0 && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-500/30 dark:bg-sky-500/10">
            <p className="font-semibold">Vé đã tạo, chưa thanh toán</p>
            {pendings.map(s => <label key={s.id} className="mt-2 flex cursor-pointer items-center gap-2"><input type="radio" name="pending" checked={pending?.id === s.id} onChange={() => { setPending(s); setPlan(null) }} className="accent-[var(--primary)]" />
              {s.planNameSnapshot} · {dmy(s.startDate)} → {dmy(s.endDate)} · {fmtMoney(s.priceSnapshot)}</label>)}
          </div>}
          <div className="rounded-lg bg-bg-surface-muted/60 p-3 text-sm">
            {pending || plan ? <div className="flex justify-between gap-3"><span><span className="font-semibold">{pending?.planNameSnapshot ?? plan!.name}</span><span className="block text-xs text-text-muted">{pending ? `${dmy(pending.startDate)} → ${dmy(pending.endDate)}` : `${plan!.paidMonths + plan!.bonusMonths} tháng sử dụng`}</span></span><span className="font-semibold tabular-nums">{fmtMoney(amount)}</span></div>
              : <p className="text-text-muted">Chọn một vé trong danh mục.</p>}
          </div>
          {plan && !pending && <Field label="Ngày bắt đầu" hint={st?.key === 'active' || st?.key === 'expiring' ? 'Đang có vé hiệu lực — vé mới tự nối tiếp sau ngày hết hạn.' : 'Bỏ trống để bắt đầu hôm nay.'}>
            <input type="date" min={centerDate()} value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></Field>}
          <div className="flex items-end justify-between border-t border-border-subtle pt-3"><span className="text-sm text-text-muted">Tổng cộng</span><span className="text-2xl font-bold tabular-nums">{fmtMoney(amount)}</span></div>
          <fieldset><legend className="mb-1.5 text-sm font-medium">Phương thức thanh toán</legend>
            <div className="flex flex-wrap gap-2">{METHODS.map(x => <label key={x.key} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${method === x.key ? 'border-primary bg-primary/5 text-text-primary' : 'border-border-subtle hover:bg-bg-surface-muted'}`}>
              <input type="radio" name="method" value={x.key} checked={method === x.key} onChange={() => setMethod(x.key)} className="accent-[var(--primary)]" /><x.icon aria-hidden className="h-4 w-4" />{x.label}</label>)}</div>
          </fieldset>
          {method === 'CASH' && <Field label="Tiền khách đưa" required hint={cash >= amount && amount ? `Tiền thối: ${fmtMoney(cash - amount)}` : undefined}>
            <input inputMode="numeric" value={received ? fmtNumber(cash) : ''} onChange={e => setReceived(e.target.value)} className={`${inputCls} tabular-nums`} placeholder={amount ? fmtNumber(amount) : '0'} />
            {amount > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{[amount, Math.ceil(amount / 100_000) * 100_000, Math.ceil(amount / 500_000) * 500_000].filter((v, i, a) => a.indexOf(v) === i).map(v => <Btn key={v} size="sm" onClick={() => setReceived(String(v))}>{fmtNumber(v)}</Btn>)}</div>}
          </Field>}
          {method === 'VNPAY' && <p className="rounded-lg bg-bg-surface-muted px-3 py-2 text-xs text-text-muted">Chuyển đến VNPay để chọn ngân hàng hoặc quét mã thanh toán. Vé chỉ kích hoạt sau khi hệ thống xác nhận thanh toán và áp dụng thành công.</p>}
          <InlineError message={submit.code === 'VNPAY_UNCONFIGURED' ? 'VNPay chưa được cấu hình. Hãy kiểm tra giao dịch trước khi chuyển sang thu tiền mặt tại quầy.' : submit.error} />
          {nextStep && <p id="payment-next-step" role="status" className="text-sm text-text-muted">{nextStep}</p>}
          <Btn variant="primary" className="h-11 w-full text-base" busy={submit.busy} disabled={!ready || !desk} aria-describedby={nextStep ? 'payment-next-step' : undefined} title={desk ? undefined : 'Chỉ tài khoản Lễ tân được thu tiền tại quầy. Manager xem được quầy nhưng không thu tiền; hãy đăng nhập bằng tài khoản Lễ tân.'} icon={<CreditCard aria-hidden className="h-5 w-5" />} onClick={() => void pay()}>
            {method === 'VNPAY' ? 'Thanh toán VNPay' : `Thu ${fmtMoney(amount)}`}</Btn>
          {!desk && <p role="note" className="text-xs text-text-muted">Chỉ tài khoản Lễ tân được thu tiền tại quầy. Hãy đăng nhập bằng tài khoản Lễ tân để thu.</p>}
        </fieldset>}
      </Card>
    </div>
    <CreateMemberModal open={create} onClose={() => setCreate(false)} onDone={(_m, id) => { if (id) deskApi.member(id).then(m => pick({ id: m.id, name: m.user.fullName, sub: m.memberCode, avatarUrl: m.user.avatarUrl })).catch(() => undefined) }} />
  </div>
}

function Receipt({ done, onNew }: { done: Done; onNew: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pdf = async () => {
    setBusy(true); setError(null)
    try {
      const p = (await deskApi.payments({ memberId: done.memberId }, 1)).find(x => x.id === done.paymentId)
      if (!p?.invoiceId) throw new Error('Hóa đơn đang được tạo, thử lại sau ít giây.')
      openReceipt({ invoiceId: p.invoiceId })
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được hóa đơn.') } finally { setBusy(false) }
  }
  return <div role="status" className="space-y-4 text-center">
    <CheckCircle2 aria-hidden className="mx-auto h-12 w-12 text-emerald-500" />
    <div><p className="text-lg font-bold">Đã thu {fmtMoney(done.amount)}</p><p className="text-sm text-text-muted">{done.plan} · {done.name}</p></div>
    {done.method === 'CASH' && done.change > 0 && <p className="rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">Tiền thối cho khách: {fmtMoney(done.change)}</p>}
    {done.application && done.application !== 'APPLIED' && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Đã nhận tiền, vé chưa được kích hoạt. Đang đối soát; không thu lại tiền của khách.</p>}
    <InlineError message={error} />
    <div className="flex flex-wrap justify-center gap-2">
      <Btn icon={<FileDown aria-hidden className="h-4 w-4" />} busy={busy} onClick={() => void pdf()}>Xem hóa đơn</Btn>
      <LinkBtn to={`/receptionist/members/${done.memberId}`}>Hồ sơ khách</LinkBtn>
      <Btn variant="primary" icon={<RotateCcw aria-hidden className="h-4 w-4" />} onClick={onNew}>Bán tiếp</Btn>
    </div>
  </div>
}
