import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MemberListPage } from './member-list-page'
import { membersService } from '@/features/memberships/services/members.service'

vi.mock('@/features/memberships/services/members.service', () => ({
  membersService: {
    getMembers: vi.fn(),
    createMember: vi.fn(),
    getMemberById: vi.fn(),
    updateMember: vi.fn(),
    getMemberHistory: vi.fn(),
    getMemberProgress: vi.fn(),
  },
}))

const mockMembersList = [
  {
    id: 'mem-1',
    memberCode: 'MEM-001',
    fullName: 'Lê Văn Hội Viên',
    phone: '0912345678',
    email: 'levan@gym.local',
    fitnessLevel: 'BEGINNER',
    user: {
      id: 'usr-1',
      fullName: 'Lê Văn Hội Viên',
      email: 'levan@gym.local',
      phone: '0912345678',
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  },
]

describe('MemberListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(membersService.getMembers).mockResolvedValue({
      success: true,
      message: 'Thành công.',
      data: mockMembersList as any,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    })
  })

  it('renders member list page and loads data', async () => {
    render(
      <MemoryRouter>
        <MemberListPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Danh Sách Hội Viên/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Lê Văn Hội Viên')).toBeInTheDocument()
      expect(screen.getByText('MEM-001')).toBeInTheDocument()
    })
  })

  it('opens register modal and registers a new member', async () => {
    vi.mocked(membersService.createMember).mockResolvedValueOnce({
      member: {
        id: 'mem-2',
        userId: 'usr-2',
        memberCode: 'MEM-002',
        fullName: 'Nguyễn Thị Hoa',
        createdAt: '2026-10-10T00:00:00Z',
      } as any,
      user: {
        id: 'usr-2',
        fullName: 'Nguyễn Thị Hoa',
        email: 'hoa@gym.local',
        phone: '0988776655',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
      temporaryPassword: 'TempMemberPass123',
    })

    render(
      <MemoryRouter>
        <MemberListPage />
      </MemoryRouter>
    )

    const addBtn = screen.getByRole('button', { name: /Đăng ký hội viên mới/i })
    fireEvent.click(addBtn)

    expect(screen.getByRole('heading', { name: /Đăng Ký Hồ Sơ Hội Viên Mới/i })).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('Ví dụ: Nguyễn Văn An')
    const phoneInput = screen.getByPlaceholderText('0987654321')

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Thị Hoa' } })
    fireEvent.change(phoneInput, { target: { value: '0988776655' } })

    const submitBtn = screen.getByRole('button', { name: /Đăng ký ngay/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(membersService.createMember).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Nguyễn Thị Hoa',
          phone: '0988776655',
        })
      )
      expect(screen.getByText('MEM-002')).toBeInTheDocument()
      expect(screen.getByText('TempMemberPass123')).toBeInTheDocument()
    })
  })

  it('opens member details modal and loads history & progress', async () => {
    vi.mocked(membersService.getMemberById).mockResolvedValueOnce({
      id: 'mem-1',
      memberCode: 'MEM-001',
      fullName: 'Lê Văn Hội Viên',
      phone: '0912345678',
      email: 'levan@gym.local',
      dateOfBirth: '1995-01-01',
      gender: 'MALE',
      address: 'Hà Nội',
      fitnessLevel: 'BEGINNER',
      createdAt: '2026-10-09T00:00:00Z',
      user: {
        id: 'usr-1',
        fullName: 'Lê Văn Hội Viên',
        email: 'levan@gym.local',
        phone: '0912345678',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    } as any)

    vi.mocked(membersService.getMemberHistory).mockResolvedValueOnce({
      bookings: [
        {
          id: 'b-1',
          courseName: 'Boxing 1:1',
          coachName: 'Coach Hải',
          startsAt: '2026-10-10T10:00:00Z',
          status: 'COMPLETED',
        } as any,
      ],
      assessments: [],
      results: [],
    })

    vi.mocked(membersService.getMemberProgress).mockResolvedValueOnce({
      assessments: [
        {
          id: 'a-1',
          assessedAt: '2026-10-10T00:00:00Z',
          weightKg: '72',
          heightCm: '175',
          bodyFatPercent: '18',
          muscleMassKg: '34',
        } as any,
      ],
      results: [],
      goals: [],
    })

    render(
      <MemoryRouter>
        <MemberListPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Lê Văn Hội Viên')).toBeInTheDocument()
    })

    const detailBtn = screen.getByRole('button', { name: /Hồ sơ/i })
    fireEvent.click(detailBtn)

    await waitFor(() => {
      expect(membersService.getMemberById).toHaveBeenCalledWith('mem-1')
      expect(screen.getByText(/Thông tin cá nhân/i)).toBeInTheDocument()
    })

    // Click History tab
    const historyTab = screen.getByRole('button', { name: /Lịch sử tập luyện/i })
    fireEvent.click(historyTab)

    await waitFor(() => {
      expect(screen.getByText('Boxing 1:1')).toBeInTheDocument()
      expect(screen.getByText(/Coach Hải/i)).toBeInTheDocument()
    })

    // Click Progress tab
    const progressTab = screen.getByRole('button', { name: /Tiến độ & Mục tiêu/i })
    fireEvent.click(progressTab)

    await waitFor(() => {
      expect(screen.getByText(/72 kg/i)).toBeInTheDocument()
    })
  })
})
