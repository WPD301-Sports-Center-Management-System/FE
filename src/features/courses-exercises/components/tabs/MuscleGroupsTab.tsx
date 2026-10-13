import { useMemo } from 'react'
import { Search, Layers, Edit2, Power } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import type { MuscleGroup } from '@/shared/types/api'

interface MuscleGroupsTabProps {
  muscleGroups: MuscleGroup[]
  search: string
  onSearchChange: (val: string) => void
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  onStatusFilterChange: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void
  onOpenEdit: (muscleGroup: MuscleGroup) => void
  onToggleStatus: (muscleGroup: MuscleGroup) => void
  togglingMuscleId: string | null
}

export function MuscleGroupsTab({
  muscleGroups,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenEdit,
  onToggleStatus,
  togglingMuscleId,
}: MuscleGroupsTabProps) {
  const filteredMuscleGroups = useMemo(() => {
    return muscleGroups.filter((mg) => {
      const s = search.toLowerCase()
      const matchesSearch =
        mg.name.toLowerCase().includes(s) ||
        (mg.description && mg.description.toLowerCase().includes(s))
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && mg.isActive) ||
        (statusFilter === 'INACTIVE' && !mg.isActive)
      return matchesSearch && matchesStatus
    })
  }, [muscleGroups, search, statusFilter])

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-bg-surface p-3.5 rounded-2xl border border-border-subtle shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm nhóm cơ..."
            className="w-full pl-9 pr-3.5 py-2 bg-bg-input border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-text-muted">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">Tất cả ({muscleGroups.length})</option>
            <option value="ACTIVE">
              Đang hoạt động ({muscleGroups.filter((m) => m.isActive).length})
            </option>
            <option value="INACTIVE">
              Tạm dừng ({muscleGroups.filter((m) => !m.isActive).length})
            </option>
          </select>
        </div>
      </div>

      {filteredMuscleGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle p-12 text-center text-text-muted text-xs">
          {search || statusFilter !== 'ALL'
            ? 'Không tìm thấy nhóm cơ phù hợp với bộ lọc.'
            : 'Chưa có nhóm cơ nào được tạo trong hệ thống.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMuscleGroups.map((mg) => (
            <div
              key={mg.id}
              className="group relative rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-3 transition-all hover:border-border-strong hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                        {mg.name}
                      </h4>
                      <p className="text-[10px] text-text-muted font-mono">
                        ID: {mg.id.slice(0, 8)}...
                      </p>
                      <p className="text-[10px] text-text-muted">
                        Hồi phục: {mg.recoveryDays ?? 2} ngày
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={mg.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>

                {mg.imageUrl && (
                  <div className="mt-2.5 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface-muted max-h-32">
                    <img
                      src={mg.imageUrl}
                      alt={mg.name}
                      className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <p className="text-xs text-text-muted leading-relaxed mt-2.5">
                  {mg.description || 'Nhóm cơ rèn luyện theo chuẩn giải phẫu thể hình.'}
                </p>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenEdit(mg)}
                  className="text-[11px] h-7 px-2.5 gap-1.5"
                >
                  <Edit2 className="h-3 w-3 text-primary" />
                  <span>Chỉnh sửa</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus(mg)}
                  disabled={togglingMuscleId === mg.id}
                  className={`text-[11px] h-7 px-2.5 gap-1.5 ${
                    mg.isActive
                      ? 'text-danger hover:bg-danger/10 hover:text-danger border-danger/30'
                      : 'text-success hover:bg-success/10 hover:text-success border-success/30'
                  }`}
                >
                  <Power
                    className={`h-3 w-3 ${
                      togglingMuscleId === mg.id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{mg.isActive ? 'Tạm dừng' : 'Kích hoạt'}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
