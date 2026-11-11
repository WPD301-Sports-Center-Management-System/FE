import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { mealPlansService, type SuggestedMealDay } from '../services/meal-plans.service'
import { CoachMealPlanPage } from './coach-meal-plan-page'

vi.mock('@/features/coaches/services/coaches.service', () => ({ coachesService: { getMyMembers: vi.fn() } }))
vi.mock('../services/meal-plans.service', () => ({
  foodLine: vi.fn(), mealPlansService: {
    getMealPlans: vi.fn(), getMealPlanById: vi.fn(), getFoodItems: vi.fn(), getTemplates: vi.fn(), getCalorieSuggestion: vi.fn(),
    suggestDays: vi.fn(), createMealPlan: vi.fn(), updateMealPlan: vi.fn(), addMealItem: vi.fn(), assignMealPlan: vi.fn(),
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
async function open(url = '/coach/meal-plans?memberId=member-1') {
  render(<MemoryRouter initialEntries={[url]}><CoachMealPlanPage /></MemoryRouter>)
  if (url.includes('memberId')) await screen.findByRole('option', { name: /Học viên An/ })
}
async function createDay() {
  await open()
  fireEvent.change(screen.getByLabelText('Phạm vi soạn'), { target: { value: 'day' } })
  fireEvent.click(screen.getByRole('button', { name: 'Soạn bằng AI' }))
  await screen.findByRole('button', { name: 'Sửa món Cơm + Ức gà' })
}
async function regenerate() {
  fireEvent.click(screen.getByRole('button', { name: 'Soạn bằng AI' }))
  const dialog = within(await screen.findByRole('dialog'))
  fireEvent.click(dialog.getByRole('button', { name: 'Soạn lại' }))
}

describe('Coach meal workflow', () => {
  it('changes settings without running AI and only generates the selected scope on request', async () => {
    await open()
    expect(screen.getByLabelText('Học viên')).toHaveValue('member-1')
    fireEvent.change(screen.getByLabelText('Sở thích và lưu ý ăn uống'), { target: { value: 'Không ăn tôm' } })
    fireEvent.change(screen.getByLabelText('Năng lượng ngày 1 (kcal)'), { target: { value: '1800' } })
    fireEvent.change(screen.getByLabelText('Số bữa trong ngày'), { target: { value: '4' } })
    expect(mealPlansService.suggestDays).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Phạm vi soạn'), { target: { value: 'day' } })
    fireEvent.click(screen.getByRole('button', { name: 'Soạn bằng AI' }))
    await waitFor(() => expect(mealPlansService.suggestDays).toHaveBeenCalledExactlyOnceWith({ memberId: 'member-1', context: 'Không ăn tôm', days: [{ dayNumber: 1, calories: 1800, mealCount: 4 }] }))
    expect(screen.getByText(/Cơm: 150 g/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Ghi chú món ăn' })).not.toBeInTheDocument()
  })

  it('edits a meal in one form and retains Coach edits when a late AI response arrives', async () => {
    await createDay()
    let resolve!: (value: SuggestedMealDay[]) => void
    vi.mocked(mealPlansService.suggestDays).mockReturnValueOnce(new Promise(r => { resolve = r }))
    await regenerate()
    fireEvent.click(screen.getByRole('button', { name: 'Sửa món Cơm + Ức gà' }))
    fireEvent.change(screen.getByLabelText('Ghi chú món ăn'), { target: { value: 'Nội dung Coach đang sửa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu món ăn' }))
    await act(async () => resolve(generated()))
    expect(screen.getByText('Nội dung Coach đang sửa')).toBeInTheDocument()
    expect(screen.getByText(/Bạn vừa sửa nội dung trong lúc AI/)).toBeInTheDocument()
  })

  it('asks before replacing meals and preserves them when AI fails', async () => {
    await createDay()
    vi.mocked(mealPlansService.suggestDays).mockRejectedValueOnce(new Error('Unavailable'))
    fireEvent.click(screen.getByRole('button', { name: 'Soạn bằng AI' }))
    expect(mealPlansService.suggestDays).toHaveBeenCalledTimes(1)
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Soạn lại' }))
    await screen.findByText(/Không tạo được gợi ý AI/)
    expect(screen.getByText(/Cơm: 150 g/)).toBeInTheDocument()
  })

  it('saves and assigns a one-day plan directly from the editor', async () => {
    vi.mocked(mealPlansService.createMealPlan).mockResolvedValue({ id: 'plan' } as never)
    vi.mocked(mealPlansService.addMealItem).mockResolvedValue({ id: 'item' })
    await createDay()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu và giao thực đơn' }))
    await waitFor(() => expect(mealPlansService.assignMealPlan).toHaveBeenCalledWith('plan'))
    expect(mealPlansService.createMealPlan).toHaveBeenCalledWith(expect.objectContaining({ memberId: 'member-1', repeatWeekly: false, title: 'Thực đơn dinh dưỡng' }))
    expect(mealPlansService.addMealItem).toHaveBeenCalledWith('plan', expect.objectContaining({ foodName: 'Cơm + Ức gà', note: 'Cơm: 150 g\nỨc gà: 100 g' }))
  })

  it('opens a saved AI draft directly through its plan link', async () => {
    vi.mocked(mealPlansService.getMealPlanById).mockResolvedValue({ id: 'saved', memberId: 'member-1', title: 'Thực đơn AI đã lưu', status: 'DRAFT', startDate: '2026-11-11', items: [] } as never)
    await open('/coach/meal-plans?tab=plans&planId=saved')
    expect(await screen.findByLabelText('Tên thực đơn')).toHaveValue('Thực đơn AI đã lưu')
    expect(screen.getByLabelText('Học viên')).toBeDisabled()
    expect(mealPlansService.getMealPlanById).toHaveBeenCalledTimes(1)
  })
  it('opens the template selected in the library without asking the Coach to select it again', async () => {
    vi.mocked(mealPlansService.getTemplates).mockResolvedValue([{ id: 'template', title: 'Thực đơn tăng cơ', isActive: true, dayCount: 7 }] as never)
    await open('/coach/meal-plans?tab=plans&templateId=template')
    await screen.findByRole('option', { name: 'Thực đơn tăng cơ · 7 ngày' })
    expect(screen.getByRole('combobox', { name: 'Mẫu thực đơn' })).toHaveValue('template')
    expect(screen.getByRole('button', { name: 'Dùng mẫu này' })).toBeDisabled()
    await screen.findByRole('option', { name: /Học viên An/ })
    fireEvent.change(screen.getByLabelText('Học viên'), { target: { value: 'member-1' } })
    expect(screen.getByRole('button', { name: 'Dùng mẫu này' })).toBeEnabled()
  })
})
