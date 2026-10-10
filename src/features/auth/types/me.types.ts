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
  FitnessGoal,
  ApiSuccess,
} from '@/shared/types/api'

export interface MemberProgressData {
  assessments: BodyAssessment[]
  results: TrainingResult[]
  goals: FitnessGoal[]
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
  FitnessGoal,
  ApiSuccess,
}
