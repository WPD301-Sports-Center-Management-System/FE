import { useAuth } from '@/features/auth/context/auth-context'
import { savePtContinuation } from '@/shared/utils/pt-continuation'
import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { hybridGet, hybridSend } from '@/features/fixed-pt/hybrid-api'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { deskApi, type Plan, type Subscription } from '@/features/reception-workspace/api'
import { Async, Btn, Card, Field, InlineError, PageHeader, inputCls } from '@/features/workspace/ui'
import { formatDate } from '@/shared/utils/date'
import { formatVND } from '@/shared/utils/currency'

export function MemberGymSalePage() {
  const location = useLocation()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const plans = useLoad(() => deskApi.plans())
  const tickets = useLoad(() => hybridGet<Subscription[]>('/me/subscriptions', { limit: 100 }))
  const [renewId, setRenewId] = useState(params.get('renewSubscriptionId') ?? '')
  const [planId, setPlanId] = useState('')
  const [order, setOrder] = useState<Subscription | null>(null)
  const act = useSubmit()
  const selected = plans.data?.find(p => p.id === planId)
  const chooseRenewal = (s: Subscription) => { setRenewId(s.id); setPlanId(plans.data?.some(p => p.id === s.planId) ? s.planId : '') }
  return <div className="mx-auto max-w-3xl space-y-5"><PageHeader title="Mua hoặc gia hạn vé gym" subtitle="Vé gym và gói PT là hai quyền lợi độc lập." />
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold underline" to={(location.state as { ptDraft?: unknown } | null)?.ptDraft ? '/member/pt-sale' : '/member'} state={location.state}>{(location.state as { ptDraft?: unknown } | null)?.ptDraft ? 'Quay lại phương án PT' : 'Về trang hội viên'}</Link>
    <Card title="Vé gym hiện có"><Async state={tickets} rows={2}>{rows => rows.filter(s => ['ACTIVE','EXPIRED'].includes(s.status)).length ? <ul className="space-y-3">{rows.filter(s => ['ACTIVE','EXPIRED'].includes(s.status)).map(s => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><div><p className="font-semibold">{s.planNameSnapshot}</p><p>{formatDate(s.startDate)} → {formatDate(s.endDate)}</p></div><Btn size="sm" disabled={act.busy || !!order} onClick={() => chooseRenewal(s)}>{s.id === renewId ? 'Đã chọn gia hạn vé này' : 'Gia hạn vé này'}</Btn></li>)}</ul> : <p className="text-sm">Bạn chưa có vé gym để gia hạn.</p>}</Async></Card>
    <Card title={order ? 'Đơn vé gym đã tạo' : renewId ? 'Chọn vé để gia hạn' : 'Chọn vé gym mới'}>{order ? <div className="space-y-3 text-sm"><p>{order.planNameSnapshot} · {formatVND(order.priceSnapshot)}</p><p>{formatDate(order.startDate)} → {formatDate(order.endDate)}</p><p>Đơn đang chờ thanh toán. Quay lại phương án PT sẽ kiểm tra lại giá và lịch; đơn vé không giữ lịch PT.</p><Btn busy={act.busy} onClick={() => void act.run(async () => { const payment = await deskApi.payVnpay({ subscriptionId: order.id }); if ((location.state as { ptDraft?: unknown } | null)?.ptDraft && (!user || !savePtContinuation({ ownerId: user.id, role: 'MEMBER', paymentId: payment.paymentId, subscriptionId: order.id, draft: location.state.ptDraft }))) throw new Error('Chưa lưu được phương án PT để tiếp tục sau thanh toán. Hãy thử lại trước khi mở VNPay.'); window.location.assign(payment.paymentUrl) })}>Tiếp tục thanh toán vé qua VNPay</Btn></div> : <><Async state={plans} rows={2}>{rows => <Field label="Loại vé"><select className={inputCls} value={planId} disabled={act.busy} onChange={e => setPlanId(e.target.value)}><option value="">Chọn vé đang mở bán</option>{rows.map((p: Plan) => <option key={p.id} value={p.id}>{p.name} · {p.paidMonths + p.bonusMonths} tháng · {formatVND(p.price)}</option>)}</select></Field>}</Async>{renewId && <Btn variant="ghost" disabled={act.busy} onClick={() => setRenewId('')}>Chọn mua vé mới</Btn>}{selected && <p className="my-3 text-sm">Giá vé: {formatVND(selected.price)}. Xem ngày hiệu lực trên đơn trước khi thanh toán.</p>}<Btn busy={act.busy} disabled={!selected || !!tickets.error || tickets.loading || !!renewId && !tickets.data?.some(t => t.id === renewId)} onClick={() => void act.run(async () => { const created = renewId ? await deskApi.renewSubscription(renewId, { planId }) : await hybridSend<Subscription>('post', '/subscriptions', { planId }); setOrder(created) })}>{renewId ? 'Tạo đơn gia hạn để xem lại' : 'Tạo đơn vé để xem lại'}</Btn></>}<InlineError message={act.error} /></Card>
  </div>
}
