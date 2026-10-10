import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, TrainingCourse, Exercise, MuscleGroup } from '@/shared/types/api'
import type {
  CreateExercisePayload,
  UpdateExercisePayload,
  UpdateExerciseStatusPayload,
  ExerciseQueryParams,
  CreateMuscleGroupPayload,
  UpdateMuscleGroupPayload,
  UpdateMuscleGroupStatusPayload,
  CreateTrainingCoursePayload,
  UpdateTrainingCoursePayload,
  UpdateTrainingCourseStatusPayload,
  TrainingCourseQueryParams,
  UpdateCourseMuscleGroupsPayload,
  UpdateCourseExercisesPayload,
  TrainingCourseDetail,
  CourseMuscleGroupRelation,
  CourseExerciseRelation,
} from '../types/courses-exercises.types'

export const coursesExercisesService = {
  /**
   * [1] GET /training-courses - List training courses with optional filters & pagination
   */
  async getTrainingCourses(params?: TrainingCourseQueryParams): Promise<ApiSuccess<TrainingCourse[]>> {
    const res = await apiClient.get<ApiSuccess<TrainingCourse[]>>('/training-courses', { params })
    return res as unknown as ApiSuccess<TrainingCourse[]>
  },

  /**
   * [2] GET /training-courses/{id} - Get single training course details by ID
   */
  async getTrainingCourseById(id: string): Promise<TrainingCourseDetail> {
    const res = await apiClient.get<ApiSuccess<TrainingCourseDetail>>(`/training-courses/${id}`)
    const data = res as unknown as ApiSuccess<TrainingCourseDetail>
    return data.data ?? (data as unknown as TrainingCourseDetail)
  },

  /**
   * [3] POST /training-courses - Create a new training course
   */
  async createTrainingCourse(payload: CreateTrainingCoursePayload): Promise<TrainingCourse> {
    const res = await apiClient.post<ApiSuccess<TrainingCourse>>('/training-courses', payload)
    const data = res as unknown as ApiSuccess<TrainingCourse>
    return data.data ?? (data as unknown as TrainingCourse)
  },

  /**
   * [4] PATCH /training-courses/{id} - Update training course details
   */
  async updateTrainingCourse(id: string, payload: UpdateTrainingCoursePayload): Promise<TrainingCourse> {
    const res = await apiClient.patch<ApiSuccess<TrainingCourse>>(`/training-courses/${id}`, payload)
    const data = res as unknown as ApiSuccess<TrainingCourse>
    return data.data ?? (data as unknown as TrainingCourse)
  },

  /**
   * [5] PATCH /training-courses/{id}/status - Toggle training course active/inactive status
   */
  async updateTrainingCourseStatus(
    id: string,
    payload: UpdateTrainingCourseStatusPayload
  ): Promise<TrainingCourse> {
    const res = await apiClient.patch<ApiSuccess<TrainingCourse>>(`/training-courses/${id}/status`, payload)
    const data = res as unknown as ApiSuccess<TrainingCourse>
    return data.data ?? (data as unknown as TrainingCourse)
  },

  /**
   * [6] PUT /training-courses/{id}/muscle-groups - Assign muscle groups to course
   */
  async updateCourseMuscleGroups(
    id: string,
    payload: UpdateCourseMuscleGroupsPayload
  ): Promise<CourseMuscleGroupRelation[]> {
    const res = await apiClient.put<ApiSuccess<CourseMuscleGroupRelation[]>>(
      `/training-courses/${id}/muscle-groups`,
      payload
    )
    const data = res as unknown as ApiSuccess<CourseMuscleGroupRelation[]>
    return data.data ?? (data as unknown as CourseMuscleGroupRelation[])
  },

  /**
   * [7] PUT /training-courses/{id}/exercises - Configure course exercise syllabus & order
   */
  async updateCourseExercises(
    id: string,
    payload: UpdateCourseExercisesPayload
  ): Promise<CourseExerciseRelation[]> {
    const res = await apiClient.put<ApiSuccess<CourseExerciseRelation[]>>(
      `/training-courses/${id}/exercises`,
      payload
    )
    const data = res as unknown as ApiSuccess<CourseExerciseRelation[]>
    return data.data ?? (data as unknown as CourseExerciseRelation[])
  },

  /**
   * [2] GET /exercises - List exercises with filters & pagination
   */
  async getExercises(params?: ExerciseQueryParams): Promise<ApiSuccess<Exercise[]>> {
    const res = await apiClient.get<ApiSuccess<Exercise[]>>('/exercises', { params })
    return res as unknown as ApiSuccess<Exercise[]>
  },

  /**
   * [3] GET /exercises/{id} - Get single exercise details by ID
   */
  async getExerciseById(id: string): Promise<Exercise> {
    const res = await apiClient.get<ApiSuccess<Exercise>>(`/exercises/${id}`)
    const data = res as unknown as ApiSuccess<Exercise>
    return data.data ?? (data as unknown as Exercise)
  },

  /**
   * [4] POST /exercises - Create a new exercise in library
   */
  async createExercise(payload: CreateExercisePayload): Promise<Exercise> {
    const res = await apiClient.post<ApiSuccess<Exercise>>('/exercises', payload)
    const data = res as unknown as ApiSuccess<Exercise>
    return data.data ?? (data as unknown as Exercise)
  },

  /**
   * [5] PATCH /exercises/{id} - Update exercise details
   */
  async updateExercise(id: string, payload: UpdateExercisePayload): Promise<Exercise> {
    const res = await apiClient.patch<ApiSuccess<Exercise>>(`/exercises/${id}`, payload)
    const data = res as unknown as ApiSuccess<Exercise>
    return data.data ?? (data as unknown as Exercise)
  },

  /**
   * [6] PATCH /exercises/{id}/status - Toggle exercise active/inactive status
   */
  async updateExerciseStatus(id: string, payload: UpdateExerciseStatusPayload): Promise<Exercise> {
    const res = await apiClient.patch<ApiSuccess<Exercise>>(`/exercises/${id}/status`, payload)
    const data = res as unknown as ApiSuccess<Exercise>
    return data.data ?? (data as unknown as Exercise)
  },

  /**
   * [7] GET /muscle-groups - List all anatomical muscle groups
   */
  async getMuscleGroups(): Promise<ApiSuccess<MuscleGroup[]>> {
    const res = await apiClient.get<ApiSuccess<MuscleGroup[]>>('/muscle-groups')
    return res as unknown as ApiSuccess<MuscleGroup[]>
  },

  /**
   * [8] GET /muscle-groups/{id} - Get muscle group details by id
   */
  async getMuscleGroupById(id: string): Promise<MuscleGroup> {
    const res = await apiClient.get<ApiSuccess<MuscleGroup>>(`/muscle-groups/${id}`)
    const data = res as unknown as ApiSuccess<MuscleGroup>
    return data.data ?? (data as unknown as MuscleGroup)
  },

  /**
   * [9] POST /muscle-groups - Create a new muscle group
   */
  async createMuscleGroup(payload: CreateMuscleGroupPayload): Promise<MuscleGroup> {
    const res = await apiClient.post<ApiSuccess<MuscleGroup>>('/muscle-groups', payload)
    const data = res as unknown as ApiSuccess<MuscleGroup>
    return data.data ?? (data as unknown as MuscleGroup)
  },

  /**
   * [10] PATCH /muscle-groups/{id} - Update muscle group details
   */
  async updateMuscleGroup(id: string, payload: UpdateMuscleGroupPayload): Promise<MuscleGroup> {
    const res = await apiClient.patch<ApiSuccess<MuscleGroup>>(`/muscle-groups/${id}`, payload)
    const data = res as unknown as ApiSuccess<MuscleGroup>
    return data.data ?? (data as unknown as MuscleGroup)
  },

  /**
   * [11] PATCH /muscle-groups/{id}/status - Toggle muscle group active/inactive status
   */
  async updateMuscleGroupStatus(
    id: string,
    payload: UpdateMuscleGroupStatusPayload
  ): Promise<MuscleGroup> {
    const res = await apiClient.patch<ApiSuccess<MuscleGroup>>(`/muscle-groups/${id}/status`, payload)
    const data = res as unknown as ApiSuccess<MuscleGroup>
    return data.data ?? (data as unknown as MuscleGroup)
  },
}
