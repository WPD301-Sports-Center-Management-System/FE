import { useState } from 'react'
import { EyeOff, Eye } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import type { CoachReview, AuditLog } from '@/shared/types/api'

export function ReviewsAuditPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'audit'>('reviews')
  const [reviews, setReviews] = useState<CoachReview[]>([...db.reviews])
  const [auditLogs] = useState<AuditLog[]>([...db.auditLogs])

  // Hide Review Modal
  const [hideReview, setHideReview] = useState<CoachReview | null>(null)
  const [hideReason, setHideReason] = useState('Nội dung không phù hợp quy chuẩn')

  const handleConfirmHide = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hideReview) return
    hideReview.moderationStatus = 'HIDDEN'
    hideReview.moderationReason = hideReason
    setReviews([...db.reviews])
    setHideReview(null)
  }

  const handleShowReview = (rev: CoachReview) => {
    rev.moderationStatus = 'VISIBLE'
    rev.moderationReason = undefined
    setReviews([...db.reviews])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Kiểm Duyệt Đánh Giá & Audit Log (WEB-MAN-11, 12)</h1>
        <p className="text-xs text-slate-400 mt-1">Giám sát tính minh bạch đánh giá HLV và nhật ký thao tác dữ liệu</p>
      </div>

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

      {activeTab === 'reviews' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{rev.memberDisplayName}</p>
                  <p className="text-[10px] text-slate-400">{rev.courseNameSnapshot}</p>
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
                  <div className="flex text-amber-400 text-xs">★ {rev.rating}</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>

              {rev.moderationReason && (
                <p className="text-[10px] text-red-400">Lý do ẩn: {rev.moderationReason}</p>
              )}

              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-500">
                <span>{formatDate(rev.createdAt)}</span>
                {rev.moderationStatus === 'VISIBLE' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-400 hover:bg-red-950/30"
                    onClick={() => setHideReview(rev)}
                  >
                    <EyeOff className="h-3.5 w-3.5 mr-1" />
                    Ẩn đánh giá
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-emerald-400"
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
                    <td className="py-3.5 px-4 font-semibold text-white">{log.actorName}</td>
                    <td className="py-3.5 px-4 font-mono text-orange-400">{log.action}</td>
                    <td className="py-3.5 px-4">{log.entityType}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{log.entityId}</td>
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
          <div className="flex justify-end gap-2 pt-2">
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
