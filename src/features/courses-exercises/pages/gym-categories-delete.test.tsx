import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AppApiError } from '@/shared/api/api-error'
import { GymCategoriesPage } from './gym-categories-page'
import { coursesExercisesService as api } from '@/features/courses-exercises/services/courses-exercises.service'

vi.mock('@/features/courses-exercises/services/courses-exercises.service', () => ({
  coursesExercisesService: {
    getTrainingCourses: vi.fn(), getExercises: vi.fn(), getMuscleGroups: vi.fn(), getTrainingCourseById: vi.fn(),
    updateTrainingCourseStatus: vi.fn(), updateExerciseStatus: vi.fn(), updateMuscleGroupStatus: vi.fn(),
    deleteTrainingCourse: vi.fn(), deleteExercise: vi.fn(), deleteMuscleGroup: vi.fn(),
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.getTrainingCourses).mockResolvedValue({ success: true, data: [{ id: 'c-1', name: 'Boxing cơ bản', isActive: true, difficultyLevel: 'BEGINNER' }] } as never)
  vi.mocked(api.getExercises).mockResolvedValue({ success: true, data: [{ id: 'e-1', name: 'Hít đất', isActive: true, muscleGroups: [] }] } as never)
  vi.mocked(api.getMuscleGroups).mockResolvedValue({ success: true, data: [{ id: 'm-1', name: 'Ngực', isActive: true, recoveryDays: 2 }] } as never)
})
const openTab = async (name: RegExp) => { await screen.findByText('Boxing cơ bản'); fireEvent.click(screen.getByRole('button', { name })) }

describe('GymCategoriesPage delete', () => {
  it('deletes a muscle group after confirmation and removes the card', async () => {
    vi.mocked(api.deleteMuscleGroup).mockResolvedValue(undefined)
    render(<GymCategoriesPage />)
    await openTab(/Nhóm cơ/)
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa nhóm cơ Ngực' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('“Ngực”')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(api.deleteMuscleGroup).toHaveBeenCalledWith('m-1'))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Xóa nhóm cơ Ngực' })).toBeNull())
    expect(screen.getByText('Đã xóa nhóm cơ "Ngực".')).toBeInTheDocument()
  })

  it('keeps an exercise and shows the BE reason while a course contains it; pause toggle is untouched', async () => {
    vi.mocked(api.deleteExercise).mockRejectedValue(new AppApiError(409, { code: 'IN_USE', message: 'Bài tập đang nằm trong 1 khóa học. Hãy gỡ bài tập khỏi các khóa này hoặc chuyển sang tạm dừng thay vì xóa.' } as never))
    render(<GymCategoriesPage />)
    await openTab(/Bài tập/)
    expect(await screen.findByRole('button', { name: /Tạm dừng/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bài tập Hít đất' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('chuyển sang tạm dừng thay vì xóa')
    expect(screen.getByRole('button', { name: 'Xóa bài tập Hít đất' })).toBeInTheDocument()
  })

  it('deletes a course and removes it from the list', async () => {
    vi.mocked(api.deleteTrainingCourse).mockResolvedValue(undefined)
    render(<GymCategoriesPage />)
    await screen.findByText('Boxing cơ bản')
    fireEvent.click(screen.getByRole('button', { name: 'Xóa khóa học Boxing cơ bản' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(api.deleteTrainingCourse).toHaveBeenCalledWith('c-1'))
    await waitFor(() => expect(screen.queryByText('Boxing cơ bản')).toBeNull())
  })
})
