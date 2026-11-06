import type {
  MuscleGroup,
  Exercise,
  TrainingCourse,
  Offering,
  CoachSlot,
  PackageOption,
  Purchase,
  Booking,
  Payment,
  Invoice,
  CoachPayout,
  TrainingPlan,
  TrainingResult,
  BodyAssessment,
  GymArea,
  Equipment,
  Maintenance,
  CoachReview,
  SupportRequest,
  AuditLog,
} from '@/shared/types/api'

export const mockMuscleGroups: MuscleGroup[] = [
  { id: 'mg-01', name: 'Ngực (Chest)', description: 'Cơ ngực trên, giữa và dưới', isActive: true },
  { id: 'mg-02', name: 'Lưng (Back)', description: 'Cơ xô, lưng trên và lưng dưới', isActive: true },
  { id: 'mg-03', name: 'Chân & Đùi (Legs)', description: 'Cơ tứ đầu đùi, đùi sau và bắp chân', isActive: true },
  { id: 'mg-04', name: 'Vai (Shoulders)', description: 'Cơ vai trước, vai giữa và vai sau', isActive: true },
  { id: 'mg-05', name: 'Tay (Arms)', description: 'Cơ tay trước (Biceps) và tay sau (Triceps)', isActive: true },
]

export const mockExercises: Exercise[] = [
  {
    id: 'ex-01',
    name: 'Barbell Bench Press',
    description: 'Bài tập đẩy ngực với thanh đòn ngang',
    instructions: 'Nằm phẳng trên ghế, hạ tạ chạm nhẹ ngực giữa rồi đẩy mạnh lên.',
    equipmentRequired: 'Thanh đòn, Ghế tập ngực',
    difficultyLevel: 'Trung bình',
    muscleGroups: [{ id: 'mg-01', name: 'Ngực', isPrimary: true }],
  },
  {
    id: 'ex-02',
    name: 'Barbell Back Squat',
    description: 'Bài tập gánh đùi mông kinh điển',
    instructions: 'Đặt đòn lên cầu vai sau, ngồi xổm sâu xuống song song sàn rồi đạp đứng dậy.',
    equipmentRequired: 'Squat Rack, Thanh đòn',
    difficultyLevel: 'Nâng cao',
    muscleGroups: [{ id: 'mg-03', name: 'Chân & Đùi', isPrimary: true }],
  },
  {
    id: 'ex-03',
    name: 'Lat Pulldown',
    description: 'Kéo cáp xô phát triển độ rộng lưng',
    instructions: 'Ngồi thẳng lưng, kéo thanh đòn cáp xuống ngang xương quai xanh.',
    equipmentRequired: 'Máy kéo cáp Lat Pulldown',
    difficultyLevel: 'Dễ',
    muscleGroups: [{ id: 'mg-02', name: 'Lưng', isPrimary: true }],
  },
]

export const mockCourses: TrainingCourse[] = [
  {
    id: 'crs-01',
    name: 'Hypertrophy & Strength (Tăng cơ giảm mỡ 1:1)',
    description: 'Khóa học huấn luyện tăng cơ chuyên sâu, tối ưu phom dáng và sức mạnh.',
    objective: 'Tăng 2-3kg cơ nạc trong 8 tuần và cải thiện chỉ số sức mạnh.',
    difficultyLevel: 'Trung bình',
    isActive: true,
  },
  {
    id: 'crs-02',
    name: 'Pilates Reformer & Posture Correction',
    description: 'Cải thiện tư thế lưng gù, săn chắc cơ lõi và tăng độ dẻo dai cơ thể.',
    objective: 'Cân bằng hệ cơ xương khớp và thu nhỏ vòng eo.',
    difficultyLevel: 'Mới bắt đầu',
    isActive: true,
  },
]

