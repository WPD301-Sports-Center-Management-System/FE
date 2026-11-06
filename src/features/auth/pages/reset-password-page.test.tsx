import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResetPasswordPage } from './reset-password-page'
import { authService } from '@/features/auth/services/auth.service'

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { resetPassword: vi.fn() },
}))

const renderPage = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <ResetPasswordPage />
  </MemoryRouter>
)

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not submit without a reset token', () => {
    renderPage('/reset-password')
    expect(screen.getByText(/Liên kết không có mã xác thực/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đặt mật khẩu mới' })).not.toBeInTheDocument()
  })

  it('validates confirmation and submits the token to BE', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({ message: 'OK' })
    renderPage('/reset-password?token=valid-reset-token')
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'new-password-123' } })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: 'different-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu xác nhận không khớp.')
    expect(authService.resetPassword).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: 'new-password-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }))
    await waitFor(() => expect(authService.resetPassword).toHaveBeenCalledWith({
      resetToken: 'valid-reset-token',
      newPassword: 'new-password-123',
    }))
    expect(await screen.findByText('Đã đặt lại mật khẩu')).toBeInTheDocument()
  })
})
