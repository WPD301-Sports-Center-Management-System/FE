import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { mealPlansService, type SuggestedMealDay } from '../services/meal-plans.service'
import { CoachMealPlanPage } from './coach-meal-plan-page'

vi.mock('@/features/coaches/services/coaches.service', () => ({ coachesService: { getMyMembers: vi.fn() } }))
vi.mock('../services/meal-plans.service', () => ({
  GOAL_TAG_LABEL: {}, foodLine: vi.fn(), mealPlansService: {
    getMealPlans: vi.fn(), getFoodItems: vi.fn(), getTemplates: vi.fn(), getCalorieSuggestion: vi.fn(),
    suggestDays: vi.fn(), createMealPlan: vi.fn(), addMealItem: vi.fn(), assignMealPlan: vi.fn(),
  },
}))
const generated = (dayNumber = 1): SuggestedMealDay[] => [{ dayNumber, calories: 1800, meals: [
  { dayNumber, mealType: 'Bữa sáng', foodName: 'Cơm + Ức gà', quantity: '1 bữa', note: 'Cơm: 150 g\nỨc gà: 100 g', estimatedCalories: 600 },
] }]
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(coachesService.getMyMembers).mockResolvedValue({ data: [{ id: 'member-1', fullName: 'Học viên An' }] } as any)
  vi.mocked(mealPlansService.getMealPlans).mockResolvedValue({ data: [] })
  vi.mocked(mealPlansService.getFoodItems).mockResolvedValue([])
  vi.mocked(mealPlansService.getTemplates).mockResolvedValue([])
  vi.mocked(mealPlansService.getCalorieSuggestion).mockResolvedValue({ suggestion: null, missing: [], weightKg: null, heightCm: null })
  vi.mocked(mealPlansService.suggestDays).mockResolvedValue(generated())
})
afterEach(cleanup)
async function open() {
  render(<MemoryRouter initialEntries={['/coach/meal-plans?memberId=member-1']}><CoachMealPlanPage /></MemoryRouter>)
  await screen.findByRole('button', { name: 'AI lên thực đơn cả tuần' })
  await screen.findByRole('option', { name: /Học viên An/ })
}

describe('coach inline AI meal editor', () => {
  it('keeps member context, generates exactly one requested day after input, and lets the coach edit the description', async () => {
    await open()
    expect(screen.getByLabelText('Học viên nhận thực đơn (Bắt buộc)')).toHaveValue('member-1')
    fireEvent.change(screen.getByLabelText('Sở thích, món kiêng / dị ứng và ghi chú sau khi trao đổi'), { target: { value: 'Không ăn tôm' } })
    fireEvent.change(screen.getByLabelText('Calo ngày 1 (kcal)'), { target: { value: '1800' } })
    fireEvent.change(screen.getByLabelText('Số bữa trong ngày'), { target: { value: '4' } })
    await waitFor(() => expect(mealPlansService.suggestDays).toHaveBeenCalledExactlyOnceWith({ memberId: 'member-1', context: 'Không ăn tôm', days: [{ dayNumber: 1, calories: 1800, mealCount: 4 }] }), { timeout: 2500 })
    const description = await screen.findByLabelText('Mô tả đồ ăn · Bữa sáng')
    fireEvent.change(description, { target: { value: 'Coach đổi thành cá: 150 g' } })
    expect(description).toHaveValue('Coach đổi thành cá: 150 g')
    expect(screen.getByRole('button', { name: /Ngày 7/ })).toBeInTheDocument()
  })

  it('does not replace coach edits with a late AI response', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'AI gợi ý lại ngày này' }))
    const description = await screen.findByLabelText('Mô tả đồ ăn · Bữa sáng')
    let resolve!: (value: SuggestedMealDay[]) => void
    vi.mocked(mealPlansService.suggestDays).mockReturnValueOnce(new Promise(r => { resolve = r }))
    fireEvent.click(screen.getByRole('button', { name: 'AI gợi ý lại ngày này' }))
    fireEvent.change(description, { target: { value: 'Nội dung coach đang sửa' } })
    await act(async () => resolve(generated()))
    expect(description).toHaveValue('Nội dung coach đang sửa')
    expect(screen.getByText(/Bạn vừa sửa nội dung trong lúc AI/)).toBeInTheDocument()
  })

  it('keeps existing content when AI fails', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'AI gợi ý lại ngày này' }))
    const description = await screen.findByLabelText('Mô tả đồ ăn · Bữa sáng')
    vi.mocked(mealPlansService.suggestDays).mockRejectedValueOnce(new Error('Unavailable'))
    fireEvent.click(screen.getByRole('button', { name: 'AI gợi ý lại ngày này' }))
    await screen.findByText(/Không tạo được gợi ý AI/)
    expect(description).toHaveValue('Cơm: 150 g\nỨc gà: 100 g')
  })
})
