import type { MuscleGroup, Exercise, TrainingCourse, ApiSuccess } from '@/shared/types/api'

export interface CreateExercisePayload {
  name: string
  description?: string
  instructions?: string
  imageUrl?: string
  videoUrl?: string
  equipmentRequired?: string
  difficultyLevel?: string
  muscleGroups: Array<{
    id: string
    isPrimary?: boolean
  }>
}

export interface UpdateExercisePayload {
  name?: string
  description?: string
  instructions?: string
  imageUrl?: string
  videoUrl?: string
  equipmentRequired?: string
  difficultyLevel?: string
  muscleGroups?: Array<{
    id: string
    isPrimary?: boolean
  }>
}

export interface UpdateExerciseStatusPayload {
  isActive: boolean
}

export interface ExerciseQueryParams {
  page?: number
  limit?: number
  search?: string
  difficultyLevel?: string
  muscleGroupId?: string
}

export interface CreateMuscleGroupPayload {
  name: string
  recoveryDays?: number
  description?: string
  imageUrl?: string
}

export interface UpdateMuscleGroupPayload {
  name?: string
  recoveryDays?: number
  description?: string
  imageUrl?: string
}

export interface UpdateMuscleGroupStatusPayload {
  isActive: boolean
}

export interface CreateTrainingCoursePayload {
  name: string
  description?: string
  objective?: string
  difficultyLevel?: string
  imageUrl?: string
}

export interface UpdateTrainingCoursePayload {
  name?: string
  description?: string
  objective?: string
  difficultyLevel?: string
  imageUrl?: string
}

export interface UpdateTrainingCourseStatusPayload {
  isActive: boolean
}

export interface TrainingCourseQueryParams {
  page?: number
  limit?: number
  search?: string
  muscleGroupId?: string
  coachId?: string
}

export interface UpdateCourseMuscleGroupsPayload {
  muscleGroups: Array<{
    id: string
    isPrimary: boolean
  }>
}

export interface UpdateCourseExercisesPayload {
  exercises: Array<{
    id: string
    sortOrder: number
    coachNote?: string
  }>
}

export interface CourseMuscleGroupRelation {
  id?: string
  courseId?: string
  muscleGroupId?: string
  isPrimary: boolean
  muscleGroup: MuscleGroup
}

export interface CourseExerciseRelation {
  id?: string
  courseId?: string
  exerciseId?: string
  sortOrder: number
  coachNote?: string
  exercise: Exercise
}

export interface CourseCoachOfferingRelation {
  id: string
  coachId: string
  status: string
  isActive: boolean
  coach?: {
    id: string
    user?: {
      fullName: string
      avatarUrl?: string
    }
  }
}

export interface CoursePtPackageRelation {
  prices?: Partial<Record<import('@/shared/utils/coach-tier').CoachTier, string>> | null
  minCoachTier?: import('@/shared/utils/coach-tier').CoachTier
  priceFrom?: string | null
  id: string
  name: string
  sessionCount: number
  validityDays?: number | null
  price: string
  approvalStatus: string
  isActive: boolean
}

export interface TrainingCourseDetail extends TrainingCourse {
  courseMuscleGroupsCourseId?: CourseMuscleGroupRelation[]
  courseExercisesCourseId?: CourseExerciseRelation[]
  coachCourseOfferingsCourseId?: CourseCoachOfferingRelation[]
  ptPackageOptionsCourseId?: CoursePtPackageRelation[]
}

export type { MuscleGroup, Exercise, TrainingCourse, ApiSuccess }

