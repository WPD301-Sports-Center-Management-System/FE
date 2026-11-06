import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HybridSalePage } from './hybrid-sale-page'
import { hybridGet } from '../hybrid-api'
import { seriesApi } from '../series-api'
import { counterPayment } from '@/features/workspace/counter-payment'
import { deskApi } from '@/features/reception-workspace/api'
vi.mock('@/features/reception-workspace/api', () => ({ deskApi: { member: vi.fn(), members: vi.fn() } }))
vi.mock('../hybrid-api', () => ({ hybridGet: vi.fn() }))
vi.mock('../series-api', () => ({ seriesApi: { patterns: vi.fn(), preview: vi.fn(), checkout: vi.fn(), rehold: vi.fn() } }))
vi.mock('@/features/workspace/counter-payment', () => ({ counterPayment: vi.fn() }))
const auth = vi.hoisted(() => ({ role: 'RECEPTIONIST' as string }))
vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: () => ({ role: auth.role }) }))
const pattern = [1, 3, 5].map(weekday => ({ weekday, startTime: '18:00' }))
const preview = { items: [{ startsAt: '2026-12-07T11:00:00Z', endsAt: '2026-12-07T12:00:00Z' }], skipped: [], expectedCompletionAt: '2026-12-07T12:00:00Z', canConfirmAll: true, price: '2400000', sessionCount: 1, policy: { holdMinutes: 15 } }
async function setup() {
  render(<MemoryRouter initialEntries={['/?memberId=member']}><HybridSalePage /></MemoryRouter>)
  await screen.findByText('Đã chọn: Học viên · MEM1')
  fireEvent.change(await screen.findByLabelText('Huấn luyện viên'), { target: { value: 'coach' } })
  await screen.findByRole('option', { name: /Gói chuẩn/ })
  fireEvent.change(screen.getByLabelText('Gói PT'), { target: { value: 'option' } })
  fireEvent.change(screen.getByLabelText('Căn cứ Member đồng ý'), { target: { value: 'Xác nhận tại quầy' } })
  for (const day of ['Thứ 2', 'Thứ 4', 'Thứ 6']) fireEvent.click(await screen.findByRole('button', { name: day }))
  fireEvent.change(screen.getByLabelText('Giờ chung'), { target: { value: '18:00' } })
  fireEvent.click(screen.getByRole('button', {name: 'Áp dụng 3 ngày'}))
}
async function hold() {
  fireEvent.click(screen.getByRole('button', {name: 'Xem trước toàn bộ lịch'}))
  fireEvent.click(await screen.findByRole('button', {name: 'Giữ chuỗi và tạo đơn'}))
}
describe('Series checkout at reception', () => {
  beforeEach(() => {
    vi.clearAllMocks(); auth.role = 'RECEPTIONIST'
    vi.mocked(deskApi.member).mockResolvedValue({id:'member', memberCode:'MEM1',user:{fullName:'Học viên'}} as Awaited<ReturnType<typeof deskApi.member>>)
    vi.mocked(hybridGet).mockImplementation(async url => url === '/coaches' ? [{id:'coach',fullName:'Coach Nam'}] : url === '/pt-package-options' ? [{id:'option',name:'Gói chuẩn',price:'2400000',sessionsPerWeek:3,sessionCount:12}] : [])
    vi.mocked(seriesApi.patterns).mockResolvedValue({sessionsPerWeek:3,slots:pattern.map(p=>({...p,available:true})),suggestions:[]})
    vi.mocked(seriesApi.preview).mockResolvedValue(preview)
    vi.mocked(seriesApi.checkout).mockImplementation(async()=>({purchaseId:'purchase',hold:{expiresAt:new Date(Date.now()+900000).toISOString()},expectedCompletionAt:preview.expectedCompletionAt}))
    vi.mocked(counterPayment).mockResolvedValue({id:'payment',application:'APPLIED'} as {id:string})
  })
  it('requires a weekly pattern and a successful preview before creating a full-chain order', async()=>{
    await setup(); expect(screen.queryByText('Tạo đơn mua gói')).not.toBeInTheDocument(); await hold()
    await screen.findByRole('heading',{name:'4. Thu tiền mặt'})
    expect(seriesApi.checkout).toHaveBeenCalledWith(expect.objectContaining({pattern,memberId:'member',packageOptionId:'option',consentEvidence:'Xác nhận tại quầy'}))
    expect(screen.getByRole('combobox',{name:'Tìm hội viên mua PT'})).toBeDisabled()
    expect(screen.queryByText('Chuyển khoản')).not.toBeInTheDocument()
  })
  it('changing the weekly selection invalidates the preview',async()=>{
    await setup(); fireEvent.click(screen.getByRole('button',{name:'Xem trước toàn bộ lịch'}));await screen.findByRole('button',{name:'Giữ chuỗi và tạo đơn'})
    fireEvent.click(screen.getByRole('button',{name:'Thứ 2'}))
    expect(screen.queryByRole('button',{name:'Giữ chuỗi và tạo đơn'})).not.toBeInTheDocument();expect(seriesApi.checkout).not.toHaveBeenCalled()
    expect(screen.getByRole('button',{name:'Xem trước toàn bộ lịch'})).toBeDisabled()
  })
  it('filters real packages by their supported weekly cadence instead of changing a package silently',async()=>{
    vi.mocked(hybridGet).mockImplementation(async url=>url==='/coaches'?[{id:'coach',fullName:'Coach Nam'}]:url==='/pt-package-options'?[{id:'option',name:'Gói chuẩn',price:'2400000',sessionsPerWeek:3,sessionCount:12},{id:'flex',name:'Gói hai buổi',price:'1800000',sessionsPerWeek:2,sessionCount:8}]:[])
    render(<MemoryRouter initialEntries={['/?memberId=member']}><HybridSalePage/></MemoryRouter>);await screen.findByText('Đã chọn: Học viên · MEM1')
    fireEvent.change(await screen.findByLabelText('Huấn luyện viên'),{target:{value:'coach'}});await screen.findByRole('option',{name:/Gói hai buổi/})
    fireEvent.change(screen.getByLabelText('Số buổi mỗi tuần'),{target:{value:'2'}})
    expect(screen.queryByRole('option',{name:/Gói chuẩn/})).not.toBeInTheDocument();expect(screen.getByRole('option',{name:/Gói hai buổi/})).toBeInTheDocument();expect(seriesApi.checkout).not.toHaveBeenCalled()
  })
  it('collects cash once and leaves the completed sale locked',async()=>{
    await setup();await hold();const button=await screen.findByRole('button',{name:'Xác nhận đã thu tiền mặt'});fireEvent.click(button);fireEvent.click(button)
    await waitFor(()=>expect(screen.getByText(/Đã nhận tiền và tạo toàn bộ buổi tập/)).toBeInTheDocument())
    expect(counterPayment).toHaveBeenCalledTimes(1);expect(counterPayment).toHaveBeenCalledWith({ptPurchaseId:'purchase',method:'CASH',receivedAmount:2400000})
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
})
