import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { ChangePasswordPage } from './change-password-page'
import { authService } from '../services/auth.service'

const logout = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('../context/auth-context', () => ({ useAuth: () => ({ role: 'MANAGER', logout }) }))
vi.mock('../services/auth.service', () => ({ authService: { changePassword: vi.fn().mockResolvedValue({ message: 'OK' }) } }))
beforeEach(() => vi.clearAllMocks())
function show() {
  render(<MemoryRouter initialEntries={['/account/change-password']}><Routes><Route path="/account/change-password" element={<ChangePasswordPage />} /><Route path="/login" element={<h1>Đăng nhập lại</h1>} /></Routes></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'Password123' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'NewPassword123' } })
}
it('rejects a mismatched confirmation without sending a password mutation', async () => {
  show()
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: 'WrongPassword123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }))
  await screen.findByRole('alert')
  expect(authService.changePassword).not.toHaveBeenCalled()
})
it('uses the existing change API and ends the local session after success', async () => {
  show()
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: 'NewPassword123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }))
  await screen.findByRole('heading', { name: 'Đăng nhập lại' })
  expect(authService.changePassword).toHaveBeenCalledWith({ currentPassword: 'Password123', newPassword: 'NewPassword123' })
  await waitFor(() => expect(logout).toHaveBeenCalledOnce())
})
