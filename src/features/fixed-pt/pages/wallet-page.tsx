import { useState } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '../hooks'
import { walletApi, withdrawalLabel, type CoachWallet, type Withdrawal } from '../wallet-api'
import { FlowSteps } from '@/features/workspace/flow-steps'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, LinkBtn, PageHeader, inputCls, useFlash } from '@/features/workspace/ui'
import { fmtMoney } from '@/features/workspace/utils'
import { formatDateTime } from '@/shared/utils/date'

export function WalletPage() {
  const state = useLoad(walletApi.mine)
  return <div className="space-y-5"><PageHeader title="Ví thu nhập" subtitle="Thu nhập được ghi sau buổi tập. Tiền của gói đã kết thúc mới có thể rút." />
    <Async state={state} rows={4}>{wallet => <>
      <Card><div className="grid items-start gap-6 lg:grid-cols-2"><div><p className="text-sm text-text-muted">Có thể yêu cầu rút</p><p className="mt-2 text-3xl font-semibold tabular-nums">{fmtMoney(Math.max(0, wallet.available))}</p><dl className="mt-5 space-y-3 text-sm">{[['Đang tích lũy từ gói chưa kết thúc', wallet.accruing], ['Đang chờ chuyển khoản', wallet.requested], ['Đã nhận', wallet.withdrawn]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="tabular-nums">{fmtMoney(Number(value))}</dd></div>)}</dl></div>
        <div><FlowSteps steps={['Ghi thu nhập', 'Yêu cầu rút', 'Nhận chuyển khoản']} current={wallet.requested > 0 ? 2 : wallet.available > 0 ? 1 : 0} /><div className="mt-5">{wallet.withdrawals.some(w => w.status === 'REQUESTED') ? <div role="status"><h2 className="font-semibold">Yêu cầu đã gửi</h2><p className="mt-2 text-sm text-text-muted">Manager đang xử lý chuyển khoản. Theo dõi kết quả và mã giao dịch bên dưới.</p></div> : wallet.available > 0 ? <RequestWithdrawal key={wallet.available} wallet={wallet} onDone={state.reload} /> : <p className="text-sm text-text-muted">{wallet.available < 0 ? 'Số dư đang được đối chiếu sau thay đổi kết quả buổi. Liên hệ Manager trước khi rút.' : 'Khi một gói kết thúc, tiền đủ điều kiện sẽ chuyển sang số dư có thể rút.'}</p>}</div></div>
      </div></Card>
      <div className={wallet.withdrawals.length ? "grid items-start gap-5 xl:grid-cols-2" : "grid gap-5"}><Card title="Thu nhập từ các gói">{!wallet.packages.length ? <EmptyBox title="Chưa có thu nhập" hint="Thu nhập xuất hiện sau khi có kết quả buổi được tính." /> : <ul className="divide-y divide-border-subtle">{wallet.packages.map(p => <li key={p.purchaseId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="font-medium">{p.packageNameSnapshot}</p><p className="mt-1 text-sm text-text-muted">{p.purchaseCode} · {p.finished ? 'Gói đã kết thúc' : 'Đang tích lũy'}</p></div><div className="flex items-center gap-3"><span className="tabular-nums">{fmtMoney(p.earned)}</span><LinkBtn size="sm" to={`/coach/pt-purchases/${p.purchaseId}`}>Xem gói</LinkBtn></div></li>)}</ul>}</Card><Card title="Lịch sử rút tiền"><WithdrawalHistory rows={wallet.withdrawals} /></Card></div>
    </>}</Async>
  </div>
}

function RequestWithdrawal({ wallet, onDone }: { wallet: CoachWallet; onDone: () => Promise<void> }) {
  const last = wallet.withdrawals.find(w => w.bankName && w.accountNumber && w.accountName)
  const [amount, setAmount] = useState(String(Math.floor(wallet.available)))
  const [bank, setBank] = useState(last?.bankName ?? ''), [number, setNumber] = useState(last?.accountNumber ?? ''), [name, setName] = useState(last?.accountName ?? '')
  const act = useSubmit()
  const valid = Number.isSafeInteger(Number(amount)) && Number(amount) > 0 && Number(amount) <= wallet.available && !!bank.trim() && /^[0-9 ]{4,40}$/.test(number.trim()) && !!name.trim()
  return <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (valid) void act.run(async () => { await walletApi.request({ amount: Number(amount), bankName: bank.trim(), accountNumber: number.trim(), accountName: name.trim() }); await onDone() }) }}>
    <Field label="Số tiền muốn rút" hint={`Tối đa ${fmtMoney(wallet.available)}`}><input inputMode="numeric" type="number" min={1} max={wallet.available} step={1} required className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} /></Field>
    <Field label="Ngân hàng"><input required maxLength={120} className={inputCls} value={bank} onChange={e => setBank(e.target.value)} /></Field>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Số tài khoản"><input required inputMode="numeric" maxLength={40} className={inputCls} value={number} onChange={e => setNumber(e.target.value)} /></Field><Field label="Chủ tài khoản"><input required maxLength={120} className={inputCls} value={name} onChange={e => setName(e.target.value)} /></Field></div>
    <InlineError message={act.error} /><Btn type="submit" variant="primary" busy={act.busy} disabled={!valid}>Gửi yêu cầu rút tiền</Btn>
  </form>
}
function WithdrawalHistory({ rows }: { rows: Withdrawal[] }) {
  return !rows.length ? <p className="text-sm text-text-muted">Chưa có yêu cầu rút.</p> : <ul className="divide-y divide-border-subtle">{rows.map(w => <li key={w.id} className="space-y-1 py-3 first:pt-0 last:pb-0"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold tabular-nums">{fmtMoney(w.amount)}</span><Badge tone={w.status === 'PAID' ? 'success' : w.status === 'REQUESTED' ? 'warning' : 'neutral'}>{withdrawalLabel[w.status]}</Badge></div><p className="text-sm text-text-muted">{w.code} · {formatDateTime(w.createdAt)}</p>{w.transferRef && <p className="break-words text-sm">Mã chuyển khoản: {w.transferRef}</p>}{w.closedReason && <p className="text-sm">Lý do: {w.closedReason}</p>}</li>)}</ul>
}
export function WithdrawalsPanel({ coachId }: { coachId?: string }) {
  const state = useLoad(() => walletApi.list(coachId), [coachId])
  const [selected, setSelected] = useState<Withdrawal | null>(null), [history, setHistory] = useState(false)
  const { flash, node } = useFlash()
  return <Card title="Yêu cầu rút tiền" subtitle="Đối chiếu tài khoản, chuyển tiền, rồi ghi nhận mã giao dịch." actions={<Btn size="sm" onClick={() => setHistory(v => !v)}>{history ? 'Xem yêu cầu đang chờ' : 'Xem lịch sử'}</Btn>}>
    {node}<Async state={state} rows={3}>{rows => { const shown = rows.filter(w => history ? w.status !== 'REQUESTED' : w.status === 'REQUESTED'); return !shown.length ? <EmptyBox title={history ? 'Chưa có lịch sử chuyển tiền' : 'Không có yêu cầu chờ chuyển'} /> : <ul className="divide-y divide-border-subtle">{shown.map(w => <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="font-semibold">{w.coach?.user.fullName ?? 'Coach'}</p><p className="mt-1 text-sm text-text-muted">{w.code} · {formatDateTime(w.createdAt)}</p><p className="mt-1 text-sm">{w.bankName} · {w.accountNumber}</p></div><div className="flex flex-wrap items-center gap-4"><strong className="tabular-nums">{fmtMoney(w.amount)}</strong>{w.status === 'REQUESTED' ? <Btn size="sm" onClick={() => setSelected(w)}>Xử lý chuyển khoản</Btn> : <Badge tone={w.status === 'PAID' ? 'success' : 'neutral'}>{withdrawalLabel[w.status]}</Badge>}</div></li>)}</ul> }}</Async>
    {selected && <TransferDialog request={selected} onClose={() => setSelected(null)} onDone={message => { setSelected(null); flash(message); void state.reload() }} />}
  </Card>
}
function TransferDialog({ request: w, onClose, onDone }: { request: Withdrawal; onClose: () => void; onDone: (message: string) => void }) {
  const [reject, setReject] = useState(false), [text, setText] = useState('')
  const act = useSubmit(), shortfall = (w.coachAvailable ?? 0) < 0
  return <Modal isOpen onClose={() => { if (!act.busy) onClose() }} title={reject ? 'Từ chối yêu cầu rút' : 'Ghi nhận chuyển khoản'} description={`${w.coach?.user.fullName ?? 'Coach'} · ${w.code}`}><form className="space-y-4" onSubmit={e => { e.preventDefault(); if (text.trim() && (reject || !shortfall)) void act.run(async () => { if (reject) await walletApi.reject(w.id, text.trim()); else await walletApi.paid(w.id, text.trim()); onDone(reject ? 'Đã từ chối và báo lý do cho Coach.' : 'Đã ghi nhận chuyển khoản và cập nhật ví Coach.') }) }}>
    <FlowSteps steps={['Yêu cầu đã gửi', 'Chuyển khoản', 'Coach nhận tiền']} current={1} /><p className="text-2xl font-semibold tabular-nums">{fmtMoney(w.amount)}</p><dl className="space-y-2 text-sm">{[['Ngân hàng', w.bankName], ['Số tài khoản', w.accountNumber], ['Chủ tài khoản', w.accountName]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-text-muted">{label}</dt><dd className="break-all font-medium">{value ?? 'Cần đối chiếu với Coach'}</dd></div>)}</dl>
    {shortfall && <p role="alert" className="text-sm text-red-700">Số dư đã thay đổi. Từ chối để Coach gửi lại số tiền phù hợp.</p>}
    <Field label={reject ? 'Lý do từ chối' : 'Mã giao dịch đã chuyển'} hint={reject ? 'Coach sẽ nhận được lý do này.' : 'Chỉ xác nhận sau khi chuyển tiền thành công.'}><input required maxLength={reject ? 1000 : 120} className={inputCls} value={text} onChange={e => setText(e.target.value)} /></Field>
    <InlineError message={act.error} /><div className="flex flex-wrap justify-between gap-2"><Btn disabled={act.busy} variant="ghost" onClick={() => { setReject(v => !v); setText(''); act.clear() }}>{reject ? 'Quay lại chuyển khoản' : 'Từ chối yêu cầu'}</Btn><Btn type="submit" variant={reject ? 'danger' : 'primary'} busy={act.busy} disabled={!text.trim() || !reject && shortfall}>{reject ? 'Gửi lý do từ chối' : 'Xác nhận đã chuyển tiền'}</Btn></div>
  </form></Modal>
}
