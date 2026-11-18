import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WalletPage, WithdrawalsPanel } from './wallet-page'
import { walletApi, type CoachWallet, type Withdrawal } from '../wallet-api'
vi.mock('../wallet-api', async original => ({ ...await original<typeof import('../wallet-api')>(), walletApi: { mine: vi.fn(), list: vi.fn(), request: vi.fn(), paid: vi.fn(), reject: vi.fn() } }))
const request: Withdrawal = { id: 'w1', code: 'WD-1', coachId: 'c', amount: 50000, status: 'REQUESTED', bankName: 'ACB', accountNumber: '01234567', accountName: 'NGUYEN AN', createdAt: '2026-11-08T03:00:00Z', coach: { user: { fullName: 'Coach An' } }, coachAvailable: 0, coverable: 50000, shortfall: 0, transferAllowed: true, allowedActions: ['TRANSFER','MARK_PAID','REJECT'] }
const wallet: CoachWallet = { available: 150000, ledger: 150000, unverified: 0, reserved: 0, paid: 0, recovery: 0, balance: 150000, packages: [], withdrawals: [] }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(walletApi.mine).mockResolvedValue(wallet); vi.mocked(walletApi.list).mockResolvedValue([request]); vi.mocked(walletApi.request).mockResolvedValue(request); vi.mocked(walletApi.paid).mockResolvedValue({ ...request, status: 'PAID' }) })
const renderWallet = () => render(<MemoryRouter><WalletPage /></MemoryRouter>)
async function openManager() { render(<MemoryRouter><WithdrawalsPanel /></MemoryRouter>); fireEvent.click(await screen.findByRole('button', { name: 'Xử lý yêu cầu' })); return within(screen.getByRole('dialog')) }
function fillBank() { for (const [label, value] of [['Ngân hàng', 'ACB'], ['Số tài khoản', '01234567'], ['Chủ tài khoản', 'NGUYEN AN']]) fireEvent.change(screen.getByLabelText(label), { target: { value } }) }

