// Common API and DTO Types directly derived from Gym_Center_API_Contract_BE_FE_Mobile.docx

export type UserRole = 'MANAGER' | 'RECEPTIONIST' | 'COACH' | 'MEMBER'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
export type OfferingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type SlotStatus = 'OPEN' | 'BOOKED' | 'BLOCKED' | 'CANCELLED' | 'COMPLETED'
export type PtPurchaseStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'
export type PtBookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED_EARLY' | 'CANCELLED_LATE' | 'COACH_CANCELLED' | 'NO_SHOW'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VNPAY'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
export type OptionApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type CoachPayoutStatus = 'PENDING' | 'PAID'
export type MakeupStatus = 'PENDING' | 'BOOKED' | 'COMPLETED' | 'FORFEITED'
export type TrainingPlanStatus = 'DRAFT' | 'ASSIGNED' | 'COMPLETED' | 'ARCHIVED'
export type TrainingResultStatus = 'DRAFT' | 'PUBLISHED'
export type FitnessGoalStatus = 'ACTIVE' | 'ACHIEVED' | 'CANCELLED'
export type MealPlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER' | 'DECOMMISSIONED'
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type SupportStatus = 'OPEN' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type NotificationType = 'SYSTEM' | 'SLOT' | 'BOOKING' | 'MEMBERSHIP' | 'PAYMENT' | 'TRAINING' | 'MAINTENANCE' | 'SUPPORT' | 'REMINDER'


