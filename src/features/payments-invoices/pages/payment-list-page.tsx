import { openReceipt } from '@/features/workspace/receipt-events'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { FileText, RefreshCw, AlertTriangle, Filter, DollarSign, CreditCard } from 'lucide-react'
import { formatVND } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { paymentsService } from '../services/payments.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { Payment } from '@/shared/types/api'

export function PaymentListPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<string | null>(null)
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
    if (!p.invoiceId) {
      setErrorMessage(`Giao dịch "${p.paymentCode || p.id}" chưa có hóa đơn được phát hành.`)
      return
    }

    setInvoiceLoadingId(p.id)
    setErrorMessage(null)
    try {
      const inv = await paymentsService.getInvoiceById(p.invoiceId)
      if (inv) {
        openReceipt({ invoiceId: inv.id })
      } else {
        setErrorMessage('Không tìm thấy thông tin hóa đơn trên máy chủ.')
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải hóa đơn.')
      } else {
        setErrorMessage('Không thể tải hóa đơn từ máy chủ.')
      }
    } finally {
      setInvoiceLoadingId(null)
    }
  }


  const columns: Column<Payment>[] = useMemo(
    () => [
      {
        header: 'Mã Thanh Toán',
        accessor: (row) => (
          <span className="font-mono font-bold text-primary">{row.paymentCode || row.id.slice(0, 8)}</span>
        ),
      },
      {
        header: 'Hội viên',
        accessor: (row) => (
          <div>
            <p className="font-semibold text-text-primary">{row.memberName || 'Hội viên'}</p>
            {row.memberCode && <p className="text-xs text-text-muted font-mono">{row.memberCode}</p>}
          </div>
        ),
      },
      {
        header: 'Nội dung giao dịch',
        accessor: (row) => (
          <span className="text-text-muted">{row.itemDescription || row.description || 'Dịch vụ Gym / PT'}</span>
        ),
      },
      {
        header: 'Số tiền (VND)',
        accessor: (row) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatVND(row.amount)}</span>,
      },
      {
        header: 'Phương thức',
        accessor: (row) => (
          <span className="inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-full bg-bg-surface-muted border border-border-subtle text-text-primary">
            {row.method === 'CASH' && <DollarSign className="h-3 w-3" />}
            {row.method === 'BANK_TRANSFER' && <CreditCard className="h-3 w-3" />}
            {row.method === 'VNPAY' && <CreditCard className="h-3 w-3 text-danger" />}
            <span>{row.method}</span>
          </span>
        ),
      },
      {
        header: 'Trạng thái',
        accessor: (row) => <StatusBadge status={row.status} context="payment" />,
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
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Sổ Thu Ngân & Hóa Đơn</h1>
          <p className="text-xs text-text-muted mt-1">
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
        <div className="flex items-center gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-text-muted">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-semibold text-text-primary">Lọc dữ liệu:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-text-muted">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-input border border-border-subtle text-text-primary rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PENDING">Chờ thanh toán (PENDING)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-text-muted">Phương thức:</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-bg-input border border-border-subtle text-text-primary rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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
            disabled={invoiceLoadingId === row.id}
            onClick={() => handleOpenInvoice(row)}
          >
            <FileText className="h-3.5 w-3.5 mr-1 text-primary" />
            {invoiceLoadingId === row.id ? 'Đang tải...' : 'In Hóa đơn'}
          </Button>
        )}
      />


    </div>
  )
}
