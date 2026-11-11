import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coachWs } from '@/features/coach-workspace/api'
import { aiRecommendationsService as ai, type AiRecommendation } from '../services/ai-recommendations.service'
import { CoachAiRecommendationPage } from './coach-ai-recommendation-page'
import { fixedPtApi } from '@/features/fixed-pt/api'

vi.mock('@/features/coach-workspace/api', () => ({ coachWs: { members: vi.fn(), purchases: vi.fn(), exercises: vi.fn(), applyTemplate: vi.fn() } }))
vi.mock('@/features/fixed-pt/api', () => ({ fixedPtApi: { purchaseSessions: vi.fn() } }))
vi.mock('../services/ai-recommendations.service', () => ({
  AI_KIND_LABEL: { TRAINING_PLAN: 'Giáo án', MEAL_PLAN: 'Thực đơn', PROGRESS_SUMMARY: 'Tiến độ' },
  aiRecommendationsService: { status: vi.fn(), getRecommendations: vi.fn(), createRecommendation: vi.fn(), updateRecommendation: vi.fn(), approveRecommendation: vi.fn() },
}))
const draft = (): AiRecommendation => ({ id: 'draft', kind: 'TRAINING_PLAN', memberId: 'member', coachId: 'coach', status: 'DRAFT', createdAt: '2026-11-07',
  generatedContent: { title: 'Sức bền', goal: 'Tập nhẹ', exercises: [{ exerciseId: 'walk', name: 'Đi bộ', durationMinutes: 10 }, { exerciseId: 'squat', name: 'Squat', sets: 3, reps: 12 }] },
})
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(fixedPtApi.purchaseSessions).mockResolvedValue([])
  vi.mocked(coachWs.applyTemplate).mockResolvedValue({})
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
  it('keeps old meal drafts accessible without a second creation form and opens the approved plan directly', async () => {
    const meal = { ...draft(), kind: 'MEAL_PLAN', generatedContent: { title: 'Thực đơn cũ', dailyCalorieTarget: 1800, averageDailyKcal: 1800, days: [{ dayNumber: 1, meals: [] }] } } as AiRecommendation
    vi.mocked(ai.getRecommendations).mockResolvedValue([meal])
    vi.mocked(ai.approveRecommendation).mockResolvedValue({ ...meal, status: 'APPROVED', mealPlanId: 'saved-meal' })
    render(<MemoryRouter><CoachAiRecommendationPage kind="MEAL_PLAN" historyOnly /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /Thực đơn cũ/ }))
    expect(screen.queryByRole('button', { name: 'Tạo bản nháp' })).not.toBeInTheDocument()
    expect(ai.status).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thực đơn nháp' }))
    expect(await screen.findByRole('link', { name: 'Mở thực đơn để kiểm tra và giao' })).toHaveAttribute('href', '/coach/meal-plans?tab=plans&planId=saved-meal')
  })
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
  it('keeps weight, rest, RPE and instructions when the Coach reviews and approves an AI plan', async () => {
    const rec = draft()
    rec.generatedContent = { title: 'Squat', goal: 'Tăng sức mạnh', exercises: [{ exerciseId: 'squat', name: 'Squat', sets: 4, reps: 8, targetWeight: 12.5, restSeconds: 90, rpe: '7', instructions: 'Giữ lưng thẳng' }] }
    vi.mocked(ai.createRecommendation).mockResolvedValue(rec)
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bản nháp' }))
    expect(await screen.findByLabelText('Khối lượng Squat')).toHaveValue(12.5)
    expect(screen.getByLabelText('Nghỉ Squat')).toHaveValue(90)
    expect(screen.getByLabelText('RPE Squat')).toHaveValue('7')
    fireEvent.change(screen.getByLabelText('RPE Squat'), { target: { value: '7–8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào thư viện giáo án' }))
    await waitFor(() => expect(ai.updateRecommendation).toHaveBeenCalledWith('draft', expect.objectContaining({ exercises: [expect.objectContaining({ sets: 4, reps: 8, targetWeight: 12.5, restSeconds: 90, rpe: '7–8', instructions: 'Giữ lưng thẳng' })] })))
  })
  it('keeps an approved template available for retry when attaching it to a session fails', async () => {
    vi.mocked(fixedPtApi.purchaseSessions).mockResolvedValue([{ id: 'session', status: 'CONFIRMED', startsAt: '2026-11-12T03:00:00Z', content: null }] as never)
    vi.mocked(coachWs.applyTemplate).mockRejectedValueOnce(new Error('Không gắn được giáo án'))
    await generate()
    fireEvent.click(await screen.findByRole('button', { name: 'Lưu và dùng cho buổi tập' }))
    await screen.findByText('Không gắn được giáo án')
    expect(ai.approveRecommendation).toHaveBeenCalledTimes(1)
    expect(coachWs.applyTemplate).toHaveBeenCalledWith('session', 'template')
    expect(screen.getByRole('button', { name: 'Dùng cho buổi tập' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Mở giáo án vừa lưu' })).toBeInTheDocument()
  })
})
