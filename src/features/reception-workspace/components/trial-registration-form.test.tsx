import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { TrialRegistrationForm } from './trial-registration-form'
import { deskApi } from '../api'

vi.mock('../api', () => ({ deskApi: { trialAllowance: vi.fn(), coaches: vi.fn().mockResolvedValue([]), createTrialSession: vi.fn() } }))
beforeEach(() => vi.clearAllMocks())
it('keeps the phone editable and discards a response for a previous phone', async () => {
  let resolveOld!: (value: never) => void
  vi.mocked(deskApi.trialAllowance).mockImplementation(phone => phone === '0901234567' ? new Promise(resolve => { resolveOld = resolve }) : Promise.resolve({ phone, registeredTypes: [], gym: { canRegister: false } } as never))
  render(<TrialRegistrationForm seed={{}} onClose={vi.fn()} onDone={vi.fn()} />)
  const phone = screen.getByRole('textbox', { name: 'Số điện thoại khách' })
  fireEvent.change(phone, { target: { value: '0901234567' } })
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  expect(phone).toBeEnabled()
  fireEvent.change(phone, { target: { value: '0907654321' } })
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  await screen.findByText('0907654321')
  await act(async () => resolveOld({ phone: '0901234567', registeredTypes: [], gym: { canRegister: true } } as never))
  expect(screen.queryByText('0901234567')).toBeNull()
  expect(screen.getByRole('button', { name: 'Lưu đăng ký' })).toBeDisabled()
})
it('automatically checks a valid normalized Vietnamese phone after debounce', async () => {
  vi.mocked(deskApi.trialAllowance).mockResolvedValue({ phone: '0901234567', registeredTypes: [], gym: { canRegister: true } } as never)
  render(<TrialRegistrationForm seed={{}} onClose={vi.fn()} onDone={vi.fn()} />)
  fireEvent.change(screen.getByRole('textbox', { name: 'Số điện thoại khách' }), { target: { value: '+84 901234567' } })
  await waitFor(() => expect(deskApi.trialAllowance).toHaveBeenCalledWith('0901234567'))
  await screen.findByText('0901234567')
})
