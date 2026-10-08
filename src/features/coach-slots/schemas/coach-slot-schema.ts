import { z } from 'zod'

export const createSlotSchema = z
  .object({
    date: z.string().min(1, 'Vui lòng chọn ngày'),
    startTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
    endTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
    offeringId: z.string().min(1, 'Vui lòng chọn khóa học'),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(':').map(Number)
      const [endH, endM] = data.endTime.split(':').map(Number)
      const startMin = startH * 60 + startM
      const endMin = endH * 60 + endM
      return endMin > startMin
    },
    {
      message: 'Giờ kết thúc phải sau giờ bắt đầu',
      path: ['endTime'],
    }
  )

export const bulkCreateSlotSchema = z
  .object({
    startTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
    endTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
    offeringId: z.string().min(1, 'Vui lòng chọn khóa học'),
    daysOfWeek: z.array(z.number()).min(1, 'Vui lòng chọn ít nhất 1 ngày trong tuần'),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu chu kỳ'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc chu kỳ'),
    note: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(':').map(Number)
      const [endH, endM] = data.endTime.split(':').map(Number)
      return endH * 60 + endM > startH * 60 + startM
    },
    {
      message: 'Giờ kết thúc phải sau giờ bắt đầu',
      path: ['endTime'],
    }
  )

export const blockSlotSchema = z.object({
  slotId: z.string().min(1, 'Mã khung giờ không hợp lệ'),
  reason: z.string().optional(),
})

export const quickBulkCreateSlotsSchema = z
  .object({
    courseOfferingId: z.string().min(1, 'Vui lòng chọn khóa học được phân công'),
    mode: z.enum(['single', 'range']),
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    daysOfWeek: z.array(z.number().int().min(1).max(7)).optional(),
    slotIndexes: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Vui lòng chọn ít nhất 1 khung giờ trong 7 ca chuẩn'),
    note: z.string().max(500, 'Ghi chú không quá 500 ký tự').optional(),
  })
  .refine(
    (data) => {
      if (data.mode === 'single') return !!data.date
      if (data.mode === 'range') {
        return !!data.startDate && !!data.endDate && data.endDate >= data.startDate
      }
      return false
    },
    {
      message: 'Vui lòng chọn ngày hợp lệ',
      path: ['date'],
    }
  )

