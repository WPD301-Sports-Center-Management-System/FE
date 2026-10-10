import { useState, useEffect, useCallback } from 'react'
import { EyeOff, Eye, RefreshCw, AlertCircle, ShieldAlert, Star } from 'lucide-react'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import { reviewsAuditService } from '@/features/support-reviews-audit/services/reviews-audit.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { CoachReview, AuditLog } from '@/shared/types/api'

export function ReviewsAuditPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'audit'>('reviews')
  const [reviews, setReviews] = useState<CoachReview[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Hide Review Modal
  const [hideReview, setHideReview] = useState<CoachReview | null>(null)
  const [hideReason, setHideReason] = useState('Nội dung không phù hợp quy chuẩn')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [revRes, logRes] = await Promise.all([
        reviewsAuditService.getCoachReviews({ limit: 50 }),
        reviewsAuditService.getAuditLogs({ limit: 50 }),
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
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleConfirmHide = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hideReview) return
    setReviews((prev) =>
      prev.map((r) =>
        r.id === hideReview.id
          ? { ...r, moderationStatus: 'HIDDEN', moderationReason: hideReason }
          : r
      )
    )
    setHideReview(null)
  }

  const handleShowReview = (rev: CoachReview) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === rev.id
          ? { ...r, moderationStatus: 'VISIBLE', moderationReason: undefined }
          : r
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
            <span>Kiểm Duyệt Đánh Giá & Audit Log (WEB-MAN-11, 12)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Giám sát tính minh bạch đánh giá HLV và nhật ký thao tác dữ liệu hệ thống</p>
        </div>
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

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Kiểm duyệt Đánh giá HLV ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Nhật ký hệ thống Audit Log ({auditLogs.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs text-slate-400">Đang tải dữ liệu kiểm duyệt...</p>
        </div>
      ) : activeTab === 'reviews' ? (
        reviews.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs rounded-2xl border border-slate-800 bg-slate-900/40">
            Chưa có đánh giá nào được gửi từ học viên.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{rev.memberDisplayName || (rev as any).member?.fullName || 'Học viên ẩn danh'}</p>
                    <p className="text-[10px] text-slate-400">{rev.courseNameSnapshot || (rev as any).course?.name || 'Khóa tập PT 1:1'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        rev.moderationStatus === 'VISIBLE'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-950/40 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {rev.moderationStatus === 'VISIBLE' ? 'Hiển thị công khai' : 'Đã ẩn'}
                    </span>
                    <div className="flex items-center text-amber-400 text-xs font-bold">
                      <Star className="h-3 w-3 fill-amber-400 mr-0.5" />
                      <span>{rev.rating}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic">"{rev.comment || 'Không có nhận xét chi tiết.'}"</p>

                {rev.moderationReason && (
                  <p className="text-[10px] text-red-400">Lý do ẩn: {rev.moderationReason}</p>
                )}

                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-500">
                  <span>{formatDate(rev.createdAt)}</span>
                  {rev.moderationStatus === 'VISIBLE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-400 hover:bg-red-950/30 h-7"
                      onClick={() => setHideReview(rev)}
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Ẩn đánh giá
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-emerald-400 h-7"
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
        <div className="text-center py-12 text-slate-400 text-xs rounded-2xl border border-slate-800 bg-slate-900/40">
          Chưa có nhật ký ghi nhận hành động nào.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Đối tượng</th>
                  <th className="py-3 px-4">Mã bản ghi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{formatDateTime(log.createdAt)}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{log.actorName || log.actorId?.slice(0, 8) || 'System'}</td>
                    <td className="py-3.5 px-4 font-mono text-orange-400 font-bold">{log.action}</td>
                    <td className="py-3.5 px-4">{log.entityType}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{log.entityId || '—'}</td>
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
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setHideReview(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="danger">
              Xác nhận ẩn
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
