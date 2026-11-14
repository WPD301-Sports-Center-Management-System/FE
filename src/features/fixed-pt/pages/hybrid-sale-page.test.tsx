import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HybridSalePage } from './hybrid-sale-page'
import { hybridGet } from '../hybrid-api'
import { seriesApi } from '../series-api'
import { counterPayment } from '@/features/workspace/counter-payment'
import { deskApi } from '@/features/reception-workspace/api'
import { beReholdSchema } from '@/test/be-rehold-schema'
import { AppApiError } from '@/shared/api/api-error'
vi.mock('@/features/reception-workspace/api', () => ({ deskApi: { member: vi.fn(), members: vi.fn() } }))
vi.mock('../hybrid-api', () => ({ hybridGet: vi.fn() }))
vi.mock('../series-api', () => ({ seriesApi: { order: vi.fn(), patterns: vi.fn(), preview: vi.fn(), checkout: vi.fn(), rehold: vi.fn() } }))
vi.mock('@/features/workspace/counter-payment', () => ({ counterPayment: vi.fn() }))
const auth = vi.hoisted(() => ({ role: 'RECEPTIONIST' as string }))
vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: () => ({ role: auth.role, user: { fullName: 'Học viên', memberProfilesUserId: { id: 'member' } } }) }))
const pattern = [1, 3, 5].map(weekday => ({ weekday, startTime: '18:00' }))
const preview = { items: [{ startsAt: '2026-12-07T11:00:00Z', endsAt: '2026-12-07T12:00:00Z' }], skipped: [], expectedCompletionAt: '2026-12-07T12:00:00Z', canConfirmAll: true, price: '2400000', sessionCount: 1, policy: { holdMinutes: 15 } }
async function setup(days = ['Thứ 2', 'Thứ 4', 'Thứ 6']) {
  render(<MemoryRouter initialEntries={['/?memberId=member']}><HybridSalePage /></MemoryRouter>)
  await screen.findByText('Đã chọn: Học viên · MEM1')
  fireEvent.change(await screen.findByLabelText('Huấn luyện viên'), { target: { value: 'coach' } })
  await screen.findByRole('option', { name: /Gói chuẩn/ })
  fireEvent.change(screen.getByLabelText('Gói PT'), { target: { value: 'option' } })

  for (const day of days) fireEvent.click(await screen.findByRole('button', { name: day }))
  fireEvent.change(screen.getByLabelText('Giờ chung'), { target: { value: '18:00' } })
  fireEvent.click(screen.getByRole('button', {name: `Áp dụng ${days.length} ngày`}))
}
async function hold() {
  fireEvent.click(screen.getByRole('button', {name: 'Xem trước toàn bộ lịch'}))
  const hold = await screen.findByRole('button', {name: 'Giữ chuỗi và tạo đơn'}); expect(hold).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Căn cứ Member đồng ý'), { target: { value: 'Member xác nhận trực tiếp tại quầy' } }); fireEvent.click(hold)
}
describe('Series checkout at reception', () => {
  it.each(['MEMBER', 'RECEPTIONIST'])('restores a live held order for %s without reholding or previewing', async role => {
    auth.role = role
    vi.mocked(seriesApi.order).mockResolvedValue({ purchaseId: 'existing', memberId: 'member', coachId: 'coach', packageOptionId: 'option', hold: { expiresAt: new Date(Date.now() + 900000).toISOString() }, expectedCompletionAt: preview.expectedCompletionAt, price: '2400000', items: preview.items })
    render(<MemoryRouter initialEntries={[{ pathname: '/member/pt-sale', state: { ptDraft: { memberId: 'member', coachId: 'coach', optionId: 'option', startDate: '2026-12-07', pattern, purchaseId: 'existing' } } }]}><HybridSalePage /></MemoryRouter>)
    await screen.findByText('Giá đơn đã xác nhận: 2.400.000 ₫')
    expect(screen.getByLabelText('Ngày bắt đầu')).toHaveValue('2026-12-07')
    expect(screen.queryByText('Giữ chỗ còn 0 giây.')).toBeNull()
    if (role === 'MEMBER') expect(screen.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeEnabled()
    else expect(screen.getByRole('button', { name: 'Xác nhận đã thu tiền mặt' })).toBeEnabled()
    expect(seriesApi.rehold).not.toHaveBeenCalled()
    expect(seriesApi.preview).not.toHaveBeenCalled()
  })
  it.each([1, 6])('allows preview with %i weekly sessions even when the package defaults to three', async count => {
    vi.mocked(seriesApi.patterns).mockResolvedValue({ sessionsPerWeek: 3, slots: Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, startTime: '18:00', available: true })), suggestions: [] })
    await setup(['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].slice(0, count))
    const button = screen.getByRole('button', { name: 'Xem trước toàn bộ lịch' })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await waitFor(() => expect(seriesApi.preview).toHaveBeenCalled())
    expect(vi.mocked(seriesApi.preview).mock.calls[0][0].pattern).toHaveLength(count)
  })
  it.each(['patterns', 'preview', 'checkout'] as const)('returns to Coach packages when %s rejects a tier', async stage => {
    const error = new AppApiError(409, { success: false, code: 'COACH_TIER_TOO_LOW', message: 'Tier too low' })
    vi.mocked(seriesApi[stage]).mockRejectedValueOnce(error)
    if (stage === 'patterns') {
      render(<MemoryRouter initialEntries={[{ pathname: '/member/pt-sale', state: { ptDraft: { memberId: 'member', coachId: 'coach', optionId: 'option', startDate: '2026-12-07', pattern } } }]}><HybridSalePage /></MemoryRouter>)
    } else {
      await setup()
      if (stage === 'checkout') await hold()
      else fireEvent.click(screen.getByRole('button', { name: 'Xem trước toàn bộ lịch' }))
    }
    await screen.findAllByText(/Coach này chưa bán gói này/)
    await waitFor(() => expect(screen.getByLabelText('Gói PT')).toHaveValue(''))
    expect(screen.queryByRole('button', { name: 'Giữ chuỗi và tạo đơn' })).toBeNull()
    expect(counterPayment).not.toHaveBeenCalled()
  })
  it('requires fresh consent and sends the new expected price after PRICE_CHANGED', async () => {
    vi.mocked(seriesApi.checkout).mockRejectedValueOnce(new AppApiError(409, { success: false, code: 'PRICE_CHANGED', message: 'Giá thay đổi', details: { price: '3000000', coachTier: 'ADVANCED' } }))
    vi.mocked(seriesApi.preview).mockResolvedValueOnce(preview).mockResolvedValue({ ...preview, price: '3000000', coachTier: 'ADVANCED' })
    await setup(); await hold()
    await screen.findByText(/Giá gói vừa thay đổi/)
    expect(screen.getByText('Giá gói: 3.000.000 ₫')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Giữ chuỗi và tạo đơn' })
    expect(button).toBeDisabled()
    expect(seriesApi.checkout).toHaveBeenCalledTimes(1)
    const first = vi.mocked(seriesApi.checkout).mock.calls[0][0]
    expect(first.expectedPrice).toBe(2400000)
    fireEvent.change(screen.getByLabelText('Căn cứ Member đồng ý'), { target: { value: 'Member xác nhận trực tiếp tại quầy' } })
    fireEvent.click(button)
    await screen.findByRole('button', { name: 'Xác nhận đã thu tiền mặt' })
    expect(seriesApi.checkout).toHaveBeenCalledTimes(2)
    const second = vi.mocked(seriesApi.checkout).mock.calls[1][0]
    expect(second.expectedPrice).toBe(3000000)
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey)
  })
  it('reholds an expired Member order with the actual strict BE schema and the same key after a network failure', async () => {
    auth.role = 'MEMBER'
    vi.mocked(hybridGet).mockImplementation(async url => url === '/coaches' ? [{ id: 'coach', fullName: 'Coach Nam' }] : url === '/pt-package-options' ? [{ id: 'option', name: 'Gói chuẩn', sessionCount: 12, sessionsPerWeek: 3, price: '2400000' }] : url === '/me/pt-packages' ? [{ id: 'existing', coachId: 'coach', packageOptionId: 'option', status: 'PENDING_PAYMENT', purchaseCode: 'PT-OLD' }] : [])
    let attempts = 0
    vi.mocked(seriesApi.rehold).mockImplementation(async (_id, body) => {
      beReholdSchema.parse(JSON.parse(JSON.stringify(body)))
      if (++attempts === 1) throw new Error('Mất kết nối khi giữ lại lịch')
      return { purchaseId: 'existing', hold: { expiresAt: new Date(Date.now() + 900000).toISOString() }, expectedCompletionAt: preview.expectedCompletionAt }
    })
    render(<MemoryRouter initialEntries={[{ pathname: '/member/pt-sale', state: { ptDraft: { memberId: 'member', coachId: 'coach', optionId: 'option', startDate: '2026-12-07', pattern } } }]}><HybridSalePage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn lại lịch cho PT-OLD' }))
    await screen.findByText('Giữ chỗ còn 0 giây.')
    const show = await screen.findByRole('button', { name: 'Xem trước toàn bộ lịch' })
    await waitFor(() => expect(show).toBeEnabled())
    fireEvent.click(show)
    const rehold = await screen.findByRole('button', { name: 'Chọn lại lịch trên đơn này' })
    expect(rehold).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /Tôi đã xem toàn bộ lịch/ }))
    fireEvent.click(rehold)
    await screen.findByText('Mất kết nối khi giữ lại lịch')
    fireEvent.click(rehold)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeEnabled())
    const calls = vi.mocked(seriesApi.rehold).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual(calls[1])
    expect(calls[0]![1]).not.toHaveProperty('acceptPolicy')
    expect(seriesApi.checkout).not.toHaveBeenCalled()
    expect(beReholdSchema.safeParse({ ...calls[0]![1], acceptPolicy: true }).success).toBe(false)
  })
  beforeEach(() => {
    vi.clearAllMocks(); auth.role = 'RECEPTIONIST'
    vi.mocked(seriesApi.order).mockResolvedValue({ purchaseId: 'existing', memberId: 'member', coachId: 'coach', packageOptionId: 'option', hold: { expiresAt: null }, expectedCompletionAt: '', price: '2400000', items: [] })
    vi.mocked(deskApi.member).mockResolvedValue({id:'member', memberCode:'MEM1',user:{fullName:'Học viên'}} as Awaited<ReturnType<typeof deskApi.member>>)
    vi.mocked(hybridGet).mockImplementation(async url => url === '/coaches' ? [{id:'coach',fullName:'Coach Nam'}] : url === '/pt-package-options' ? [{id:'option',name:'Gói chuẩn',price:'2400000',sessionsPerWeek:3,sessionCount:12}] : [])
    vi.mocked(seriesApi.patterns).mockResolvedValue({sessionsPerWeek:3,slots:pattern.map(p=>({...p,available:true})),suggestions:[]})
    vi.mocked(seriesApi.preview).mockResolvedValue(preview)
    vi.mocked(seriesApi.checkout).mockImplementation(async()=>({purchaseId:'purchase',hold:{expiresAt:new Date(Date.now()+900000).toISOString()},expectedCompletionAt:preview.expectedCompletionAt}))
    vi.mocked(counterPayment).mockResolvedValue({id:'payment',application:'APPLIED'} as {id:string})
  })
  it('requires a weekly pattern and a successful preview before creating a full-chain order', async()=>{
    await setup(); expect(screen.queryByText('Tạo đơn mua gói')).not.toBeInTheDocument(); await hold()
    await screen.findByRole('heading',{name:'Thanh toán đơn PT'})
    expect(seriesApi.checkout).toHaveBeenCalledWith(expect.objectContaining({pattern,memberId:'member',packageOptionId:'option',consentEvidence:'Member xác nhận trực tiếp tại quầy'}))
    expect(screen.getByRole('combobox',{name:'Tìm hội viên mua PT'})).toBeDisabled()
    expect(screen.queryByText('Chuyển khoản')).not.toBeInTheDocument()
  })
  it('changing the weekly selection invalidates the preview',async()=>{
    await setup(); fireEvent.click(screen.getByRole('button',{name:'Xem trước toàn bộ lịch'}));await screen.findByRole('button',{name:'Giữ chuỗi và tạo đơn'})
    fireEvent.click(screen.getByRole('button',{name:'Thứ 2'}))
    expect(screen.queryByRole('button',{name:'Giữ chuỗi và tạo đơn'})).not.toBeInTheDocument();expect(seriesApi.checkout).not.toHaveBeenCalled()
    expect(screen.getByRole('button',{name:'Xem trước toàn bộ lịch'})).toBeEnabled()
  })
  it('lists Coach packages without imposing a package weekly cadence',async()=>{
    vi.mocked(hybridGet).mockImplementation(async url=>url==='/coaches'?[{id:'coach',fullName:'Coach Nam'}]:url==='/pt-package-options'?[{id:'option',name:'Gói chuẩn',price:'2400000',sessionsPerWeek:3,sessionCount:12},{id:'flex',name:'Gói hai buổi',price:'1800000',sessionsPerWeek:2,sessionCount:8}]:[])
    render(<MemoryRouter initialEntries={['/?memberId=member']}><HybridSalePage/></MemoryRouter>);await screen.findByText('Đã chọn: Học viên · MEM1')
    fireEvent.change(await screen.findByLabelText('Huấn luyện viên'),{target:{value:'coach'}});await screen.findByRole('option',{name:/Gói hai buổi/})
    expect(screen.queryByLabelText('Số buổi mỗi tuần')).toBeNull()
    expect(screen.getByRole('option',{name:/Gói chuẩn/})).toBeInTheDocument();expect(screen.getByRole('option',{name:/Gói hai buổi/})).toBeInTheDocument();expect(seriesApi.checkout).not.toHaveBeenCalled()
  })
  it('collects cash once and leaves the completed sale locked',async()=>{
    await setup();await hold();const button=await screen.findByRole('button',{name:'Xác nhận đã thu tiền mặt'});fireEvent.click(button);fireEvent.click(button)
    await waitFor(()=>expect(screen.getByText(/Đã nhận tiền và tạo toàn bộ buổi tập/)).toBeInTheDocument())
    expect(counterPayment).toHaveBeenCalledTimes(1);expect(counterPayment).toHaveBeenCalledWith({ptPurchaseId:'purchase',method:'CASH',receivedAmount:2400000,overrideReason:'Lễ tân thu tiền mặt tại quầy'})
  })
  it('a Manager browsing the desk is not offered counter cash (Receptionist-only on the BE)',async()=>{
    auth.role='MANAGER';await setup();await hold();expect(await screen.findByText(/Chỉ tài khoản Lễ tân được thu tiền tại quầy/)).toBeInTheDocument()
    expect(screen.queryByRole('button',{name:'Xác nhận đã thu tiền mặt'})).toBeNull();expect(counterPayment).not.toHaveBeenCalled()
  })
  it('locks collection and offers recovery when money is received but not applied',async()=>{
    vi.mocked(counterPayment).mockResolvedValue({id:'payment',application:'PENDING_REVIEW'} as {id:string});await setup();await hold()
    fireEvent.click(await screen.findByRole('button',{name:'Xác nhận đã thu tiền mặt'}));await screen.findByRole('link',{name:'Mở thanh toán để theo dõi'})
    expect(screen.getByRole('button',{name:'Xác nhận đã thu tiền mặt'})).toBeDisabled();expect(counterPayment).toHaveBeenCalledTimes(1)
  })
  it('lets a Member review a restored draft and explicitly accept policy before VNPay checkout', async () => {
    auth.role = 'MEMBER'
    render(<MemoryRouter initialEntries={[{ pathname: '/member/pt-sale', state: { ptDraft: { memberId: 'member', coachId: 'coach', optionId: 'option', startDate: '2026-12-07', pattern } } }]}><HybridSalePage /></MemoryRouter>)
    const show = await screen.findByRole('button', { name: 'Xem trước toàn bộ lịch' })
    await waitFor(() => expect(show).toBeEnabled())
    fireEvent.click(show)
    const hold = await screen.findByRole('button', { name: 'Giữ chuỗi và tạo đơn' })
    expect(hold).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /Tôi đã xem toàn bộ lịch/ }))
    fireEvent.click(hold)
    await screen.findByRole('button', { name: 'Thanh toán qua VNPay' })
    expect(seriesApi.checkout).toHaveBeenCalledWith(expect.objectContaining({ memberId: 'member', acceptPolicy: true, consentEvidence: undefined }))
    expect(deskApi.member).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Xác nhận đã thu tiền mặt' })).toBeNull()
    expect(counterPayment).not.toHaveBeenCalled()
  })

})
