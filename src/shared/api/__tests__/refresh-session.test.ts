import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../client'
import { refreshSessionTokens } from '../refresh-session'
import { authStorage } from '@/shared/utils/storage'

const old = 'old-refresh-token-with-20-characters'
const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh-token-with-20-characters', tokenType:'Bearer', expiresIn:'15m' }
const denied = (config: InternalAxiosRequestConfig) => new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status:401, statusText:'Unauthorized', headers:{}, config, data:{code:'INVALID_TOKEN',message:'Expired'} })
const originalAdapter = apiClient.defaults.adapter
describe('Refresh rotation matches BE token-reuse protection', () => {
  beforeEach(() => { localStorage.clear(); authStorage.setTokens({accessToken:'expired',refreshToken:old}) })
  afterEach(() => { apiClient.defaults.adapter=originalAdapter; vi.restoreAllMocks(); localStorage.clear() })
  it('shares one rotation across simultaneous callers', async () => {
    let finish!: (v: unknown) => void
    const post=vi.spyOn(axios,'post').mockImplementation(() => new Promise(resolve=>{finish=resolve}) as never)
    const first=refreshSessionTokens(old), second=refreshSessionTokens(old)
    expect(first).toBe(second); expect(post).toHaveBeenCalledTimes(1)
    finish({data:{data:tokens}})
    expect(await first).toEqual(tokens)
    expect(authStorage.getRefreshToken()).toBe(tokens.refreshToken)
    expect(post.mock.calls[0]?.[2]).toEqual({timeout:15000})
  })
  it('does not restore old credentials after logout while a refresh is pending', async () => {
    let finish!: (v: unknown) => void
    vi.spyOn(axios,'post').mockImplementation(() => new Promise(resolve=>{finish=resolve}) as never)
    const request=refreshSessionTokens(old)
    authStorage.clearSession(); finish({data:{data:tokens}})
    await expect(request).rejects.toThrow('Phiên đăng nhập đã thay đổi')
    expect(authStorage.getAccessToken()).toBeNull()
  })
  it('marks every queued request as retried; a second 401 cannot rotate again', async () => {
    let finish!: (v: unknown) => void
    const post=vi.spyOn(axios,'post').mockImplementation(() => new Promise(resolve=>{finish=resolve}) as never)
    apiClient.defaults.adapter=async config=>{ throw denied(config) }
    const requests=Promise.allSettled([apiClient.get('/members'),apiClient.get('/payments')])
    await vi.waitFor(()=>expect(post).toHaveBeenCalledTimes(1))
    finish({data:{data:tokens}})
    const results=await requests
    expect(results.every(r=>r.status==='rejected')).toBe(true)
    expect(post).toHaveBeenCalledTimes(1)
  })
  it('replays simultaneous successful requests with the rotated access token', async () => {
    vi.spyOn(axios,'post').mockResolvedValue({data:{data:tokens}})
    apiClient.defaults.adapter=async config=>{
      if(config.headers.Authorization!=='Bearer new-access') throw denied(config)
      return {status:200,statusText:'OK',headers:new AxiosHeaders(),config,data:{success:true,data:config.url}}
    }
    const results=await Promise.all([apiClient.get('/members'),apiClient.get('/payments')])
    expect(results).toEqual([{success:true,data:'/members'},{success:true,data:'/payments'}])
  })
})
