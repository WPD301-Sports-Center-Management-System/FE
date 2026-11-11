import { useEffect, useState } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { Badge, Btn, Field, InlineError, inputCls, textareaCls } from '@/features/workspace/ui'
import { fmtMoney } from '@/features/workspace/utils'
import { useSubmit } from '../hooks'
import { isOpenWithdrawal, walletApi, withdrawalLabel, type Withdrawal } from '../wallet-api'

type Mode = 'paid' | 'reject'
export function TransferDialog({ request: w, onClose, onDone, onRefresh }: { request: Withdrawal; onClose: () => void; onDone: (message: string) => void; onRefresh: () => Promise<void> }) {
  const [mode, setMode] = useState<Mode>((w.allowedActions ?? []).includes('MARK_PAID') ? 'paid' : 'reject')
  const [ref, setRef] = useState(''), [reason, setReason] = useState('')
  const act = useSubmit(), allowed = w.allowedActions ?? []
  const canSubmit = isOpenWithdrawal(w) && (mode === 'paid' ? allowed.includes('MARK_PAID') && !!ref.trim() : allowed.includes('REJECT') && !!reason.trim())
  useEffect(() => { if (['INVALID_STATE', 'ALREADY_PAID', 'TRANSFER_REF_USED'].includes(act.code ?? '')) void onRefresh() }, [act.code, onRefresh])
  return <Modal isOpen onClose={() => { if (!act.busy) onClose() }} title="Xử lý yêu cầu rút tiền" description={`${w.coach?.user.fullName ?? 'Coach'} · ${w.code}`}>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!canSubmit) return; void act.run(async () => {
      if (mode === 'paid') await walletApi.paid(w.id, { transferRef: ref.trim() })
      else await walletApi.reject(w.id, { reason: reason.trim() })
      onDone(mode === 'paid' ? 'Đã ghi nhận tiền chuyển và cập nhật ví Coach.' : 'Đã từ chối, giải phóng tiền giữ và thông báo Coach.')
    }) }}>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-2xl font-semibold tabular-nums">{fmtMoney(w.amount)}</p><Badge tone={isOpenWithdrawal(w) ? 'warning' : 'neutral'}>{withdrawalLabel[w.status]}</Badge></div>
      {w.warnings?.includes('CHECK_BANK_BEFORE_RETRY') && <p role="status" className="border-l-2 border-amber-600 pl-3 text-sm">Kiểm tra sao kê ngân hàng trước khi chuyển lại. Khoản tiền này vẫn đang được giữ.</p>}
      <dl className="space-y-2 rounded-lg bg-bg-surface-muted p-3 text-sm">{[['Ngân hàng', w.bankName], ['Số tài khoản', w.accountNumber], ['Chủ tài khoản', w.accountName]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-text-muted">{label}</dt><dd className="break-all text-right font-medium">{value ?? 'Cần đối chiếu với Coach'}</dd></div>)}</dl>
      {w.actionReason === 'ENTITLEMENT_REDUCED' && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">Quyền hưởng còn {fmtMoney(w.coverable ?? 0)}. Nếu chưa chuyển, từ chối để Coach gửi lại đúng số tiền. Nếu tiền đã đi, ghi nhận đã chuyển: phần vượt sẽ được trừ vào thu nhập sau của Coach.</p>}
      {mode === 'paid' && w.transferAllowed === true && allowed.includes('TRANSFER') && <p className="text-sm text-text-muted">Chuyển đúng số tiền về tài khoản trên, sau đó nhập mã giao dịch. Chỉ một Manager thực hiện thanh toán.</p>}
      {isOpenWithdrawal(w) && <p className="text-sm text-text-muted">Chưa rõ kết quả chuyển khoản: đóng để giữ yêu cầu chờ, kiểm tra sao kê trước khi chuyển lại.</p>}
      {mode === 'paid' ? <><Field label="Mã giao dịch đã chuyển" hint="Ghi nhận tiền đã chuyển thành công, không phải lệnh chuyển tiền."><input aria-label="Mã giao dịch đã chuyển" required maxLength={120} disabled={act.busy} className={inputCls} value={ref} onChange={e => setRef(e.target.value)} /></Field></>
      : <><Field label="Lý do từ chối" hint="Từ chối sẽ giải phóng tiền giữ và thông báo Coach. Chỉ xác nhận khi chắc chắn tiền chưa chuyển hoặc chuyển thất bại."><textarea aria-label="Lý do từ chối" required maxLength={5000} disabled={act.busy} rows={3} className={textareaCls} value={reason} onChange={e => setReason(e.target.value)} /></Field>
      </>}
      <InlineError message={act.error} />{!isOpenWithdrawal(w) && <p role="status" className="text-sm">Phiếu đã được người khác xử lý. Đóng để xem trạng thái mới.</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isOpenWithdrawal(w) && (mode === 'paid' ? allowed.includes('REJECT') : allowed.includes('MARK_PAID')) && <Btn variant="ghost" className="mr-auto" disabled={act.busy} onClick={() => { setMode(mode === 'paid' ? 'reject' : 'paid'); act.clear() }}>{mode === 'paid' ? 'Từ chối yêu cầu' : 'Quay lại xác nhận chuyển tiền'}</Btn>}
        <Btn disabled={act.busy} onClick={onClose}>Đóng</Btn><Btn type="submit" variant={mode === 'reject' ? 'danger' : 'primary'} className={mode === 'reject' ? '' : 'bg-text-primary! text-bg-surface! shadow-none!'} busy={act.busy} disabled={!canSubmit}>{mode === 'paid' ? 'Xác nhận đã chuyển tiền' : 'Từ chối và thông báo Coach'}</Btn>
      </div>
    </form>
  </Modal>
}
