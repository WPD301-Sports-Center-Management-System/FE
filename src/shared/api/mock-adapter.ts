import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { db, mockPaginate, handleMockBookingCancel } from '@/mocks/mock-server'

export async function handleMockRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const url = (config.url || '').replace(/^\/?api\/v1\/?/, '').replace(/^\//, '')
  const method = (config.method || 'get').toLowerCase()
  const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {})

  // Artificial latency for realistic async feel
  await new Promise((resolve) => setTimeout(resolve, 150))

  let resData: unknown = { message: 'Thao tác thành công' }

  // 1. Auth routes
  if (url === 'auth/login' && method === 'post') {
    const user = db.users.find((u) => u.email === data.email || u.phone === data.phone) || db.users[0]
    resData = {
      accessToken: 'mock-jwt-access-token-' + Date.now(),
      refreshToken: 'mock-jwt-refresh-token-' + Date.now(),
      tokenType: 'Bearer',
      expiresIn: 3600,
      user,
    }
  } else if (url === 'auth/refresh-token' && method === 'post') {
    resData = {
      accessToken: 'mock-jwt-refreshed-' + Date.now(),
      refreshToken: 'mock-jwt-refresh-token-' + Date.now(),
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: db.users[0],
    }
  } else if (url === 'auth/me' && method === 'get') {
    resData = db.users[0]
  }

  // 2. Members & Check-in
  else if (url.startsWith('members') && method === 'get') {
    const parts = url.split('/')
    if (parts.length > 1 && parts[1]) {
      const mem = db.members.find((m) => m.id === parts[1]) || db.members[0]
      resData = mem
    } else {
      resData = mockPaginate(db.members)
    }
  } else if (url === 'check-ins' && method === 'post') {
    const member = db.members.find((m) => m.id === data.memberId || m.memberCode === data.memberCode) || db.members[0]
    const newCheckIn = {
      id: 'chk-' + Date.now(),
      memberId: member.id,
      checkedInBy: 'usr-rec-01',
      checkedInAt: new Date().toISOString(),
      note: data.note || 'Check-in tại quầy',
      member,
    }
    db.checkIns.unshift(newCheckIn)
    resData = newCheckIn
  } else if (url.startsWith('check-ins') && method === 'get') {
    resData = mockPaginate(db.checkIns)
  }

  // 3. Plans & Subscriptions
  else if (url === 'membership-plans' && method === 'get') {
    resData = db.plans
  } else if (url.startsWith('membership-plans/') && method === 'patch') {
    const id = url.split('/')[1]
    const plan = db.plans.find((p) => p.id === id)
    if (plan && data.price) plan.price = data.price
    resData = plan
  } else if (url === 'subscriptions' && method === 'post') {
    const newSub = {
      id: 'sub-' + Date.now(),
      memberId: data.memberId,
      planId: data.planId,
      planNameSnapshot: data.planName || 'Gói Hội Viên',
      paidMonthsSnapshot: 1,
      bonusMonthsSnapshot: 0,
      priceSnapshot: data.price || '330000.00',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      status: 'ACTIVE' as const,
    }
    db.subscriptions.unshift(newSub)
    resData = newSub
  }

  // 4. Coaches & Courses
  else if (url.startsWith('coaches') && method === 'get') {
    const parts = url.split('/')
    if (parts.length > 1 && parts[1] && !parts[1].includes('?')) {
      const c = db.coaches.find((item) => item.id === parts[1]) || db.coaches[0]
      resData = c
    } else {
      resData = mockPaginate(db.coaches)
    }
  } else if (url === 'courses' && method === 'get') {
    resData = mockPaginate(db.courses)
  } else if (url === 'exercises' && method === 'get') {
    resData = mockPaginate(db.exercises)
  } else if (url === 'muscle-groups' && method === 'get') {
    resData = db.muscleGroups
  } else if (url === 'offerings' && method === 'get') {
    resData = db.offerings
  } else if (url.startsWith('offerings/') && method === 'patch') {
    const id = url.split('/')[1]
    const off = db.offerings.find((o) => o.id === id)
    if (off) off.status = data.status
    resData = off
  }

  // 5. Package Options & Purchases
  else if (url === 'package-options' && method === 'get') {
    resData = db.packageOptions
  } else if (url.startsWith('package-options/') && method === 'patch') {
    const id = url.split('/')[1]
    const opt = db.packageOptions.find((p) => p.id === id)
    if (opt) {
      opt.approvalStatus = data.approvalStatus
      if (data.rejectionReason) opt.rejectionReason = data.rejectionReason
    }
    resData = opt
  } else if (url === 'pt-purchases' && method === 'get') {
    resData = mockPaginate(db.purchases)
  }

  // 6. Slots & Bookings
  else if (url === 'coach-slots/bulk' && method === 'post') {
    const coachId = data.coachId || 'coa-01'
    const offering = db.offerings.find((o) => o.id === data.courseOfferingId) || db.offerings[0]

    if (offering && offering.status !== 'APPROVED') {
      return {
        data: {
          success: false,
          code: 'FORBIDDEN_OFFERING_NOT_APPROVED',
          message: `Khóa học chưa được phê duyệt (Trạng thái: ${offering.status}). Chỉ được mở slot cho khóa học APPROVED.`,
        },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      }
    }

    const templateTimes: Record<number, { startTime: string; endTime: string; name: string }> = {
      1: { startTime: '06:00', endTime: '07:00', name: 'Slot 1 (06:00 - 07:00)' },
      2: { startTime: '07:15', endTime: '08:15', name: 'Slot 2 (07:15 - 08:15)' },
      3: { startTime: '11:30', endTime: '12:30', name: 'Slot 3 (11:30 - 12:30)' },
      4: { startTime: '16:45', endTime: '17:45', name: 'Slot 4 (16:45 - 17:45)' },
      5: { startTime: '18:00', endTime: '19:00', name: 'Slot 5 (18:00 - 19:00)' },
      6: { startTime: '19:15', endTime: '20:15', name: 'Slot 6 (19:15 - 20:15)' },
      7: { startTime: '20:30', endTime: '21:30', name: 'Slot 7 (20:30 - 21:30)' },
    }

    const targetDates: string[] = []
    if (data.date) {
      targetDates.push(data.date)
    } else if (data.startDate && data.endDate) {
      const cur = new Date(data.startDate)
      const end = new Date(data.endDate)
      while (cur <= end) {
        const d = cur.getDay() === 0 ? 7 : cur.getDay()
        if (!data.daysOfWeek || data.daysOfWeek.includes(d)) {
          targetDates.push(cur.toISOString().split('T')[0])
        }
        cur.setDate(cur.getDate() + 1)
      }
    }

    const newSlots: any[] = []
    const slotIndexes: number[] = Array.isArray(data.slotIndexes) ? data.slotIndexes : [1]

    for (const d of targetDates) {
      for (const idx of slotIndexes) {
        const tpl = templateTimes[idx]
        if (!tpl) continue

        const startsAt = `${d}T${tpl.startTime}:00+07:00`
        const endsAt = `${d}T${tpl.endTime}:00+07:00`
        const candStart = new Date(startsAt).getTime()
        const candEnd = new Date(endsAt).getTime()

        // Past time validation
        if (candStart <= Date.now()) {
          return {
            data: {
              success: false,
              code: 'SLOT_IN_PAST',
              message: `Không thể mở ca ${tpl.startTime} - ${tpl.endTime} ngày ${d} vì thời gian này đã ở trong quá khứ.`,
            },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config,
          }
        }

        // Overlap validation
        const conflict = db.slots.find((s) => {
          if (s.coachId !== coachId || s.status === 'CANCELLED') return false
          const sStart = new Date(s.startsAt).getTime()
          const sEnd = new Date(s.endsAt).getTime()
          return sStart < candEnd && sEnd > candStart
        })

        if (conflict) {
          return {
            data: {
              success: false,
              code: 'SLOT_OVERLAP_CONFLICT',
              message: `Trùng lịch: Khung giờ ${tpl.startTime} - ${tpl.endTime} ngày ${d} bị trùng với slot hiện có.`,
            },
            status: 409,
            statusText: 'Conflict',
            headers: {},
            config,
          }
        }

        const slotObj = {
          id: 'slt-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
          coachId,
          offeringId: data.courseOfferingId || offering?.id || 'off-01',
          startsAt,
          endsAt,
          status: 'OPEN' as const,
          note: data.note || tpl.name,
          coachName: 'Nguyễn Văn Coach Minh',
          courseName: offering?.courseName || 'PT 1:1 Chuẩn Quốc Tế',
        }
        newSlots.push(slotObj)
      }
    }

    for (const ns of newSlots) {
      db.slots.unshift(ns)
    }

    return {
      data: {
        success: true,
        message: `Đã mở thành công ${newSlots.length} khung giờ dạy.`,
        count: newSlots.length,
        data: newSlots,
      },
      status: 201,
      statusText: 'Created',
      headers: {},
      config,
    }
  } else if (url.startsWith('coach-slots/') && url.endsWith('/block') && method === 'patch') {
    const id = url.split('/')[1]
    const slot = db.slots.find((s) => s.id === id)
    if (slot) {
      if (slot.status !== 'OPEN') {
        return {
          data: {
            success: false,
            message: `Không thể khóa slot ở trạng thái ${slot.status}. Chỉ có thể khóa slot OPEN.`,
          },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config,
        }
      }
      slot.status = 'BLOCKED'
      slot.note = data.reason || 'Huấn luyện viên bận'
    }
    resData = slot
  } else if (url.startsWith('coach-slots/') && method === 'delete') {
    const id = url.split('/')[1]
    const idx = db.slots.findIndex((s) => s.id === id)
    if (idx !== -1) {
      if (db.slots[idx].status !== 'OPEN') {
        return {
          data: {
            success: false,
            message: 'Chỉ có thể xóa slot đang OPEN chưa có học viên đặt.',
          },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config,
        }
      }
      db.slots.splice(idx, 1)
      resData = { message: 'Đã xóa khung giờ thành công.' }
    }
  } else if (url.startsWith('coaches/') && url.endsWith('/availability') && method === 'get') {
    const coachId = url.split('/')[1]
    let filtered = db.slots.filter((s) => s.coachId === coachId)
    if (config.params?.status) {
      filtered = filtered.filter((s) => s.status === config.params.status)
    }
    resData = filtered
  } else if (url.startsWith('coach-slots/') && method === 'patch') {
    const id = url.split('/')[1]
    const slot = db.slots.find((s) => s.id === id)
    if (slot) {
      if (data.status) slot.status = data.status
      if (data.note !== undefined) slot.note = data.note
    }
    resData = slot
  } else if (url === 'coach-slots' && method === 'get') {
    resData = db.slots
  } else if (url === 'coach-slots' && method === 'post') {
    const newSlot = {
      id: 'slt-' + Date.now(),
      coachId: data.coachId || 'coa-01',
      offeringId: data.offeringId || 'off-01',
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      status: 'OPEN' as const,
      note: data.note,
      coachName: 'Nguyễn Văn Coach Minh',
      courseName: 'Hypertrophy & Strength',
    }
    db.slots.unshift(newSlot)
    resData = newSlot
  } else if (url === 'pt-bookings' && method === 'get') {
    resData = mockPaginate(db.bookings)
  } else if (url === 'pt-bookings' && method === 'post') {
    const newBooking = {
      id: 'bkg-' + Date.now(),
      purchaseId: data.purchaseId || 'pur-01',
      slotId: data.slotId,
      memberId: data.memberId || 'mem-01',
      coachId: data.coachId || 'coa-01',
      courseId: data.courseId || 'crs-01',
      status: 'CONFIRMED' as const,
      startsAt: data.startsAt || new Date(Date.now() + 86400000).toISOString(),
      endsAt: data.endsAt || new Date(Date.now() + 90000000).toISOString(),
      creditReturned: false,
      memberName: 'Phạm Tuấn Kiệt',
      coachName: 'Nguyễn Văn Coach Minh',
      courseName: 'Hypertrophy & Strength',
    }
    db.bookings.unshift(newBooking)
    resData = newBooking
  } else if (url.includes('pt-bookings/') && url.endsWith('/cancel') && method === 'post') {
    const id = url.split('/')[1]
    resData = handleMockBookingCancel(id, data.role || 'MEMBER', data.reason)
  }

  // 7. Payments, Invoices, Coach Payouts
  else if (url === 'payments' && method === 'get') {
    resData = mockPaginate(db.payments)
  } else if (url === 'payments' && method === 'post') {
    const newPayment = {
      id: 'pay-' + Date.now(),
      paymentCode: 'PAY-' + Math.floor(Math.random() * 900000 + 100000),
      memberId: data.memberId || 'mem-01',
      amount: data.amount || '330000.00',
      method: data.method || 'CASH',
      status: 'PAID' as const,
      paidAt: new Date().toISOString(),
      itemDescription: data.itemDescription || 'Thanh toán dịch vụ Gym',
    }
    db.payments.unshift(newPayment)
    resData = newPayment
  } else if (url === 'invoices' && method === 'get') {
    resData = mockPaginate(db.invoices)
  } else if (url === 'coach-payouts' && method === 'get') {
    resData = db.payouts
  } else if (url.startsWith('coach-payouts/') && url.endsWith('/settle') && method === 'post') {
    const id = url.split('/')[1]
    const p = db.payouts.find((item) => item.id === id)
    if (p) {
      p.status = 'PAID'
      p.transferRef = data.transferRef || 'MB-BANK-REF-' + Date.now()
      p.paidAt = new Date().toISOString()
    }
    resData = p
  }

  // 8. Training Plans, Results, Assessments
  else if (url === 'training-plans' && method === 'get') {
    resData = mockPaginate(db.trainingPlans)
  } else if (url === 'training-plans' && method === 'post') {
    const newPlan = {
      id: 'tp-' + Date.now(),
      ...data,
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
    }
    db.trainingPlans.unshift(newPlan)
    resData = newPlan
  } else if (url === 'training-results' && method === 'get') {
    resData = mockPaginate(db.trainingResults)
  } else if (url === 'body-assessments' && method === 'get') {
    resData = db.assessments
  } else if (url === 'body-assessments' && method === 'post') {
    const newAsm = {
      id: 'asm-' + Date.now(),
      assessedAt: new Date().toISOString(),
      ...data,
    }
    db.assessments.unshift(newAsm)
    resData = newAsm
  }

  // 9. Equipment & Maintenance
  else if (url === 'equipment' && method === 'get') {
    resData = mockPaginate(db.equipment)
  } else if (url === 'maintenance' && method === 'get') {
    resData = mockPaginate(db.maintenance)
  } else if (url === 'reviews' && method === 'get') {
    resData = mockPaginate(db.reviews)
  } else if (url === 'audit-logs' && method === 'get') {
    resData = mockPaginate(db.auditLogs)
  } else if (url === 'support-requests' && method === 'get') {
    resData = mockPaginate(db.support)
  }

  return {
    data: {
      success: true,
      message: 'Operation completed (Mock)',
      ...(typeof resData === 'object' && resData !== null && 'meta' in resData
        ? (resData as Record<string, unknown>)
        : { data: resData }),
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}