export type ApiSuccess<T> = {
  success: true
  message: string
  data: T
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ApiError = {
  success: false
  code: string
  message: string
  errors?: Array<{ field: string; reason?: string; message?: string }>
}

export type UserSummary = {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  role: UserRole
  status: UserStatus
  memberCode?: string | null
}

export type UserDetail = UserSummary & {
  lastLoginAt?: string
  createdAt: string
  memberCode?: string | null
  memberProfile?: {
    id?: string
    memberCode?: string
    gender?: string
    fitnessLevel?: string
  } | null
  profile?: MemberDetail | CoachDetail
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: UserDetail
}

export type MemberSummary = {
  id: string
  userId: string
  memberCode: string
  fullName: string
  avatarUrl?: string
  membershipStatus?: SubscriptionStatus
  activePackageCount?: number
  phone?: string
  email?: string
}

export type MemberDetail = MemberSummary & {
  dateOfBirth?: string
  gender?: string
  address?: string
  emergencyPhone?: string
  fitnessLevel?: string
  medicalNotes?: string
  subscriptions?: Subscription[]
  packages?: Purchase[]
}

export type CoachSummary = {
  id: string
  fullName: string
  avatarUrl?: string
  specialization?: string
  averageRating: number
  reviewCount: number
}

export type CoachDetail = CoachSummary & {
  bio?: string
  yearsOfExperience?: number
  certification?: string
  approvedCourses?: TrainingCourse[]
  availablePackageOptions?: PackageOption[]
}

export type MembershipPlan = {
  id: string
  code: 'GYM_1M' | 'GYM_3M_PLUS_1' | string
  name: string
  paidMonths: number
  bonusMonths: number
  totalMonths: number
  price: string
  isActive: boolean
}

export type Subscription = {
  id: string
  memberId: string
  planId: string
  planNameSnapshot: string
  paidMonthsSnapshot: number
  bonusMonthsSnapshot: number
  priceSnapshot: string
  startDate: string
  endDate: string
  status: SubscriptionStatus
  previousSubscriptionId?: string
}

export type CheckIn = {
  id: string
  memberId: string
  checkedInBy: string
  checkedInAt: string
  note?: string
  member?: MemberSummary
}

export type MuscleGroup = {
  id: string
  name: string
  recoveryDays?: number
  description?: string
  imageUrl?: string
  isActive: boolean
}

export type Exercise = {
  id: string
  name: string
  description?: string
  instructions?: string
  imageUrl?: string
  videoUrl?: string
  equipmentRequired?: string
  difficultyLevel?: string
  isActive?: boolean
  muscleGroups?: Array<{ id: string; name?: string; isPrimary: boolean; recoveryDays?: number }>
}

export type TrainingCourse = {
  id: string
  name: string
  description?: string
  objective?: string
  difficultyLevel?: string
  imageUrl?: string
  isActive: boolean
  muscleGroups?: Array<{ id: string; name?: string }>
  exercises?: Exercise[]
  approvedCoaches?: CoachSummary[]
}

export type Offering = {
  id: string
  coachId: string
  courseId: string
  status: OfferingStatus
  isActive: boolean
  experienceNote?: string
  rejectionReason?: string
  approvedAt?: string
  coachName?: string
  courseName?: string
}

export type CoachSlot = {
  id: string
  coachId: string
  offeringId: string
  startsAt: string
  endsAt: string
  status: SlotStatus
  note?: string
  coachName?: string
  courseName?: string
}

export type PackageOption = {
  id: string
  courseId: string
  coachId?: string
  name: string
  description?: string
  sessionCount: number
  validityDays: number
  price: string
  approvalStatus: OptionApprovalStatus
  rejectionReason?: string
  isActive: boolean
  courseName?: string
  coachName?: string
}

export type Purchase = {
  id: string
  memberId: string
  coachId: string
  courseId: string
  packageOptionId: string
  courseNameSnapshot: string
  coachNameSnapshot: string
  priceSnapshot: string
  gymSharePercentSnapshot: number
  coachSharePercentSnapshot: number
  totalCredits: number
  reservedCredits: number
  consumedCredits: number
  availableCredits: number
  status: PtPurchaseStatus
  expiresAt?: string
  pendingMakeupCount: number
  purchaseCode?: string
  memberCode?: string
  memberName?: string
}

export type Booking = {
  id: string
  bookingCode?: string
  purchaseId: string
  slotId: string
  memberId: string
  coachId: string
  courseId: string
  status: PtBookingStatus
  startsAt: string
  endsAt: string
  makeupEntitlementId?: string
  cancellationPolicy?: {
    cutoffAt: string
    creditEffect: 'RETURN' | 'CONSUME'
    makeupEligible: boolean
  }
  creditReturned: boolean
  memberName?: string
  coachName?: string
  courseName?: string
}

export type MakeupEntitlement = {
  id: string
  purchaseId: string
  sourceBookingId: string
  originalStartsAt: string
  status: MakeupStatus
  appliedExtensionDays: number
  completedBookingId?: string
}

export type Payment = {
  id: string
  paymentCode: string
  memberId: string
  subscriptionId?: string
  ptPurchaseId?: string
  amount: string
  method: PaymentMethod
  status: PaymentStatus
  paidAt?: string
  paymentUrl?: string
  invoiceId?: string
  memberCode?: string
  memberName?: string
  description?: string
  itemDescription?: string
}

export type CoachPayout = {
  id: string
  paymentId: string
  purchaseId: string
  coachId: string
  grossAmount: string
  gymAmount: string
  coachAmount: string
  status: CoachPayoutStatus
  transferRef?: string
  paidAt?: string
  coachName?: string
}

export type Invoice = {
  id: string
  invoiceNumber: string
  paymentId: string
  memberNameSnapshot: string
  itemNameSnapshot: string
  subtotal: string
  total: string
  issuedAt: string
  paymentMethod?: PaymentMethod
}

export type TrainingPlan = {
  id: string
  coachId: string
  memberId: string
  ptPurchaseId: string
  title: string
  goal?: string
  startDate: string
  endDate?: string
  status: TrainingPlanStatus
  assignedAt?: string
  exercises: Array<{
    id: string
    exerciseId: string
    exerciseName?: string
    scheduledDate?: string | null
    sets?: number
    reps?: number
    durationMinutes?: number
    restSeconds?: number
    targetWeight?: string
    sortOrder: number
  }>
  memberName?: string
}

export type TrainingResult = {
  id: string
  ptBookingId: string
  trainingPlanId?: string
  memberId: string
  coachId: string
  performedAt: string
  result: Array<{
    exerciseId: string
    exerciseName?: string
    sets: Array<{ reps: number; weight?: string; rpe?: number }>
    completed: boolean
    note?: string
  }>
  coachComment?: string
  progressScore?: number
  status: TrainingResultStatus
  publishedAt?: string
}

export type BodyAssessment = {
  id: string
  memberId: string
  coachId: string
  assessedAt: string
  weightKg?: string
  heightCm?: string
  bodyFatPercent?: string
  muscleMassKg?: string
  waistCm?: string
  chestCm?: string
  hipCm?: string
  restingHeartRate?: number
  notes?: string
}

export type FitnessGoal = {
  id: string
  memberId: string
  coachId: string
  title: string
  description?: string
  metricName?: string
  startValue?: string
  targetValue?: string
  currentValue?: string
  unit?: string
  targetDate?: string
  status: FitnessGoalStatus
}

export type ProgressSeries = {
  memberId: string
  from: string
  to: string
  metrics: Array<{
    name: string
    unit: string
    points: Array<{ date: string; value: number }>
  }>
  goals: FitnessGoal[]
}

export type MealPlan = {
  id: string
  memberId: string
  coachId: string
  title: string
  dailyCalorieTarget?: number
  startDate: string
  endDate?: string
  medicalDisclaimer: string
  status: MealPlanStatus
  items: Array<{
    id: string
    dayNumber: number
    mealType: string
    foodName: string
    quantity?: string
    estimatedCalories?: number
    proteinGrams?: string
    carbsGrams?: string
    fatGrams?: string
    sortOrder: number
  }>
}

export type GymArea = {
  id: string
  name: string
  location?: string
  description?: string
  isActive: boolean
}

export type Equipment = {
  id: string
  equipmentCode: string
  gymAreaId: string
  gymAreaName?: string
  name: string
  brand?: string
  model?: string
  status: EquipmentStatus
  purchaseDate?: string
  lastMaintenanceAt?: string
  nextMaintenanceAt?: string
}

export type Maintenance = {
  id: string
  equipmentId: string
  equipmentName?: string
  scheduledAt: string
  status: MaintenanceStatus
  description: string
  handledBy?: string
  handlerName?: string
  resultNote?: string
  completedAt?: string
}

export type CoachReview = {
  id: string
  ptPackagePurchaseId?: string
  memberId?: string
  memberDisplayName: string
  coachId: string
  courseId: string
  courseNameSnapshot: string
  rating: number
  comment?: string
  createdAt: string
  moderationStatus?: 'VISIBLE' | 'HIDDEN'
  moderationReason?: string
  hiddenReason?: string
}

export type SupportRequest = {
  id: string
  requestCode: string
  memberId: string
  memberName?: string
  subject: string
  message: string
  status: SupportStatus
  response?: string
  assignedTo?: string
  respondedAt?: string
  createdAt: string
}

export type AuditLog = {
  id: string
  actorId?: string
  actorName?: string
  action: string
  entityType: string
  entityId?: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  createdAt: string
}
