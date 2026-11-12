import { OperationsPanel } from '@/features/fixed-pt/components/operations-panel'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { PageHeader } from '@/features/workspace/ui'
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
  const status = (ready: boolean, error: string | null, value: string) => ready ? value : error ? 'Không tải được' : 'Đang tải…'
  const priority = [
    { to: '/manager/policies', title: 'Chính sách cần phê duyệt', detail: status(!!policies.data, policies.error, `${missing} chính sách`), warn: missing > 0 },
    { to: '/manager/sessions', title: 'Buổi tập và gián đoạn cần xử lý', detail: `${counts ? `${counts.sessionsNeedingReview} buổi cần kiểm tra` : 'Đang tải buổi tập…'} · ${status(!!disruptions.data, disruptions.error, `${openDisruptions} gián đoạn đang mở`)}`, warn: !!counts?.sessionsNeedingReview || openDisruptions > 0 },
    { to: '/manager/support', title: 'Yêu cầu hỗ trợ', detail: status(!!support.data, support.error, `${openSupport.length} đang mở · ${late} quá 24 giờ`), warn: late > 0 },
    { to: '/manager/payments?tab=reconciliation', title: 'Đối soát tiền nhận', detail: counts ? `${counts.openReconciliation} hồ sơ chưa kết luận` : 'Đang tải…', warn: !!counts?.openReconciliation },
    { to: '/manager/reviews-audit', title: 'Đánh giá huấn luyện viên', detail: status(!!reviews.data, reviews.error, `${avg === null ? 'Chưa có điểm' : `${fmtNumber(avg, 1)}/5`} · ${visible.length} đánh giá hiển thị · ${low} đánh giá ≤ 2/5 trong 14 ngày`), warn: low > 0 },
  ]
  const links = [
    { to: '/manager/reviews-audit?tab=audit', title: 'Nhật ký hệ thống', detail: status(audit.data !== null, audit.error, `${fmtNumber(audit.data ?? 0)} thao tác / 30 ngày`) },
    { to: '/manager/membership-plans', title: 'Bảng giá vé gym' },
    { to: '/manager/reports', title: 'Báo cáo' },
    { to: '/manager/users', title: 'Tài khoản & phân quyền' },
  ]
  return <div>
    <PageHeader title="Vận hành & Kiểm duyệt" />
    <div className="mb-6"><OperationsPanel /></div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <section className="rounded-xl border border-border-subtle bg-bg-surface"><h2 className="border-b border-border-subtle px-5 py-4 font-semibold">Cần theo dõi</h2><ul className="divide-y divide-border-subtle">{priority.map(item => <li key={item.to}><Link to={item.to} className="flex min-h-16 items-center gap-4 px-5 py-3 hover:bg-bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring"><span className="min-w-0 flex-1"><span className="block font-medium">{item.title}</span><span className={`mt-1 block text-sm ${item.warn ? 'text-amber-700 dark:text-amber-400' : 'text-text-muted'}`}>{item.detail}</span></span><ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-text-muted" /></Link></li>)}</ul></section>
      <section className="rounded-xl border border-border-subtle bg-bg-surface"><h2 className="border-b border-border-subtle px-5 py-4 font-semibold">Tra cứu & cấu hình</h2><ul className="divide-y divide-border-subtle">{links.map(item => <li key={item.to}><Link to={item.to} className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring"><span className="min-w-0 flex-1"><span className="block font-medium">{item.title}</span>{item.detail && <span className="mt-1 block text-sm text-text-muted">{item.detail}</span>}</span><ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-text-muted" /></Link></li>)}</ul></section>
    </div>
  </div>
}
