import { useState } from 'react'
import { Printer, FileText } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import type { Payment, Invoice } from '@/shared/types/api'

export function PaymentListPage() {
  const [payments] = useState<Payment[]>([...db.payments])
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  const handleOpenInvoice = (p: Payment) => {
    const inv = db.invoices.find((i) => i.paymentId === p.id) || {
      id: 'inv-gen-' + p.id,
      invoiceNumber: 'INV-TEMP-' + p.paymentCode,
      paymentId: p.id,
      memberNameSnapshot: p.memberName || 'Hội viên',
      itemNameSnapshot: p.itemDescription || 'Dịch vụ Gym & PT',
      subtotal: p.amount,
      total: p.amount,
      issuedAt: p.paidAt || new Date().toISOString(),
      paymentMethod: p.method,
    }
    setPreviewInvoice(inv)
  }

  const columns: Column<Payment>[] = [
    {
      header: 'Mã Thanh Toán',
      accessor: (row) => <span className="font-mono font-bold text-orange-400">{row.paymentCode}</span>,
    },
    { header: 'Hội viên', accessor: 'memberName' },
    { header: 'Nội dung giao dịch', accessor: 'itemDescription' },
    {
      header: 'Số tiền (VND)',
      accessor: (row) => <span className="font-bold text-emerald-400">{formatVND(row.amount)}</span>,
    },
    { header: 'Phương thức', accessor: 'method' },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Thời gian',
      accessor: (row) => formatDateTime(row.paidAt),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sổ Thu Ngân & Hóa Đơn (WEB-REC-08, 09)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận các khoản thu vé Gym, hợp đồng PT và phát hành hóa đơn điện tử
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        searchKey="paymentCode"
        searchPlaceholder="Tìm theo mã giao dịch..."
        actions={(row) => (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => handleOpenInvoice(row)}
          >
            <FileText className="h-3.5 w-3.5 mr-1 text-cyan-400" />
            In Hóa đơn
          </Button>
        )}
      />

      {/* Invoice Print & Preview Modal (WEB-REC-09) */}
      <Modal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        title="Hóa Đơn Thu Phí Dịch Vụ"
        maxWidth="lg"
      >
        {previewInvoice && (
          <div className="space-y-6 p-2">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold text-white">SPORTS CENTER MANAGEMENT</h3>
                <p className="text-xs text-slate-400">123 Đường Cầu Giấy, Hà Nội • Hotline: 1900 6868</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-orange-400">
                  {previewInvoice.invoiceNumber}
                </span>
                <p className="text-[10px] text-slate-500">{formatDateTime(previewInvoice.issuedAt)}</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>Khách hàng: <strong className="text-white">{previewInvoice.memberNameSnapshot}</strong></p>
              <p>Hình thức thanh toán: <strong className="text-white">{previewInvoice.paymentMethod}</strong></p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex justify-between text-xs border-b border-slate-800 pb-2 font-bold text-slate-400">
                <span>Dịch vụ</span>
                <span>Thành tiền</span>
              </div>
              <div className="flex justify-between text-sm text-slate-200">
                <span>{previewInvoice.itemNameSnapshot}</span>
                <span className="font-bold text-emerald-400">{formatVND(previewInvoice.total)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-800/40 p-3 text-center text-[11px] text-slate-400 italic">
              Lưu ý: Hóa đơn đã thanh toán tuân thủ chính sách không hoàn tiền (Non-refundable).
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <Button variant="ghost" onClick={() => setPreviewInvoice(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                className="gap-1.5"
                onClick={() => {
                  window.print()
                }}
              >
                <Printer className="h-4 w-4" />
                <span>In Hóa Đơn (Print)</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
