import { openReceipt } from '@/features/workspace/receipt-events'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
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
import { formatVND } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { isAppApiError } from '@/shared/api/api-error'
import { useAuth } from '@/features/auth/context/auth-context'
import type { Payment, Invoice, PaymentStatus } from '@/shared/types/api'
import { readPtContinuation, type PtContinuation } from '@/shared/utils/pt-continuation'

export function VnPayReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isInitializing } = useAuth()
  const location = useLocation()

  const paymentId = searchParams.get('paymentId') || ''
  const responseCode = searchParams.get('responseCode') || searchParams.get('vnp_ResponseCode') || ''

  const [application, setApplication] = useState<string | null>(null)
  const [status, setStatus] = useState<PaymentStatus>('PENDING')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [isPolling, setIsPolling] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [continuation, setContinuation] = useState<PtContinuation | null>(null)

  const shownReceipt = useRef<string | null>(null)
  const generation = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchStatusAndPayment = useCallback(async () => {
    const current = ++generation.current
    if (!paymentId || !user) {
      setIsPolling(false)
      setErrorMessage(!paymentId ? 'Không tìm thấy mã giao dịch (paymentId) trong đường dẫn.' : 'Đăng nhập để kiểm tra giao dịch. Không thanh toán lại khi chưa xác minh.')
      return true
    }
    setErrorMessage(null)
    try {
      const result = await paymentsService.getPaymentStatus(paymentId)
      if (current !== generation.current) return true
      setStatus(result.status); setApplication(result.application ?? null)
      // Only expose a saved draft after this account has successfully read this exact payment.
      const next = readPtContinuation(user.id, paymentId, user.role, user.memberProfilesUserId?.id)
      setContinuation(next)
      if (result.status === 'PAID') {
        const full = await paymentsService.getPaymentById(paymentId)
        if (current !== generation.current) return true
        setPayment(full)
        if (next && full.subscriptionId && full.subscriptionId !== next.subscriptionId) setContinuation(null)
        if (full.invoiceId) {
          const inv = await paymentsService.getInvoiceById(full.invoiceId)
          if (current !== generation.current) return true
          setInvoice(inv)
          if (shownReceipt.current !== inv.id) { shownReceipt.current = inv.id; openReceipt({ invoiceId: inv.id }) }
          return true
        }
        return result.application === 'UNAPPLIED'
      }
      return result.status !== 'PENDING'
    } catch (err) {
      if (current === generation.current) setErrorMessage(isAppApiError(err) ? err.message : 'Không thể kết nối đến máy chủ để xác thực giao dịch.')
      return true
    }
  }, [paymentId, user])

  useEffect(() => {
    if (isInitializing) return
    let active = true
    let polls = 0
    setStatus('PENDING'); setPayment(null); setInvoice(null); setApplication(null); setPollCount(0); setIsPolling(true); setContinuation(null)
    shownReceipt.current = null
    const poll = async () => {
      const terminal = await fetchStatusAndPayment()
      if (!active) return
      polls++; setPollCount(polls)
      if (terminal || polls >= 5) { setIsPolling(false); return }
      timerRef.current = setTimeout(poll, 2500)
    }
    void poll()
    return () => { active = false; generation.current++; if (timerRef.current) clearTimeout(timerRef.current) }
  }, [fetchStatusAndPayment, isInitializing])
  const applied = status === 'PAID' && (application === 'APPLIED' || !!invoice)

  const handleDownloadInvoice = async () => {
    const invId = invoice?.id || payment?.invoiceId
    if (!invId) return

    setIsDownloadingPdf(true)
    setErrorMessage(null)
    try {
      openReceipt({ invoiceId: invId })
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
              <h1 className="text-2xl font-bold text-text-primary">{applied ? 'Thanh Toán Thành Công!' : 'Đã nhận tiền — đang đối soát'}</h1>
              <p className="text-xs text-text-muted">
                {applied ? 'Thanh toán đã được áp dụng vào đơn.' : 'Quyền sử dụng chưa được xác nhận. Trung tâm đang xử lý giao dịch; không thanh toán lại.'}
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
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
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

        {!user && !isInitializing && <Button onClick={() => navigate('/login', { state: { from: { pathname: location.pathname, search: location.search } } })}>Đăng nhập để xem giao dịch</Button>}
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
              className={`font-semibold px-2 py-0.5 rounded text-xs ${
                status === 'PAID'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : status === 'PENDING'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-danger/15 text-danger border border-danger/30'
              }`}
            >
              {status === 'PAID'
                ? applied ? 'ĐÃ ÁP DỤNG' : 'ĐÃ NHẬN TIỀN'
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
            <div className="flex justify-between py-1 border-t border-border-subtle text-xs">
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
                <span className="text-xs font-mono text-primary">#{invoice.invoiceNumber}</span>
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
                <span>{isDownloadingPdf ? 'Đang tải hóa đơn...' : 'Xem / in hóa đơn'}</span>
              </Button>
            ) : (
              <p className="text-xs text-text-muted italic text-center">
                {application === 'UNAPPLIED' ? 'Giao dịch cần trung tâm đối soát trước khi áp dụng.' : 'Hóa đơn đang được hệ thống phát hành...'}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {continuation && continuation.ownerId === user?.id && continuation.role === user.role && continuation.paymentId === paymentId && <section className="space-y-3 rounded-lg bg-bg-surface-muted p-4 text-sm">
          <h2 className="font-semibold">Tiếp tục phương án PT</h2>
          <p>{applied ? 'Vé gym đã được áp dụng. Xem lại phương án PT trước khi tạo hoặc thanh toán đơn PT.' : status === 'PAID' ? 'Tiền vé đã được nhận nhưng quyền lợi còn đang xử lý. Không thanh toán lại vé; phương án PT vẫn cần kiểm tra lại.' : 'Thanh toán vé chưa hoàn tất. Bạn có thể xem lại phương án PT; vé gym và đơn PT được xử lý riêng.'}</p>
          <Button onClick={() => navigate(continuation.role === 'MEMBER' ? '/member/pt-sale' : '/receptionist/pt-sale', { state: { ptDraft: continuation.draft } })}>Tiếp tục chọn lịch PT</Button>
          <p>Giá, lịch trống và giữ chỗ sẽ được kiểm tra lại. Cần xác nhận lại phương án trước khi tạo đơn.</p>
        </section>}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {(status === 'PENDING' || (status === 'PAID' && !invoice)) && (
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
