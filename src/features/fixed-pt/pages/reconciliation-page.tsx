import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/features/auth/context/auth-context'
import { formatDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { ReconciliationCase } from '../types'
import { ErrorBanner, inputCls, label, Loadable, money, Notice, Page, Panel, Status, Table, td } from '../components/ui'
import { ReasonDialog } from '../components/widgets'

const TYPE: Record<string, string> = { DUPLICATE_RECEIPT: 'Trả trùng', RECEIPT_AFTER_CLOSE: 'Tiền về sau khi đóng đăng ký', TERMS_CHANGED: 'Thanh toán cho điều khoản cũ', LATE_RECEIPT_SCHEDULE_LOST: 'Tiền về muộn, mất giữ chỗ', APPLY_FAILED: 'Áp dụng lỗi nhiều lần' }

// Staff: money that was received but not (or not yet) applied to an order. Nothing is refunded or
// credited automatically; the Manager records the decision taken outside the system (D-14).
export function ReconciliationPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('OPEN')
  const cases = useLoad(() => fixedPtApi.reconciliationCases({ status: status || undefined, limit: 100 }), [status])
  const [resolving, setResolving] = useState<ReconciliationCase | null>(null)
  const [retrying, setRetrying] = useState<ReconciliationCase | null>(null)
  const [result, setResult] = useState('')
  const act = useSubmit()
  const isManager = user?.role === 'MANAGER'
  return (
    <Page title="Đối soát tiền nhận" subtitle="Mọi khoản tiền thực nhận đều được ghi; khoản không áp dụng được cho đơn nằm ở đây chờ xử lý.">
      <Notice tone="info">Khoản đã nhận nhưng áp dụng lỗi có thể phục hồi ở đây. Hoàn phần gói chưa dùng được xử lý tại tab Hoàn tiền PT.</Notice>
      {result && <Notice tone="info">{result}</Notice>}
      <Panel title="Hồ sơ đối soát" actions={<select aria-label="Lọc" className={inputCls} value={status} onChange={e => setStatus(e.target.value)}><option value="OPEN">Đang mở</option><option value="IN_PROGRESS">Đang xử lý</option><option value="RESOLVED">Đã giải quyết</option><option value="">Tất cả</option></select>}>
        <ErrorBanner message={act.error} />
        <Loadable state={cases} empty="Không có hồ sơ.">{items => (
          <Table head={['Mã', 'Loại', 'Member', 'Số tiền', 'Đơn / đăng ký', 'Trạng thái', '']}>
            {items.map(c => <tr key={c.id}>
              <td className={td}>{c.code}<div className="text-xs text-text-muted">{formatDateTime(c.createdAt)}</div></td>
              <td className={td}>{TYPE[c.type] ?? c.type}<div className="text-xs text-text-muted">{c.detail}</div></td>
              <td className={td}>{c.payment.member.user.fullName}<div className="text-xs text-text-muted">{c.payment.paymentCode} · {c.payment.method}</div></td>
              <td className={td}>{money(c.amount)}</td>
              <td className={td}>{c.ptPurchase?.purchaseCode ?? '—'}{c.enrollment && <div className="text-xs text-text-muted">{c.enrollment.code} · {label(c.enrollment.status)}</div>}</td>
              <td className={td}><Status value={c.status} />{c.resolution && <div className="text-xs text-text-muted">{c.resolution}</div>}</td>
              <td className={td}>{isManager && c.status !== 'RESOLVED' && <div className="flex gap-1.5">
                {c.status === 'OPEN' && <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.updateReconciliation(c.id, { status: 'IN_PROGRESS' }); await cases.reload() })}>Nhận xử lý</Button>}
                {c.type === 'APPLY_FAILED' ? <Button size="sm" disabled={act.busy} onClick={() => setRetrying(c)}>Phục hồi thanh toán</Button> : <Button size="sm" onClick={() => setResolving(c)}>Kết luận</Button>}</div>}</td>
            </tr>)}
          </Table>
        )}</Loadable>
      </Panel>
      <ReasonDialog open={!!resolving} title="Kết luận hồ sơ đối soát" confirmLabel="Đóng hồ sơ" busy={act.busy} error={act.error}
        description="Ghi rõ đã làm gì bên ngoài hệ thống (ví dụ: đã chuyển trả theo chứng từ số…, hoặc áp dụng cho gói kế tiếp theo quyết định…)." onClose={() => { setResolving(null); act.clear() }}
        onConfirm={resolution => void act.run(async () => { await fixedPtApi.updateReconciliation(resolving!.id, { status: 'RESOLVED', resolution }); setResolving(null); await cases.reload() })} />
      <ReasonDialog open={!!retrying} title="Phục hồi thanh toán đã nhận" confirmLabel="Thử áp dụng lại" busy={act.busy} error={act.error}
        description="Ghi lý do xử lý. Hệ thống thử cấp quyền lợi từ khoản đã nhận; không thu thêm tiền. Hồ sơ chỉ tự đóng khi áp dụng thành công."
        onClose={() => { setRetrying(null); act.clear() }} onConfirm={reason => void act.run(async () => {
          const payment = await fixedPtApi.retryPaymentApplication(retrying!.paymentId, reason)
          setResult(payment.application === 'APPLIED' ? 'Đã phục hồi thanh toán và cấp quyền lợi. Hồ sơ áp dụng lỗi đã được đóng.' : 'Chưa cấp được quyền lợi. Hồ sơ vẫn cần xử lý; xem thông tin mới và nguyên nhân lỗi trước khi thử tiếp.')
          setRetrying(null); await cases.reload()
        })} />
    </Page>
  )
}
