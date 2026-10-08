import { describe, it, expect } from 'vitest'
import { createSlotSchema, bulkCreateSlotSchema, blockSlotSchema } from './coach-slot-schema'

describe('coach-slot-schema validation', () => {
  describe('createSlotSchema', () => {
    it('passes for valid slot data with end > start', () => {
      const valid = {
        date: '2026-10-15',
        startTime: '08:00',
        endTime: '09:00',
        offeringId: 'off-01',
        note: 'Ghi chú thử nghiệm',
      }
      const result = createSlotSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('fails when endTime is equal or earlier than startTime', () => {
      const invalid = {
        date: '2026-10-15',
        startTime: '10:00',
        endTime: '09:00',
        offeringId: 'off-01',
      }
      const result = createSlotSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Giờ kết thúc phải sau giờ bắt đầu')
      }
    })

    it('fails when required fields are missing', () => {
      const missing = {
        date: '',
        startTime: '',
        endTime: '',
        offeringId: '',
      }
      const result = createSlotSchema.safeParse(missing)
      expect(result.success).toBe(false)
    })
  })

  describe('bulkCreateSlotSchema', () => {
    it('passes for valid recurring configuration', () => {
      const valid = {
        startTime: '08:00',
        endTime: '09:00',
        offeringId: 'off-01',
        daysOfWeek: [1, 3, 5],
        startDate: '2026-10-10',
        endDate: '2026-10-30',
        note: 'Chu kỳ 3 tuần',
      }
      const result = bulkCreateSlotSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('fails if endDate is before startDate', () => {
      const invalid = {
        startTime: '08:00',
        endTime: '09:00',
        offeringId: 'off-01',
        daysOfWeek: [1],
        startDate: '2026-10-30',
        endDate: '2026-10-10',
      }
      const result = bulkCreateSlotSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('sau ngày bắt đầu'))).toBe(true)
      }
    })

    it('fails if daysOfWeek is empty', () => {
      const invalid = {
        startTime: '08:00',
        endTime: '09:00',
        offeringId: 'off-01',
        daysOfWeek: [],
        startDate: '2026-10-10',
        endDate: '2026-10-30',
      }
      const result = bulkCreateSlotSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('blockSlotSchema', () => {
    it('passes with slotId and optional reason', () => {
      const valid = { slotId: 'slt-10', reason: 'Bận việc riêng' }
      const result = blockSlotSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })
  })
})
