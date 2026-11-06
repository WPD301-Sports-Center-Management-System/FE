import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, AlertCircle, Check, Wrench, CheckCircle2, Eye, Edit2 } from 'lucide-react'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select, Textarea } from '@/shared/components/ui/input'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { equipmentService } from '@/features/equipment-maintenance/services/equipment.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { Equipment, GymArea, Maintenance } from '@/shared/types/api'

export function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'areas' | 'maintenance'>('equipment')
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [gymAreas, setGymAreas] = useState<GymArea[]>([])
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters for Equipment
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [areaFilter, setAreaFilter] = useState<string>('ALL')

  // Create Equipment Modal State
  const [isCreateEqModalOpen, setIsCreateEqModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createEqForm, setCreateEqForm] = useState({
    name: '',
    equipmentCode: '',
    gymAreaId: '',
    brand: '',
    model: '',
    purchaseDate: '',
  })

  // Change Equipment Status State
  const [statusModalEq, setStatusModalEq] = useState<Equipment | null>(null)
  const [targetEqStatus, setTargetEqStatus] = useState<string>('AVAILABLE')

  // Create Gym Area Modal State
  const [isCreateAreaModalOpen, setIsCreateAreaModalOpen] = useState(false)
  const [createAreaForm, setCreateAreaForm] = useState({
    name: '',
    location: '',
    description: '',
  })

  // Create Maintenance Modal State
  const [isCreateMaintModalOpen, setIsCreateMaintModalOpen] = useState(false)
  const [createMaintForm, setCreateMaintForm] = useState({
    equipmentId: '',
    scheduledAt: '',
    description: '',
  })

  // Complete Maintenance Modal State
  const [completeMaintItem, setCompleteMaintItem] = useState<Maintenance | null>(null)
  const [completeMaintForm, setCompleteMaintForm] = useState({
    resultNote: '',
    nextMaintenanceAt: '',
  })

  // View Equipment Detail State
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null)
  const [isViewingLoading, setIsViewingLoading] = useState(false)

  // Edit Equipment State
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [editEqForm, setEditEqForm] = useState({
    name: '',
    equipmentCode: '',
    gymAreaId: '',
    brand: '',
    model: '',
    purchaseDate: '',
  })

  // Edit Gym Area State
  const [editingArea, setEditingArea] = useState<GymArea | null>(null)
  const [editAreaForm, setEditAreaForm] = useState({
    name: '',
    location: '',
    description: '',
    isActive: true,
  })

  // Edit Maintenance State
  const [editingMaintItem, setEditingMaintItem] = useState<Maintenance | null>(null)
  const [editMaintForm, setEditMaintForm] = useState({
    scheduledAt: '',
    status: 'SCHEDULED',
    description: '',
  })

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const promises: Promise<any>[] = [
        equipmentService.getEquipment({
          limit: 100,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          gymAreaId: areaFilter !== 'ALL' ? areaFilter : undefined,
        }),
        equipmentService.getGymAreas({ limit: 100 }),
      ]
      if (typeof equipmentService.getMaintenanceSchedules === 'function') {
        promises.push(equipmentService.getMaintenanceSchedules({ limit: 100 }))
      }

      const results = await Promise.allSettled(promises)
      const eqRes = results[0]
      const gaRes = results[1]
      const maintRes = results[2]

      if (eqRes && eqRes.status === 'fulfilled') {
        const list = Array.isArray(eqRes.value) ? eqRes.value : (eqRes.value?.data || [])
        setEquipmentList(list)
      }
      if (gaRes && gaRes.status === 'fulfilled') {
        const areas = Array.isArray(gaRes.value) ? gaRes.value : (gaRes.value?.data || [])
        setGymAreas(areas)
        if (areas.length > 0 && !createEqForm.gymAreaId) {
          setCreateEqForm((prev) => ({ ...prev, gymAreaId: areas[0].id }))
        }
      }
      if (maintRes && maintRes.status === 'fulfilled') {
        const maints = Array.isArray(maintRes.value) ? maintRes.value : (maintRes.value?.data || [])
        setMaintenanceList(maints)
      }

      if (eqRes.status === 'rejected' && gaRes.status === 'rejected') {
        setErrorMessage('Không thể tải dữ liệu thiết bị và cơ sở vật chất từ máy chủ.')
      }
    } catch {
      setErrorMessage('Lỗi kết nối máy chủ.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, areaFilter, createEqForm.gymAreaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ================= 1. Equipment Actions =================
  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createEqForm.name.trim() || !createEqForm.equipmentCode.trim() || !createEqForm.gymAreaId) {
      setErrorMessage('Vui lòng nhập tên, mã máy và chọn khu vực.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.createEquipment({
        name: createEqForm.name.trim(),
        equipmentCode: createEqForm.equipmentCode.trim(),
        gymAreaId: createEqForm.gymAreaId,
        brand: createEqForm.brand.trim() || undefined,
        model: createEqForm.model.trim() || undefined,
        purchaseDate: createEqForm.purchaseDate || undefined,
      })

      showSuccess(`Đã thêm thiết bị "${createEqForm.name}" thành công!`)
      setIsCreateEqModalOpen(false)
      setCreateEqForm({
        name: '',
        equipmentCode: '',
        gymAreaId: gymAreas[0]?.id || '',
        brand: '',
        model: '',
        purchaseDate: '',
      })
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Thêm thiết bị thất bại.')
      else setErrorMessage('Lỗi hệ thống khi thêm máy.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusModalEq) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.updateEquipmentStatus(statusModalEq.id, {
        status: targetEqStatus as any,
      })
      showSuccess(`Đã cập nhật trạng thái thiết bị thành ${targetEqStatus}!`)
      setStatusModalEq(null)
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Đổi trạng thái thất bại.')
      else setErrorMessage('Lỗi khi cập nhật trạng thái.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ================= 2. Gym Area Actions =================
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createAreaForm.name.trim()) {
      setErrorMessage('Vui lòng nhập tên khu vực.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.createGymArea({
        name: createAreaForm.name.trim(),
        location: createAreaForm.location.trim() || undefined,
        description: createAreaForm.description.trim() || undefined,
      })

      showSuccess(`Đã tạo khu vực "${createAreaForm.name}" thành công!`)
      setIsCreateAreaModalOpen(false)
      setCreateAreaForm({ name: '', location: '', description: '' })
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Tạo khu vực thất bại.')
      else setErrorMessage('Lỗi khi tạo khu vực.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ================= 3. Maintenance Actions =================
  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createMaintForm.equipmentId || !createMaintForm.scheduledAt || !createMaintForm.description.trim()) {
      setErrorMessage('Vui lòng chọn thiết bị, thời gian dự kiến và nội dung bảo trì.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.createMaintenanceSchedule({
        equipmentId: createMaintForm.equipmentId,
        scheduledAt: new Date(createMaintForm.scheduledAt).toISOString(),
        description: createMaintForm.description.trim(),
      })

      showSuccess('Đã lên lịch bảo trì thiết bị thành công!')
      setIsCreateMaintModalOpen(false)
      setCreateMaintForm({ equipmentId: '', scheduledAt: '', description: '' })
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Lên lịch bảo trì thất bại.')
      else setErrorMessage('Lỗi khi lên lịch bảo trì.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completeMaintItem) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.completeMaintenanceSchedule(completeMaintItem.id, {
        resultNote: completeMaintForm.resultNote.trim() || undefined,
        nextMaintenanceAt: completeMaintForm.nextMaintenanceAt
          ? new Date(completeMaintForm.nextMaintenanceAt).toISOString()
          : undefined,
      })

      showSuccess('Đã xác nhận hoàn tất bảo trì! Máy đã sẵn sàng hoạt động (AVAILABLE).')
      setCompleteMaintItem(null)
      setCompleteMaintForm({ resultNote: '', nextMaintenanceAt: '' })
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Xác nhận hoàn tất thất bại.')
      else setErrorMessage('Lỗi khi cập nhật hoàn tất bảo trì.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ================= 4. View & Edit Handlers =================
  const handleOpenViewEquipment = async (eq: Equipment) => {
    setViewingEquipment(eq)
    setIsViewingLoading(true)
    try {
      const detail = await equipmentService.getEquipmentById(eq.id)
      if (detail) setViewingEquipment(detail)
    } catch {
      // Non-fatal, use existing summary
    } finally {
      setIsViewingLoading(false)
    }
  }

  const handleOpenEditEquipment = (eq: Equipment) => {
    setEditingEquipment(eq)
    setEditEqForm({
      name: eq.name || '',
      equipmentCode: eq.equipmentCode || '',
      gymAreaId: eq.gymAreaId || gymAreas[0]?.id || '',
      brand: eq.brand || '',
      model: eq.model || '',
      purchaseDate: eq.purchaseDate ? eq.purchaseDate.slice(0, 10) : '',
    })
  }

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEquipment || !editEqForm.name.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.updateEquipment(editingEquipment.id, {
        name: editEqForm.name.trim() || undefined,
        gymAreaId: editEqForm.gymAreaId || undefined,
        brand: editEqForm.brand.trim() || undefined,
        model: editEqForm.model.trim() || undefined,
        purchaseDate: editEqForm.purchaseDate || undefined,
      })
      showSuccess(`Đã cập nhật thông tin thiết bị "${editEqForm.name}" thành công!`)
      setEditingEquipment(null)
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Cập nhật thiết bị thất bại.')
      else setErrorMessage('Lỗi khi cập nhật thiết bị.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEditArea = (area: GymArea) => {
    setEditingArea(area)
    setEditAreaForm({
      name: area.name || '',
      location: area.location || '',
      description: area.description || '',
      isActive: area.isActive ?? true,
    })
  }

  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingArea || !editAreaForm.name.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.updateGymArea(editingArea.id, {
        name: editAreaForm.name.trim() || undefined,
        location: editAreaForm.location.trim() || undefined,
        description: editAreaForm.description.trim() || undefined,
        isActive: editAreaForm.isActive,
      })
      showSuccess(`Đã cập nhật khu vực "${editAreaForm.name}" thành công!`)
      setEditingArea(null)
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Cập nhật khu vực thất bại.')
      else setErrorMessage('Lỗi khi cập nhật khu vực.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEditMaintenance = (maint: Maintenance) => {
    setEditingMaintItem(maint)
    setEditMaintForm({
      scheduledAt: maint.scheduledAt ? new Date(maint.scheduledAt).toISOString().slice(0, 16) : '',
      status: maint.status || 'SCHEDULED',
      description: maint.description || '',
    })
  }

  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMaintItem) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await equipmentService.updateMaintenanceSchedule(editingMaintItem.id, {
        scheduledAt: editMaintForm.scheduledAt ? new Date(editMaintForm.scheduledAt).toISOString() : undefined,
        status: editMaintForm.status as any,
        description: editMaintForm.description.trim() || undefined,
      })
      showSuccess('Đã cập nhật lịch bảo trì thiết bị thành công!')
      setEditingMaintItem(null)
      await loadData()
    } catch (err: any) {
      if (isAppApiError(err)) setErrorMessage(err.message || 'Cập nhật lịch bảo trì thất bại.')
      else setErrorMessage('Lỗi khi cập nhật lịch bảo trì.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ================= Columns =================
  const eqColumns: Column<Equipment>[] = [
    {
      header: 'Mã & Tên Thiết Bị',
      accessor: (row) => (
        <div>
          <p className="font-bold text-white">{row.name}</p>
          <p className="text-xs font-mono text-orange-400">
            {row.equipmentCode} {row.brand ? `• ${row.brand}` : ''} {row.model ? `(${row.model})` : ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Khu vực',
      accessor: (row) => (
        <span className="text-text-primary">
          {(row as any).gymArea?.name || row.gymAreaName || 'Khu chung'}
        </span>
      ),
    },
    {
      header: 'Tình trạng',
      accessor: (row) => <StatusBadge status={row.status || 'AVAILABLE'} context="equipment" />,
    },
    {
      header: 'Bảo trì lần cuối',
      accessor: (row) => (row.lastMaintenanceAt ? formatDate(row.lastMaintenanceAt) : 'Chưa bảo trì'),
    },
  ]

  const areaColumns: Column<GymArea>[] = [
    {
      header: 'Tên Khu Vực',
      accessor: (row) => <span className="font-bold text-text-primary">{row.name}</span>,
    },
    {
      header: 'Vị trí',
      accessor: (row) => <span className="text-text-primary">{row.location || 'Chưa định vị'}</span>,
    },
    {
      header: 'Mô tả',
      accessor: (row) => <span className="text-text-muted text-xs">{row.description || '--'}</span>,
    },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ]

  const maintColumns: Column<Maintenance>[] = [
    {
      header: 'Thiết Bị',
      accessor: (row) => (
        <div>
          <p className="font-bold text-text-primary">{row.equipmentName || (row as any).equipment?.name || row.equipmentId.slice(0, 8)}</p>
          <p className="text-xs font-mono text-text-muted">{(row as any).equipment?.equipmentCode}</p>
        </div>
      ),
    },
    {
      header: 'Nội dung',
      accessor: (row) => <span className="text-text-primary text-xs">{row.description}</span>,
    },
    {
      header: 'Thời gian hẹn',
      accessor: (row) => <span className="font-mono text-xs">{formatDateTime(row.scheduledAt)}</span>,
    },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.status} context="maintenance" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span>Quản Lý Thiết Bị & Khu Vực Phòng Gym</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi máy móc phòng gym, cơ sở vật chất khu vực và lịch trình bảo trì định kỳ
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

          {activeTab === 'equipment' && (
            <Button size="sm" onClick={() => setIsCreateEqModalOpen(true)} className="gap-1.5 text-xs">
              <Plus className="h-4 w-4" />
              <span>Thêm thiết bị mới</span>
            </Button>
          )}

          {activeTab === 'areas' && (
            <Button size="sm" onClick={() => setIsCreateAreaModalOpen(true)} className="gap-1.5 text-xs">
              <Plus className="h-4 w-4" />
              <span>Tạo khu vực mới</span>
            </Button>
          )}

          {activeTab === 'maintenance' && (
            <Button size="sm" onClick={() => setIsCreateMaintModalOpen(true)} className="gap-1.5 text-xs">
              <Plus className="h-4 w-4" />
              <span>Lên lịch bảo trì</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-600 dark:text-emerald-300">
          <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'equipment'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Danh mục Thiết bị ({equipmentList.length})
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'areas'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Khu Vực & Zone ({gymAreas.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'maintenance'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Lịch Bảo Trì ({maintenanceList.length})
        </button>
      </div>

      {/* TAB 1: EQUIPMENT */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-bg-surface-muted p-3 rounded-xl border border-border-subtle text-xs items-center">
            <span className="text-text-muted font-semibold">Lọc trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-lg px-2.5 py-1 text-text-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">AVAILABLE (Sẵn sàng)</option>
              <option value="IN_USE">IN_USE (Đang dùng)</option>
              <option value="MAINTENANCE">MAINTENANCE (Bảo trì)</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE (Hỏng/Dừng)</option>
            </select>

            <span className="text-text-muted font-semibold ml-2">Khu vực:</span>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-lg px-2.5 py-1 text-text-primary"
            >
              <option value="ALL">Tất cả khu vực</option>
              {gymAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <DataTable
            columns={eqColumns}
            data={equipmentList}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="Tìm kiếm thiết bị theo tên..."
            actions={(row) => (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 px-2 text-text-muted hover:text-text-primary"
                  onClick={() => handleOpenViewEquipment(row)}
                  title="Xem chi tiết"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 px-2 text-text-muted hover:text-primary"
                  onClick={() => handleOpenEditEquipment(row)}
                  title="Chỉnh sửa thông tin"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-border-subtle"
                  onClick={() => {
                    setStatusModalEq(row)
                    setTargetEqStatus(row.status || 'AVAILABLE')
                  }}
                >
                  Đổi trạng thái
                </Button>
              </div>
            )}
          />
        </div>
      )}

      {/* TAB 2: GYM AREAS */}
      {activeTab === 'areas' && (
        <DataTable
          columns={areaColumns}
          data={gymAreas}
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="Tìm kiếm khu vực..."
          actions={(row) => (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 gap-1 border-border-subtle"
              onClick={() => handleOpenEditArea(row)}
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Sửa khu vực</span>
            </Button>
          )}
        />
      )}

      {/* TAB 3: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <DataTable
          columns={maintColumns}
          data={maintenanceList}
          isLoading={isLoading}
          searchKey="description"
          searchPlaceholder="Tìm kiếm công việc bảo trì..."
          actions={(row) => (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1 border-border-subtle"
                onClick={() => handleOpenEditMaintenance(row)}
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa</span>
              </Button>
              {(row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS') && (
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs h-7 gap-1"
                  onClick={() => {
                    setCompleteMaintItem(row)
                    setCompleteMaintForm({ resultNote: '', nextMaintenanceAt: '' })
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Hoàn thành</span>
                </Button>
              )}
            </div>
          )}
        />
      )}

      {/* Modal: Create Equipment */}
      <Modal
        isOpen={isCreateEqModalOpen}
        onClose={() => !isSubmitting && setIsCreateEqModalOpen(false)}
        title="Thêm Thiết Bị Phòng Gym Mới"
        description="Đăng ký mã máy và định vị khu vực tập luyện"
      >
        <form onSubmit={handleCreateEquipment} className="space-y-4">
          <Input
            label="Tên thiết bị / máy tập"
            required
            value={createEqForm.name}
            onChange={(e) => setCreateEqForm({ ...createEqForm, name: e.target.value })}
            placeholder="Ví dụ: Máy Chạy Bộ Matrix Commercial T70"
            disabled={isSubmitting}
          />
          <Input
            label="Mã định danh thiết bị (Equipment Code)"
            required
            value={createEqForm.equipmentCode}
            onChange={(e) => setCreateEqForm({ ...createEqForm, equipmentCode: e.target.value })}
            placeholder="Ví dụ: EQ-TM-01"
            disabled={isSubmitting}
          />

          {gymAreas.length > 0 ? (
            <Select
              label="Khu vực đặt thiết bị"
              value={createEqForm.gymAreaId}
              onChange={(e) => setCreateEqForm({ ...createEqForm, gymAreaId: e.target.value })}
              options={gymAreas.map((a) => ({ value: a.id, label: `${a.name} (${a.location || 'Chung'})` }))}
              disabled={isSubmitting}
            />
          ) : (
            <p className="text-xs text-amber-400">Chưa có khu vực nào. Hãy tạo khu vực trước.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Thương hiệu (Brand)"
              value={createEqForm.brand}
              onChange={(e) => setCreateEqForm({ ...createEqForm, brand: e.target.value })}
              placeholder="Hammer Strength..."
              disabled={isSubmitting}
            />
            <Input
              label="Model"
              value={createEqForm.model}
              onChange={(e) => setCreateEqForm({ ...createEqForm, model: e.target.value })}
              placeholder="T-2026 Pro"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsCreateEqModalOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || !createEqForm.gymAreaId}>
              Lưu thiết bị
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Change Equipment Status */}
      <Modal
        isOpen={!!statusModalEq}
        onClose={() => !isSubmitting && setStatusModalEq(null)}
        title={`Cập nhật trạng thái máy [${statusModalEq?.equipmentCode}]`}
        description={statusModalEq?.name}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <Select
            label="Trạng thái vận hành"
            value={targetEqStatus}
            onChange={(e) => setTargetEqStatus(e.target.value)}
            options={[
              { value: 'AVAILABLE', label: 'AVAILABLE - Sẵn sàng phục vụ' },
              { value: 'IN_USE', label: 'IN_USE - Đang có hội viên tập' },
              { value: 'MAINTENANCE', label: 'MAINTENANCE - Đang tạm ngừng để bảo trì' },
              { value: 'OUT_OF_SERVICE', label: 'OUT_OF_SERVICE - Hỏng hóc / Ngừng hoạt động' },
            ]}
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setStatusModalEq(null)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Cập nhật
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Gym Area */}
      <Modal
        isOpen={isCreateAreaModalOpen}
        onClose={() => !isSubmitting && setIsCreateAreaModalOpen(false)}
        title="Tạo Khu Vực / Zone Mới"
        description="Định nghĩa phân khu chức năng trong trung tâm thể hình"
      >
        <form onSubmit={handleCreateArea} className="space-y-4">
          <Input
            label="Tên khu vực"
            required
            value={createAreaForm.name}
            onChange={(e) => setCreateAreaForm({ ...createAreaForm, name: e.target.value })}
            placeholder="Ví dụ: Khu Cardio, Khu Tạ Tự Do (Free Weights)..."
            disabled={isSubmitting}
          />
          <Input
            label="Vị trí (Location)"
            value={createAreaForm.location}
            onChange={(e) => setCreateAreaForm({ ...createAreaForm, location: e.target.value })}
            placeholder="Tầng 1 - Cánh Đông, Tầng 2..."
            disabled={isSubmitting}
          />
          <Textarea
            label="Mô tả"
            rows={3}
            value={createAreaForm.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateAreaForm({ ...createAreaForm, description: e.target.value })}
            placeholder="Mô tả chức năng hoặc các lưu ý an toàn của khu vực..."
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsCreateAreaModalOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Tạo khu vực
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Maintenance Schedule */}
      <Modal
        isOpen={isCreateMaintModalOpen}
        onClose={() => !isSubmitting && setIsCreateMaintModalOpen(false)}
        title="Lên Lịch Bảo Trì Thiết Bị"
        description="Định thời điểm kiểm tra kỹ thuật hoặc thay thế linh kiện máy móc"
      >
        <form onSubmit={handleCreateMaintenance} className="space-y-4">
          {equipmentList.length > 0 ? (
            <Select
              label="Thiết bị cần bảo trì"
              value={createMaintForm.equipmentId}
              onChange={(e) => setCreateMaintForm({ ...createMaintForm, equipmentId: e.target.value })}
              options={[
                { value: '', label: '-- Chọn thiết bị --' },
                ...equipmentList.map((eq) => ({
                  value: eq.id,
                  label: `[${eq.equipmentCode}] ${eq.name}`,
                })),
              ]}
              disabled={isSubmitting}
            />
          ) : (
            <p className="text-xs text-amber-400">Chưa có thiết bị nào trong danh mục.</p>
          )}

          <Input
            label="Thời gian dự kiến bảo trì"
            type="datetime-local"
            required
            value={createMaintForm.scheduledAt}
            onChange={(e) => setCreateMaintForm({ ...createMaintForm, scheduledAt: e.target.value })}
            disabled={isSubmitting}
          />

          <Textarea
            label="Nội dung công việc bảo trì"
            required
            rows={3}
            value={createMaintForm.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateMaintForm({ ...createMaintForm, description: e.target.value })}
            placeholder="Tra dầu băng chuyền, thay cáp ròng rọc, siết ốc định kỳ..."
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsCreateMaintModalOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || !createMaintForm.equipmentId}>
              Lưu lịch bảo trì
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Complete Maintenance */}
      <Modal
        isOpen={!!completeMaintItem}
        onClose={() => !isSubmitting && setCompleteMaintItem(null)}
        title="Xác Nhận Hoàn Thành Bảo Trì"
        description={completeMaintItem?.description}
      >
        <form onSubmit={handleCompleteMaintenance} className="space-y-4">
          <Textarea
            label="Ghi chú kết quả kỹ thuật"
            rows={3}
            value={completeMaintForm.resultNote}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompleteMaintForm({ ...completeMaintForm, resultNote: e.target.value })}
            placeholder="Đã thay phụ tùng, kiểm tra tải trọng an toàn và sẵn sàng vận hành..."
            disabled={isSubmitting}
          />

          <Input
            label="Dự kiến bảo trì lần tiếp theo (Next Maintenance)"
            type="datetime-local"
            value={completeMaintForm.nextMaintenanceAt}
            onChange={(e) => setCompleteMaintForm({ ...completeMaintForm, nextMaintenanceAt: e.target.value })}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setCompleteMaintItem(null)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Xác nhận xong
            </Button>
          </div>
        </form>
      </Modal>
      {/* Modal: View Equipment Details */}
      <Modal
        isOpen={!!viewingEquipment}
        onClose={() => setViewingEquipment(null)}
        title="Chi Tiết Thiết Bị Phòng Gym"
        description={viewingEquipment ? `Mã máy: ${viewingEquipment.equipmentCode} • ID: ${viewingEquipment.id}` : ''}
      >
        {isViewingLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : viewingEquipment ? (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg-surface-muted border border-border-subtle">
              <div>
                <p className="text-base font-bold text-text-primary">{viewingEquipment.name}</p>
                <p className="text-text-muted font-mono text-xs mt-0.5">
                  {viewingEquipment.brand ? `${viewingEquipment.brand} ` : ''}
                  {viewingEquipment.model ? `(${viewingEquipment.model})` : ''}
                </p>
              </div>
              <StatusBadge status={viewingEquipment.status || 'AVAILABLE'} context="equipment" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-bg-surface border border-border-subtle">
              <div>
                <span className="text-text-muted block">Khu vực đặt máy:</span>
                <span className="text-text-primary font-medium">
                  {viewingEquipment.gymAreaName || (viewingEquipment as any).gymArea?.name || 'Chưa định vị'}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Vị trí cụ thể:</span>
                <span className="text-text-primary">
                  {(viewingEquipment as any).gymArea?.location || 'Trung tâm'}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Ngày mua / nhập kho:</span>
                <span className="text-text-primary font-mono">
                  {viewingEquipment.purchaseDate ? formatDate(viewingEquipment.purchaseDate) : 'Chưa ghi nhận'}
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Bảo dưỡng gần nhất:</span>
                <span className="text-text-primary font-mono">
                  {(viewingEquipment as any).lastMaintainedAt ? formatDate((viewingEquipment as any).lastMaintainedAt) : 'Chưa có'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <Button type="button" variant="ghost" onClick={() => setViewingEquipment(null)}>
                Đóng
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal: Edit Equipment */}
      <Modal
        isOpen={!!editingEquipment}
        onClose={() => !isSubmitting && setEditingEquipment(null)}
        title="Chỉnh Sửa Thông Tin Thiết Bị"
        description={`Cập nhật thông số cho [${editingEquipment?.equipmentCode}]`}
      >
        <form onSubmit={handleUpdateEquipment} className="space-y-4">
          <Input
            label="Tên thiết bị *"
            value={editEqForm.name}
            onChange={(e) => setEditEqForm({ ...editEqForm, name: e.target.value })}
            placeholder="Máy Chạy Bộ Technogym..."
            required
            disabled={isSubmitting}
          />

          <Input
            label="Mã quản lý thiết bị (Equipment Code) *"
            value={editEqForm.equipmentCode}
            onChange={(e) => setEditEqForm({ ...editEqForm, equipmentCode: e.target.value })}
            placeholder="RUN-001..."
            required
            disabled={isSubmitting}
          />

          {gymAreas.length > 0 && (
            <Select
              label="Khu vực đặt thiết bị"
              value={editEqForm.gymAreaId}
              onChange={(e) => setEditEqForm({ ...editEqForm, gymAreaId: e.target.value })}
              options={gymAreas.map((a) => ({ value: a.id, label: `${a.name} (${a.location || 'Chung'})` }))}
              disabled={isSubmitting}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Thương hiệu (Brand)"
              value={editEqForm.brand}
              onChange={(e) => setEditEqForm({ ...editEqForm, brand: e.target.value })}
              placeholder="Technogym..."
              disabled={isSubmitting}
            />
            <Input
              label="Model"
              value={editEqForm.model}
              onChange={(e) => setEditEqForm({ ...editEqForm, model: e.target.value })}
              placeholder="Excite Live"
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Ngày mua / nhập kho"
            type="date"
            value={editEqForm.purchaseDate}
            onChange={(e) => setEditEqForm({ ...editEqForm, purchaseDate: e.target.value })}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setEditingEquipment(null)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Cập nhật thiết bị
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Gym Area */}
      <Modal
        isOpen={!!editingArea}
        onClose={() => !isSubmitting && setEditingArea(null)}
        title="Chỉnh Sửa Khu Vực / Zone"
        description={editingArea ? `ID: ${editingArea.id}` : ''}
      >
        <form onSubmit={handleUpdateArea} className="space-y-4">
          <Input
            label="Tên khu vực *"
            value={editAreaForm.name}
            onChange={(e) => setEditAreaForm({ ...editAreaForm, name: e.target.value })}
            placeholder="Khu Cardio Tầng 2..."
            required
            disabled={isSubmitting}
          />

          <Input
            label="Vị trí (Location)"
            value={editAreaForm.location}
            onChange={(e) => setEditAreaForm({ ...editAreaForm, location: e.target.value })}
            placeholder="Tầng 2, Cánh Đông..."
            disabled={isSubmitting}
          />

          <Textarea
            label="Mô tả chức năng"
            rows={2}
            value={editAreaForm.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditAreaForm({ ...editAreaForm, description: e.target.value })}
            placeholder="Khu máy chạy bộ, xe đạp trượt tuyết..."
            disabled={isSubmitting}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="areaActiveCheck"
              checked={editAreaForm.isActive}
              onChange={(e) => setEditAreaForm({ ...editAreaForm, isActive: e.target.checked })}
              className="rounded border-border-subtle bg-bg-input text-primary focus:ring-0"
              disabled={isSubmitting}
            />
            <label htmlFor="areaActiveCheck" className="text-xs text-text-primary cursor-pointer">
              Khu vực đang mở cửa hoạt động (Active)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setEditingArea(null)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Maintenance Schedule */}
      <Modal
        isOpen={!!editingMaintItem}
        onClose={() => !isSubmitting && setEditingMaintItem(null)}
        title="Chỉnh Sửa / Dời Lịch Bảo Trì"
        description={editingMaintItem ? `Mã công việc: ${editingMaintItem.id}` : ''}
      >
        <form onSubmit={handleUpdateMaintenance} className="space-y-4">
          <Input
            label="Thời gian hẹn mới *"
            type="datetime-local"
            value={editMaintForm.scheduledAt}
            onChange={(e) => setEditMaintForm({ ...editMaintForm, scheduledAt: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <Select
            label="Trạng thái lịch hẹn"
            value={editMaintForm.status}
            onChange={(e) => setEditMaintForm({ ...editMaintForm, status: e.target.value })}
            options={[
              { value: 'SCHEDULED', label: 'SCHEDULED - Đã lên lịch' },
              { value: 'IN_PROGRESS', label: 'IN_PROGRESS - Đang thực hiện' },
              { value: 'CANCELLED', label: 'CANCELLED - Đã hủy' },
            ]}
            disabled={isSubmitting}
          />

          <Textarea
            label="Nội dung kiểm tra / bảo trì"
            rows={3}
            value={editMaintForm.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditMaintForm({ ...editMaintForm, description: e.target.value })}
            placeholder="Tra dầu xích, kiểm tra dây curoa..."
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setEditingMaintItem(null)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Cập nhật lịch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
