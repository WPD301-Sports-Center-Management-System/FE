import { useState } from 'react'
import { Download, CheckCircle2 } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input } from '@/shared/components/ui/input'
import type { CoachPayout } from '@/shared/types/api'

export function ReportsPage() {
  const [payouts, setPayouts] = useState<CoachPayout[]>([...db.payouts])
  const [settleItem, setSettleItem] = useState<CoachPayout | null>(null)
  const [transferRef, setTransferRef] = useState('')

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settleItem || !transferRef.trim()) return

    settleItem.status = 'PAID'
    settleItem.transferRef = transferRef
    settleItem.paidAt = new Date().toISOString()

    setPayouts([...db.payouts])
    setSettleItem(null)
    setTransferRef('')
  }

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,HLV,TongTien,Gym40,Coach60,TrangThai,MaChuyenKhoan\n' +
      payouts
        .map(
          (p) =>
            `"${p.coachName}","${p.grossAmount}","${p.gymAmount}","${p.coachAmount}","${p.status}","${p.transferRef || ''}"`
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Báo Cáo Tài Chính & Quyết Toán HLV (WEB-MAN-10)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy tắc chia sẻ doanh thu: Gym hưởng 40% • HLV hưởng 60% gói PT 1:1
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} className="gap-2">
          <Download className="h-4 w-4" />
          <span>Xuất Báo Cáo CSV</span>
        </Button>
      </div>

      {/* Revenue Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase">Tổng Doanh Thu Hợp Đồng PT</p>
          <h3 className="text-2xl font-bold text-white">{formatVND(4500000)}</h3>
          <p className="text-[11px] text-slate-500">1 Gói PT 1:1 đã thanh toán thành công</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 space-y-2">
          <p className="text-xs font-semibold text-cyan-400 uppercase">Phần Gym Giữ Lại (40%)</p>
          <h3 className="text-2xl font-bold text-cyan-300">{formatVND(1800000)}</h3>
          <p className="text-[11px] text-slate-400">Chi phí vận hành mặt bằng & máy móc</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 space-y-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase">Phần Quyết Toán HLV (60%)</p>
          <h3 className="text-2xl font-bold text-emerald-300">{formatVND(2700000)}</h3>
          <p className="text-[11px] text-slate-400">Thù lao giảng dạy huấn luyện trực tiếp</p>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Danh Sách Bảng Kê Quyết Toán Huấn Luyện Viên</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Huấn luyện viên</th>
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
                  <td className="py-3.5 px-4 font-semibold text-white">{p.coachName}</td>
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
                        className="text-xs"
                        onClick={() => {
                          setSettleItem(p)
                          setTransferRef('MB-' + Math.floor(Math.random() * 900000 + 100000))
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Xác nhận đã chuyển
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Modal */}
      <Modal
        isOpen={!!settleItem}
        onClose={() => setSettleItem(null)}
        title="Xác nhận chi trả thù lao HLV (60%)"
        description={`HLV: ${settleItem?.coachName} • Số tiền: ${formatVND(settleItem?.coachAmount)}`}
      >
        <form onSubmit={handleConfirmSettle} className="space-y-4">
          <Input
            label="Mã tham chiếu ngân hàng (Transfer Ref)"
            required
            value={transferRef}
            onChange={(e) => setTransferRef(e.target.value)}
            placeholder="Ví dụ: VCB-20261008-883921"
          />
          <div className="flex justify-end gap-2 pt-2">
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
