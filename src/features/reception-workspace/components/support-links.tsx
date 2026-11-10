import { Link } from 'react-router-dom'
import { hybridGet } from '@/features/fixed-pt/hybrid-api'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Async, Btn } from '@/features/workspace/ui'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { formatVND } from '@/shared/utils/currency'

type Context = { links: { purchase: { id: string; purchaseCode: string; refund: { status: string; amount: number } | null } | null; booking: { id: string } | null; disruptions: { id: string; code: string; status: string; purchaseId: string }[] } }
export function SupportLinks({ ticketId, manager }: { ticketId: string; manager: boolean }) {
  const state = useLoad(() => hybridGet<Context>(`/support-requests/${ticketId}`), [ticketId])
  const base = manager ? '/manager' : '/receptionist'
  return <section className="space-y-2 text-sm"><h3 className="font-semibold">Hồ sơ xử lý và kết quả liên quan</h3><Btn size="sm" busy={state.loading} onClick={() => void state.reload()}>Làm mới kết quả</Btn><Async state={state} rows={1}>{data => <div className="space-y-2">{data.links?.purchase && <p><Link className="underline" to={`${base}/pt-purchases/${data.links.purchase.id}?ticketId=${ticketId}`}>Gói {data.links.purchase.purchaseCode}</Link>{data.links.purchase.refund && <> · {data.links.purchase.refund.status === 'PAID' ? 'Đã xác nhận chuyển tiền hoàn' : 'Chờ chuyển tiền hoàn'}: {formatVND(data.links.purchase.refund.amount)}</>}</p>}{data.links?.booking && <Link className="block underline" to={`/pt-sessions/${data.links.booking.id}?ticketId=${ticketId}`}>Buổi tập liên quan</Link>}{data.links?.disruptions.map(d => <p key={d.id}><Link className="underline" to={`${base}/pt-purchases/${d.purchaseId}?ticketId=${ticketId}`}>Gián đoạn {d.code}</Link> · <StatusBadge status={d.status} /></p>)}<p className="text-text-muted">Mở hoặc xử lý hồ sơ không tự đóng yêu cầu hỗ trợ. Kiểm tra kết quả thực tế trước khi cập nhật trạng thái.</p></div>}</Async></section>
}
