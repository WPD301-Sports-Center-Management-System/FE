import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatDateTime } from '@/shared/utils/date'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import type { SupportRequest } from '@/shared/types/api'

export function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportRequest[]>([...db.support])
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null)
  const [replyText, setReplyText] = useState('')

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !replyText.trim()) return

    selectedTicket.response = replyText
    selectedTicket.status = 'RESOLVED'
    selectedTicket.respondedAt = new Date().toISOString()

    setTickets([...db.support])
    setSelectedTicket(null)
    setReplyText('')
  }

  const columns: Column<SupportRequest>[] = [
    {
      header: 'Mã Ticket',
      accessor: (row) => <span className="font-mono font-bold text-orange-400">{row.requestCode}</span>,
    },
    { header: 'Hội viên gửi', accessor: 'memberName' },
    { header: 'Chủ đề', accessor: 'subject' },
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Yêu Cầu Hỗ Trợ Tại Quầy (WEB-REC-10)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Tiếp nhận khiếu nại, phản hồi đổi lịch và giải đáp thắc mắc từ hội viên
        </p>
      </div>

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
            {row.status === 'RESOLVED' ? 'Xem phản hồi' : 'Xử lý ticket'}
          </Button>
        )}
      />

      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Xử lý yêu cầu [${selectedTicket?.requestCode}]`}
        description={`Người gửi: ${selectedTicket?.memberName}`}
      >
        {selectedTicket && (
          <form onSubmit={handleSendResponse} className="space-y-4">
            <div className="rounded-xl bg-slate-800/60 p-4 text-xs space-y-2">
              <p className="font-bold text-white">Chủ đề: {selectedTicket.subject}</p>
              <p className="text-slate-300 leading-relaxed italic">"{selectedTicket.message}"</p>
            </div>

            <Textarea
              label="Nội dung phản hồi của Lễ tân"
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập nội dung hướng dẫn giải quyết cho hội viên..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedTicket(null)}>
                Đóng
              </Button>
              <Button type="submit" variant="primary">
                Hoàn tất & Đóng ticket
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
