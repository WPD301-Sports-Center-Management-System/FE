import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Textarea } from '@/shared/components/ui/input'
import { formatDate } from '@/shared/utils/date'
import type { Equipment, Maintenance } from '@/shared/types/api'

export function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'maintenance'>('equipment')
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([...db.equipment])
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([...db.maintenance])

  // Complete Maintenance Modal
  const [completeMnt, setCompleteMnt] = useState<Maintenance | null>(null)
  const [resultNote, setResultNote] = useState('Đã thay mới linh kiện và bôi trơn dây kéo')
  const [nextDate, setNextDate] = useState('2026-12-10')

  const handleCompleteMaintenance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!completeMnt) return
    completeMnt.status = 'COMPLETED'
    completeMnt.resultNote = resultNote
    completeMnt.completedAt = new Date().toISOString()

    const eq = db.equipment.find((item) => item.id === completeMnt.equipmentId)
    if (eq) {
      eq.status = 'OPERATIONAL'
      eq.lastMaintenanceAt = new Date().toISOString()
      eq.nextMaintenanceAt = nextDate ? new Date(nextDate).toISOString() : undefined
    }

    setMaintenanceList([...db.maintenance])
    setEquipmentList([...db.equipment])
    setCompleteMnt(null)
  }

  const eqColumns: Column<Equipment>[] = [
    {
      header: 'Mã & Tên Thiết Bị',
      accessor: (row) => (
        <div>
          <p className="font-bold text-white">{row.name}</p>
          <p className="text-[10px] font-mono text-orange-400">{row.equipmentCode} • {row.brand}</p>
        </div>
      ),
    },
    { header: 'Khu vực', accessor: 'gymAreaName' },
    {
      header: 'Tình trạng',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Bảo trì gần nhất',
      accessor: (row) => formatDate(row.lastMaintenanceAt),
    },
    {
      header: 'Bảo trì kế tiếp',
      accessor: (row) => formatDate(row.nextMaintenanceAt),
    },
  ]

  const mntColumns: Column<Maintenance>[] = [
    {
      header: 'Thiết Bị',
      accessor: (row) => <span className="font-semibold text-white">{row.equipmentName}</span>,
    },
    { header: 'Nội dung bảo dưỡng', accessor: 'description' },
    { header: 'Người phụ trách', accessor: 'handlerName' },
    {
      header: 'Ngày dự kiến',
      accessor: (row) => formatDate(row.scheduledAt),
    },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản Lý Thiết Bị & Lịch Bảo Trì (WEB-MAN-08, 09)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Theo dõi máy móc phòng gym, lên lịch kiểm định an toàn và nghiệm thu bảo dưỡng
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'equipment'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Danh mục Thiết bị ({equipmentList.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'maintenance'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Lịch Bảo Trì ({maintenanceList.length})
        </button>
      </div>

      {activeTab === 'equipment' ? (
        <DataTable
          columns={eqColumns}
          data={equipmentList}
          searchKey="name"
          searchPlaceholder="Tìm kiếm thiết bị..."
        />
      ) : (
        <DataTable
          columns={mntColumns}
          data={maintenanceList}
          searchKey="description"
          actions={(row) =>
            row.status === 'SCHEDULED' ? (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setCompleteMnt(row)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                Nghiệm thu
              </Button>
            ) : null
          }
        />
      )}

      {/* Complete Maintenance Modal */}
      <Modal
        isOpen={!!completeMnt}
        onClose={() => setCompleteMnt(null)}
        title="Nghiệm thu hoàn tất bảo dưỡng"
        description={`Thiết bị: ${completeMnt?.equipmentName}`}
      >
        <form onSubmit={handleCompleteMaintenance} className="space-y-4">
          <Textarea
            label="Ghi chú kết quả nghiệm thu"
            required
            value={resultNote}
            onChange={(e) => setResultNote(e.target.value)}
          />
          <Input
            label="Ngày bảo trì định kỳ kế tiếp"
            type="date"
            required
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCompleteMnt(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Xác nhận hoàn thành
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
