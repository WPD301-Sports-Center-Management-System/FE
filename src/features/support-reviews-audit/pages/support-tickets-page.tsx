import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'
import { supportRequestsService } from '../services/support-requests.service'
import { formatDateTime } from '@/shared/utils/date'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import { isAppApiError } from '@/shared/api/api-error'
import type { SupportRequest } from '@/shared/types/api'

export function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportRequest[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await supportRequestsService.getSupportRequests({ limit: 100 })
      const list = res?.data || (Array.isArray(res) ? res : [])
      setTickets(list)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải danh sách yêu cầu hỗ trợ.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ hỗ trợ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !replyText.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const updated = await supportRequestsService.updateSupportRequest(selectedTicket.id, {
        status: 'RESOLVED',
        response: replyText.trim(),
      })

      // Immutable state update
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, ...updated } : t)))
      setSelectedTicket(null)
      setReplyText('')
      setSuccessMessage(`Đã phản hồi và xử lý thành công ticket [${updated.requestCode || selectedTicket.id}]!`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi gửi phản hồi ticket.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ để cập nhật yêu cầu.')
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
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...updated, status: 'OPEN' } : t)))
      setSelectedTicket(null)
      setSuccessMessage(`Đã mở lại ticket [${ticket.requestCode || ticket.id}] thành công.`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể mở lại yêu cầu hỗ trợ.')
      } else {
        setErrorMessage('Lỗi hệ thống khi mở lại yêu cầu hỗ trợ.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<SupportRequest>[] = [
    {
      header: 'Mã Ticket',
      accessor: (row) => <span className="font-mono font-bold text-primary">{row.requestCode || row.id.slice(0, 8)}</span>,
    },
    { header: 'Hội viên gửi', accessor: (row) => row.memberName || 'Hội viên' },
    { header: 'Chủ đề', accessor: (row) => row.subject || 'Hỗ trợ' },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Thời gian gửi',
      accessor: (row) => formatDateTime(row.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Yêu Cầu Hỗ Trợ Tại Quầy (WEB-REC-10)</h1>
          <p className="text-xs text-text-muted mt-1">
            Tiếp nhận khiếu nại, phản hồi đổi lịch và giải đáp thắc mắc từ hội viên
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadTickets}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={tickets}
        searchKey="subject"
        actions={(row) => (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              setSelectedTicket(row)
              setReplyText(row.response || '')
            }}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            {row.status === 'RESOLVED' || row.status === 'CLOSED' ? 'Xem phản hồi' : 'Xử lý ticket'}
          </Button>
        )}
      />

      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Xử lý yêu cầu [${selectedTicket?.requestCode || selectedTicket?.id?.slice(0, 8)}]`}
        description={`Người gửi: ${selectedTicket?.memberName || 'Hội viên'}`}
      >
        {selectedTicket && (
          <form onSubmit={handleSendResponse} className="space-y-4">
            <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-4 text-xs space-y-2">
              <p className="font-bold text-text-primary">Chủ đề: {selectedTicket.subject}</p>
              <p className="text-text-muted leading-relaxed italic">"{selectedTicket.message}"</p>
            </div>

            {selectedTicket.response && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs space-y-1">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Phản hồi hiện tại:</p>
                <p className="text-text-primary">{selectedTicket.response}</p>
                {selectedTicket.respondedAt && (
                  <p className="text-[10px] text-text-muted">{formatDateTime(selectedTicket.respondedAt)}</p>
                )}
              </div>
            )}

            <Textarea
              label="Nội dung phản hồi của Lễ tân"
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập nội dung hướng dẫn giải quyết cho hội viên..."
            />

            <div className="flex justify-between items-center pt-2">
              <div>
                {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleReopenTicket(selectedTicket)}
                    className="text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Mở lại ticket (Reopen)</span>
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setSelectedTicket(null)}>
                  Đóng
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting || !replyText.trim()}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Phản Hồi & Hoàn Tất'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
