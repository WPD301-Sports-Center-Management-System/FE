import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { GymCategoriesPage } from './gym-categories-page'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'

vi.mock('@/features/courses-exercises/services/courses-exercises.service', () => ({
  coursesExercisesService: {
    getTrainingCourses: vi.fn(),
    getTrainingCourseById: vi.fn(),
    createTrainingCourse: vi.fn(),
    updateTrainingCourse: vi.fn(),
    updateTrainingCourseStatus: vi.fn(),
    updateCourseMuscleGroups: vi.fn(),
    updateCourseExercises: vi.fn(),
    getExercises: vi.fn(),
    getMuscleGroups: vi.fn(),
    createExercise: vi.fn(),
    updateExercise: vi.fn(),
    updateExerciseStatus: vi.fn(),
    createMuscleGroup: vi.fn(),
    updateMuscleGroup: vi.fn(),
    updateMuscleGroupStatus: vi.fn(),
  },
}))

describe('GymCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders courses, exercises and muscle groups from API', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'tc-1',
          name: 'Boxing Chuyên Nghiệp',
          difficultyLevel: 'ADVANCED',
          objective: 'Cải thiện thể lực',
          isActive: true,
        } as any,
      ],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'ex-1',
          name: 'Hít đất cơ bản',
          difficultyLevel: 'BEGINNER',
          isActive: true,
          muscleGroups: [{ id: 'mg-1', name: 'Cơ ngực', isPrimary: true }],
        },
      ],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'mg-1',
          name: 'Cơ ngực',
          description: 'Nhóm cơ ngực trên và dưới',
          isActive: true,
        },
      ],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Danh Mục & Thư Viện Bài Tập (WEB-MAN-05)')).toBeInTheDocument()
      expect(screen.getByText('Boxing Chuyên Nghiệp')).toBeInTheDocument()
    })
  })

  it('creates a new training course via modal', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [{ id: 'mg-1', name: 'Cơ ngực', isActive: true }],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Thêm khóa tập mới')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Thêm khóa tập mới'))

    const nameInput = screen.getByPlaceholderText('Ví dụ: Kickboxing PT Giảm mỡ Cấp tốc')
    fireEvent.change(nameInput, { target: { value: 'Kickboxing Đỉnh Cao' } })

    const objInput = screen.getByPlaceholderText('Ví dụ: Tăng 2kg cơ bắp và đốt 3% mỡ trong 8 tuần')
    fireEvent.change(objInput, { target: { value: 'Rèn luyện phản xạ & đốt calo' } })

    vi.mocked(coursesExercisesService.createTrainingCourse).mockResolvedValueOnce({
      id: 'tc-2',
      name: 'Kickboxing Đỉnh Cao',
      difficultyLevel: 'INTERMEDIATE',
      objective: 'Rèn luyện phản xạ & đốt calo',
      isActive: true,
    })

    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'tc-2',
          name: 'Kickboxing Đỉnh Cao',
          difficultyLevel: 'INTERMEDIATE',
          objective: 'Rèn luyện phản xạ & đốt calo',
          isActive: true,
        },
      ],
    } as any)

    fireEvent.click(screen.getByText('Tạo khóa học'))

    await waitFor(() => {
      expect(coursesExercisesService.createTrainingCourse).toHaveBeenCalledWith({
        name: 'Kickboxing Đỉnh Cao',
        difficultyLevel: 'INTERMEDIATE',
        objective: 'Rèn luyện phản xạ & đốt calo',
        description: undefined,
        imageUrl: undefined,
      })
      expect(screen.getByText('Đã tạo thành công khóa tập "Kickboxing Đỉnh Cao"!')).toBeInTheDocument()
    })
  })

  it('toggles training course active/inactive status', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'tc-1',
          name: 'Yoga Trị Liệu PT',
          difficultyLevel: 'BEGINNER',
          isActive: true,
        },
      ],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Yoga Trị Liệu PT')).toBeInTheDocument()
    })

    vi.mocked(coursesExercisesService.updateTrainingCourseStatus).mockResolvedValueOnce({
      id: 'tc-1',
      name: 'Yoga Trị Liệu PT',
      isActive: false,
    })

    const pauseBtn = screen.getByRole('button', { name: /Tạm dừng/i })
    fireEvent.click(pauseBtn)

    await waitFor(() => {
      expect(coursesExercisesService.updateTrainingCourseStatus).toHaveBeenCalledWith('tc-1', {
        isActive: false,
      })
      expect(screen.getByText('Đã tạm dừng khóa tập "Yoga Trị Liệu PT" thành công!')).toBeInTheDocument()
    })
  })

  it('opens training course details modal and displays syllabus & relations', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'tc-1',
          name: 'Cardio HIIT',
          difficultyLevel: 'ADVANCED',
          isActive: true,
        },
      ],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Cardio HIIT')).toBeInTheDocument()
    })

    vi.mocked(coursesExercisesService.getTrainingCourseById).mockResolvedValueOnce({
      id: 'tc-1',
      name: 'Cardio HIIT',
      difficultyLevel: 'ADVANCED',
      isActive: true,
      description: 'Giảm cân cấp tốc trong 30 ngày',
      objective: 'Tối ưu hóa VO2 Max',
      courseMuscleGroupsCourseId: [
        {
          isPrimary: true,
          muscleGroup: { id: 'mg-leg', name: 'Cơ chân đùi', isActive: true },
        },
      ],
      courseExercisesCourseId: [
        {
          sortOrder: 1,
          coachNote: '5 vòng x 1 phút nghỉ 30s',
          exercise: { id: 'ex-burpee', name: 'Burpees Nâng Cao', difficultyLevel: 'ADVANCED', muscleGroups: [] },
        },
      ],
      coachCourseOfferingsCourseId: [
        {
          id: 'off-1',
          coachId: 'c-1',
          status: 'APPROVED',
          isActive: true,
          coach: { id: 'c-1', user: { fullName: 'HLV Tuấn Anh' } },
        },
      ],
      ptPackageOptionsCourseId: [
        {
          id: 'pkg-1',
          name: 'Gói 12 Buổi Cardio',
          sessionCount: 12,
          validityDays: 60,
          price: '3600000',
          approvalStatus: 'APPROVED',
          isActive: true,
        },
      ],
    })

    const detailBtn = screen.getByRole('button', { name: /Chi tiết/i })
    fireEvent.click(detailBtn)

    await waitFor(() => {
      expect(coursesExercisesService.getTrainingCourseById).toHaveBeenCalledWith('tc-1')
      expect(screen.getByText('Burpees Nâng Cao')).toBeInTheDocument()
      expect(screen.getByText('HLV Tuấn Anh')).toBeInTheDocument()
      expect(screen.getByText('Gói 12 Buổi Cardio (12 buổi)')).toBeInTheDocument()
    })
  })

  it('switches to exercise tab and creates a new exercise', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [{ id: 'mg-1', name: 'Cơ ngực', isActive: true }],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.getByText('Thư viện Bài tập (0)')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Thư viện Bài tập (0)'))

    expect(screen.getByText('Thêm bài tập mới')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Thêm bài tập mới'))

    const nameInput = screen.getByPlaceholderText('Ví dụ: Dumbbell Incline Bench Press')
    fireEvent.change(nameInput, { target: { value: 'Incline Dumbbell Press' } })

    vi.mocked(coursesExercisesService.createExercise).mockResolvedValueOnce({
      id: 'ex-2',
      name: 'Incline Dumbbell Press',
      difficultyLevel: 'INTERMEDIATE',
      muscleGroups: [{ id: 'mg-1', name: 'Cơ ngực', isPrimary: true }],
      isActive: true,
    })

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'ex-2',
          name: 'Incline Dumbbell Press',
          difficultyLevel: 'INTERMEDIATE',
          muscleGroups: [{ id: 'mg-1', name: 'Cơ ngực', isPrimary: true }],
          isActive: true,
        },
      ],
    } as any)

    fireEvent.click(screen.getByText('Lưu bài tập'))

    await waitFor(() => {
      expect(coursesExercisesService.createExercise).toHaveBeenCalled()
      expect(screen.getByText('Đã tạo thành công bài tập "Incline Dumbbell Press"!')).toBeInTheDocument()
    })
  })

  it('toggles exercise active/inactive status', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'ex-1',
          name: 'Barbell Deadlift',
          difficultyLevel: 'ADVANCED',
          isActive: true,
          muscleGroups: [{ id: 'mg-back', name: 'Cơ lưng', isPrimary: true }],
        },
      ],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [{ id: 'mg-back', name: 'Cơ lưng', isActive: true }],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.queryByText('Đang tải danh mục từ máy chủ...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Thư viện Bài tập (1)'))

    expect(screen.getByText('Barbell Deadlift')).toBeInTheDocument()

    vi.mocked(coursesExercisesService.updateExerciseStatus).mockResolvedValueOnce({
      id: 'ex-1',
      name: 'Barbell Deadlift',
      isActive: false,
      muscleGroups: [{ id: 'mg-back', name: 'Cơ lưng', isPrimary: true }],
    })

    const pauseBtn = screen.getByRole('button', { name: /Tạm dừng/i })
    fireEvent.click(pauseBtn)

    await waitFor(() => {
      expect(coursesExercisesService.updateExerciseStatus).toHaveBeenCalledWith('ex-1', {
        isActive: false,
      })
      expect(screen.getByText('Đã tạm dừng bài tập "Barbell Deadlift" thành công!')).toBeInTheDocument()
    })
  })

  it('switches to muscle group tab and creates a new muscle group', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'mg-1',
          name: 'Cơ ngực',
          description: 'Nhóm cơ ngực',
          isActive: true,
        },
      ],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.queryByText('Đang tải danh mục từ máy chủ...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Nhóm cơ (1)'))

    expect(screen.getByText('Cơ ngực')).toBeInTheDocument()
    expect(screen.getByText('Thêm nhóm cơ mới')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Thêm nhóm cơ mới'))

    const nameInput = screen.getByPlaceholderText('Ví dụ: Cơ ngực (Pectoralis), Cơ lưng xô (Latissimus)...')
    fireEvent.change(nameInput, { target: { value: 'Cơ vai (Deltoids)' } })
    fireEvent.change(screen.getByLabelText('Số ngày hồi phục'), { target: { value: '3' } })

    vi.mocked(coursesExercisesService.createMuscleGroup).mockResolvedValueOnce({
      id: 'mg-2',
      name: 'Cơ vai (Deltoids)',
      description: '',
      isActive: true,
    })

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'mg-1', name: 'Cơ ngực', isActive: true },
        { id: 'mg-2', name: 'Cơ vai (Deltoids)', isActive: true },
      ],
    } as any)

    fireEvent.click(screen.getByText('Tạo nhóm cơ'))

    await waitFor(() => {
      expect(coursesExercisesService.createMuscleGroup).toHaveBeenCalledWith({
        name: 'Cơ vai (Deltoids)',
        recoveryDays: 3,
        description: undefined,
        imageUrl: undefined,
      })
      expect(screen.getByText('Đã tạo nhóm cơ "Cơ vai (Deltoids)" thành công!')).toBeInTheDocument()
    })
  })

  it('toggles muscle group active status', async () => {
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getExercises).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coursesExercisesService.getMuscleGroups).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'mg-1',
          name: 'Cơ đùi trước',
          description: 'Quadriceps',
          isActive: true,
        },
      ],
    } as any)

    render(<GymCategoriesPage />)

    await waitFor(() => {
      expect(screen.queryByText('Đang tải danh mục từ máy chủ...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Nhóm cơ (1)'))

    vi.mocked(coursesExercisesService.updateMuscleGroupStatus).mockResolvedValueOnce({
      id: 'mg-1',
      name: 'Cơ đùi trước',
      isActive: false,
    })

    const pauseBtn = screen.getByRole('button', { name: /Tạm dừng/i })
    fireEvent.click(pauseBtn)

    await waitFor(() => {
      expect(coursesExercisesService.updateMuscleGroupStatus).toHaveBeenCalledWith('mg-1', {
        isActive: false,
      })
      expect(screen.getByText('Đã tạm dừng nhóm cơ "Cơ đùi trước" thành công!')).toBeInTheDocument()
    })
  })
})
