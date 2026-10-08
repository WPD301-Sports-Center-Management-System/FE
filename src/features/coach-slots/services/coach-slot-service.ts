import { apiClient } from '@/shared/api/client'
import type { CoachSlot } from '@/shared/types/api'
import type {
  CreateSlotInput,
  BulkCreateSlotInput,
  BlockSlotInput,
  QuickBulkCreateSlotsInput,
} from '../types/coach-slot-types'

export const coachSlotService = {
  async getSlots(params: { coachId?: string; from?: string; to?: string }): Promise<CoachSlot[]> {
    const res = await apiClient.get<{ data: CoachSlot[] }>('/coach-slots', { params })
    return ((res as unknown as { data: CoachSlot[] }).data || res) as CoachSlot[]
  },

  async createSlot(input: CreateSlotInput): Promise<CoachSlot> {
    const startsAt = `${input.date}T${input.startTime}:00+07:00`
    const endsAt = `${input.date}T${input.endTime}:00+07:00`
    const res = await apiClient.post<{ data: CoachSlot }>('/coach-slots', {
      startsAt,
      endsAt,
      offeringId: input.offeringId,
      note: input.note,
    })
    return ((res as unknown as { data: CoachSlot }).data || res) as CoachSlot
  },

  async bulkCreateSlots(input: BulkCreateSlotInput): Promise<CoachSlot[]> {
    const created: CoachSlot[] = []
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    const current = new Date(start)

    while (current <= end) {
      // getDay: 0 = Sunday, 1 = Monday, ... 6 = Saturday
      // Match with ISO/JS daysOfWeek: Monday=1, Tuesday=2, ... Sunday=0 or 7
      const day = current.getDay() === 0 ? 7 : current.getDay()
      if (input.daysOfWeek.includes(day)) {
        const dateStr = current.toISOString().split('T')[0]
        const slot = await this.createSlot({
          date: dateStr,
          startTime: input.startTime,
          endTime: input.endTime,
          offeringId: input.offeringId,
          note: input.note,
        })
        created.push(slot)
      }
      current.setDate(current.getDate() + 1)
    }

    return created
  },

  /**
   * Bulk tạo các slot theo quy chuẩn 7 khung giờ cố định
   * Gọi API POST /api/v1/coach-slots/bulk
   */
  async bulkCreateTemplateSlots(
    input: QuickBulkCreateSlotsInput
  ): Promise<{ message: string; count: number; data: CoachSlot[] }> {
    const res = await apiClient.post<{
      success: boolean
      message: string
      count: number
      data: CoachSlot[]
    }>('/coach-slots/bulk', input)
    return res as unknown as { message: string; count: number; data: CoachSlot[] }
  },

  async blockSlot({ slotId, reason }: BlockSlotInput): Promise<CoachSlot> {
    const res = await apiClient.patch<{ data: CoachSlot }>(`/coach-slots/${slotId}/block`, {
      reason,
    })
    return ((res as unknown as { data: CoachSlot }).data || res) as CoachSlot
  },

  async unblockSlot(slotId: string): Promise<CoachSlot> {
    const res = await apiClient.patch<{ data: CoachSlot }>(`/coach-slots/${slotId}`, {
      status: 'OPEN',
    })
    return ((res as unknown as { data: CoachSlot }).data || res) as CoachSlot
  },

  async deleteSlot(slotId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/coach-slots/${slotId}`)
    return res as unknown as { message: string }
  },
}

