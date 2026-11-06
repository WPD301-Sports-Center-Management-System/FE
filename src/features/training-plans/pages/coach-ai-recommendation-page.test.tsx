import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coachWs } from '@/features/coach-workspace/api'
import { aiRecommendationsService as ai, type AiRecommendation } from '../services/ai-recommendations.service'
import { CoachAiRecommendationPage } from './coach-ai-recommendation-page'

vi.mock('@/features/coach-workspace/api', () => ({ coachWs: { members: vi.fn(), purchases: vi.fn(), exercises: vi.fn() } }))
vi.mock('../services/ai-recommendations.service', () => ({
  AI_KIND_LABEL: { TRAINING_PLAN: 'Giáo án', MEAL_PLAN: 'Thực đơn', PROGRESS_SUMMARY: 'Tiến độ' },
  aiRecommendationsService: { status: vi.fn(), getRecommendations: vi.fn(), createRecommendation: vi.fn(), updateRecommendation: vi.fn(), approveRecommendation: vi.fn() },
}))
const draft = (): AiRecommendation => ({ id: 'draft', kind: 'TRAINING_PLAN', memberId: 'member', coachId: 'coach', status: 'DRAFT', createdAt: '2026-11-07',
  generatedContent: { title: 'Sức bền', goal: 'Tập nhẹ', exercises: [{ exerciseId: 'walk', name: 'Đi bộ', durationMinutes: 10 }, { exerciseId: 'squat', name: 'Squat', sets: 3, reps: 12 }] },
})
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ai.status).mockResolvedValue({ configured: true, provider: 'gemini', model: 'test' })
  vi.mocked(ai.getRecommendations).mockResolvedValue([])
  vi.mocked(ai.createRecommendation).mockResolvedValue(draft())
  vi.mocked(ai.approveRecommendation).mockResolvedValue({ ...draft(), status: 'APPROVED', sessionTemplateId: 'template' })
  vi.mocked(ai.updateRecommendation).mockImplementation(async (_, editedContent) => ({ ...draft(), editedContent }))
  vi.mocked(coachWs.members).mockResolvedValue([{ id: 'member', memberCode: 'HV01', fullName: 'An' }])
  vi.mocked(coachWs.purchases).mockResolvedValue([{ id: 'package', memberId: 'member', status: 'ACTIVE', packageNameSnapshot: 'PT 12 buổi' }] as any)
  vi.mocked(coachWs.exercises).mockResolvedValue([{ id: 'bike', name: 'Đạp xe' }])
})
afterEach(cleanup)
async function open() {
  render(<MemoryRouter initialEntries={['/coach/library?tab=ai&memberId=member']}><CoachAiRecommendationPage kind="TRAINING_PLAN" /></MemoryRouter>)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tạo bản nháp' })).toBeEnabled())
}
async function generate() {
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Tạo bản nháp' }))
  await screen.findByLabelText('Phút Đi bộ')
}
describe('AI session planning workflow', () => {
  it('uses member context, the actual default package and profile goals without typing', async () => {
    await open()
    fireEvent.change(screen.getByLabelText('Thời lượng buổi tập'), { target: { value: '45' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bản nháp' }))
    await waitFor(() => expect(ai.createRecommendation).toHaveBeenCalledWith(expect.objectContaining({ memberId: 'member', ptPurchaseId: 'package', durationMinutes: 45, goal: undefined })))
  })
  it('saves edits before approval and links directly to the created template', async () => {
    await generate()
    fireEvent.change(screen.getByLabelText('Phút Đi bộ'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đưa Squat lên' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào thư viện giáo án' }))
    await screen.findByText(/Đã lưu vào thư viện/)
    expect(vi.mocked(ai.updateRecommendation).mock.calls[0][1]).toMatchObject({ exercises: [{ exerciseId: 'squat' }, { exerciseId: 'walk', durationMinutes: 15 }] })
    expect(ai.approveRecommendation).toHaveBeenCalledExactlyOnceWith('draft', { publish: undefined })
    expect(screen.getByRole('link', { name: 'Mở giáo án vừa lưu' })).toHaveAttribute('href', '/coach/library?tab=templates&templateId=template')
  })
  it('keeps edits and does not approve when saving fails', async () => {
    await generate()
    vi.mocked(ai.updateRecommendation).mockRejectedValueOnce(new Error('Không lưu được'))
    fireEvent.change(screen.getByLabelText('Phút Đi bộ'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào thư viện giáo án' }))
    await screen.findByText('Không lưu được')
    expect(ai.approveRecommendation).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Phút Đi bộ')).toHaveValue(20)
  })
  it('adds only library exercises and preserves their editable fields', async () => {
    await generate()
    await screen.findByRole('option', { name: 'Đạp xe' })
    fireEvent.change(screen.getByLabelText('Thêm bài từ thư viện'), { target: { value: 'bike' } })
    expect(screen.getByLabelText('Hiệp Đạp xe')).toHaveValue(3)
    expect(screen.queryByRole('option', { name: 'Đạp xe' })).not.toBeInTheDocument()
  })
})
