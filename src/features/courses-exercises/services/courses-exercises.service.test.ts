import { describe, it, expect, vi, beforeEach } from 'vitest'
import { coursesExercisesService } from './courses-exercises.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}))

describe('coursesExercisesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Training Courses ---
  it('[1] calls GET /training-courses with query params', async () => {
    const mockCourses = [{ id: 'tc-1', name: 'Boxing Fitness', isActive: true }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockCourses,
    } as any)

    const res = await coursesExercisesService.getTrainingCourses({ search: 'Boxing', limit: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/training-courses', {
      params: { search: 'Boxing', limit: 10 },
    })
    expect(res.data).toEqual(mockCourses)
  })

  it('[2] calls GET /training-courses/:id', async () => {
    const mockCourse = {
      id: 'tc-1',
      name: 'Kickboxing PT',
      description: 'Lộ trình Kickboxing cá nhân',
      isActive: true,
      courseMuscleGroupsCourseId: [],
      courseExercisesCourseId: [],
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockCourse,
    } as any)

    const res = await coursesExercisesService.getTrainingCourseById('tc-1')
    expect(apiClient.get).toHaveBeenCalledWith('/training-courses/tc-1')
    expect(res).toEqual(mockCourse)
  })

  it('[3] calls POST /training-courses to create a course', async () => {
    const payload = {
      name: 'Khóa Tăng Cơ Hypertrophy',
      difficultyLevel: 'ADVANCED',
      objective: 'Tăng cơ toàn diện',
      description: 'Chương trình phát triển cơ bắp',
      imageUrl: 'https://example.com/hypertrophy.jpg',
    }
    const created = { id: 'tc-new', ...payload, isActive: true }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: created,
    } as any)

    const res = await coursesExercisesService.createTrainingCourse(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/training-courses', payload)
    expect(res).toEqual(created)
  })

  it('[4] calls PATCH /training-courses/:id to update course', async () => {
    const payload = {
      name: 'Khóa Tăng Cơ Nâng Cao',
      difficultyLevel: 'ADVANCED',
    }
    const updated = { id: 'tc-1', ...payload, isActive: true }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const res = await coursesExercisesService.updateTrainingCourse('tc-1', payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/training-courses/tc-1', payload)
    expect(res).toEqual(updated)
  })

  it('[5] calls PATCH /training-courses/:id/status to toggle status', async () => {
    const updated = { id: 'tc-1', name: 'Boxing', isActive: false }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const res = await coursesExercisesService.updateTrainingCourseStatus('tc-1', { isActive: false })
    expect(apiClient.patch).toHaveBeenCalledWith('/training-courses/tc-1/status', { isActive: false })
    expect(res).toEqual(updated)
  })

  it('[6] calls PUT /training-courses/:id/muscle-groups to assign muscle groups', async () => {
    const payload = {
      muscleGroups: [
        { id: 'mg-chest', isPrimary: true },
        { id: 'mg-triceps', isPrimary: false },
      ],
    }
    const result = [
      { courseId: 'tc-1', muscleGroupId: 'mg-chest', isPrimary: true, muscleGroup: { id: 'mg-chest', name: 'Ngực' } },
    ]
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      success: true,
      data: result,
    } as any)

    const res = await coursesExercisesService.updateCourseMuscleGroups('tc-1', payload)
    expect(apiClient.put).toHaveBeenCalledWith('/training-courses/tc-1/muscle-groups', payload)
    expect(res).toEqual(result)
  })

  it('[7] calls PUT /training-courses/:id/exercises to configure exercises syllabus', async () => {
    const payload = {
      exercises: [
        { id: 'ex-1', sortOrder: 1, coachNote: '3 sets x 12 reps' },
        { id: 'ex-2', sortOrder: 2, coachNote: '4 sets x 10 reps' },
      ],
    }
    const result = [
      { courseId: 'tc-1', exerciseId: 'ex-1', sortOrder: 1, coachNote: '3 sets x 12 reps' },
    ]
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      success: true,
      data: result,
    } as any)

    const res = await coursesExercisesService.updateCourseExercises('tc-1', payload)
    expect(apiClient.put).toHaveBeenCalledWith('/training-courses/tc-1/exercises', payload)
    expect(res).toEqual(result)
  })

  // --- Exercises ---
  it('[8] calls GET /exercises with query params', async () => {
    const mockEx = [{ id: 'ex-1', name: 'Plank', difficultyLevel: 'BEGINNER' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockEx,
    } as any)

    const res = await coursesExercisesService.getExercises({ limit: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/exercises', { params: { limit: 10 } })
    expect(res.data).toEqual(mockEx)
  })

  it('[9] calls GET /exercises/:id', async () => {
    const mockEx = { id: 'ex-1', name: 'Barbell Squat', difficultyLevel: 'INTERMEDIATE' }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockEx,
    } as any)

    const res = await coursesExercisesService.getExerciseById('ex-1')
    expect(apiClient.get).toHaveBeenCalledWith('/exercises/ex-1')
    expect(res).toEqual(mockEx)
  })

  it('[10] calls POST /exercises to create new exercise', async () => {
    const payload = {
      name: 'Bench Press',
      instructions: 'Đẩy tạ đòn',
      muscleGroups: [{ id: 'mg-chest', isPrimary: true }],
    }
    const created = { id: 'ex-created', ...payload }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: created,
    } as any)

    const res = await coursesExercisesService.createExercise(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/exercises', payload)
    expect(res).toEqual(created)
  })

  it('[11] calls PATCH /exercises/:id to update exercise details', async () => {
    const payload = {
      name: 'Bench Press Nâng Cao',
      equipmentRequired: 'Tạ đòn + Ghế phẳng',
    }
    const updated = { id: 'ex-1', name: 'Bench Press Nâng Cao', equipmentRequired: 'Tạ đòn + Ghế phẳng' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const res = await coursesExercisesService.updateExercise('ex-1', payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/exercises/ex-1', payload)
    expect(res).toEqual(updated)
  })

  it('[12] calls PATCH /exercises/:id/status to toggle active status', async () => {
    const updated = { id: 'ex-1', name: 'Bench Press', isActive: false }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const res = await coursesExercisesService.updateExerciseStatus('ex-1', { isActive: false })
    expect(apiClient.patch).toHaveBeenCalledWith('/exercises/ex-1/status', { isActive: false })
    expect(res).toEqual(updated)
  })

  // --- Muscle Groups ---
  it('[13] calls GET /muscle-groups', async () => {
    const mockMg = [{ id: 'mg-1', name: 'Chest', isActive: true }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockMg,
    } as any)

    const res = await coursesExercisesService.getMuscleGroups()
    expect(apiClient.get).toHaveBeenCalledWith('/muscle-groups')
    expect(res.data).toEqual(mockMg)
  })

  it('[14] calls GET /muscle-groups/:id', async () => {
    const mockMg = { id: 'mg-1', name: 'Ngực', description: 'Cơ ngực', isActive: true }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockMg,
    } as any)

    const res = await coursesExercisesService.getMuscleGroupById('mg-1')
    expect(apiClient.get).toHaveBeenCalledWith('/muscle-groups/mg-1')
    expect(res).toEqual(mockMg)
  })

  it('[15] calls POST /muscle-groups to create a new muscle group', async () => {
    const payload = {
      name: 'Cơ vai (Deltoids)',
      description: 'Nhóm cơ vai trước, giữa và sau',
      imageUrl: 'https://example.com/deltoids.png',
    }
    const created = { id: 'mg-deltoid', ...payload, isActive: true }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: created,
    } as any)

    const res = await coursesExercisesService.createMuscleGroup(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/muscle-groups', payload)
    expect(res).toEqual(created)
  })

  it('[16] calls PATCH /muscle-groups/:id to update muscle group details', async () => {
    const payload = {
      name: 'Cơ vai nâng cao',
      description: 'Mô tả cập nhật',
    }
    const updated = { id: 'mg-deltoid', name: 'Cơ vai nâng cao', description: 'Mô tả cập nhật', isActive: true }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const res = await coursesExercisesService.updateMuscleGroup('mg-deltoid', payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/muscle-groups/mg-deltoid', payload)
    expect(res).toEqual(updated)
  })

  it('[17] calls PATCH /muscle-groups/:id/status to toggle status', async () => {
    const updated = { id: 'mg-deltoid', name: 'Cơ vai', isActive: false }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const res = await coursesExercisesService.updateMuscleGroupStatus('mg-deltoid', { isActive: false })
    expect(apiClient.patch).toHaveBeenCalledWith('/muscle-groups/mg-deltoid/status', { isActive: false })
    expect(res).toEqual(updated)
  })
})
