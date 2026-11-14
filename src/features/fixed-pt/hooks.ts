import { useCallback, useEffect, useRef, useState } from 'react'
import { isAppApiError } from '@/shared/api/api-error'
import { tierLabels, type CoachTier } from '@/shared/utils/coach-tier'
import { publishFieldErrors } from '@/features/workspace/field-errors'

export function errorMessage(error: unknown): string {
  if (isAppApiError(error)) {
    if (error.code === 'COACH_TIER_TOO_LOW') return 'Coach này chưa bán gói này. Vui lòng chọn lại gói của Coach.'
    if (['PRICE_BELOW_MIN_TIER', 'PRICE_NOT_SET'].includes(error.code)) {
      const tiers = (error.details as { tiers?: CoachTier[] } | undefined)?.tiers ?? []
      return (error.code === 'PRICE_NOT_SET' ? 'Cần nhập giá cho bậc: ' : 'Bỏ giá dưới bậc tối thiểu: ') + tiers.map(t => tierLabels[t] ?? t).join(', ')
    }
  }
  // Every invalid field is listed, each with its label, so the user sees what to fix and where (not only the first one).
  if (isAppApiError(error)) return error.errors?.length ? [...new Set(error.errors.map(e => e.label ? `${e.label}: ${e.message}` : e.message))].join('\n') : error.message
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'
}
export function errorCode(error: unknown): string | undefined { return isAppApiError(error) ? error.code : undefined }

// Loads data with loading/error/retry state; `deps` re-run the loader.
// Staff screens (Manager, reception, Coach) stay open for hours: the data is quietly re-read when the tab comes back into
// view and every LIVE_REFRESH_MS while visible, so a record created on another device (a submitted application, a payment)
// appears without a manual reload. A background read never shows the skeleton and never replaces data with an error.
const LIVE_REFRESH_MS = 30_000
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = [], enabled = true, live = true) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef(loader)
  const generation = useRef(0)
  loaderRef.current = loader
  const reload = useCallback(async () => {
    const request = ++generation.current
    setLoading(true); setError(null)
    try { const result = await loaderRef.current(); if (request === generation.current) setData(result) }
    catch (e) { if (request === generation.current) setError(errorMessage(e)) }
    finally { if (request === generation.current) setLoading(false) }
  }, [])
  useEffect(() => {
    setData(null)
    if (enabled) void reload()
    else { setLoading(false); setError(null) }
    return () => { generation.current++ }
  }, [enabled, reload, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enabled || !live) return
    let busy = false
    const quiet = async () => {
      if (busy || document.hidden) return
      busy = true
      const request = ++generation.current
      try { const result = await loaderRef.current(); if (request === generation.current) { setData(result); setError(null) } }
      catch { /* keep what is on screen; the next tick retries */ }
      finally { busy = false }
    }
    const timer = window.setInterval(() => void quiet(), LIVE_REFRESH_MS)
    const onVisible = () => { if (!document.hidden) void quiet() }
    document.addEventListener('visibilitychange', onVisible); window.addEventListener('focus', onVisible)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible) }
  }, [enabled, live, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
  return { data, loading, error, reload, setData }
}

// Runs one mutation at a time (prevents double submit) and keeps the server error for display.
export function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | undefined>()
  const [details, setDetails] = useState<unknown>()
  const running = useRef(false)
  const run = useCallback(async <T>(work: () => Promise<T>): Promise<T | undefined> => {
    if (running.current) return undefined
    running.current = true; setBusy(true); setError(null); setCode(undefined); setDetails(undefined); publishFieldErrors(null)
    try { return await work() }
    catch (e) { publishFieldErrors(e); setError(errorMessage(e)); setCode(errorCode(e)); setDetails((e as { details?: unknown })?.details); return undefined }
    finally { running.current = false; setBusy(false) }
  }, [])
  return { busy, error, code, details, run, clear: () => { setError(null); setCode(undefined) } }
}
