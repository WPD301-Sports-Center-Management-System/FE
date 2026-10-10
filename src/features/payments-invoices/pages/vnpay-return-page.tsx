import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ArrowLeft,
  RefreshCw,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { paymentsService } from '@/features/payments-invoices/services/payments.service'
import { downloadBlob } from '@/shared/utils/download'
import { formatVND } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { isAppApiError } from '@/shared/api/api-error'
import { useAuth } from '@/features/auth/context/auth-context'
import type { Payment, Invoice, PaymentStatus } from '@/shared/types/api'

export function VnPayReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const paymentId = searchParams.get('paymentId') || ''
  const responseCode = searchParams.get('responseCode') || searchParams.get('vnp_ResponseCode') || ''

  const [status, setStatus] = useState<PaymentStatus>('PENDING')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [isPolling, setIsPolling] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const isMountedRef = useRef(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStatusAndPayment = useCallback(async () => {
    if (!paymentId) {
      setIsPolling(false)
      setErrorMessage('Không tìm thấy mã giao dịch (paymentId) trong đường dẫn.')
      return
    }

    try {
      const statusRes = await paymentsService.getPaymentStatus(paymentId)
      if (!isMountedRef.current) return

      setStatus(statusRes.status)

      if (statusRes.status === 'PAID') {
        setIsPolling(false)
        // Fetch full payment & invoice details
        const fullPayment = await paymentsService.getPaymentById(paymentId)
        if (!isMountedRef.current) return
        setPayment(fullPayment)

        if (fullPayment.invoiceId) {
          try {
            const fullInvoice = await paymentsService.getInvoiceById(fullPayment.invoiceId)
            if (isMountedRef.current) setInvoice(fullInvoice)
          } catch {
            // Non-fatal, invoice could still be indexing
          }
        }
      } else if (statusRes.status === 'FAILED' || statusRes.status === 'CANCELLED') {
        setIsPolling(false)
        try {
          const fullPayment = await paymentsService.getPaymentById(paymentId)
          if (isMountedRef.current) setPayment(fullPayment)
        } catch {
          // ignore
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi kiểm tra trạng thái thanh toán.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ để xác thực giao dịch.')
      }
      setIsPolling(false)
    }
  }, [paymentId])

  useEffect(() => {
    isMountedRef.current = true

    // Initial check
    fetchStatusAndPayment()

    // Polling setup: Poll up to 5 times every 2.5s if PENDING
    let currentPolls = 0
    const maxPolls = 5

    const pollInterval = setInterval(async () => {
      currentPolls += 1
      if (!isMountedRef.current) return
      setPollCount(currentPolls)

      if (currentPolls >= maxPolls) {
        clearInterval(pollInterval)
        setIsPolling(false)
        return
      }

      await fetchStatusAndPayment()
    }, 2500)

    timerRef.current = pollInterval

    return () => {
      isMountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchStatusAndPayment])

  // Stop polling if state changed to non-pending
  useEffect(() => {
    if (status !== 'PENDING' && timerRef.current) {
      clearInterval(timerRef.current)
      setIsPolling(false)
    }
  }, [status])

  const handleDownloadInvoice = async () => {
    const invId = invoice?.id || payment?.invoiceId
    if (!invId) return

    setIsDownloadingPdf(true)
    setErrorMessage(null)
    try {
      const blob = await paymentsService.downloadInvoicePdf(invId)
      const filename = `hoa_don_${invoice?.invoiceNumber || payment?.paymentCode || invId}.pdf`
      await downloadBlob(blob, filename)
    } catch (err: any) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải hóa đơn PDF.')
      } else {
        setErrorMessage(err.message || 'Không thể tạo file hóa đơn.')
      }
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleBackToDashboard = () => {
    const role = user?.role
    if (role === 'MEMBER') navigate('/member')
    else if (role === 'RECEPTIONIST') navigate('/receptionist/payments')
    else if (role === 'COACH') navigate('/coach')
    else navigate('/manager')
  }

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Status Header */}
        <div className="text-center space-y-2">
          {status === 'PAID' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Thanh Toán Thành Công!</h1>
              <p className="text-xs text-text-muted">
                Giao dịch đã được hệ thống và cổng VNPay xác nhận hợp lệ.
              </p>
            </div>
          ) : status === 'PENDING' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="h-10 w-10 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Đang Chờ Xác Nhận</h1>
              <p className="text-xs text-text-muted">
                Hệ thống đang đồng bộ kết quả giao dịch từ cổng VNPay...
              </p>
              {isPolling && (
                <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Đang kiểm tra tự động ({pollCount}/5)...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center text-danger">
                <XCircle className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Giao Dịch Thất Bại</h1>
              <p className="text-xs text-text-muted">
                Thanh toán chưa hoàn tất hoặc đã bị hủy từ cổng thanh toán.
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-border-subtle">
            <span className="text-text-muted">Mã giao dịch</span>
            <span className="font-mono font-semibold text-text-primary">
              {payment?.paymentCode || paymentId.slice(0, 12)}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-border-subtle">
            <span className="text-text-muted">Phương thức</span>
            <span className="font-semibold text-primary">VNPay QR / Thẻ</span>
          </div>

          {payment?.itemDescription && (
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Dịch vụ</span>
              <span className="font-semibold text-text-primary text-right max-w-[200px] truncate">
                {payment.itemDescription}
              </span>
            </div>
          )}

          {payment?.amount && (
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Số tiền thanh toán</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatVND(payment.amount)}</span>
            </div>
          )}

          <div className="flex justify-between py-1">
            <span className="text-text-muted">Trạng thái</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                status === 'PAID'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : status === 'PENDING'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-danger/15 text-danger border border-danger/30'
              }`}
            >
              {status === 'PAID'
                ? 'ĐÃ THANH TOÁN'
                : status === 'PENDING'
                ? 'CHỜ XÁC NHẬN'
                : 'THẤT BẠI'}
            </span>
          </div>

          {payment?.paidAt && (
            <div className="flex justify-between py-1 border-t border-border-subtle">
              <span className="text-text-muted">Thời gian xác nhận</span>
              <span className="font-mono text-text-primary">{formatDateTime(payment.paidAt)}</span>
            </div>
          )}

          {responseCode && (
            <div className="flex justify-between py-1 border-t border-border-subtle text-[10px]">
              <span className="text-text-muted">Mã phản hồi cổng (Response Code)</span>
              <span className="font-mono text-text-muted">{responseCode}</span>
            </div>
          )}
        </div>

        {/* Invoice Card if PAID */}
        {status === 'PAID' && (
          <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-text-primary">Hóa Đơn Điện Tử</span>
              </div>
              {invoice?.invoiceNumber && (
                <span className="text-[11px] font-mono text-primary">#{invoice.invoiceNumber}</span>
              )}
            </div>

            {invoice || payment?.invoiceId ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadInvoice}
                disabled={isDownloadingPdf}
                className="w-full gap-2 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isDownloadingPdf ? 'Đang tải hóa đơn...' : 'Tải Hóa Đơn PDF'}</span>
              </Button>
            ) : (
              <p className="text-[11px] text-text-muted italic text-center">
                Hóa đơn đang được hệ thống phát hành...
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {status === 'PENDING' && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatusAndPayment}
              className="w-full gap-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Kiểm tra lại trạng thái</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleBackToDashboard}
            className="w-full gap-2 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về Trang Quản Lý</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