describe('V3 coach income and withdrawal', () => {
  it('withdraws from ACTIVE income with a request key and no package completion gate', async () => {
    vi.mocked(walletApi.mine).mockResolvedValue({ ...wallet, packages: [{purchaseId:'p1',purchaseCode:'PT-1',packageNameSnapshot:'PT Starter',purchaseStatus:'ACTIVE',earned:150000,awaitingDecision:0}] })
    renderWallet()
    fireEvent.change(await screen.findByLabelText('Số tiền muốn rút'), { target: { value: '50000' } }); fillBank()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu rút tiền' }))
    await waitFor(() => expect(walletApi.request).toHaveBeenCalledWith({ amount: 50000, bankName: 'ACB', accountNumber: '01234567', accountName: 'NGUYEN AN', requestKey: expect.any(String) }))
    expect(screen.queryByText(/gói đã kết thúc mới|Đang tích lũy/)).not.toBeInTheDocument()
  })
  it('prefills the last account and all available money so a repeat withdrawal takes one submit', async () => {
    vi.mocked(walletApi.mine).mockResolvedValue({ ...wallet, withdrawals: [{ ...request, status: 'PAID' }] })
    renderWallet()
    expect(await screen.findByDisplayValue('150000')).toBeInTheDocument()
    expect(screen.queryByLabelText('Ngân hàng')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu rút tiền' }))
    await waitFor(() => expect(walletApi.request).toHaveBeenCalledWith(expect.objectContaining({ amount: 150000, bankName: 'ACB' })))
  })
  it('reuses the same request key after a lost response and prevents a double submit', async () => {
    vi.mocked(walletApi.request).mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValueOnce(request)
    renderWallet(); await screen.findByLabelText('Số tiền muốn rút'); fillBank()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu rút tiền' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu rút tiền' }))
    await waitFor(() => expect(walletApi.request).toHaveBeenCalledTimes(2))
    expect(vi.mocked(walletApi.request).mock.calls[0]?.[0]).toEqual(vi.mocked(walletApi.request).mock.calls[1]?.[0])
  })
  it('keeps a REQUESTED withdrawal open even when more money is available', async () => {
    vi.mocked(walletApi.mine).mockResolvedValue({ ...wallet, reserved: 50000, withdrawals: [request] })
    renderWallet()
    expect(await screen.findByText(/Có thể gửi yêu cầu tiếp theo khi yêu cầu này hoàn tất/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gửi yêu cầu rút tiền' })).not.toBeInTheDocument()
  })
  it('shows recovery as a deduction from future earnings without a negative available amount', async () => {
    vi.mocked(walletApi.mine).mockResolvedValue({...wallet,available:0,recovery:50000})
    renderWallet(); expect(await screen.findByText(/Cần bù trừ/)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name:'Gửi yêu cầu rút tiền'})).not.toBeInTheDocument()
  })
})
describe('V3 Manager transfer decisions', () => {
  it('leaves an uncertain bank transfer pending without sending a mutation', async () => {
    const d = await openManager()
    fireEvent.click(d.getByText('Đóng', { selector: 'button', exact: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(walletApi.paid).not.toHaveBeenCalled()
    expect(walletApi.reject).not.toHaveBeenCalled()
  })
  it('requires a bank reference and marks paid directly', async () => {
    const d=await openManager()
    expect(d.getByText('01234567')).toBeInTheDocument()
    expect(d.queryByRole('button', { name: 'Chưa rõ — giữ chờ' })).not.toBeInTheDocument()
    expect(d.queryByRole('button', { name: 'Đã chuyển tiền' })).not.toBeInTheDocument()
    expect(d.queryByRole('button', { name: 'Chưa chuyển / thất bại' })).not.toBeInTheDocument()
    expect(d.queryByLabelText('Lý do từ chối')).not.toBeInTheDocument()
    expect(d.getByRole('button',{name:'Xác nhận đã chuyển tiền'})).toBeDisabled()
    fireEvent.change(d.getByLabelText('Mã giao dịch đã chuyển'),{target:{value:'BANK-1'}})
    fireEvent.click(d.getByRole('button',{name:'Xác nhận đã chuyển tiền'}))
    await waitFor(()=>expect(walletApi.paid).toHaveBeenCalledWith('w1',{transferRef:'BANK-1'}))
  })
  it('rejects with a written reason when the money was not transferred', async () => {
    const d=await openManager()
    fireEvent.click(d.getByRole('button',{name:'Từ chối yêu cầu'}))
    expect(walletApi.reject).not.toHaveBeenCalled()
    expect(d.getByRole('button',{name:'Từ chối và thông báo Coach'})).toBeDisabled()
    fireEvent.change(d.getByLabelText('Lý do từ chối'),{target:{value:'Chuyển thất bại'}})
    fireEvent.click(d.getByRole('button',{name:'Từ chối và thông báo Coach'}))
    await waitFor(()=>expect(walletApi.reject).toHaveBeenCalledWith('w1',{reason:'Chuyển thất bại'}))
  })
  it('uses the server shortfall as a hint: no transfer instruction, rejection allowed, an already sent transfer is recorded as is', async () => {
    vi.mocked(walletApi.list).mockResolvedValue([{...request,coachAvailable:0,transferAllowed:false,coverable:10000,shortfall:40000,actionReason:'ENTITLEMENT_REDUCED',allowedActions:['MARK_PAID','REJECT']}])
    const d=await openManager()
    expect(d.queryByText(/Chuyển đúng số tiền/)).not.toBeInTheDocument()
    expect(d.getByText(/phần vượt sẽ được trừ vào thu nhập sau/)).toBeInTheDocument()
    expect(d.queryByRole('checkbox')).not.toBeInTheDocument()
    fireEvent.change(d.getByLabelText('Mã giao dịch đã chuyển'),{target:{value:'BANK-SHORT'}})
    fireEvent.click(d.getByRole('button',{name:'Xác nhận đã chuyển tiền'}))
    await waitFor(()=>expect(walletApi.paid).toHaveBeenCalledWith('w1',{transferRef:'BANK-SHORT'}))
  })
})
