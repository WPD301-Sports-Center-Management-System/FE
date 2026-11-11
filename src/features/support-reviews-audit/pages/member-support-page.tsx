import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLoad } from '@/features/fixed-pt/hooks'
import { hybridGet } from '@/features/fixed-pt/hybrid-api'
import { InlineError, inputCls } from '@/features/workspace/ui'
import { formatVND } from '@/shared/utils/currency'
import { HelpCircle, Plus, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input, Textarea } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { formatDateTime } from '@/shared/utils/date'
import { isAppApiError } from '@/shared/api/api-error'
import { supportRequestsService } from '../services/support-requests.service'
import type { SupportRequest } from '@/shared/types/api'

export function MemberSupportPage() {
  const [params] = useSearchParams()
  const purchases = useLoad(() => hybridGet<{id: string; purchaseCode: string; packageNameSnapshot: string}[]>('/me/pt-packages', {limit:100}))
  const [purchaseId, setPurchaseId] = useState(params.get('purchaseId') ?? '')
  const [category, setCategory] = useState<'GENERAL' | 'COACH' | 'SCHEDULE' | 'PAYMENT'>(params.get('purchaseId') ? 'PAYMENT' : 'GENERAL')
  const [detailError, setDetailError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create ticket state
  const [isCreateOpen, setIsCreateOpen] = useState(!!params.get('purchaseId'))
  const [subject, setSubject] = useState(params.get('refund') ? 'Yêu cầu hoàn phần gói PT chưa dùng' : '')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Detail modal state
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await supportRequestsService.getMySupportRequests({ limit: 50 })
      setTickets(res.data || [])
    } catch (err: any) {
      if (isAppApiError(err)) {
        if (err.status === 401) setErrorMessage('Hết phiên đăng nhập. Vui lòng đăng nhập lại.')
        else if (err.status === 403) setErrorMessage('Không có quyền truy cập yêu cầu hỗ trợ.')
        else setErrorMessage(err.message || 'Không thể tải danh sách yêu cầu hỗ trợ.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ để tải yêu cầu hỗ trợ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleOpenDetail = async (ticket: SupportRequest) => {
    setDetailError(null)
    setIsDetailLoading(true)
    setSelectedTicket(ticket)
    try {
      const detail = await supportRequestsService.getSupportRequestById(ticket.id)
      setSelectedTicket(detail)
    } catch {
      setDetailError('Chưa tải được kết quả xử lý mới nhất. Vui lòng thử lại.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ tiêu đề và nội dung yêu cầu.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await supportRequestsService.createSupportRequest({
        subject: subject.trim(),
        message: message.trim(),
        category,
        ...(purchaseId ? { ptPurchaseId: purchaseId } : {}),
      })
      setSuccessMessage('Yêu cầu hỗ trợ của bạn đã được gửi thành công đến quầy tiếp đón!')
      setIsCreateOpen(false)
      setSubject('')
      setMessage('')
      await loadTickets()
    } catch (err: any) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tạo yêu cầu hỗ trợ.')
      } else {
        setErrorMessage('Không thể tạo yêu cầu hỗ trợ. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReopenTicket = async (ticket: SupportRequest) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const updated = await supportRequestsService.reopenSupportRequest(ticket.id)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, ...updated, status: 'OPEN' } : t))
      )
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket((prev) => (prev ? { ...prev, ...updated, status: 'OPEN' } : prev))
      }
      setSuccessMessage(`Đã mở lại yêu cầu [${ticket.requestCode || ticket.id}] thành công.`)
    } catch (err: any) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể mở lại yêu cầu.')
      } else {
        setErrorMessage('Lỗi khi mở lại yêu cầu hỗ trợ.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <HelpCircle className="h-6 w-6 text-primary" />
            <span>Trung Tâm Hỗ Trợ Hội Viên</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Gửi phản hồi, khiếu nại hoặc thắc mắc dịch vụ trực tiếp tới ban quản lý và quầy lễ tân
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={loadTickets}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Gửi Yêu Cầu Mới</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </div>
      )}

      {/* Ticket List */}
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>Danh Sách Yêu Cầu Của Bạn</span>
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Đang tải danh sách yêu cầu...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle p-10 text-center text-xs text-text-muted space-y-2">
            <p>Bạn chưa có yêu cầu hỗ trợ nào.</p>
            <p className="text-xs opacity-75">Bấm nút "Gửi Yêu Cầu Mới" ở trên nếu cần trợ giúp từ trung tâm.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {tickets.map((t) => (
              <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{t.requestCode || t.id.slice(0, 8)}</span>
                    <StatusBadge status={t.status} context="support" />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">{t.subject}</h4>
                  <p className="text-xs text-text-muted line-clamp-1">{t.message}</p>
                  <p className="text-xs text-text-muted">{formatDateTime(t.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleOpenDetail(t)}
                  >
                    Xem chi tiết
                  </Button>
                  {t.status === 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-primary hover:underline"
                      onClick={() => handleReopenTicket(t)}
                      disabled={isSubmitting}
                    >
                      Mở lại
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Gửi Yêu Cầu Hỗ Trợ Mới"
        description="Điền thông tin chi tiết thắc mắc hoặc sự cố bạn đang gặp phải"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <label className="block space-y-2 text-sm"><span>Loại yêu cầu</span><select aria-label="Loại yêu cầu" className={inputCls} value={category} disabled={isSubmitting} onChange={e => setCategory(e.target.value as typeof category)}><option value="GENERAL">Hỗ trợ chung</option><option value="PAYMENT">Thanh toán / hoàn tiền</option><option value="SCHEDULE">Lịch tập</option><option value="COACH">Coach</option></select></label>
          <label className="block space-y-2 text-sm"><span>Gói PT liên quan</span><select aria-label="Gói PT liên quan" className={inputCls} value={purchaseId} disabled={isSubmitting || purchases.loading} onChange={e => setPurchaseId(e.target.value)}><option value="">Không liên quan gói PT</option>{purchases.data?.map(p => <option key={p.id} value={p.id}>{p.purchaseCode} · {p.packageNameSnapshot}</option>)}</select></label>
          {purchases.error && <><InlineError message={purchases.error} /><Button type="button" variant="outline" onClick={() => void purchases.reload()}>Tải lại gói PT</Button></>}
          {category === 'PAYMENT' && <p className="text-sm text-text-muted">Chọn đúng gói để trung tâm kiểm tra phần chưa dùng. Gửi yêu cầu chưa làm thay đổi gói hoặc phát sinh tiền hoàn.</p>}
          <Input
            label="Chủ đề / Tiêu đề"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ví dụ: Thắc mắc về gia hạn vé tập, đổi HLV..."
            disabled={isSubmitting}
          />
          <Textarea
            label="Nội dung chi tiết"
            required
            rows={4}
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder="Mô tả cụ thể vấn đề hoặc phản ánh của bạn..."
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <InlineError message={errorMessage} />
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Chi tiết yêu cầu [${selectedTicket?.requestCode || selectedTicket?.id?.slice(0, 8)}]`}
        description={selectedTicket ? `Gửi lúc: ${formatDateTime(selectedTicket.createdAt)}` : ''}
      >
        {selectedTicket && (
          <div className="space-y-4 text-xs">
            <Button variant="outline" disabled={isDetailLoading} onClick={() => void handleOpenDetail(selectedTicket)}>Cập nhật tiến độ</Button>
            {isDetailLoading && (
              <div className="py-2 text-center text-text-muted">Đang tải chi tiết mới nhất...</div>
            )}
            {detailError && <><InlineError message={detailError} /><Button variant="outline" onClick={() => void handleOpenDetail(selectedTicket)}>Thử lại kết quả</Button></>}
            {!detailError && selectedTicket.links?.purchase && <div className="space-y-2 rounded-lg border border-border-subtle p-3 text-sm"><Link className="underline" to={`/pt-purchases/${selectedTicket.links.purchase.id}`}>Gói {selectedTicket.links.purchase.purchaseCode}</Link>{selectedTicket.links.purchase.refund ? <><p className="font-semibold">{selectedTicket.links.purchase.refund.status === 'PAID' ? 'Đã chuyển tiền hoàn' : 'Đã chốt hoàn · đang chờ chuyển'} · {formatVND(Number(selectedTicket.links.purchase.refund.amount))}</p><p className="text-text-muted">{selectedTicket.links.purchase.refund.status === 'PAID' ? 'Trung tâm đã ghi nhận khoản chuyển. Liên hệ lễ tân nếu bạn chưa nhận được tiền.' : 'Gói đã đóng; trung tâm đang xử lý chuyển tiền cho bạn.'}</p></> : <p className="text-text-muted">Trung tâm chưa chốt khoản hoàn cho gói này.</p>}</div>}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-muted">Trạng thái:</span>
              <StatusBadge status={selectedTicket.status} context="support" />
            </div>
            <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-4 space-y-1.5">
              <p className="font-bold text-text-primary text-sm">Chủ đề: {selectedTicket.subject}</p>
              <p className="text-text-muted leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>

            {selectedTicket.response ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-1.5">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Phản hồi từ Ban Quản Lý / Lễ Tân:</p>
                <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{selectedTicket.response}</p>
                {selectedTicket.respondedAt && (
                  <p className="text-xs text-text-muted pt-1">
                    Thời gian phản hồi: {formatDateTime(selectedTicket.respondedAt)}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3 text-text-muted text-center">
                Yêu cầu đang chờ nhân viên lễ tân tiếp nhận và xử lý.
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
              {selectedTicket.status === 'RESOLVED' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleReopenTicket(selectedTicket)}
                  disabled={isSubmitting}
                >
                  Mở lại yêu cầu
                </Button>
              ) : (
                <div />
              )}
              <Button type="button" variant="ghost" onClick={() => setSelectedTicket(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
