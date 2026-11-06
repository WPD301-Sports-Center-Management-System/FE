import type {
  Subscription,
  Purchase,
  Booking,
  Payment,
  Invoice,
  TrainingPlan,
  MealPlan,
  SupportRequest,
  BodyAssessment,
  TrainingResult,
  ApiSuccess,
} from '@/shared/types/api'

export interface MemberProgressData {
  assessments: BodyAssessment[]
  results: TrainingResult[]
}

export type {
  Subscription,
  Purchase,
  Booking,
  Payment,
  Invoice,
  TrainingPlan,
  MealPlan,
  SupportRequest,
  BodyAssessment,
  TrainingResult,
  ApiSuccess,
}
