import { OperationsPanel } from '@/features/fixed-pt/components/operations-panel'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ChevronRight, FileClock, LifeBuoy, ScrollText, ShieldAlert, Star, Ticket, TriangleAlert, Wallet } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Dot, PageHeader } from '@/features/workspace/ui'
import { addDays, fmtNumber } from '@/features/workspace/utils'
import { mgrApi } from '../api'
import { useMgrShell } from '../shell'

export function MgrOpsPage() {
  const { counts } = useMgrShell()
  const policies = useLoad(() => mgrApi.policies(), [])
  const disruptions = useLoad(() => mgrApi.disruptions(), [])
  const reviews = useLoad(() => mgrApi.reviews(), [])
  const audit = useLoad(() => mgrApi.auditTotal(addDays(centerDate(), -30)), [])
  const support = useLoad(() => mgrApi.support(), [])
  const missing = (policies.data ?? []).filter(p => p.source !== 'APPROVED').length
  const openDisruptions = (disruptions.data ?? []).filter(d => d.status !== 'RESOLVED').length
  const visible = (reviews.data ?? []).filter(r => r.moderationStatus === 'VISIBLE')
  const avg = visible.length ? visible.reduce((n, r) => n + r.rating, 0) / visible.length : null
  const low = visible.filter(r => r.rating <= 2 && r.createdAt >= new Date(Date.now() - 14 * 86_400_000).toISOString()).length
  const openSupport = (support.data ?? []).filter(s => s.status === 'OPEN' || s.status === 'IN_PROGRESS')
  const late = openSupport.filter(s => Date.now() - new Date(s.createdAt).getTime() > 24 * 3600_000).length
  const v = (n: number | null | undefined, ready: boolean) => ready ? fmtNumber(n ?? 0) : '…'

  return <div>
    <PageHeader title="Vận hành & Kiểm duyệt" subtitle={<><span>Trung tâm điều khiển các phân hệ quản trị</span><Dot /><span>Chọn một khối để mở chi tiết</span></>} />
    <div className="mb-6"><OperationsPanel /></div>
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <Block to="/manager/policies" icon={<ShieldAlert className="h-5 w-5" />} tone="bg-primary/10 text-primary" title="Chính sách vận hành" value={v(policies.data?.length, !!policies.data)} unit="chính sách"
        meta={policies.data ? (missing ? `${missing} chính sách đang dùng giá trị tạm hoặc còn thiếu` : 'Tất cả đã được phê duyệt') : '…'} hint="Mốc hủy buổi, học bù, vắng, giữ chỗ, chia doanh thu" warn={missing > 0} />
      <Block to="/manager/sessions" icon={<TriangleAlert className="h-5 w-5" />} tone="bg-red-50 text-red-600 dark:bg-red-500/10" title="Buổi cần xử lý & gián đoạn" value={v(openDisruptions, !!disruptions.data)} unit="gián đoạn đang mở"
        meta={counts ? `${counts.sessionsNeedingReview} buổi PT đang gắn cờ kiểm tra` : '…'} hint="Đảo kết quả, ngoại lệ vé gym, tạm dừng gói khi có sự cố" warn={openDisruptions > 0 || !!counts?.sessionsNeedingReview} />
      <Block to="/manager/reviews-audit" icon={<Star className="h-5 w-5" />} tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10" title="Kiểm duyệt đánh giá Coach" value={avg === null ? (reviews.data ? '—' : '…') : `★ ${fmtNumber(avg, 1)}`} unit={reviews.data ? `${visible.length} đánh giá đang hiển thị` : ''}
        meta={reviews.data ? `${reviews.data.length - visible.length} đã ẩn · ${low} đánh giá ≤ 2★ trong 14 ngày` : '…'} hint="Đánh giá hiện ngay trên app; Manager ẩn kèm lý do khi vi phạm" warn={low > 0} />
      <Block to="/manager/reviews-audit" icon={<ScrollText className="h-5 w-5" />} tone="bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300" title="Nhật ký hệ thống" value={v(audit.data, audit.data !== null)} unit="thao tác / 30 ngày"
        meta="Ai làm gì, lúc nào, trước và sau" hint="Lọc theo người dùng, hành động, đối tượng; xuất CSV cho kiểm toán" />
      <Block to="/manager/support" icon={<LifeBuoy className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" title="Yêu cầu hỗ trợ" value={v(openSupport.length, !!support.data)} unit="đang mở"
        meta={support.data ? (late ? `${late} yêu cầu mở quá 24 giờ` : 'Không có yêu cầu tồn quá 24 giờ') : '…'} hint="Lễ tân trả lời hội viên; Manager theo dõi tồn đọng" warn={late > 0} />
      <Block to="/manager/payments?tab=reconciliation" icon={<Wallet className="h-5 w-5" />} tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10" title="Đối soát tiền nhận" value={v(counts?.openReconciliation, !!counts)} unit="hồ sơ chưa kết luận"
        meta="Tiền đến muộn, trùng, sai số tiền" hint="Kết luận hồ sơ; hệ thống không tự hoàn tiền" warn={!!counts?.openReconciliation} />
      <Block to="/manager/membership-plans" icon={<Ticket className="h-5 w-5" />} tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10" title="Bảng giá vé gym" value="" unit="" meta="Chỉnh giá, mở / đóng bán vé" hint="Đơn đã bán giữ nguyên giá cũ" />
      <Block to="/manager/reports" icon={<BarChart3 className="h-5 w-5" />} tone="bg-primary/10 text-primary" title="Báo cáo" value="" unit="" meta="Doanh thu, gói PT, buổi tập, Coach, thiết bị" hint="Lọc theo khoảng ngày, xuất CSV / Excel" />
      <Block to="/manager/users" icon={<FileClock className="h-5 w-5" />} tone="bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300" title="Tài khoản & phân quyền" value="" unit="" meta="Tạo tài khoản nhân sự, khóa / mở, đặt lại mật khẩu" hint="Vai trò: Manager, Lễ tân, Coach, Hội viên" />
    </div>
  </div>
}

function Block({ to, icon, tone, title, value, unit, meta, hint, warn }: { to: string; icon: ReactNode; tone: string; title: string; value: string; unit: string; meta: string; hint: string; warn?: boolean }) {
  return <Link to={to} className="group flex flex-col rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50">
    <div className="flex items-start gap-3">
      <span aria-hidden className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
      <div className="min-w-0 flex-1"><p className="font-semibold">{title}</p><p className="text-xs text-text-muted">{hint}</p></div>
      <ChevronRight aria-hidden className="h-5 w-5 text-text-muted transition-transform group-hover:translate-x-0.5" />
    </div>
    {value && <p className="mt-4 text-2xl font-bold tabular-nums">{value}<span className="ml-1.5 text-sm font-medium text-text-muted">{unit}</span></p>}
    <p className={`mt-auto pt-3 text-sm ${warn ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-text-muted'}`}>{meta}</p>
  </Link>
}
