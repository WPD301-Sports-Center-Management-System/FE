import { useState } from 'react'
import { useLoad, useSubmit } from '../hooks'
import { isOpenWithdrawal, walletApi, withdrawalLabel, withdrawalRequestKey, type CoachWallet, type Withdrawal } from '../wallet-api'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, LinkBtn, PageHeader, inputCls, useFlash } from '@/features/workspace/ui'
import { fmtMoney } from '@/features/workspace/utils'
import { formatDateTime } from '@/shared/utils/date'
import { TransferDialog } from './withdrawal-dialog'

const primary = 'bg-text-primary! text-bg-surface! shadow-none! hover:opacity-90'
export function WalletPage() {
  const state = useLoad(walletApi.mine)
  return <div className="space-y-5" data-coach-wallet>
    <PageHeader title="Thu nhập của tôi" actions={<Btn size="sm" onClick={() => void state.reload()} disabled={state.loading}>Cập nhật</Btn>} />
    <Async state={state} rows={4}>{wallet => {
      const open = wallet.withdrawals.find(isOpenWithdrawal)
      return <>
        {/* Five tracks: 2fr balance + one 24px gutter + 3fr next action = full canvas. */}
        <Card><div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2"><p className="text-sm text-text-muted">Có thể rút ngay</p><p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{fmtMoney(wallet.available)}</p>
            <dl className="mt-6 space-y-3 text-sm">{[['Đang chờ chuyển', wallet.reserved], ['Đã nhận', wallet.paid], ['Thu nhập ròng', wallet.ledger]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-text-muted">{label}</dt><dd className="text-right tabular-nums">{fmtMoney(Number(value))}</dd></div>)}</dl>
            {wallet.recovery > 0 && <div role="status" className="mt-5 border-l-2 border-amber-600 pl-3 text-sm"><p className="font-medium">Cần bù trừ {fmtMoney(wallet.recovery)}</p><p className="mt-1 text-text-muted">Khoản đã nhận vượt thu nhập sau điều chỉnh sẽ được trừ vào thu nhập tiếp theo.</p></div>}
            {wallet.unverified > 0 && <p className="mt-4 text-sm text-text-muted">{fmtMoney(wallet.unverified)} thu nhập cũ đang chờ đối soát, chưa thể rút.</p>}
          </div>
          <div className="border-t border-border-subtle pt-5 lg:col-span-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            {open ? <OpenRequest request={open} /> : wallet.available > 0 ? <RequestWithdrawal wallet={wallet} onDone={state.reload} /> : <div><h2 className="font-medium">Chưa có tiền để rút</h2><p className="mt-2 text-sm text-text-muted">{wallet.recovery > 0 ? 'Thu nhập mới sẽ bù khoản chênh lệch trước. Phần còn lại có thể rút ngay.' : 'Sau buổi tập được ghi nhận thu nhập, bạn có thể gửi yêu cầu nhận tiền tại đây.'}</p><LinkBtn className="mt-4" size="sm" to="/coach/schedule">Xem lịch tập</LinkBtn></div>}
          </div>
        </div></Card>
        <Card><div className="grid items-start gap-6 xl:grid-cols-2"><section><h2 className="mb-4 font-semibold">Lịch sử rút tiền</h2><WithdrawalHistory rows={wallet.withdrawals} /></section><section className="border-t border-border-subtle pt-5 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6"><h2 className="font-semibold">Thu nhập theo gói</h2><p className="mt-1 mb-4 text-sm text-text-muted">Gói đang tập hoặc tạm ngưng vẫn được rút thu nhập.</p><PackageIncome packages={wallet.packages} /></section></div></Card>
      </>
    }}</Async>
  </div>
}
function OpenRequest({ request: w }: { request: Withdrawal }) {
  return <div role="status" className="space-y-3"><Badge tone="warning">{withdrawalLabel[w.status]}</Badge><h2 className="text-xl font-semibold tabular-nums">{fmtMoney(w.amount)}</h2>
    <p className="text-sm text-text-muted">Yêu cầu đã gửi. Trung tâm sẽ chuyển tiền về tài khoản bên dưới.</p>
    <p className="break-words text-sm">{w.bankName} · {w.accountNumber}<br /><span className="text-text-muted">{w.accountName}</span></p>
    <p className="text-xs text-text-muted">{w.code} · {formatDateTime(w.createdAt)}<br />Bạn có thể gửi yêu cầu tiếp theo khi phiếu này hoàn tất.</p>
  </div>
}
function RequestWithdrawal({ wallet, onDone }: { wallet: CoachWallet; onDone: () => Promise<void> }) {
  const last = wallet.withdrawals.find(w => w.bankName && w.accountNumber && w.accountName)
  const [requestKey] = useState(withdrawalRequestKey), [amount, setAmount] = useState(String(wallet.available))
  const [bank, setBank] = useState(last?.bankName ?? ''), [number, setNumber] = useState(last?.accountNumber ?? ''), [name, setName] = useState(last?.accountName ?? '')
  const [editBank, setEditBank] = useState(!last), [sent, setSent] = useState(false)
  const act = useSubmit()
  const valid = Number.isSafeInteger(Number(amount)) && Number(amount) > 0 && Number(amount) <= wallet.available && !!bank.trim() && /^[0-9 ]{4,40}$/.test(number.trim()) && !!name.trim()
  return <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (valid && !sent) void act.run(async () => {
    await walletApi.request({ amount: Number(amount), bankName: bank.trim(), accountNumber: number.trim(), accountName: name.trim(), requestKey })
    setSent(true); await onDone()
  }) }}>
    <h2 className="font-medium">Nhận tiền về tài khoản</h2>
    <Field label="Số tiền muốn rút" hint={`Tối đa ${fmtMoney(wallet.available)}`}><div className="flex gap-2"><input aria-label="Số tiền muốn rút" inputMode="numeric" type="number" min={1} max={wallet.available} step={1} required disabled={act.busy || sent} className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} /><Btn size="sm" className="shrink-0 whitespace-nowrap" disabled={act.busy || sent || Number(amount) === wallet.available} onClick={() => setAmount(String(wallet.available))}>Rút hết</Btn></div></Field>
    {!editBank ? <div className="flex items-start justify-between gap-3 rounded-lg bg-bg-surface-muted p-3"><div className="min-w-0 text-sm"><p className="break-words font-medium">{bank} · {number}</p><p className="mt-1 break-words text-text-muted">{name}</p></div><Btn size="sm" variant="ghost" disabled={act.busy || sent} onClick={() => setEditBank(true)}>Đổi tài khoản</Btn></div> : <fieldset className="space-y-3" disabled={act.busy || sent}>
      <Field label="Ngân hàng"><input required maxLength={120} placeholder="Ví dụ: ACB" className={inputCls} value={bank} onChange={e => setBank(e.target.value)} /></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Số tài khoản"><input required inputMode="numeric" maxLength={40} className={inputCls} value={number} onChange={e => setNumber(e.target.value)} /></Field><Field label="Chủ tài khoản"><input required maxLength={120} autoComplete="name" className={inputCls} value={name} onChange={e => setName(e.target.value)} /></Field></div>
    </fieldset>}
    <InlineError message={act.error} />{act.error && <Btn size="sm" onClick={() => void onDone()}>Kiểm tra trạng thái yêu cầu</Btn>}
    <Btn type="submit" variant="primary" className={`w-full sm:w-auto ${primary}`} busy={act.busy} disabled={!valid || sent}>Gửi yêu cầu rút tiền</Btn>
  </form>
}
function PackageIncome({ packages }: { packages: CoachWallet['packages'] }) {
  const [all, setAll] = useState(false)
  return !packages.length ? <EmptyBox title="Chưa có thu nhập theo gói" hint="Thu nhập sẽ xuất hiện sau buổi được ghi nhận." /> : <><ul className="divide-y divide-border-subtle">{packages.slice(0, all ? undefined : 5).map(p => <li key={p.purchaseId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="font-medium">{p.packageNameSnapshot}</p><p className="mt-1 text-xs text-text-muted">{p.purchaseCode}{p.awaitingDecision > 0 ? ' · Có khoản chờ đối soát' : ''}</p><LinkBtn size="sm" variant="ghost" className="-ml-3 mt-1" to={`/coach/pt-purchases/${p.purchaseId}`}>Xem gói</LinkBtn></div><span className="shrink-0 text-right tabular-nums">{fmtMoney(p.earned)}</span></li>)}</ul>{packages.length > 5 && <Btn size="sm" className="mt-3" onClick={() => setAll(v => !v)}>{all ? 'Thu gọn' : `Xem ${packages.length} gói`}</Btn>}</>
}
function WithdrawalHistory({ rows }: { rows: Withdrawal[] }) {
  const [all, setAll] = useState(false)
  return !rows.length ? <EmptyBox title="Chưa có yêu cầu rút tiền" hint="Yêu cầu đầu tiên của bạn sẽ xuất hiện tại đây." /> : <><ul className="divide-y divide-border-subtle">{rows.slice(0, all ? undefined : 5).map(w => <li key={w.id} className="space-y-1 py-3 first:pt-0 last:pb-0"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold tabular-nums">{fmtMoney(w.amount)}</span><Badge tone={w.status === 'PAID' ? 'success' : isOpenWithdrawal(w) ? 'warning' : 'neutral'}>{withdrawalLabel[w.status]}</Badge></div><p className="text-xs text-text-muted">{w.code} · {formatDateTime(w.createdAt)}</p>{w.transferRef && <p className="break-words text-sm">Mã chuyển khoản: {w.transferRef}</p>}{w.closedReason && <p className="text-sm">Lý do: {w.closedReason}</p>}</li>)}</ul>{rows.length > 5 && <Btn size="sm" className="mt-3" onClick={() => setAll(v => !v)}>{all ? 'Thu gọn' : `Xem ${rows.length} yêu cầu gần nhất`}</Btn>}</>
}
export function WithdrawalsPanel({ coachId, onChanged }: { coachId?: string; onChanged?: () => void }) {
  const state = useLoad(() => walletApi.list(coachId), [coachId])
  const [selectedId, setSelectedId] = useState<string | null>(null), [history, setHistory] = useState(false)
  const { flash, node } = useFlash(), selected = state.data?.find(w => w.id === selectedId)
  return <Card title="Yêu cầu rút tiền" actions={<div className="flex gap-2"><Btn size="sm" onClick={() => void state.reload()} disabled={state.loading}>Cập nhật</Btn><Btn size="sm" onClick={() => setHistory(v => !v)}>{history ? 'Đang xử lý' : 'Lịch sử'}</Btn></div>}>
    {node}<Async state={state} rows={3}>{rows => {
      const shown = rows.filter(w => history ? !isOpenWithdrawal(w) : isOpenWithdrawal(w))
      return !shown.length ? <EmptyBox title={history ? 'Chưa có lịch sử chuyển tiền' : 'Không có yêu cầu đang chờ'} /> : <ul className="divide-y divide-border-subtle">{shown.map(w => <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="font-medium">{w.coach?.user.fullName ?? 'Coach'}</p><p className="mt-1 text-xs text-text-muted">{w.code} · {formatDateTime(w.createdAt)}</p><p className="mt-1 text-sm">{w.bankName} · {w.accountNumber}</p>{w.transferRef && <p className="mt-1 break-words text-sm">Mã chuyển khoản: {w.transferRef}</p>}{w.closedReason && <p className="mt-1 break-words text-sm">Lý do: {w.closedReason}</p>}{w.actionReason === 'ENTITLEMENT_REDUCED' && <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Quyền hưởng còn {fmtMoney(w.coverable ?? 0)} · Chưa chuyển thì từ chối để gửi lại.</p>}</div><div className="flex flex-wrap items-center justify-end gap-3"><div className="space-y-1 text-right"><p className="font-semibold tabular-nums">{fmtMoney(w.amount)}</p><Badge tone={w.status === 'PAID' ? 'success' : isOpenWithdrawal(w) ? 'warning' : 'neutral'}>{withdrawalLabel[w.status]}</Badge></div>{isOpenWithdrawal(w) && <Btn size="sm" onClick={() => setSelectedId(w.id)}>Xử lý yêu cầu</Btn>}</div></li>)}</ul>
    }}</Async>
    {selected && <TransferDialog request={selected} onRefresh={state.reload} onClose={() => setSelectedId(null)} onDone={message => { setSelectedId(null); flash(message); void state.reload(); onChanged?.() }} />}
  </Card>
}
