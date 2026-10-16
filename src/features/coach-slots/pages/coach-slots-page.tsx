import { useState, useMemo, useCallback, useEffect } from 'react'
import { Views, type View } from 'react-big-calendar'
import { addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { Plus, Layers, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { Button } from '@/shared/components/ui/button'
import { CoachScheduleCalendar, type SelectedTimeRange } from '../components/coach-schedule-calendar'
import { ScheduleToolbar } from '../components/schedule-toolbar'
import { ScheduleLegend } from '../components/schedule-legend'
import { SlotDetailDrawer } from '../components/slot-detail-drawer'
import { CreateSlotDialog } from '../components/create-slot-dialog'
import { BulkCreateSlotDialog } from '../components/bulk-create-slot-dialog'
import { BlockSlotDialog } from '../components/block-slot-dialog'
import { QuickSlotGeneratorModal } from '../components/quick-slot-generator-modal'
import {
  useCoachSlots,
  useCreateSlot,
  useBulkCreateSlots,
  useBulkCreateTemplateSlots,
  useBlockSlot,
  useDeleteSlot,
} from '../hooks/use-coach-slots'
import { mapSlotsToCalendarEvents } from '../utils/calendar-event-mapper'
import { formatWeekRangeText, formatDayTitleText } from '../utils/slot-time-utils'
import type {
  SlotStatusFilter,
  CreateSlotInput,
  BulkCreateSlotInput,
  QuickBulkCreateSlotsInput,
} from '../types/coach-slot-types'
import type { CoachSlot } from '@/shared/types/api'

export function CoachSlotsPage() {
  // Controlled Calendar Date & View
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<View>(Views.WEEK)
  const [statusFilter, setStatusFilter] = useState<SlotStatusFilter>('ALL')

  // Dynamic offerings list
  const [offerings, setOfferings] = useState<
    Array<{ id: string; name: string; courseName?: string; status: string }>
  >([])

  useEffect(() => {
    async function loadOfferings() {
      try {
        const res = await coachesService.getMyOfferings()
        const items = res?.data || []
        if (items.length > 0) {
          setOfferings(
            items.map((o) => ({
              id: o.id,
              name: (o as any).course?.name || o.courseName || 'Khóa đào tạo PT',
              courseName: (o as any).course?.name || o.courseName,
              status: o.status,
            }))
          )
        }
      } catch {
        setOfferings([])
      }
    }
    loadOfferings()
  }, [])

  // Dialog & Drawer states
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false)
  const [isBlockOpen, setIsBlockOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<CoachSlot | null>(null)
  const [prefilledCreate, setPrefilledCreate] = useState<Partial<CreateSlotInput> | undefined>(undefined)

  // Range and text for toolbar
  const rangeText = useMemo(() => {
    return view === Views.WEEK ? formatWeekRangeText(date) : formatDayTitleText(date)
  }, [date, view])

  const visibleRange = useMemo(() => {
    if (view === Views.WEEK) {
      const s = startOfWeek(date, { weekStartsOn: 1 })
      const e = endOfWeek(date, { weekStartsOn: 1 })
      return { from: s.toISOString(), to: e.toISOString() }
    }
    return { from: date.toISOString(), to: date.toISOString() }
  }, [date, view])

  // Queries & Mutations
  const {
    data: slots = [],
    isLoading,
    isError,
    refetch,
  } = useCoachSlots({
    from: visibleRange.from,
    to: visibleRange.to,
  })

  const createSlotMutation = useCreateSlot()
  const bulkCreateMutation = useBulkCreateSlots()
  const bulkCreateTemplateMutation = useBulkCreateTemplateSlots()
  const blockSlotMutation = useBlockSlot()
  const deleteSlotMutation = useDeleteSlot()

  // Map slots to CalendarEvents (with JS Date objects)
  const calendarEvents = useMemo(() => {
    return mapSlotsToCalendarEvents(slots, [], statusFilter)
  }, [slots, statusFilter])

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setDate((prev) => (view === Views.WEEK ? subWeeks(prev, 1) : subDays(prev, 1)))
  }, [view])

  const handleNext = useCallback(() => {
    setDate((prev) => (view === Views.WEEK ? addWeeks(prev, 1) : addDays(prev, 1)))
  }, [view])

  const handleToday = useCallback(() => {
    setDate(new Date())
  }, [])

  const handleViewModeChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

  // Selection & Click Handlers
  const handleTimeSelect = useCallback(
    (selection: SelectedTimeRange) => {
      setPrefilledCreate({
        date: selection.dateStr,
        slotIndex: selection.slotIndex,
        startTime: selection.startTime,
        endTime: selection.endTime,
        offeringId: offerings[0]?.id || '',
      })
      setIsCreateOpen(true)
    },
    [offerings]
  )

  const handleEventClick = useCallback(
    (slotId: string, event?: any) => {
      const found = slots.find((s) => s.id === slotId)
      if (found) {
        setSelectedSlot({
          ...found,
          ...(event || {}),
        })
        setIsDetailOpen(true)
      } else if (event) {
        setSelectedSlot(event as any)
        setIsDetailOpen(true)
      }
    },
    [slots]
  )

  const handleOpenBlockFromDrawer = useCallback((slot: CoachSlot) => {
    setSelectedSlot(slot)
    setIsDetailOpen(false)
    setIsBlockOpen(true)
  }, [])

  const handleConfirmBlock = useCallback(
    async (slotId: string, reason: string) => {
      await blockSlotMutation.mutateAsync({ slotId, reason })
      setIsBlockOpen(false)
    },
    [blockSlotMutation]
  )

  const handleCreateSubmit = useCallback(
    async (data: CreateSlotInput) => {
      await createSlotMutation.mutateAsync(data)
      setIsCreateOpen(false)
      setPrefilledCreate(undefined)
    },
    [createSlotMutation]
  )

  const handleBulkCreateSubmit = useCallback(
    async (data: BulkCreateSlotInput) => {
      await bulkCreateMutation.mutateAsync(data)
      setIsBulkCreateOpen(false)
    },
    [bulkCreateMutation]
  )

  const handleQuickBulkSubmit = useCallback(
    async (data: QuickBulkCreateSlotsInput) => {
      await bulkCreateTemplateMutation.mutateAsync(data)
      setIsQuickModalOpen(false)
    },
    [bulkCreateTemplateMutation]
  )

  const handleDeleteSlot = useCallback(
    async (slotId: string) => {
      await deleteSlotMutation.mutateAsync({ slotId })
      setIsDetailOpen(false)
    },
    [deleteSlotMutation]
  )

  return (
    <div className="space-y-5 max-w-[1680px] mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Quản lý khung giờ làm việc
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Đăng ký các slot trống để học viên hoặc Lễ tân có thể xếp lịch tập PT 1:1
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            className="gap-2 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md shadow-orange-500/20"
            onClick={() => setIsQuickModalOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            <span>Mở 7 Ca Chuẩn</span>
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-xs border-border-subtle hover:border-border-strong"
            onClick={() => setIsBulkCreateOpen(true)}
          >
            <Layers className="h-4 w-4 text-orange-400" />
            <span>Mở theo chu kỳ</span>
          </Button>
          <Button
            variant="secondary"
            className="gap-2 text-xs"
            onClick={() => {
              setPrefilledCreate(undefined)
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Khung giờ đơn lẻ</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <ScheduleToolbar
        rangeText={rangeText}
        viewMode={view}
        onViewModeChange={handleViewModeChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Error State */}
      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
            <span>Không thể tải lịch làm việc của huấn luyện viên.</span>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* Calendar Area */}
      <div className="space-y-4">
        <CoachScheduleCalendar
          events={calendarEvents}
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
          onEventClick={handleEventClick}
          onTimeSelect={handleTimeSelect}
          isLoading={isLoading}
        />

        {/* Legend */}
        <div className="p-2">
          <ScheduleLegend />
        </div>
      </div>

      {/* Modals & Drawers */}
      <QuickSlotGeneratorModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        offerings={offerings}
        existingSlots={slots}
        onSubmit={handleQuickBulkSubmit}
        isSubmitting={bulkCreateTemplateMutation.isPending}
      />

      <CreateSlotDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false)
          setPrefilledCreate(undefined)
        }}
        onSubmit={handleCreateSubmit}
        initialValues={prefilledCreate}
        offerings={offerings}
        existingSlots={slots}
        isSubmitting={createSlotMutation.isPending}
      />

      <BulkCreateSlotDialog
        isOpen={isBulkCreateOpen}
        onClose={() => setIsBulkCreateOpen(false)}
        onSubmit={handleBulkCreateSubmit}
        offerings={offerings}
        isSubmitting={bulkCreateMutation.isPending}
      />

      <BlockSlotDialog
        isOpen={isBlockOpen}
        onClose={() => setIsBlockOpen(false)}
        slot={selectedSlot}
        onConfirm={handleConfirmBlock}
        isSubmitting={blockSlotMutation.isPending}
      />

      <SlotDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        slot={selectedSlot}
        onBlockSlot={handleOpenBlockFromDrawer}
        onDeleteSlot={handleDeleteSlot}
        isDeleting={deleteSlotMutation.isPending}
      />
    </div>
  )
}
