import { useState, useEffect, useCallback, useMemo } from 'react'
import { Printer, FileText, RefreshCw, AlertTriangle, Filter, DollarSign, CreditCard } from 'lucide-react'
import { formatVND } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { paymentsService } from '../services/payments.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { Payment, Invoice, PaymentMethod, PaymentStatus } from '@/shared/types/api'

export function PaymentListPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [methodFilter, setMethodFilter] = useState<string>('ALL')

  const loadPayments = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const params: any = { limit: 100 }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (methodFilter !== 'ALL') params.method = methodFilter

      const res = await paymentsService.getPayments(params)
      const list = res.data || (Array.isArray(res) ? res : [])
      setPayments(list)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi tải danh sách thanh toán.')
      } else {
        setErrorMessage('Không thể kết nối máy chủ thanh toán.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, methodFilter])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleOpenInvoice = async (p: Payment) => {
    if (p.invoiceId) {
      try {
        const inv = await paymentsService.getInvoiceById(p.invoiceId)
        if (inv) {
          setPreviewInvoice(inv)
          return
        }
      } catch {
        // Fallback below
      }
    }

    const fallbackInv: Invoice = {
      id: p.invoiceId || 'inv-' + p.id,
      invoiceNumber: 'INV-' + (p.paymentCode || p.id.slice(0, 8)),
      paymentId: p.id,
      memberNameSnapshot: p.memberName || 'Hội viên',
      itemNameSnapshot: p.itemDescription || 'Dịch vụ Gym / PT',
      subtotal: p.amount,
      total: p.amount,
      issuedAt: p.paidAt || new Date().toISOString(),
      paymentMethod: p.method,
    }
    setPreviewInvoice(fallbackInv)
  }

  const columns: Column<Payment>[] = useMemo(
    () => [
      {
        header: 'Mã Thanh Toán',
        accessor: (row) => (
          <span className="font-mono font-bold text-orange-400">{row.paymentCode || row.id.slice(0, 8)}</span>
        ),
      },
      {
        header: 'Hội viên',
        accessor: (row) => (
          <div>
            <p className="font-semibold text-slate-200">{row.memberName || 'Hội viên'}</p>
            {row.memberCode && <p className="text-[11px] text-slate-400 font-mono">{row.memberCode}</p>}
          </div>
        ),
      },
      {
        header: 'Nội dung giao dịch',
        accessor: (row) => (
          <span className="text-slate-300">{row.itemDescription || row.description || 'Dịch vụ Gym / PT'}</span>
        ),
      },
      {
        header: 'Số tiền (VND)',
        accessor: (row) => <span className="font-bold text-emerald-400">{formatVND(row.amount)}</span>,
      },
      {
        header: 'Phương thức',
        accessor: (row) => (
          <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
            {row.method === 'CASH' && <DollarSign className="h-3 w-3" />}
            {row.method === 'BANK_TRANSFER' && <CreditCard className="h-3 w-3" />}
            {row.method === 'VNPAY' && <CreditCard className="h-3 w-3 text-red-400" />}
            <span>{row.method}</span>
          </span>
        ),
      },
      {
        header: 'Trạng thái',
        accessor: (row) => <StatusBadge status={row.status} />,
      },
      {
        header: 'Thời gian',
        accessor: (row) => formatDateTime(row.paidAt || (row as any).createdAt),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sổ Thu Ngân & Hóa Đơn (WEB-REC-08, 09)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận các khoản thu vé Gym, hợp đồng PT và phát hành hóa đơn điện tử tự động
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPayments}
          disabled={isLoading}
          className="gap-2 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-semibold text-slate-200">Lọc dữ liệu:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PENDING">Chờ thanh toán (PENDING)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400">Phương thức:</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">Tất cả phương thức</option>
            <option value="CASH">Tiền mặt (CASH)</option>
            <option value="BANK_TRANSFER">Chuyển khoản (BANK_TRANSFER)</option>
            <option value="VNPAY">Cổng VNPay (VNPAY)</option>
          </select>
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