export const mockOfferings: Offering[] = [
  {
    id: 'off-01',
    coachId: 'coa-01',
    courseId: 'crs-01',
    status: 'APPROVED',
    isActive: true,
    experienceNote: 'Đã hoàn thành hơn 300 giờ huấn luyện khóa Hypertrophy',
    approvedAt: '2026-02-01T00:00:00Z',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength (Tăng cơ giảm mỡ 1:1)',
  },
  {
    id: 'off-02',
    coachId: 'coa-02',
    courseId: 'crs-02',
    status: 'APPROVED',
    isActive: true,
    experienceNote: 'Chuyên gia chứng chỉ Pilates quốc tế',
    approvedAt: '2026-03-01T00:00:00Z',
    coachName: 'Đỗ Thùy Trang',
    courseName: 'Pilates Reformer & Posture Correction',
  },
]

export const mockPackageOptions: PackageOption[] = [
  {
    id: 'pkg-opt-01',
    courseId: 'crs-01',
    name: 'Gói 10 Buổi PT Cá Nhân',
    sessionCount: 10,
    validityDays: 45,
    price: '4500000.00',
    approvalStatus: 'APPROVED',
    isActive: true,
    courseName: 'Hypertrophy & Strength (Tăng cơ giảm mỡ 1:1)',
  },
  {
    id: 'pkg-opt-02',
    courseId: 'crs-01',
    coachId: 'coa-01',
    name: 'Gói 20 Buổi Tối Ưu Thể Hình (VIP)',
    sessionCount: 20,
    validityDays: 90,
    price: '8000000.00',
    approvalStatus: 'APPROVED',
    isActive: true,
    courseName: 'Hypertrophy & Strength (Tăng cơ giảm mỡ 1:1)',
    coachName: 'Nguyễn Văn Coach Minh',
  },
  {
    id: 'pkg-opt-03',
    courseId: 'crs-02',
    coachId: 'coa-02',
    name: 'Gói 12 Buổi Pilates Cải Thiện Vóc Dáng',
    sessionCount: 12,
    validityDays: 60,
    price: '6000000.00',
    approvalStatus: 'PENDING',
    isActive: true,
    courseName: 'Pilates Reformer & Posture Correction',
    coachName: 'Đỗ Thùy Trang',
  },
]

export const mockPurchases: Purchase[] = [
  {
    id: 'pur-01',
    memberId: 'mem-01',
    coachId: 'coa-01',
    courseId: 'crs-01',
    packageOptionId: 'pkg-opt-01',
    courseNameSnapshot: 'Hypertrophy & Strength (Tăng cơ giảm mỡ 1:1)',
    coachNameSnapshot: 'Nguyễn Văn Coach Minh',
    priceSnapshot: '4500000.00',
    gymSharePercentSnapshot: 40,
    coachSharePercentSnapshot: 60,
    totalCredits: 10,
    reservedCredits: 1,
    consumedCredits: 2,
    availableCredits: 7,
    status: 'ACTIVE',
    expiresAt: '2026-11-20T23:59:59Z',
    pendingMakeupCount: 0,
    memberCode: 'MEM-00109',
    memberName: 'Phạm Tuấn Kiệt',
  },
]

