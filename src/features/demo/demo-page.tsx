import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { hybridGet, hybridSend } from '@/features/fixed-pt/hybrid-api'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { formatDateTime } from '@/shared/utils/date'

export const demoVisible = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'
interface Purchase {
  id: string; code: string; status: string; memberName: string; memberEmail: string
  coachName: string; coachEmail: string; gymValid: boolean; formReady: boolean
}
interface Session { id: string; purchaseId: string; status: string; startsAt: string; endsAt: string }
interface Scenario { purchases: Purchase[]; sessions: Session[]; serverNow: string }
const states: Record<string, string> = { SCHEDULED: 'Chưa diễn ra', ARRIVED: 'Đã đến', IN_PROGRESS: 'Đang tập', COMPLETED: 'Hoàn thành', ACTIVE: 'Đang hoạt động', PENDING_PAYMENT: 'Chờ thanh toán', CANCELLED_EARLY: 'Nghỉ đúng hạn', CANCELLED_LATE: 'Nghỉ muộn', NO_SHOW: 'Vắng mặt', PAUSED: 'Bảo lưu' }
const steps = [
  { role: 'Member', title: 'Mua vé gym và gói PT', screen: '/member/membership-sale → /member/pt-sale', detail: 'Nhập mong muốn tập luyện. Mua vé gym, chọn Coach demo, gói 3 buổi và lịch tuần. Xác nhận chính sách, tạo đơn và thanh toán.' },
  { role: 'Lễ tân', title: 'Kiểm tra thanh toán và lịch', screen: '/receptionist/payments → /receptionist/calendar', detail: 'Nếu chọn trả tại quầy, thu tiền và hoàn tất xử lý theo màn hình. Kiểm tra gói đã kích hoạt và chuỗi buổi đã xuất hiện; nhận tiền chưa đồng nghĩa đã áp dụng gói.' },
  { role: 'Coach', title: 'Khởi tạo lộ trình và nội dung buổi', screen: '/coach/students → chọn học viên demo', detail: 'Hoàn thành Form 1 của gói, ghi nhận số đo ban đầu và chuẩn bị nội dung buổi tập.' },
  { role: 'Coach → Manager', title: 'Chứng minh ràng buộc, rồi chuyển mốc demo', screen: '/coach/schedule → /manager/demo', detail: 'Mở buổi chưa đến giờ, cho thấy lý do chưa được bắt đầu. Trở lại bảng demo, chọn đúng gói và bấm Đưa buổi kế tiếp về hiện tại.' },
  { role: 'Lễ tân → Coach', title: 'Ghi đã đến, bắt đầu và kết thúc', screen: '/receptionist/calendar → /coach/schedule', detail: 'Tải lại lịch, mở buổi vừa dời. Lễ tân ghi học viên đã đến; Coach bắt đầu, nhập kết quả và kết thúc. Nếu kết thúc sớm, nhập lý do: “Rút ngắn buổi để trình diễn”.' },
  { role: 'Member → Coach', title: 'Xem kết quả và hoàn tất gói', screen: '/member/goals → /coach/progress', detail: 'Cho thấy lịch sử, tiến độ và số buổi còn lại. Lặp lại chuyển mốc → đã đến → bắt đầu → kết quả → kết thúc cho các buổi còn lại; chỉ chuyển sau khi hoàn tất buổi hiện tại.' },
  { role: 'Coach → Manager', title: 'Trình bày quyết toán và chi trả', screen: '/coach/earnings → /manager/coach-income', detail: 'Khi gói đủ điều kiện, Coach gửi yêu cầu quyết toán. Manager kiểm tra, duyệt và ghi nhận đã chi với tham chiếu chi trả demo. Phân biệt rõ đã duyệt và đã chi.' },
]

