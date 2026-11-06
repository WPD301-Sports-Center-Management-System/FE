import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './auth-context'
import { authService } from '../services/auth.service'
import { authStorage } from '@/shared/utils/storage'
vi.mock('../services/auth.service',()=>({authService:{getCurrentUser:vi.fn(),refreshToken:vi.fn(),updateProfile:vi.fn(),logout:vi.fn(),login:vi.fn()}}))
const user={id:'coach-user',fullName:'Coach',role:'COACH',status:'ACTIVE',email:'coach@local',phone:'0900000000',coachProfilesUserId:{id:'coach-profile'}}
function Probe(){const a=useAuth();return <><output>{a.user?.coachProfilesUserId?.id??'guest'}</output><button onClick={()=>void a.login({identifier:'coach',password:'test'})}>Login</button><button onClick={()=>void a.updateUserProfile({fullName:'Edited'})}>Edit</button><button onClick={()=>void a.logout()}>Logout</button></>}
describe('Auth bootstrap and profile response contracts',()=>{
  beforeEach(()=>{vi.clearAllMocks();localStorage.clear();authStorage.setTokens({accessToken:'expired',refreshToken:'old-refresh-token-with-20-characters'})})
  it('does not use a stale captured refresh token after auth/me recovery fails',async()=>{
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Expired'))
    render(<AuthProvider><Probe/></AuthProvider>)
    await waitFor(()=>expect(authStorage.getAccessToken()).toBeNull())
    expect(authService.refreshToken).not.toHaveBeenCalled()
  })
  it('keeps Coach profile ID when PATCH /auth/me returns scalar fields',async()=>{
    vi.mocked(authService.getCurrentUser).mockResolvedValue(user as never)
    vi.mocked(authService.updateProfile).mockResolvedValue({...user,coachProfilesUserId:undefined,fullName:'Edited'} as never)
    // BE omits relation fields rather than sending undefined properties.
    vi.mocked(authService.updateProfile).mockResolvedValue({id:user.id,fullName:'Edited',role:'COACH',status:'ACTIVE',email:user.email,phone:user.phone})
    render(<AuthProvider><Probe/></AuthProvider>)
    await screen.findByText('coach-profile')
    fireEvent.click(screen.getByText('Edit'))
    await waitFor(()=>expect(authService.updateProfile).toHaveBeenCalled())
    expect(screen.getByText('coach-profile')).toBeInTheDocument()
  })
  it('hydrates Coach profile ID immediately after login without a page reload',async()=>{
    localStorage.clear()
    vi.mocked(authService.login).mockResolvedValue({user:{...user,coachProfilesUserId:undefined},accessToken:'new-access',refreshToken:'new-refresh',tokenType:'Bearer',expiresIn:900} as never)
    vi.mocked(authService.getCurrentUser).mockResolvedValue(user as never)
    render(<AuthProvider><Probe/></AuthProvider>)
    fireEvent.click(screen.getByText('Login'))
    await screen.findByText('coach-profile')
    expect(authStorage.getUser()?.coachProfilesUserId?.id).toBe('coach-profile')
  })
  it('does not restore a user from an in-flight bootstrap after logout',async()=>{
    let finish!: (v: never)=>void
    vi.mocked(authService.getCurrentUser).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
    vi.mocked(authService.logout).mockResolvedValue({revoked:true})
    render(<AuthProvider><Probe/></AuthProvider>)
    await waitFor(()=>expect(authService.getCurrentUser).toHaveBeenCalled())
    fireEvent.click(screen.getByText('Logout'))
    await waitFor(()=>expect(authStorage.getAccessToken()).toBeNull())
    await act(async()=>{finish(user as never)})
    expect(screen.getByText('guest')).toBeInTheDocument()
  })
})
