import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, AlertCircle, Check } from 'lucide-react'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import { formatDate } from '@/shared/utils/date'
import { equipmentService } from '@/features/equipment-maintenance/services/equipment.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { Equipment, GymArea } from '@/shared/types/api'

export function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'areas'>('equipment')
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [gymAreas, setGymAreas] = useState<GymArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    equipmentCode: '',
    gymAreaId: '',
    brand: '',
    model: '',
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [eqRes, gaRes] = await Promise.all([
        equipmentService.getEquipment({ limit: 50 }),
        equipmentService.getGymAreas(),
      ])
      const areas = gaRes.data || []
      setEquipmentList(eqRes.data || [])
      setGymAreas(areas)

      if (areas.length > 0 && !createForm.gymAreaId) {
        setCreateForm((prev) => ({ ...prev, gymAreaId: areas[0].id }))
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách thiết bị.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [createForm.gymAreaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      setErrorMessage('Vui lòng nhập tên thiết bị.')
      return
    }
    if (!createForm.equipmentCode.trim()) {
      setErrorMessage('Vui lòng nhập mã thiết bị.')
      return
    }
    if (!createForm.gymAreaId) {
      setErrorMessage('Vui lòng chọn khu vực đặt máy.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.createEquipment({
        name: createForm.name.trim(),
        equipmentCode: createForm.equipmentCode.trim(),
        gymAreaId: createForm.gymAreaId,
        brand: createForm.brand.trim() || undefined,
        model: createForm.model.trim() || undefined,
      })

      showSuccess(`Đã thêm thiết bị "${createForm.name}" thành công!`)
      setIsCreateModalOpen(false)
      setCreateForm({
        name: '',
        equipmentCode: '',
        gymAreaId: gymAreas[0]?.id || '',
        brand: '',
        model: '',
      })
      // Reload equipment
      const updatedEq = await equipmentService.getEquipment({ limit: 50 })
      setEquipmentList(updatedEq.data || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Thêm thiết bị thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi thêm máy.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const eqColumns: Column<Equipment>[] = [
    {
      header: 'Mã & Tên Thiết Bị',
      accessor: (row) => (
        <div>
          <p className="font-bold text-white">{row.name}</p>
          <p className="text-[10px] font-mono text-orange-400">
            {row.equipmentCode} {row.brand ? `• ${row.brand}` : ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Khu vực',
      accessor: (row) => (
        <span className="text-slate-300">
          {(row as any).gymArea?.name || row.gymAreaName || 'Khu chung'}
        </span>
      ),
    },
    {
      header: 'Tình trạng',
      accessor: (row) => <StatusBadge status={row.status || 'OPERATIONAL'} />,
    },
    {
      header: 'Ngày đăng ký',
      accessor: (row) => formatDate((row as any).createdAt || row.lastMaintenanceAt),
    },
  ]

  const areaColumns: Column<GymArea>[] = [
    {
      header: 'Tên Khu Vực',
      accessor: (row) => <span className="font-bold text-white">{row.name}</span>,
    },
    {
      header: 'Vị trí',
      accessor: (row) => <span className="text-slate-300">{row.location || 'Chưa định vị'}</span>,
    },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản Lý Thiết Bị & Khu Vực Phòng Gym (WEB-MAN-08)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi máy móc phòng gym, cơ sở vật chất các khu vực tập luyện
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>Thêm thiết bị mới</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

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
          onClick={() => setActiveTab('areas')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'areas'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Khu Vực & Zone ({gymAreas.length})
        </button>
      </div>

      {activeTab === 'equipment' ? (
        <DataTable
          columns={eqColumns}
          data={equipmentList}
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="Tìm kiếm thiết bị theo tên..."
        />
      ) : (
        <DataTable
          columns={areaColumns}
          data={gymAreas}
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="Tìm kiếm khu vực..."
        />
      )}

      {/* Create Equipment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Thêm Thiết Bị Phòng Gym Mới"
        description="Đăng ký mã máy và định vị khu vực tập luyện"
      >
        <form onSubmit={handleCreateEquipment} className="space-y-4">
          <Input
            label="Tên thiết bị / máy tập"
            required
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Ví dụ: Máy Chạy Bộ Matrix Commercial T70"
            disabled={isSubmitting}
          />
          <Input
            label="Mã định danh thiết bị (Equipment Code)"
            required
            value={createForm.equipmentCode}
            onChange={(e) => setCreateForm({ ...createForm, equipmentCode: e.target.value })}
            placeholder="Ví dụ: EQ-TM-01"
            disabled={isSubmitting}
          />

          {gymAreas.length > 0 ? (
            <Select
              label="Khu vực đặt thiết bị"
              value={createForm.gymAreaId}
              onChange={(e) => setCreateForm({ ...createForm, gymAreaId: e.target.value })}
              options={gymAreas.map((a) => ({ value: a.id, label: `${a.name} (${a.location || 'Chung'})` }))}
              disabled={isSubmitting}
            />
          ) : (
            <p className="text-xs text-amber-400">Chưa có khu vực nào. Hãy tạo khu vực trước.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Thương hiệu (Brand)"
              value={createForm.brand}
              onChange={(e) => setCreateForm({ ...createForm, brand: e.target.value })}
              placeholder="Hammer Strength, Technogym..."
              disabled={isSubmitting}
            />
            <Input
              label="Model"
              value={createForm.model}
              onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
              placeholder="T-2026 Pro"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || !createForm.gymAreaId}>
              Lưu thiết bị
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
