import { Link } from 'react-router-dom'
import { hybridGet } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { deskApi } from '@/features/reception-workspace/api'
import { Async, Btn, InlineError } from '@/features/workspace/ui'

export function MemberPurchasePayment({ purchaseId }: { purchaseId: string }) {
  const state = useLoad(() => hybridGet<{ items: { kind: string; purchaseId?: string }[] }>('/me/next-actions'), [purchaseId])
  const act = useSubmit()
  return <Async state={state} rows={1}>{data => {
    const processing = data.items.some(i => i.kind === 'PAYMENT_PROCESSING' && i.purchaseId === purchaseId)
    const due = data.items.some(i => i.kind === 'PAYMENT_DUE' && i.purchaseId === purchaseId)
    return <div className="space-y-2 text-sm">{processing ? <p role="status">Trung tâm đã nhận tiền và đang xử lý quyền lợi. Bạn không cần thanh toán lại. <Link className="underline" to="/member?tab=billing">Theo dõi thanh toán</Link></p> : due ? <Btn busy={act.busy} onClick={() => void act.run(async () => { const result = await deskApi.payVnpay({ ptPurchaseId: purchaseId }); window.location.assign(result.paymentUrl) })}>Tiếp tục thanh toán qua VNPay</Btn> : <p>Kiểm tra tình trạng đơn trong <Link className="underline" to="/member?tab=billing">lịch sử thanh toán</Link>. Đơn hết giữ chỗ cần chọn lại lịch trước khi thanh toán.</p>}<InlineError message={act.error} /></div>
  }}</Async>
}
