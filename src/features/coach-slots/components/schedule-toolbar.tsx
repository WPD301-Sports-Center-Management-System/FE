import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import type { SlotViewMode, SlotStatusFilter } from '../types/coach-slot-types'

export interface ScheduleToolbarProps {
  rangeText: string
  viewMode: SlotViewMode
  onViewModeChange: (mode: SlotViewMode) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  statusFilter: SlotStatusFilter
  onStatusFilterChange: (filter: SlotStatusFilter) => void
}

export function ScheduleToolbar({
  rangeText,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  statusFilter,
  onStatusFilterChange,
}: ScheduleToolbarProps) {
  const filterOptions: Array<{ value: SlotStatusFilter; label: string }> = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'OPEN', label: 'Trống' },
    { value: 'BOOKED', label: 'Đã đặt' },
    { value: 'BLOCKED', label: 'Đã khóa' },
  ]

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-3.5 sm:p-4 shadow-sm shadow-slate-900/[0.04] backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
      {/* Navigation Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border-subtle bg-bg-surface-muted p-1">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors"
            title="Tuần/Ngày trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-surface transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors"
            title="Tuần/Ngày tiếp theo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-text-primary min-w-0">
          <CalendarIcon className="h-4 w-4 text-orange-400" />
          <span className="truncate">{rangeText || 'Đang tải lịch...'}</span>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        {/* View Switcher */}
        <div className="flex rounded-xl border border-border-subtle bg-bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Theo Tuần
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'day'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Theo Ngày
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-l border-border-subtle pl-3">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onStatusFilterChange(f.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'border border-orange-500/40 bg-orange-500/15 text-orange-600 dark:text-orange-300 font-bold shadow-sm'
                  : 'text-text-muted hover:bg-bg-surface-muted hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
