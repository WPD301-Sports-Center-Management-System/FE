import { apiClient } from '@/shared/api/client'
import type { CoachSlot } from '@/shared/types/api'
import { STANDARD_TEMPLATE_SLOTS } from '../constants/coach-slot.constants'
import type {
  CreateSlotInput,
  BulkCreateSlotInput,
  BlockSlotInput,
  QuickBulkCreateSlotsInput,
} from '../types/coach-slot-types'

const isUUID = (str?: string) =>
  Boolean(str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str))

export const coachSlotService = {
  /**
   * [1] GET /coach-slots - List all coach slots with optional filters
   */
  async getSlots(params?: {
    coachId?: string
    from?: string
    to?: string
    status?: string
    courseId?: string
    page?: number
    limit?: number
  }): Promise<CoachSlot[]> {
    const cleanParams: Record<string, any> = {}
    if (params?.from) cleanParams.from = params.from
    if (params?.to) cleanParams.to = params.to
    if (params?.coachId && isUUID(params.coachId)) {
      cleanParams.coachId = params.coachId
    }
    if (params?.courseId && isUUID(params.courseId)) {
      cleanParams.courseId = params.courseId
    }
    if (params?.status && params.status !== 'ALL') {
      cleanParams.status = params.status
    }
    if (params?.page) cleanParams.page = params.page
    if (params?.limit) cleanParams.limit = params.limit

    const res = await apiClient.get<any>('/coach-slots', { params: cleanParams })
    const items = res?.data?.items || res?.data || (Array.isArray(res) ? res : [])
    return (Array.isArray(items) ? items : []) as CoachSlot[]
  },

  /**
   * [2] POST /coach-slots - Create single slot
   */
  async createSlot(input: CreateSlotInput): Promise<CoachSlot> {
    const startsAt = new Date(`${input.date}T${input.startTime}:00`).toISOString()
    const endsAt = new Date(`${input.date}T${input.endTime}:00`).toISOString()
    const res = await apiClient.post<any>('/coach-slots', {
      startsAt,
      endsAt,
      offeringId: input.offeringId,
      note: input.note?.trim() || undefined,
    })
    return (res?.data || res) as CoachSlot
  },

  /**
   * [3] POST /coach-slots/bulk - Create recurring slots across days
   */
  async bulkCreateSlots(input: BulkCreateSlotInput): Promise<CoachSlot[]> {
    const dates: string[] = []
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    const current = new Date(start)

    while (current <= end) {
      const day = current.getDay() === 0 ? 7 : current.getDay()
      if (input.daysOfWeek.includes(day)) {
        dates.push(current.toISOString().split('T')[0]!)
      }
      current.setDate(current.getDate() + 1)
    }

    if (dates.length === 0) return []

    const res = await apiClient.post<any>('/coach-slots/bulk', {
      offeringId: input.offeringId,
      dates,
      startTime: input.startTime,
      endTime: input.endTime,
      timezone: 'Asia/Bangkok',
    })
    return (res?.data || (Array.isArray(res) ? res : [])) as CoachSlot[]
  },

  /**
   * [4] Bulk create template slots (7 standard shifts)
   */
  async bulkCreateTemplateSlots(
    input: QuickBulkCreateSlotsInput
  ): Promise<{ message: string; count: number; data: CoachSlot[] }> {
    const dates: string[] = []
    if (input.date) {
      dates.push(input.date)
    } else if (input.startDate && input.endDate) {
      const start = new Date(input.startDate)
      const end = new Date(input.endDate)
      const current = new Date(start)
      const targetDays = input.daysOfWeek || [1, 2, 3, 4, 5, 6, 7]

      while (current <= end) {
        const day = current.getDay() === 0 ? 7 : current.getDay()
        if (targetDays.includes(day)) {
          dates.push(current.toISOString().split('T')[0]!)
        }
        current.setDate(current.getDate() + 1)
      }
    }

    if (dates.length === 0) {
      return { message: 'Không có ngày nào được chọn.', count: 0, data: [] }
    }

    const created: CoachSlot[] = []
    for (const slotIndex of input.slotIndexes) {
      const template = STANDARD_TEMPLATE_SLOTS.find((s) => s.index === slotIndex)
      if (!template) continue

      const res = await apiClient.post<any>('/coach-slots/bulk', {
        offeringId: input.courseOfferingId,
        dates,
        startTime: template.startTime,
        endTime: template.endTime,
        timezone: 'Asia/Bangkok',
      })
      const items = res?.data || (Array.isArray(res) ? res : [])
      if (Array.isArray(items)) {
        created.push(...items)
      }
    }

    return {
      message: `Đã mở thành công ${created.length} khung giờ dạy.`,
      count: created.length,
      data: created,
    }
  },

  /**
   * [5] GET /coach-slots/{id} - Get slot detail by ID
   */
  async getSlotById(slotId: string): Promise<CoachSlot> {
    const res = await apiClient.get<any>(`/coach-slots/${slotId}`)
    return (res?.data || res) as CoachSlot
  },

  /**
   * [6] PATCH /coach-slots/{id} - Update slot note or time range
   */
  async updateSlot(
    slotId: string,
    payload: { note?: string; startsAt?: string; endsAt?: string }
  ): Promise<CoachSlot> {
    const res = await apiClient.patch<any>(`/coach-slots/${slotId}`, payload)
    return (res?.data || res) as CoachSlot
  },

  /**
   * [7] DELETE /coach-slots/{id} - Delete / Cancel open slot or booked session
   */
  async deleteSlot(
    slotId: string,
    payload?: { cancellationReason?: string }
  ): Promise<{ cancelled: boolean }> {
    const res = await apiClient.delete<any>(`/coach-slots/${slotId}`, {
      data: payload,
    })
    return (res?.data || res) as { cancelled: boolean }
  },

  /**
   * [8] PATCH /coach-slots/{id}/block - Block an open slot
   */
  async blockSlot({ slotId, reason }: BlockSlotInput): Promise<CoachSlot> {
    const res = await apiClient.patch<any>(`/coach-slots/${slotId}/block`, {
      reason: reason?.trim() || undefined,
    })
    return (res?.data || res) as CoachSlot
  },

  /**
   * [9] POST /coach-slots/{slotId}/book - Member books a PT slot
   */
  async bookSlot(
    slotId: string,
    payload: { purchaseId: string; memberId?: string }
  ): Promise<any> {
    const res = await apiClient.post<any>(`/coach-slots/${slotId}/book`, payload)
    return res?.data || res
  },

  /**
   * [10] GET /coaches/me/slots - Coach gets their own schedule slots
   */
  async getMySlots(params?: {
    from?: string
    to?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<CoachSlot[]> {
    const res = await apiClient.get<any>('/coaches/me/slots', { params })
    const items = res?.data?.items || res?.data || (Array.isArray(res) ? res : [])
    return (Array.isArray(items) ? items : []) as CoachSlot[]
  },
}
