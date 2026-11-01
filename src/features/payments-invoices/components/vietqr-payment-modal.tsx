import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Clock, Copy } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { formatVND } from '@/shared/utils/currency'
import { paymentsService } from '../services/payments.service'
import type { VietQRPaymentResponse } from '../types/payments.types'

type Props = {
  payment: VietQRPaymentResponse | null
  onClose: () => void
  onSuccess: () => void | Promise<void>
}

export function VietQrPaymentModal({ payment, onClose, onSuccess }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(10)
  const [error, setError] = useState<string | null>(null)
  const completed = useRef(false)

  useEffect(() => {
    if (!payment) return
    completed.current = false
    setError(null)
    const updateCountdown = () => setSecondsLeft(Math.max(0, Math.ceil((Date.parse(payment.expiresAt) - Date.now()) / 1000)))
    updateCountdown()
    const countdown = window.setInterval(updateCountdown, 1000)
    const poll = window.setInterval(() => {
      void paymentsService.getPaymentStatus(payment.paymentId).then((status) => {
        if (!completed.current && status.application === 'APPLIED') {
          completed.current = true
          void Promise.resolve(onSuccess()).catch((cause) => {
            completed.current = false
            setError(cause instanceof Error ? cause.message : 'Không thể cập nhật sau thanh toán.')
          })
        }
      }).catch((cause) => {
        if (!completed.current) setError(cause instanceof Error ? cause.message : 'Không thể kiểm tra trạng thái thanh toán.')
      })
    }, 2000)
    return () => {
      window.clearInterval(countdown)
      window.clearInterval(poll)
    }
  }, [payment, onSuccess])

  const copyMemo = async () => {
    if (!payment) return
    try {
      await navigator.clipboard.writeText(payment.memo)
    } catch {
      setError('Không thể sao chép nội dung. Bạn có thể nhập thủ công.')
    }
  }

  return (
    <Modal isOpen={Boolean(payment)} onClose={onClose} title="Thanh toán VietQR" description="Demo tự động xác nhận sau 10 giây">
      {payment && <div className="space-y-4 text-sm">
        <div className="flex justify-center rounded-xl bg-white p-3"><img src={payment.qrUrl} alt="Mã QR thanh toán VietQR" className="h-64 w-64 object-contain" /></div>
        <div className="space-y-2 rounded-xl border border-border-subtle bg-bg-surface-muted p-4">
          <div className="flex justify-between"><span className="text-text-muted">Số tiền</span><strong>{formatVND(payment.amount)}</strong></div>
          <div className="flex justify-between"><span className="text-text-muted">Ngân hàng</span><strong>TPBank · {payment.accountName}</strong></div>
          <div className="flex items-center justify-between"><span className="text-text-muted">Nội dung</span><button type="button" className="flex items-center gap-1 font-mono text-primary" onClick={() => void copyMemo()}>{payment.memo}<Copy className="h-3.5 w-3.5" /></button></div>
        </div>
        <div className="flex items-center justify-center gap-2 text-primary">{secondsLeft > 0 ? <><Clock className="h-4 w-4" /> Hệ thống đang xác nhận giao dịch ({secondsLeft}s)...</> : <><CheckCircle className="h-4 w-4" /> Đang hoàn tất kích hoạt...</>}</div>
        {error && <p role="alert" className="text-center text-xs text-danger">{error}</p>}
      </div>}
    </Modal>
  )
}