export const mockSlots: CoachSlot[] = [
  // Thứ 4 (2026-10-07)
  {
    id: 'slt-c1',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-07T07:15:00+07:00', // Slot 2
    endsAt: '2026-10-07T08:15:00+07:00',
    status: 'COMPLETED',
    note: 'Slot 2 (Ca Sáng): Hoàn thành buổi tập cơ ngực',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-b0',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-07T11:30:00+07:00', // Slot 3
    endsAt: '2026-10-07T12:30:00+07:00',
    status: 'BOOKED',
    note: 'Slot 3 (Ca Trưa): Kèm 1:1 hội viên Mai',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-o0',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-07T16:45:00+07:00', // Slot 4
    endsAt: '2026-10-07T17:45:00+07:00',
    status: 'OPEN',
    note: 'Slot 4 (Ca Chiều)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },

  // Thứ 5 (2026-10-08 - Today)
  {
    id: 'slt-o1',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-08T07:15:00+07:00', // Slot 2
    endsAt: '2026-10-08T08:15:00+07:00',
    status: 'OPEN',
    note: 'Slot 2 (Ca Sáng)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-bl1',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-08T11:30:00+07:00', // Slot 3
    endsAt: '2026-10-08T12:30:00+07:00',
    status: 'BLOCKED',
    note: 'Slot 3 (Ca Trưa): Họp ban huấn luyện định kỳ',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-b1',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-08T16:45:00+07:00', // Slot 4
    endsAt: '2026-10-08T17:45:00+07:00',
    status: 'BOOKED',
    note: 'Slot 4 (Ca Chiều): Tập sức bền với Tú',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-o2',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-08T18:00:00+07:00', // Slot 5
    endsAt: '2026-10-08T19:00:00+07:00',
    status: 'OPEN',
    note: 'Slot 5 (Cao điểm 1)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },

  // Thứ 6 (2026-10-09)
  {
    id: 'slt-01',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-09T06:00:00+07:00', // Slot 1
    endsAt: '2026-10-09T07:00:00+07:00',
    status: 'BOOKED',
    note: 'Slot 1 (Ca Sáng sớm): Tập sớm với Kiệt',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-02',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-09T07:15:00+07:00', // Slot 2
    endsAt: '2026-10-09T08:15:00+07:00',
    status: 'OPEN',
    note: 'Slot 2 (Ca Sáng)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-03',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-09T16:45:00+07:00', // Slot 4
    endsAt: '2026-10-09T17:45:00+07:00',
    status: 'OPEN',
    note: 'Slot 4 (Ca Chiều)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-04',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-09T18:00:00+07:00', // Slot 5
    endsAt: '2026-10-09T19:00:00+07:00',
    status: 'BLOCKED',
    note: 'Slot 5 (Cao điểm 1): Huấn luyện viên bận việc riêng',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },

  // Thứ 7 (2026-10-10)
  {
    id: 'slt-05',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-10T07:15:00+07:00', // Slot 2
    endsAt: '2026-10-10T08:15:00+07:00',
    status: 'OPEN',
    note: 'Slot 2 (Ca Sáng)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-can1',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-10T11:30:00+07:00', // Slot 3
    endsAt: '2026-10-10T12:30:00+07:00',
    status: 'CANCELLED',
    note: 'Slot 3: Hội viên báo bận công tác',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-07',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-10T16:45:00+07:00', // Slot 4
    endsAt: '2026-10-10T17:45:00+07:00',
    status: 'BOOKED',
    note: 'Slot 4 (Ca Chiều): Kèm riêng hội viên Nam',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-06',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-10T18:00:00+07:00', // Slot 5
    endsAt: '2026-10-10T19:00:00+07:00',
    status: 'OPEN',
    note: 'Slot 5 (Cao điểm 1)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },

  // Chủ Nhật (2026-10-11)
  {
    id: 'slt-08',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-11T07:15:00+07:00', // Slot 2
    endsAt: '2026-10-11T08:15:00+07:00',
    status: 'OPEN',
    note: 'Slot 2 (Ca Sáng)',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'slt-09',
    coachId: 'coa-01',
    offeringId: 'off-01',
    startsAt: '2026-10-11T16:45:00+07:00', // Slot 4
    endsAt: '2026-10-11T17:45:00+07:00',
    status: 'BLOCKED',
    note: 'Slot 4: Bảo trì thiết bị sàn tạ',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
]

export const mockBookings: Booking[] = [
  {
    id: 'bkg-01',
    purchaseId: 'pur-01',
    slotId: 'slt-01',
    memberId: 'mem-01',
    coachId: 'coa-01',
    courseId: 'crs-01',
    status: 'CONFIRMED',
    startsAt: '2026-10-09T06:00:00+07:00',
    endsAt: '2026-10-09T07:00:00+07:00',
    creditReturned: false,
    memberName: 'Phạm Tuấn Kiệt',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength (Tăng cơ giảm mỡ 1:1)',
    cancellationPolicy: {
      cutoffAt: '2026-10-09T02:00:00+07:00',
      creditEffect: 'RETURN',
      makeupEligible: true,
    },
  },
  {
    id: 'bkg-02',
    purchaseId: 'pur-02',
    slotId: 'slt-b0',
    memberId: 'mem-02',
    coachId: 'coa-01',
    courseId: 'crs-01',
    status: 'CONFIRMED',
    startsAt: '2026-10-07T11:30:00+07:00',
    endsAt: '2026-10-07T12:30:00+07:00',
    creditReturned: false,
    memberName: 'Trần Thị Mai',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'bkg-03',
    purchaseId: 'pur-03',
    slotId: 'slt-b1',
    memberId: 'mem-03',
    coachId: 'coa-01',
    courseId: 'crs-01',
    status: 'CONFIRMED',
    startsAt: '2026-10-08T16:45:00+07:00',
    endsAt: '2026-10-08T17:45:00+07:00',
    creditReturned: false,
    memberName: 'Hoàng Anh Tú',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
  {
    id: 'bkg-04',
    purchaseId: 'pur-04',
    slotId: 'slt-07',
    memberId: 'mem-04',
    coachId: 'coa-01',
    courseId: 'crs-01',
    status: 'CONFIRMED',
    startsAt: '2026-10-10T16:45:00+07:00',
    endsAt: '2026-10-10T17:45:00+07:00',
    creditReturned: false,
    memberName: 'Lê Hoàng Nam',
    coachName: 'Nguyễn Văn Coach Minh',
    courseName: 'Hypertrophy & Strength',
  },
]

export const mockPayments: Payment[] = [
  {
    id: 'pay-01',
    paymentCode: 'PAY-261001-091',
    memberId: 'mem-01',
    subscriptionId: 'sub-01',
    amount: '990000.00',
    method: 'VNPAY',
    status: 'PAID',
    paidAt: '2026-09-01T08:15:00Z',
    invoiceId: 'inv-01',
    memberName: 'Phạm Tuấn Kiệt',
    itemDescription: 'Gói Hội Viên 3 Tháng (Tặng 1 Tháng)',
  },
  {
    id: 'pay-02',
    paymentCode: 'PAY-261005-442',
    memberId: 'mem-01',
    ptPurchaseId: 'pur-01',
    amount: '4500000.00',
    method: 'BANK_TRANSFER',
    status: 'PAID',
    paidAt: '2026-10-05T10:30:00Z',
    invoiceId: 'inv-02',
    memberName: 'Phạm Tuấn Kiệt',
    itemDescription: 'Gói 10 Buổi PT Cá Nhân (HLV Nguyễn Văn Coach Minh)',
  },
]

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-01',
    invoiceNumber: 'INV-2026-000109',
    paymentId: 'pay-01',
    memberNameSnapshot: 'Phạm Tuấn Kiệt',
    itemNameSnapshot: 'Gói Hội Viên 3 Tháng (Tặng 1 Tháng)',
    subtotal: '990000.00',
    total: '990000.00',
    issuedAt: '2026-09-01T08:15:00Z',
    paymentMethod: 'VNPAY',
  },
  {
    id: 'inv-02',
    invoiceNumber: 'INV-2026-000442',
    paymentId: 'pay-02',
    memberNameSnapshot: 'Phạm Tuấn Kiệt',
    itemNameSnapshot: 'Gói 10 Buổi PT Cá Nhân (HLV Nguyễn Văn Coach Minh)',
    subtotal: '4500000.00',
    total: '4500000.00',
    issuedAt: '2026-10-05T10:30:00Z',
    paymentMethod: 'BANK_TRANSFER',
  },
]

export const mockCoachPayouts: CoachPayout[] = [
  {
    id: 'payout-01',
    paymentId: 'pay-02',
    purchaseId: 'pur-01',
    coachId: 'coa-01',
    grossAmount: '4500000.00',
    gymAmount: '1800000.00', // 40%
    coachAmount: '2700000.00', // 60%
    status: 'PENDING',
    coachName: 'Nguyễn Văn Coach Minh',
  },
]

export const mockTrainingPlans: TrainingPlan[] = [
  {
    id: 'tp-01',
    coachId: 'coa-01',
    memberId: 'mem-01',
    ptPurchaseId: 'pur-01',
    title: 'Giáo án Tuần 1: Kích hoạt cơ & Sức mạnh thân trên',
    goal: 'Tập trung cơ ngực và tay sau, hoàn thiện kỹ thuật đẩy thanh đòn',
    startDate: '2026-10-06',
    endDate: '2026-10-13',
    status: 'ASSIGNED',
    assignedAt: '2026-10-06T09:00:00Z',
    memberName: 'Phạm Tuấn Kiệt',
    exercises: [
      {
        id: 'pe-01',
        exerciseId: 'ex-01',
        exerciseName: 'Barbell Bench Press',
        sets: 4,
        reps: 10,
        restSeconds: 90,
        targetWeight: '60.00',
        sortOrder: 1,
      },
      {
        id: 'pe-02',
        exerciseId: 'ex-03',
        exerciseName: 'Lat Pulldown',
        sets: 3,
        reps: 12,
        restSeconds: 60,
        targetWeight: '50.00',
        sortOrder: 2,
      },
    ],
  },
]

export const mockTrainingResults: TrainingResult[] = [
  {
    id: 'tr-01',
    ptBookingId: 'bkg-01',
    trainingPlanId: 'tp-01',
    memberId: 'mem-01',
    coachId: 'coa-01',
    performedAt: '2026-10-06T09:00:00Z',
    result: [
      {
        exerciseId: 'ex-01',
        exerciseName: 'Barbell Bench Press',
        sets: [
          { reps: 10, weight: '55.00', rpe: 7 },
          { reps: 10, weight: '60.00', rpe: 8 },
          { reps: 8, weight: '60.00', rpe: 9 },
        ],
        completed: true,
        note: 'Form chuẩn, lưng cố định tốt',
      },
    ],
    coachComment: 'Kiệt tập trung rất tốt, hiệp cuối đẩy ổn định.',
    status: 'PUBLISHED',
    publishedAt: '2026-10-06T10:15:00Z',
  },
]

export const mockAssessments: BodyAssessment[] = [
  {
    id: 'asm-01',
    memberId: 'mem-01',
    coachId: 'coa-01',
    assessedAt: '2026-09-02T08:00:00Z',
    weightKg: '74.50',
    heightCm: '175.00',
    bodyFatPercent: '21.50',
    muscleMassKg: '33.20',
    waistCm: '84.00',
    chestCm: '96.00',
    hipCm: '98.00',
    restingHeartRate: 72,
    notes: 'Khởi đầu chương trình tập',
  },
  {
    id: 'asm-02',
    memberId: 'mem-01',
    coachId: 'coa-01',
    assessedAt: '2026-10-05T08:00:00Z',
    weightKg: '73.00',
    heightCm: '175.00',
    bodyFatPercent: '19.80',
    muscleMassKg: '34.00',
    waistCm: '81.50',
    chestCm: '98.00',
    hipCm: '97.00',
    restingHeartRate: 68,
    notes: 'Giảm 1.5kg mỡ, tăng 0.8kg cơ nạc!',
  },
]

export const mockGymAreas: GymArea[] = [
  { id: 'area-01', name: 'Khu vực Tạ tự do (Free Weights)', location: 'Tầng 1 - Khu A', isActive: true },
  { id: 'area-02', name: 'Khu vực Máy Cardio & Chạy bộ', location: 'Tầng 1 - Khu B', isActive: true },
  { id: 'area-03', name: 'Studio Pilates & Yoga', location: 'Tầng 2 - Phòng 201', isActive: true },
]

export const mockEquipment: Equipment[] = [
  {
    id: 'eq-01',
    equipmentCode: 'EQ-CRD-01',
    gymAreaId: 'area-02',
    gymAreaName: 'Khu vực Máy Cardio & Chạy bộ',
    name: 'Máy Chạy Bộ Technogym Excite Live',
    brand: 'Technogym',
    model: 'Excite 9000',
    status: 'OPERATIONAL',
    lastMaintenanceAt: '2026-09-15T00:00:00Z',
    nextMaintenanceAt: '2026-12-15T00:00:00Z',
  },
  {
    id: 'eq-02',
    equipmentCode: 'EQ-RACK-03',
    gymAreaId: 'area-01',
    gymAreaName: 'Khu vực Tạ tự do (Free Weights)',
    name: 'Power Rack Rogue Monster',
    brand: 'Rogue',
    model: 'RM-4',
    status: 'OPERATIONAL',
    lastMaintenanceAt: '2026-08-01T00:00:00Z',
    nextMaintenanceAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'eq-03',
    equipmentCode: 'EQ-PLT-02',
    gymAreaId: 'area-03',
    gymAreaName: 'Studio Pilates & Yoga',
    name: 'Reformer Pilates Allegro 2',
    brand: 'Balanced Body',
    model: 'Allegro 2 Tower',
    status: 'UNDER_MAINTENANCE',
    lastMaintenanceAt: '2026-07-20T00:00:00Z',
    nextMaintenanceAt: '2026-10-10T00:00:00Z',
  },
]

export const mockMaintenance: Maintenance[] = [
  {
    id: 'mnt-01',
    equipmentId: 'eq-03',
    equipmentName: 'Reformer Pilates Allegro 2',
    scheduledAt: '2026-10-10T09:00:00Z',
    status: 'SCHEDULED',
    description: 'Bảo trì lò xo dây kéo và thanh trượt định kỳ',
    handledBy: 'usr-man-01',
    handlerName: 'Trần Văn Quản Lý',
  },
]

export const mockReviews: CoachReview[] = [
  {
    id: 'rev-01',
    ptPackagePurchaseId: 'pur-01',
    memberId: 'mem-01',
    memberDisplayName: 'Phạm Tuấn K.',
    coachId: 'coa-01',
    courseId: 'crs-01',
    courseNameSnapshot: 'Hypertrophy & Strength (Tăng cơ giảm mỡ 1:1)',
    rating: 5,
    comment: 'Coach Minh chỉnh form rất kỹ, hướng dẫn chi tiết về dinh dưỡng. Sau 1 tháng thấy khỏe khoắn hẳn!',
    createdAt: '2026-10-06T12:00:00Z',
    moderationStatus: 'VISIBLE',
  },
]

export const mockSupportRequests: SupportRequest[] = [
  {
    id: 'sup-01',
    requestCode: 'TKT-2610-001',
    memberId: 'mem-02',
    memberName: 'Nguyễn Mai Phương',
    subject: 'Hỏi về việc đổi lịch tập buổi sáng sang tối',
    message: 'Chào ban quản lý, em muốn đổi lịch tập thứ 4 sang khung giờ 18:00 thì liên hệ lễ tân hay coach ạ?',
    status: 'IN_PROGRESS',
    createdAt: '2026-10-08T07:45:00Z',
  },
]

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-01',
    actorId: 'usr-man-01',
    actorName: 'Trần Văn Quản Lý',
    action: 'APPROVE_PACKAGE_OPTION',
    entityType: 'PackageOption',
    entityId: 'pkg-opt-02',
    createdAt: '2026-10-05T09:30:00Z',
  },
  {
    id: 'aud-02',
    actorId: 'usr-rec-01',
    actorName: 'Lê Thị Lễ Tân',
    action: 'CHECK_IN_MEMBER',
    entityType: 'Member',
    entityId: 'mem-01',
    createdAt: '2026-10-08T07:15:00Z',
  },
]
