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

  // 1b. Current Authenticated User (Me) Endpoints
  else if (url === 'me/subscriptions' && method === 'get') {
    resData = db.subscriptions
  } else if (url === 'me/pt-packages' && method === 'get') {
    resData = db.purchases
  } else if (url === 'me/pt-bookings' && method === 'get') {
    resData = db.bookings
  } else if (url === 'me/payments' && method === 'get') {
    resData = db.payments
  } else if (url === 'me/invoices' && method === 'get') {
    resData = db.invoices
  } else if (url === 'me/training-plans' && method === 'get') {
    resData = db.trainingPlans
  } else if (url === 'me/progress' && method === 'get') {
    resData = {
      assessments: db.assessments,
      results: db.trainingResults,
      goals: [],
    }
  } else if (url === 'me/meal-plans' && method === 'get') {
    resData = (db as any).mealPlans || []
  } else if (url === 'me/support-requests' && method === 'get') {
    resData = db.support
  }

  // 2. Members & Check-in
  else if (url.startsWith('members') && method === 'get') {
    const parts = url.split('/')
    if (parts.length > 1 && parts[1]) {
      const mem = db.members.find((m) => m.id === parts[1]) || db.members[0]
      resData = mem
    } else {
      let list = [...db.members]
      const memberCode = config.params?.memberCode
      const search = config.params?.search
      if (memberCode) {
        list = list.filter((m) => m.memberCode.toLowerCase().includes(memberCode.toLowerCase()))
      } else if (search) {
        const s = search.toLowerCase()
        list = list.filter(
          (m) =>
            m.fullName.toLowerCase().includes(s) ||
            m.memberCode.toLowerCase().includes(s) ||
            (m.phone && m.phone.includes(s)) ||
            (m.email && m.email.toLowerCase().includes(s))
        )
      }
      resData = mockPaginate(list)
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
    const list = db.checkIns.map((item) => ({
      ...item,
      member: item.member || db.members.find((m) => m.id === item.memberId) || db.members[0],
    }))
    resData = mockPaginate(list)
  }

  // 3. Plans & Subscriptions
  else if (url === 'membership-plans' && method === 'get') {
    resData = db.plans
  } else if (url.startsWith('membership-plans/') && method === 'patch') {
    const id = url.split('/')[1]
    const plan = db.plans.find((p) => p.id === id)
    if (plan && data.price) plan.price = data.price
    resData = plan
  } else if (url === 'subscriptions' && method === 'get') {
    const searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')
    const memberId = searchParams.get('memberId') || config.params?.memberId
    const status = searchParams.get('status') || config.params?.status
    let list = [...db.subscriptions]
    if (memberId) {
      list = list.filter((s) => s.memberId === memberId)
    }
    if (status) {
      list = list.filter((s) => s.status === status)
    }
    resData = mockPaginate(list, Number(config.params?.page || 1), Number(config.params?.limit || 20))
  } else if (url.startsWith('subscriptions/') && url.endsWith('/renew') && method === 'post') {
    const id = url.split('/')[1]
    const currentSub = db.subscriptions.find((s) => s.id === id)
    const plan = db.plans.find((p) => p.id === (data.planId || currentSub?.planId)) || db.plans[0]
    const renewedSub = {
      id: 'sub-' + Date.now(),
      memberId: currentSub?.memberId || db.members[0].id,
      planId: plan.id,
      previousSubscriptionId: id,
      planNameSnapshot: plan.name,
      paidMonthsSnapshot: plan.paidMonths,
      bonusMonthsSnapshot: plan.bonusMonths,
      priceSnapshot: plan.price,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: '2027-12-31',
      status: 'PENDING' as const,
    }
    db.subscriptions.unshift(renewedSub)
    resData = renewedSub
  } else if (url.startsWith('subscriptions/') && url.endsWith('/cancel') && method === 'patch') {
    const id = url.split('/')[1]
    const sub = db.subscriptions.find((s) => s.id === id)
    if (sub) {
      sub.status = 'CANCELLED'
      ;(sub as any).cancelledAt = new Date().toISOString()
      ;(sub as any).cancellationReason = data.reason || 'Hủy theo yêu cầu'
    }
    resData = sub || { message: 'Đã hủy gói tập' }
  } else if (url.startsWith('subscriptions/') && method === 'get') {
    const id = url.split('/')[1]
    const sub = db.subscriptions.find((s) => s.id === id) || db.subscriptions[0]
    const plan = db.plans.find((p) => p.id === sub?.planId) || db.plans[0]
    resData = {
      ...sub,
      plan,
    }
  } else if (url === 'subscriptions' && method === 'post') {
    const plan = db.plans.find((p) => p.id === data.planId) || db.plans[0]
    const newSub = {
      id: 'sub-' + Date.now(),
      memberId: data.memberId,
      planId: plan.id,
      planNameSnapshot: plan.name,
      paidMonthsSnapshot: plan.paidMonths,
      bonusMonthsSnapshot: plan.bonusMonths,
      priceSnapshot: plan.price,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      status: 'PENDING' as const,
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
  } else if (url === 'exercises' && method === 'post') {
    const mgList = (data.muscleGroups || []).map((mgItem: any) => {
      const found = db.muscleGroups.find((m) => m.id === mgItem.id)
      return { id: mgItem.id, name: found?.name || 'Nhóm cơ', isPrimary: mgItem.isPrimary ?? true }
    })
    const newEx = {
      id: 'ex-' + Date.now(),
      name: data.name,
      description: data.description || '',
      instructions: data.instructions || '',
      imageUrl: data.imageUrl || undefined,
      recoveryDays: data.recoveryDays ?? 2,
      videoUrl: data.videoUrl || undefined,
      equipmentRequired: data.equipmentRequired || '',
      difficultyLevel: data.difficultyLevel || 'INTERMEDIATE',
      isActive: true,
      muscleGroups: mgList,
    }
    db.exercises.push(newEx)
    resData = newEx
  } else if (url.startsWith('exercises/') && url.endsWith('/status') && method === 'patch') {
    const id = url.split('/')[1]
    const ex = db.exercises.find((e) => e.id === id)
    if (ex) {
      ex.isActive = data.isActive
    }
    resData = ex
  } else if (url.startsWith('exercises/') && method === 'patch') {
    const id = url.split('/')[1]
    const ex = db.exercises.find((e) => e.id === id)
    if (ex) {
      if (data.name !== undefined) ex.name = data.name
      if (data.description !== undefined) ex.description = data.description
      if (data.instructions !== undefined) ex.instructions = data.instructions
      if (data.imageUrl !== undefined) ex.imageUrl = data.imageUrl
      if (data.videoUrl !== undefined) ex.videoUrl = data.videoUrl
      if (data.equipmentRequired !== undefined) ex.equipmentRequired = data.equipmentRequired
      if (data.difficultyLevel !== undefined) ex.difficultyLevel = data.difficultyLevel
      if (data.muscleGroups !== undefined) {
        ex.muscleGroups = data.muscleGroups.map((mgItem: any) => {
          const found = db.muscleGroups.find((m) => m.id === mgItem.id)
          return { id: mgItem.id, name: found?.name || 'Nhóm cơ', isPrimary: mgItem.isPrimary ?? true }
        })
      }
    }
    resData = ex
  } else if (url.startsWith('exercises/') && method === 'get') {
    const id = url.split('/')[1]
    const ex = db.exercises.find((e) => e.id === id) || db.exercises[0]
    resData = ex
  } else if (url === 'muscle-groups' && method === 'get') {
    resData = db.muscleGroups
  } else if (url === 'muscle-groups' && method === 'post') {
    const newMg = {
      id: 'mg-' + Date.now(),
      name: data.name,
      description: data.description || '',
      imageUrl: data.imageUrl || undefined,
      isActive: true,
    }
    db.muscleGroups.push(newMg)
    resData = newMg
  } else if (url.startsWith('muscle-groups/') && url.endsWith('/status') && method === 'patch') {
    const id = url.split('/')[1]
    const mg = db.muscleGroups.find((m) => m.id === id)
    if (mg) {
      mg.isActive = data.isActive
    }
    resData = mg
  } else if (url.startsWith('muscle-groups/') && method === 'patch') {
    const id = url.split('/')[1]
    const mg = db.muscleGroups.find((m) => m.id === id)
    if (mg) {
      if (data.name !== undefined) mg.name = data.name
      if (data.description !== undefined) mg.description = data.description
      if (data.imageUrl !== undefined) mg.imageUrl = data.imageUrl
      if (data.recoveryDays !== undefined) mg.recoveryDays = data.recoveryDays
    }
    resData = mg
  } else if (url.startsWith('muscle-groups/') && method === 'get') {
    const id = url.split('/')[1]
    const mg = db.muscleGroups.find((m) => m.id === id) || db.muscleGroups[0]
    resData = mg
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
    const coachId = data.coachId || 'coa-01'
    const candStart = new Date(data.startsAt).getTime()
    const candEnd = new Date(data.endsAt).getTime()

    // 1. Kiểm tra quá khứ
    if (candStart <= Date.now()) {
      return {
        data: {
          success: false,
          code: 'SLOT_IN_PAST',
          message: 'Không thể mở ca dạy vì thời gian này đã ở trong quá khứ.',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config,
      }
    }

    // 2. Chống trùng lịch (1 PT không thể có 2 ca dạy trùng hoặc giao thoa nhau)
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
          message: `Trùng lịch: Huấn luyện viên đã có ca dạy trong khung giờ này (Trạng thái: ${conflict.status}). Một PT không thể mở 2 ca trùng giờ!`,
        },
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config,
      }
    }

    const offering = db.offerings.find((o) => o.id === data.offeringId) || db.offerings[0]

    const newSlot = {
      id: 'slt-' + Date.now(),
      coachId,
      offeringId: data.offeringId || 'off-01',
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      status: 'OPEN' as const,
      note: data.note,
      coachName: 'Nguyễn Văn Coach Minh',
      courseName: offering?.courseName || 'Hypertrophy & Strength',
    }
    db.slots.unshift(newSlot)
    return {
      data: {
        success: true,
        data: newSlot,
        message: 'Đã tạo thành công ca dạy.',
      },
      status: 201,
      statusText: 'Created',
      headers: {},
      config,
    }
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
  } else if (url === 'equipment' && method === 'post') {
    const newEq = {
      id: 'eq-' + Date.now(),
      ...data,
      status: 'OPERATIONAL',
      createdAt: new Date().toISOString(),
    }
    db.equipment.unshift(newEq)
    resData = newEq
  } else if (url === 'gym-areas' && method === 'get') {
    resData = db.gymAreas || [
      { id: 'area-1', name: 'Khu vực Tạ tự do Free Weights', location: 'Tầng 1', isActive: true },
      { id: 'area-2', name: 'Khu vực Máy Cardio & Chạy bộ', location: 'Tầng 2', isActive: true },
    ]
  } else if (url === 'training-courses' && method === 'get') {
    resData = mockPaginate(db.courses)
  } else if (url === 'reports/revenue' && method === 'get') {
    resData = {
      membershipRevenue: 990000,
      ptGross: 3600000,
      ptGymShare: 1440000,
      coachPayable: 2160000,
      coachPending: 1080000,
      paymentCount: db.payments.length || 3,
    }
  } else if (url === 'dashboard/manager' && method === 'get') {
    resData = {
      members: db.members.length,
      coaches: db.coaches.length,
      revenue: {
        membershipRevenue: 990000,
        ptGross: 3600000,
        ptGymShare: 1440000,
        coachPayable: 2160000,
        coachPending: 1080000,
        paymentCount: db.payments.length || 3,
      },
      bookingsToday: db.bookings.length,
      equipmentIssues: 0,
    }
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
