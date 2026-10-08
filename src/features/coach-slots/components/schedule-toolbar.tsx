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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
      {/* Navigation Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-950 p-1">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Tuần/Ngày trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Tuần/Ngày tiếp theo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <CalendarIcon className="h-4 w-4 text-orange-400" />
          <span>{rangeText || 'Đang tải lịch...'}</span>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View Switcher */}
        <div className="flex rounded-xl border border-slate-700/80 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
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
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Theo Ngày
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-l border-slate-800 pl-3">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onStatusFilterChange(f.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'border border-orange-500/40 bg-orange-500/20 text-orange-300 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
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
