import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WalletPage, WithdrawalsPanel } from './wallet-page'
import { walletApi, type CoachWallet, type Withdrawal } from '../wallet-api'
vi.mock('../wallet-api', async original => ({ ...await original<typeof import('../wallet-api')>(), walletApi: { mine: vi.fn(), list: vi.fn(), request: vi.fn(), paid: vi.fn(), reject: vi.fn() } }))
const request: Withdrawal = { id: 'w1', code: 'WD-1', coachId: 'c', amount: 50000, status: 'REQUESTED', bankName: 'ACB', accountNumber: '01234567', accountName: 'NGUYEN AN', createdAt: '2026-11-08T03:00:00Z', coach: { user: { fullName: 'Coach An' } }, coachAvailable: 0 }
const wallet: CoachWallet = { available: 150000, accruing: 200000, requested: 0, withdrawn: 0, earned: 150000, balance: 150000, packages: [], withdrawals: [] }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(walletApi.mine).mockResolvedValue(wallet); vi.mocked(walletApi.list).mockResolvedValue([request]); vi.mocked(walletApi.request).mockResolvedValue(request); vi.mocked(walletApi.paid).mockResolvedValue({ ...request, status: 'PAID' }) })
describe('wallet → request → transfer', () => {
  it('allows a partial withdrawal with bank information on the same screen', async () => {
    render(<MemoryRouter><WalletPage /></MemoryRouter>)
    fireEvent.change(await screen.findByLabelText(/Số tiền muốn rút/), { target: { value: '50000' } })
    for (const [label, value] of [['Ngân hàng', 'ACB'], ['Số tài khoản', '01234567'], ['Chủ tài khoản', 'NGUYEN AN']]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu rút tiền' }))
    await waitFor(() => expect(walletApi.request).toHaveBeenCalledWith({ amount: 50000, bankName: 'ACB', accountNumber: '01234567', accountName: 'NGUYEN AN' }))
  })
  it('shows the pending request instead of allowing a duplicate', async () => {
    vi.mocked(walletApi.mine).mockResolvedValue({ ...wallet, requested: 50000, withdrawals: [request] })
    render(<MemoryRouter><WalletPage /></MemoryRouter>)
    expect(await screen.findByText('Yêu cầu đã gửi')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gửi yêu cầu rút tiền' })).not.toBeInTheDocument()
  })
  it('requires transfer evidence and pays directly without an approval stage', async () => {
    render(<MemoryRouter><WithdrawalsPanel /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Xử lý chuyển khoản' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('01234567')).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Xác nhận đã chuyển tiền' })).toBeDisabled()
    fireEvent.change(dialog.getByLabelText(/Mã giao dịch đã chuyển/), { target: { value: 'BANK-1' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Xác nhận đã chuyển tiền' }))
    await waitFor(() => expect(walletApi.paid).toHaveBeenCalledWith('w1', 'BANK-1'))
  })
  it('blocks transfer when the server reports a balance shortfall and still permits rejection', async () => {
    vi.mocked(walletApi.list).mockResolvedValue([{ ...request, coachAvailable: -50000 }])
    render(<MemoryRouter><WithdrawalsPanel /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Xử lý chuyển khoản' }))
    fireEvent.change(screen.getByLabelText(/Mã giao dịch đã chuyển/), { target: { value: 'BANK-1' } })
    expect(screen.getByRole('button', { name: 'Xác nhận đã chuyển tiền' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối yêu cầu' }))
    fireEvent.change(screen.getByLabelText(/Lý do từ chối/), { target: { value: 'Số dư đã thay đổi' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lý do từ chối' }))
    await waitFor(() => expect(walletApi.reject).toHaveBeenCalledWith('w1', 'Số dư đã thay đổi'))
  })
})
