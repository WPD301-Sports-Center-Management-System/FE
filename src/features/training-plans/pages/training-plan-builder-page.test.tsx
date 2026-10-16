import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TrainingPlanBuilderPage } from './training-plan-builder-page'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { trainingPlansService } from '../services/training-plans.service'
import { AppApiError } from '@/shared/api/api-error'

vi.mock('@/features/coaches/services/coaches.service', () => ({ coachesService: { getMyMembers: vi.fn(), getMyPackages: vi.fn() } }))
vi.mock('@/features/courses-exercises/services/courses-exercises.service', () => ({
  coursesExercisesService: {
    getExercises: vi.fn(),
    getTrainingCourseById: vi.fn().mockResolvedValue({ courseExercisesCourseId: [] }),
  },
}))
vi.mock('../services/training-plans.service', () => ({ trainingPlansService: {
  createTrainingPlan: vi.fn(), addExercise: vi.fn(), assignTrainingPlan: vi.fn(), deleteTrainingPlan: vi.fn(),
} }))

describe('TrainingPlanBuilderPage recovery schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(coachesService.getMyMembers).mockResolvedValue({ data: [{ id: 'member-1', fullName: 'Hội viên' }] } as never)
    vi.mocked(coachesService.getMyPackages).mockResolvedValue({ data: [{ id: 'purchase-1', memberId: 'member-1', status: 'ACTIVE' }] } as never)
    vi.mocked(coursesExercisesService.getExercises).mockResolvedValue({ data: [{
      id: 'exercise-1', name: 'Bench Press', muscleGroups: [
        { id: 'chest', name: 'Ngực', isPrimary: true, recoveryDays: 2 },
        { id: 'shoulder', name: 'Vai', isPrimary: false, recoveryDays: 3 },
      ],
    }] } as never)
    vi.mocked(trainingPlansService.createTrainingPlan).mockResolvedValue({ id: 'plan-1' } as never)
    vi.mocked(trainingPlansService.addExercise).mockResolvedValue({ id: 'row-1' })
    vi.mocked(trainingPlansService.assignTrainingPlan).mockResolvedValue({ id: 'plan-1' } as never)
    vi.mocked(trainingPlansService.deleteTrainingPlan).mockResolvedValue({ deleted: true })
  })

  it('shows the primary and secondary muscles and submits the chosen day', async () => {
    render(<TrainingPlanBuilderPage />)
    fireEvent.change(await screen.findByLabelText('Giao cho Học viên'), { target: { value: 'member-1' } })
    fireEvent.change(await screen.findByLabelText('Gói tập PT liên kết'), { target: { value: 'purchase-1' } })
    expect(await screen.findByText('Chính: Ngực · Phụ: Vai · Hồi phục: 2 ngày')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Ngày bắt đầu'), { target: { value: '2030-02-01' } })
    fireEvent.change(screen.getByLabelText('Ngày tập'), { target: { value: '2030-02-03' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu & Giao Giáo Án' }))
    await waitFor(() => expect(trainingPlansService.addExercise).toHaveBeenCalledWith('plan-1',
      expect.objectContaining({ exerciseId: 'exercise-1', scheduledDate: '2030-02-03' })))
    expect(trainingPlansService.assignTrainingPlan).toHaveBeenCalledWith('plan-1')
  })

  it('shows the recovery error and removes the incomplete draft', async () => {
    vi.mocked(trainingPlansService.addExercise).mockRejectedValue(new AppApiError(409, {
      code: 'MUSCLE_RECOVERY_CONFLICT', message: 'Nhóm cơ Ngực chỉ tập lại từ 2030-02-03.',
    } as never))
    render(<TrainingPlanBuilderPage />)
    fireEvent.change(await screen.findByLabelText('Giao cho Học viên'), { target: { value: 'member-1' } })
    fireEvent.change(await screen.findByLabelText('Gói tập PT liên kết'), { target: { value: 'purchase-1' } })
    await screen.findByLabelText('Ngày tập')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu & Giao Giáo Án' }))
    expect(await screen.findByText('Nhóm cơ Ngực chỉ tập lại từ 2030-02-03.')).toBeInTheDocument()
    expect(trainingPlansService.deleteTrainingPlan).toHaveBeenCalledWith('plan-1')
    expect(trainingPlansService.assignTrainingPlan).not.toHaveBeenCalled()
  })

  it('saves draft without assigning when clicking Lưu Bản Nháp', async () => {
    render(<TrainingPlanBuilderPage />)
    fireEvent.change(await screen.findByLabelText('Giao cho Học viên'), { target: { value: 'member-1' } })
    fireEvent.change(await screen.findByLabelText('Gói tập PT liên kết'), { target: { value: 'purchase-1' } })
    await screen.findByLabelText('Ngày tập')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu Bản Nháp' }))
    await waitFor(() => expect(trainingPlansService.addExercise).toHaveBeenCalledWith('plan-1',
      expect.objectContaining({ exerciseId: 'exercise-1' })))
    expect(trainingPlansService.assignTrainingPlan).not.toHaveBeenCalled()
    expect(await screen.findByText('Lưu Bản Nháp Thành Công!')).toBeInTheDocument()
  })
})
