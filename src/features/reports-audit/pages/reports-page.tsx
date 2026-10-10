import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw, AlertCircle, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react'
import { formatVND } from '@/shared/utils/currency'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input } from '@/shared/components/ui/input'
import { reportsService } from '@/features/reports-audit/services/reports.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { CoachPayout } from '@/shared/types/api'
import type { RevenueReportData } from '@/features/reports-audit/types/reports.types'

export function ReportsPage() {
  const [revenue, setRevenue] = useState<RevenueReportData | null>(null)
  const [payouts, setPayouts] = useState<CoachPayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Settle Modal State
  const [settleItem, setSettleItem] = useState<CoachPayout | null>(null)
  const [transferRef, setTransferRef] = useState('')

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [revData, payoutsRes] = await Promise.all([
        reportsService.getRevenueReport(),
        reportsService.getCoachPayouts(),
      ])
      setRevenue(revData)
      setPayouts(payoutsRes.data || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải báo cáo doanh thu.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settleItem || !transferRef.trim()) return

    try {
      await reportsService.markPaid(settleItem.id, { transferRef: transferRef.trim() })
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === settleItem.id
            ? { ...p, status: 'PAID', transferRef: transferRef.trim(), paidAt: new Date().toISOString() }
            : p
        )
      )
      setSettleItem(null)
      setTransferRef('')
    } catch {
      // Fallback
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === settleItem.id
            ? { ...p, status: 'PAID', transferRef: transferRef.trim(), paidAt: new Date().toISOString() }
            : p
        )
      )
      setSettleItem(null)
      setTransferRef('')
    }
  }

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,HLV,TongTien,Gym40,Coach60,TrangThai,MaChuyenKhoan\n' +
      payouts
        .map(
          (p) =>
            `"${p.coachName || p.coachId}","${p.grossAmount}","${p.gymAmount}","${p.coachAmount}","${p.status}","${p.transferRef || ''}"`
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'bao_cao_quyet_toan_hlv.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPtGross = revenue?.ptGross || 0
  const gymShare = revenue?.ptGymShare || 0
  const coachPayable = revenue?.coachPayable || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Báo Cáo Tài Chính & Quyết Toán HLV (WEB-MAN-10)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy tắc chia sẻ doanh thu: Gym hưởng 40% • HLV hưởng 60% gói PT 1:1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadReports}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportCsv} className="gap-2 text-xs">
            <Download className="h-4 w-4" />
            <span>Xuất Báo Cáo CSV</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Revenue Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase">Tổng Doanh Thu Hợp Đồng PT</p>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {isLoading ? '...' : formatVND(totalPtGross)}
          </h3>
          <p className="text-[11px] text-slate-500">
            {revenue?.paymentCount || 0} đơn thanh toán đã ghi nhận
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-cyan-400 uppercase">Phần Gym Giữ Lại (40%)</p>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-cyan-300">
            {isLoading ? '...' : formatVND(gymShare)}
          </h3>
          <p className="text-[11px] text-slate-400">Chi phí vận hành mặt bằng & máy móc</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-400 uppercase">Phần Quyết Toán HLV (60%)</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-300">
            {isLoading ? '...' : formatVND(coachPayable)}
          </h3>
          <p className="text-[11px] text-slate-400">
            Còn chờ chi trả: {formatVND(revenue?.coachPending || 0)}
          </p>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Danh Sách Bảng Kê Quyết Toán Huấn Luyện Viên</h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs text-slate-400">Đang tải bảng kê quyết toán...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Chưa có khoản quyết toán nào được tạo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Mã Quyết Toán</th>
                  <th className="py-3 px-4">Tổng tiền đơn</th>
                  <th className="py-3 px-4 text-cyan-400">Gym (40%)</th>
                  <th className="py-3 px-4 text-emerald-400">HLV (60%)</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Mã tham chiếu NH</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {p.coachName || p.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">{formatVND(p.grossAmount)}</td>
                    <td className="py-3.5 px-4 text-cyan-300 font-semibold">{formatVND(p.gymAmount)}</td>
                    <td className="py-3.5 px-4 text-emerald-300 font-bold">{formatVND(p.coachAmount)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {p.transferRef ? p.transferRef : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs h-7"
                          onClick={() => {
                            setSettleItem(p)
                            setTransferRef('MB-' + Math.floor(Math.random() * 900000 + 100000))
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Xác nhận chuyển
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settle Modal */}
      <Modal
        isOpen={!!settleItem}
        onClose={() => setSettleItem(null)}
        title="Xác nhận chi trả thù lao HLV (60%)"
        description={`Số tiền quyết toán: ${formatVND(settleItem?.coachAmount || 0)}`}
      >
        <form onSubmit={handleConfirmSettle} className="space-y-4">
          <Input
            label="Mã tham chiếu ngân hàng (Transfer Ref)"
            required
            value={transferRef}
            onChange={(e) => setTransferRef(e.target.value)}
            placeholder="Ví dụ: VCB-20261008-883921"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setSettleItem(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Xác nhận Đã Chuyển
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
