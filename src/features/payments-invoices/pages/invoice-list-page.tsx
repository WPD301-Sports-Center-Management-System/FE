import { openReceipt } from '@/features/workspace/receipt-events'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { apiClient } from '@/shared/api/client'
import { isAppApiError } from '@/shared/api/api-error'
import type { ApiSuccess, Invoice } from '@/shared/types/api'
import { formatDateTime } from '@/shared/utils/date'
import { formatVND } from '@/shared/utils/currency'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { Button } from '@/shared/components/ui/button'

type InvoiceRow = Invoice & Record<string, unknown>

const fetchInvoices = async () => ((await apiClient.get('/invoices', { params: { limit: 100 } })) as ApiSuccess<InvoiceRow[]>).data

// Every issued invoice in one place, newest first, so staff can find and reprint one by number or member name.
export function InvoiceListPage() {
  const invoices = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices })
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const download = async (row: InvoiceRow) => {
    setDownloading(row.id)
    setDownloadError(null)
    try {
      openReceipt({ invoiceId: row.id })
    } catch (err) {
      setDownloadError(isAppApiError(err) ? err.message : `Không tải được hóa đơn ${row.invoiceNumber}.`)
    } finally {
      setDownloading(null)
    }
  }

  const columns: Column<InvoiceRow>[] = [
    { header: 'Số hóa đơn', accessor: (row) => <span className="font-mono font-semibold text-text-primary">{row.invoiceNumber}</span> },
    { header: 'Ngày xuất', accessor: (row) => formatDateTime(row.issuedAt) },
    { header: 'Hội viên', accessor: 'memberNameSnapshot' },
    { header: 'Nội dung', accessor: 'itemNameSnapshot' },
    { header: 'Tổng tiền', accessor: (row) => <span className="font-semibold text-text-primary">{formatVND(row.total)}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Hóa đơn</h1>
          <p className="mt-1 text-sm text-text-muted">Tất cả hóa đơn đã xuất. Tìm theo số hóa đơn hoặc tên hội viên để in lại.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => invoices.refetch()} disabled={invoices.isFetching} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${invoices.isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {(invoices.isError || downloadError) && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{downloadError ?? (isAppApiError(invoices.error) ? invoices.error.message : 'Không tải được danh sách hóa đơn.')}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={invoices.data ?? []}
        isLoading={invoices.isLoading}
        searchPlaceholder="Số hóa đơn hoặc tên hội viên…"
        searchFn={(row, term) => {
          const t = term.toLowerCase()
          return row.invoiceNumber.toLowerCase().includes(t) || row.memberNameSnapshot.toLowerCase().includes(t)
        }}
        actions={(row) => (
          <Button size="sm" variant="outline" isLoading={downloading === row.id} onClick={() => void download(row)} className="gap-1">
            <Download className="h-3.5 w-3.5" />
            Xem hóa đơn
          </Button>
        )}
      />
    </div>
  )
}