export function DemoPage() {
  const data = useLoad(() => hybridGet<Scenario>('/demo/scenarios'), [], demoVisible)
  const [selected, setSelected] = useState('')
  const [confirm, setConfirm] = useState<Session | null>(null)
  const [notice, setNotice] = useState('')
  const act = useSubmit()
  const purchase = data.data?.purchases.find(p => p.id === selected) ?? data.data?.purchases[0]
  const sessions = data.data?.sessions.filter(s => s.purchaseId === purchase?.id) ?? []
  const next = sessions.find(s => s.status === 'SCHEDULED')
  const occupied = sessions.some(s => ['ARRIVED', 'IN_PROGRESS'].includes(s.status))
  if (!demoVisible) return <p>Bảng demo chưa bật trong bản web này.</p>
  const warp = async () => {
    if (!confirm) return
    await act.run(async () => {
      const result = await hybridSend<{ startsAt: string }>('post', `/demo/sessions/${confirm.id}/warp`, {})
      setConfirm(null)
      setNotice(`Đã chuyển lịch bắt đầu sang ${formatDateTime(result.startsAt)}. Mở lại lịch ở cửa sổ Lễ tân và Coach để tiếp tục.`)
      await data.reload()
    })
  }
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Trình diễn luồng PT</h1><p className="mt-1 text-sm text-text-muted">ApexFIT · Thao tác thật trên giao diện, chuyển lịch tại bước phải chờ.</p></div>
      <Button variant="outline" onClick={() => { setNotice(''); void data.reload() }} isLoading={data.loading}>Cập nhật trạng thái</Button>
    </header>
    <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-3 text-sm">
      Môi trường demo local · Chỉ Manager được chuyển lịch của Member và Coach demo. Thời gian hệ thống vẫn chạy bình thường.
    </div>
    {(data.error || act.error) && <div role="alert" className="rounded-lg border border-danger p-4 text-sm text-danger">{data.error || act.error}</div>}
    {notice && <p role="status" className="rounded-lg border border-border-strong bg-bg-surface p-4 text-sm">{notice}</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 rounded-lg border border-border-subtle bg-bg-surface p-4 sm:p-5" aria-labelledby="scenario-title">
        <h2 id="scenario-title" className="mb-4 text-base font-semibold">Gói đang trình diễn</h2>
        <label htmlFor="demo-purchase" className="mb-2 block text-sm">Chọn học viên / gói demo</label>
        <select id="demo-purchase" value={purchase?.id ?? ''} onChange={e => { setSelected(e.target.value); setNotice(''); act.clear() }} className="min-h-11 w-full rounded-lg border border-border-strong bg-bg-surface px-3 text-sm" disabled={!data.data?.purchases.length}>
          {!data.data?.purchases.length && <option value="">Chưa có gói demo</option>}
          {data.data?.purchases.map(p => <option key={p.id} value={p.id}>{p.memberName} · {p.code} · {states[p.status] ?? p.status}</option>)}
        </select>
        {purchase ? <>
          <p className="mt-3 break-words text-sm text-text-muted">{purchase.memberEmail}<br />Coach: {purchase.coachName} · {purchase.coachEmail}</p>
          <dl className="my-4 grid grid-cols-2 gap-4 border-y border-border-subtle py-4 text-sm">
            <div><dt className="text-text-muted">Vé gym hôm nay</dt><dd className="mt-1">{purchase.gymValid ? 'Hợp lệ' : 'Cần mua / gia hạn'}</dd></div>
            <div><dt className="text-text-muted">Form 1 của gói</dt><dd className="mt-1">{purchase.formReady ? 'Đã hoàn thành' : 'Coach cần hoàn thành'}</dd></div>
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-sm font-medium">Bước chuyển thời gian</h3><p className="mt-1 text-xs text-text-muted">Đưa giờ bắt đầu về cách hiện tại 2 phút, giữ thời lượng buổi.</p></div>
            <Button className="bg-text-primary text-bg-surface hover:bg-text-primary/90" disabled={!next || occupied || purchase.status !== 'ACTIVE' || data.loading || !!data.error || act.busy} onClick={() => { act.clear(); setConfirm(next!) }}>Đưa buổi kế tiếp về hiện tại</Button>
          </div>
          <p className="mt-3 text-sm text-text-muted">{occupied ? 'Hoàn tất buổi đã đến / đang tập trước khi chuyển tiếp.' : !next ? 'Không còn buổi chờ trong gói này.' : 'Sau khi chuyển: tải lại lịch → ghi đã đến → Coach bắt đầu.'}</p>
          <ol className="mt-5 divide-y divide-border-subtle" aria-label="Các buổi của gói">
            {sessions.map((s, i) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><span className="font-medium">Buổi {i + 1}</span><p className="mt-1 text-xs text-text-muted">{formatDateTime(s.startsAt)} – {formatDateTime(s.endsAt)}</p></div><span>{states[s.status] ?? s.status}</span></li>)}
          </ol>
        </> : <div className="mt-5 space-y-3 text-sm text-text-muted"><p>{data.loading ? 'Đang tải dữ liệu demo…' : 'Chuẩn bị tài khoản demo, rồi dùng Member mua gói trên giao diện. Bấm Cập nhật trạng thái để thấy gói tại đây.'}</p><p>Chỉ các gói có cả Member và Coach dùng email demo.…@apexfit.demo được hiển thị.</p></div>}
      </section>
      <aside className="space-y-4 rounded-lg border border-border-subtle bg-bg-surface p-5">
        <h2 className="text-base font-semibold">Trước khi chiếu màn hình</h2>
        <p className="text-sm text-text-muted">Mở 4 hồ sơ trình duyệt riêng cho Member, Lễ tân, Coach và Manager. Các tab cùng hồ sơ dùng chung phiên đăng nhập.</p>
        <p className="text-sm text-text-muted">Dùng gói 3 buổi cho luồng chính; dùng học viên thứ hai cho đổi lịch, báo nghỉ và học bù.</p>
        <blockquote className="border-l-2 border-border-strong pl-3 text-sm leading-6">“Em dùng dữ liệu demo để rút ngắn thời gian chờ. Các bước mua gói, thanh toán và tập luyện đều thao tác trực tiếp trên giao diện.”</blockquote>
        <Link to="/manager/pt-board" className="inline-block text-sm underline underline-offset-4">Mở lịch PT trung tâm</Link>
      </aside>
    </div>
    <section aria-labelledby="script-title">
      <h2 id="script-title" className="mb-3 text-base font-semibold">Kịch bản trình bày trên màn hình</h2>
      <ol className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-bg-surface px-4 sm:px-5">
        {steps.map((step, i) => <li key={step.title} className="grid gap-2 py-4 sm:grid-cols-[32px_150px_minmax(0,1fr)]"><span className="text-sm tabular-nums text-text-muted">{i + 1}</span><span className="text-sm font-medium">{step.role}</span><div><h3 className="text-sm font-medium">{step.title}</h3><p className="mt-1 text-sm leading-6 text-text-muted">{step.detail}</p><p className="mt-2 break-words text-xs text-text-muted">Màn hình: {step.screen}</p></div></li>)}
      </ol>
    </section>
    <Modal isOpen={!!confirm} onClose={() => { if (!act.busy) setConfirm(null) }} title="Chuyển lịch buổi demo về hiện tại">
      <p className="text-sm leading-6">{purchase?.memberName} · {purchase?.code}<br />Lịch hiện tại: {confirm && formatDateTime(confirm.startsAt)}.<br />Buổi sẽ bắt đầu cách hiện tại 2 phút. Thao tác này được ghi vào lịch sử demo; nội dung, kết quả và tiền không được tự động tạo.</p>
      {act.error && <p role="alert" className="mt-3 text-sm text-danger">{act.error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={act.busy} onClick={() => setConfirm(null)}>Giữ lịch hiện tại</Button><Button isLoading={act.busy} onClick={() => void warp()}>Chuyển lịch demo</Button></div>
    </Modal>
  </div>
}
