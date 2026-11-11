import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AppApiError } from '@/shared/api/api-error'
import { MealLibraryPage } from './meal-library-page'
import { mealPlansService } from '../services/meal-plans.service'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/meal-plans.service', () => ({
  GOAL_TAG_LABEL: {}, foodLine: vi.fn(),
  mealPlansService: { getTemplates: vi.fn(), getTemplate: vi.fn(), getFoodItems: vi.fn(), deleteTemplate: vi.fn(), deleteFoodItem: vi.fn(), setTemplateActive: vi.fn(), updateFoodItem: vi.fn() },
}))
vi.mock('./coach-meal-plan-page', () => ({ MEAL_TYPES: ['Sáng', 'Trưa', 'Tối'] }))

const template = { id: 't-1', title: 'Giảm mỡ 1800', scope: 'CENTER', isActive: true, dailyCalorieTarget: 1800, dayCount: 7, goalTag: null, description: null }
const food = { id: 'f-1', name: 'Ức gà', category: 'Đạm', servingLabel: '100 g', calories: 165, proteinGrams: '31', carbsGrams: '0', fatGrams: '3.6', isActive: true }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(mealPlansService.getTemplates).mockResolvedValueOnce([template] as never).mockResolvedValue([])
  vi.mocked(mealPlansService.getFoodItems).mockResolvedValueOnce([food] as never).mockResolvedValue([])
})

describe('MealLibraryPage delete (Manager)', () => {
  it('deletes a center template after confirmation and reloads', async () => {
    vi.mocked(mealPlansService.deleteTemplate).mockResolvedValue(undefined)
    render(<MemoryRouter><MealLibraryPage manager /></MemoryRouter>)
    expect(await screen.findByRole('button', { name: 'Ẩn mẫu' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xóa mẫu Giảm mỡ 1800' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('“Giảm mỡ 1800”')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(mealPlansService.deleteTemplate).toHaveBeenCalledWith('t-1'))
    await waitFor(() => expect(screen.queryByText('Giảm mỡ 1800')).toBeNull())
  })

  it('a Coach never sees a delete button on templates', async () => {
    render(<MemoryRouter initialEntries={['/coach/meal-plans?tab=templates&memberId=member']}><MealLibraryPage /></MemoryRouter>)
    await screen.findByText('Giảm mỡ 1800')
    expect(screen.queryByRole('button', { name: /Xóa mẫu/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'Dùng mẫu' })).toHaveAttribute('href', '/coach/meal-plans?tab=plans&templateId=t-1&memberId=member')
  })

  it('deletes a food from the library; BE refusal keeps it and suggests hiding', async () => {
    vi.mocked(mealPlansService.deleteFoodItem)
      .mockRejectedValueOnce(new AppApiError(409, { code: 'IN_USE', message: 'Món "Ức gà" đang được dùng trong 1 mẫu thực đơn đang bật. Hãy chọn Ẩn món thay vì xóa.' } as never))
      .mockResolvedValueOnce(undefined)
    render(<MemoryRouter><MealLibraryPage manager /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('tab', { name: /Thư viện món/ }).catch(() => screen.getByText(/Thư viện món/)))
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa khỏi thư viện: Ức gà' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Hãy chọn Ẩn món')
    expect(mealPlansService.deleteFoodItem).toHaveBeenCalledTimes(1)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' })) // retry succeeds
    await waitFor(() => expect(mealPlansService.deleteFoodItem).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByText('Ức gà')).toBeNull())
  })
})
