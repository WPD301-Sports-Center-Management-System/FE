import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LinkedPurchasePage } from './linked-detail-page'
const auth = vi.hoisted(()=>({role:'MEMBER'}))
vi.mock('@/features/auth/context/auth-context',()=>({useAuth:()=>auth}))
vi.mock('../hybrid-api',()=>({hybridGet:vi.fn().mockResolvedValue({id:'p1',seriesMode:true,status:'ACTIVE',availableCredits:2,reservedCredits:3,consumedCredits:1,activationDeadline:'2027-01-01',expiresAt:'2027-02-01'})}))
afterEach(cleanup)
describe('Purchase return routes',()=>{
  it.each([['MEMBER','/member'],['MANAGER','/manager/members'],['RECEPTIONIST','/receptionist/members'],['COACH','/coach/packages?view=sold']])('returns %s to an existing destination',async(role,href)=>{
    auth.role=role
    render(<MemoryRouter initialEntries={['/pt-purchases/p1']}><Routes><Route path="/pt-purchases/:id" element={<LinkedPurchasePage/>}/></Routes></MemoryRouter>)
    expect(await screen.findByRole('link',{name:'Quay lại danh sách gói'})).toHaveAttribute('href',href)
    await screen.findByText(/Chờ Coach xếp lịch 2 buổi/)
    expect(screen.queryByText(/Hạn sử dụng:/)).not.toBeInTheDocument()
  })
})
