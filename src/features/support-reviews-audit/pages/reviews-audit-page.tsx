import { useState, useEffect, useCallback } from 'react'
import {
  EyeOff,
  Eye,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Star,
  Download,
  Info,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import { reviewsAuditService } from '@/features/support-reviews-audit/services/reviews-audit.service'
import { downloadBlob } from '@/shared/utils/download'
import { isAppApiError } from '@/shared/api/api-error'
import type { CoachReview, AuditLog } from '@/shared/types/api'

export function ReviewsAuditPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'audit'>('reviews')
  const [reviews, setReviews] = useState<CoachReview[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Audit Filters
  const [auditActionFilter, setAuditActionFilter] = useState('')
  const [auditEntityFilter, setAuditEntityFilter] = useState('')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [isExportingAudit, setIsExportingAudit] = useState(false)

  // Audit Detail Modal
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null)
  const [isLoadingAuditDetail, setIsLoadingAuditDetail] = useState(false)

  // Hide Review Modal
  const [hideReview, setHideReview] = useState<CoachReview | null>(null)
  const [hideReason, setHideReason] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const auditParams = {
        limit: 50,
        action: auditActionFilter ? auditActionFilter : undefined,
        entityType: auditEntityFilter ? auditEntityFilter : undefined,
        from: auditDateFrom ? auditDateFrom : undefined,
        to: auditDateTo ? auditDateTo : undefined,
      }
      const [revRes, logRes] = await Promise.all([
        reviewsAuditService.getCoachReviews({ limit: 50 }),
        reviewsAuditService.getAuditLogs(auditParams),
      ])
      setReviews(revRes.data || [])
      setAuditLogs(logRes.data || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải dữ liệu kiểm duyệt.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [auditActionFilter, auditEntityFilter, auditDateFrom, auditDateTo])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleConfirmHide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hideReview) return
    setIsActionLoading(true)
    setErrorMessage(null)
    setActionSuccessMessage(null)
    try {
      const updated = await reviewsAuditService.moderateReview(hideReview.id, {
        moderationStatus: 'HIDDEN',
        reason: hideReason.trim() || 'Nội dung không phù hợp',
      })
      setReviews((prev) =>
        prev.map((r) =>
          r.id === hideReview.id
            ? { ...r, ...updated, moderationStatus: 'HIDDEN', hiddenReason: hideReason, moderationReason: hideReason }
            : r
        )
      )
      setHideReview(null)
      setActionSuccessMessage('Đã ẩn đánh giá khỏi trang công khai thành công!')
      // Refresh audit logs
      reviewsAuditService.getAuditLogs({ limit: 50 }).then((res) => {
        if (res?.data) setAuditLogs(res.data)
      }).catch(() => {})
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi ẩn đánh giá.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ để ẩn đánh giá.')
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleShowReview = async (rev: CoachReview) => {
    setIsActionLoading(true)
    setErrorMessage(null)
    setActionSuccessMessage(null)
    try {
      const updated = await reviewsAuditService.moderateReview(rev.id, {
        moderationStatus: 'VISIBLE',
      })
      setReviews((prev) =>
        prev.map((r) =>
          r.id === rev.id
            ? { ...r, ...updated, moderationStatus: 'VISIBLE', moderationReason: undefined }
            : r
        )
      )
      setActionSuccessMessage('Đã bỏ ẩn và hiển thị lại đánh giá thành công!')
      // Refresh audit logs
      reviewsAuditService.getAuditLogs({ limit: 50 }).then((res) => {
        if (res?.data) setAuditLogs(res.data)
      }).catch(() => {})
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi mở hiển thị đánh giá.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ để hiển thị đánh giá.')
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleExportAudit = async () => {
    setIsExportingAudit(true)
    setErrorMessage(null)
    try {
      const blob = await reviewsAuditService.exportAuditLogs({
        action: auditActionFilter ? auditActionFilter : undefined,
        entityType: auditEntityFilter ? auditEntityFilter : undefined,
        from: auditDateFrom ? auditDateFrom : undefined,
        to: auditDateTo ? auditDateTo : undefined,
      })
      const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      await downloadBlob(blob, filename)
      setActionSuccessMessage('Đã xuất file nhật ký kiểm toán (CSV) thành công!')
    } catch (err: any) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi xuất audit log.')
      } else {
        setErrorMessage(err.message || 'Không thể tải file xuất kiểm toán.')
      }
    } finally {
      setIsExportingAudit(false)
    }
  }

  const handleOpenAuditDetail = async (log: AuditLog) => {
    setIsLoadingAuditDetail(true)
    setSelectedAuditLog(log)
    try {
      const detail = await reviewsAuditService.getAuditLogById(log.id)
      setSelectedAuditLog(detail)
    } catch {
      // Keep selected log summary if detail endpoint returns same
    } finally {
      setIsLoadingAuditDetail(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <span>Kiểm Duyệt Đánh Giá & Audit Log (WEB-MAN-11, 12)</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Giám sát tính minh bạch đánh giá HLV và nhật ký thao tác dữ liệu hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'audit' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportAudit}
              disabled={isExportingAudit}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExportingAudit ? 'Đang xuất...' : 'Xuất CSV Audit'}</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-600 dark:text-emerald-300">
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Kiểm duyệt Đánh giá HLV ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Nhật ký hệ thống Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* Audit Log Filters */}
      {activeTab === 'audit' && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border-subtle bg-bg-surface-muted text-xs">
          <span className="text-text-muted font-semibold">Lọc nhật ký:</span>
          <input
            type="text"
            placeholder="Lọc theo hành động (VD: PAYOUT_PAID)"
            value={auditActionFilter}
            onChange={(e) => setAuditActionFilter(e.target.value)}
            className="rounded-lg border border-border-subtle bg-bg-input px-2.5 py-1 text-xs text-text-primary placeholder:text-text-muted/60"
          />
          <input
            type="text"
            placeholder="Lọc theo đối tượng (VD: CoachPayout)"
            value={auditEntityFilter}
            onChange={(e) => setAuditEntityFilter(e.target.value)}
            className="rounded-lg border border-border-subtle bg-bg-input px-2.5 py-1 text-xs text-text-primary placeholder:text-text-muted/60"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Từ:</span>
            <input
              type="date"
              value={auditDateFrom}
              onChange={(e) => setAuditDateFrom(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-input px-2 py-1 text-xs text-text-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Đến:</span>
            <input
              type="date"
              value={auditDateTo}
              onChange={(e) => setAuditDateTo(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-input px-2 py-1 text-xs text-text-primary"
            />
          </div>
          {(auditActionFilter || auditEntityFilter || auditDateFrom || auditDateTo) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAuditActionFilter('')
                setAuditEntityFilter('')
                setAuditDateFrom('')
                setAuditDateTo('')
              }}
              className="text-xs h-7 text-text-muted hover:text-text-primary"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-muted">Đang tải dữ liệu kiểm duyệt...</p>
        </div>
      ) : activeTab === 'reviews' ? (
        reviews.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-xs rounded-2xl border border-border-subtle bg-bg-surface-muted">
            Chưa có đánh giá nào được gửi từ học viên.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      {rev.memberDisplayName || (rev as any).member?.fullName || 'Học viên ẩn danh'}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {rev.courseNameSnapshot || (rev as any).course?.name || 'Khóa tập PT 1:1'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        rev.moderationStatus === 'VISIBLE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-danger/10 text-danger border border-danger/20'
                      }`}
                    >
                      {rev.moderationStatus === 'VISIBLE' ? 'Hiển thị công khai' : 'Đã ẩn'}
                    </span>
                    <div className="flex items-center text-amber-500 dark:text-amber-400 text-xs font-bold">
                      <Star className="h-3 w-3 fill-amber-500 dark:fill-amber-400 mr-0.5" />
                      <span>{rev.rating}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-text-primary italic">"{rev.comment || 'Không có nhận xét chi tiết.'}"</p>

                {(rev.hiddenReason || rev.moderationReason) && (
                  <p className="text-[10px] text-danger">Lý do ẩn: {rev.hiddenReason || rev.moderationReason}</p>
                )}

                <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-[10px] text-text-muted">
                  <span>{formatDate(rev.createdAt)}</span>
                  {rev.moderationStatus === 'VISIBLE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-danger hover:bg-danger/10 h-7"
                      onClick={() => setHideReview(rev)}
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Ẩn đánh giá
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-emerald-600 dark:text-emerald-400 h-7"
                      onClick={() => handleShowReview(rev)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Hiện lại
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : auditLogs.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-xs rounded-2xl border border-border-subtle bg-bg-surface-muted">
          Chưa có nhật ký ghi nhận hành động nào theo điều kiện lọc.
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-2 shadow-sm">
          <p className="text-[11px] text-text-muted">Nhấn vào một bản ghi để xem chi tiết đầy đủ</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-primary">
              <thead className="border-b border-border-subtle text-text-muted uppercase bg-bg-surface-muted">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Đối tượng</th>
                  <th className="py-3 px-4">Mã bản ghi</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleOpenAuditDetail(log)}
                    className="hover:bg-bg-surface-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-text-muted">{formatDateTime(log.createdAt)}</td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {log.actorName || log.actorId?.slice(0, 8) || 'System'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-primary font-bold">{log.action}</td>
                    <td className="py-3.5 px-4">{log.entityType}</td>
                    <td className="py-3.5 px-4 font-mono text-text-muted">{log.entityId || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] text-text-muted hover:text-text-primary">
                        <Info className="h-3 w-3 mr-1" />
                        Xem
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hide Review Modal */}
      <Modal
        isOpen={!!hideReview}
        onClose={() => setHideReview(null)}
        title="Xác nhận ẩn đánh giá khỏi hồ sơ công khai"
        description="Đánh giá bị ẩn sẽ không hiển thị trên trang Profile của Huấn luyện viên"
      >
        <form onSubmit={handleConfirmHide} className="space-y-4">
          <Textarea
            label="Lý do kiểm duyệt / ẩn"
            required
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder="Nhập lý do kiểm duyệt / ẩn đánh giá này..."
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setHideReview(null)} disabled={isActionLoading}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" disabled={isActionLoading}>
              {isActionLoading ? 'Đang xử lý...' : 'Xác nhận ẩn'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={!!selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
        title="Chi tiết Nhật Ký Kiểm Toán (Audit Detail)"
        description={`Mã log: ${selectedAuditLog?.id}`}
      >
        {isLoadingAuditDetail ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : selectedAuditLog ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-bg-surface-muted border border-border-subtle">
              <div>
                <span className="text-text-muted block">Thời gian ghi nhận:</span>
                <span className="text-text-primary font-mono">{formatDateTime(selectedAuditLog.createdAt)}</span>
              </div>
              <div>
                <span className="text-text-muted block">Hành động:</span>
                <span className="text-primary font-bold font-mono">{selectedAuditLog.action}</span>
              </div>
              <div>
                <span className="text-text-muted block">Đối tượng áp dụng:</span>
                <span className="text-cyan-600 dark:text-cyan-300 font-semibold">{selectedAuditLog.entityType}</span>
              </div>
              <div>
                <span className="text-text-muted block">Mã đối tượng (Entity ID):</span>
                <span className="text-text-primary font-mono">{selectedAuditLog.entityId || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-text-muted block">Người thực hiện:</span>
                <span className="text-text-primary font-mono">
                  {selectedAuditLog.actorName ? `${selectedAuditLog.actorName} (${selectedAuditLog.actorId})` : selectedAuditLog.actorId || 'Hệ thống tự động'}
                </span>
              </div>
              {((selectedAuditLog as any).ipAddress || (selectedAuditLog as any).userAgent) && (
                <div className="col-span-2 border-t border-border-subtle pt-2 text-[11px] text-text-muted">
                  <span className="text-text-muted block">Môi trường client:</span>
                  <p className="font-mono truncate">IP: {(selectedAuditLog as any).ipAddress || '—'} • {(selectedAuditLog as any).userAgent || ''}</p>
                </div>
              )}
            </div>

            {/* Diff / Change Data Section */}
            {(selectedAuditLog.beforeData || selectedAuditLog.afterData) ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">Chi Tiết Biến Động Dữ Liệu (Data Diff):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-bg-surface border border-danger/30 space-y-1">
                    <span className="text-danger font-semibold block text-[11px]">Dữ liệu trước (Before):</span>
                    {selectedAuditLog.beforeData ? (
                      <pre className="text-[10px] font-mono text-text-primary bg-bg-surface-muted p-2 rounded overflow-x-auto max-h-40 border border-border-subtle">
                        {JSON.stringify(selectedAuditLog.beforeData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-text-muted italic text-[11px]">Không có dữ liệu trước</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-bg-surface border border-emerald-500/30 space-y-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold block text-[11px]">Dữ liệu sau (After):</span>
                    {selectedAuditLog.afterData ? (
                      <pre className="text-[10px] font-mono text-text-primary bg-bg-surface-muted p-2 rounded overflow-x-auto max-h-40 border border-border-subtle">
                        {JSON.stringify(selectedAuditLog.afterData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-text-muted italic text-[11px]">Không có dữ liệu sau</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-bg-surface-muted border border-border-subtle text-text-muted text-center text-[11px]">
                Bản ghi này ghi nhận sự kiện hệ thống đơn thuần (không có payload biến động dữ liệu).
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setSelectedAuditLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
