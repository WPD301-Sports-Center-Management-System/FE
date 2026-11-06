import { useCallback, useEffect, useRef, useState } from 'react'
import { isAppApiError } from '@/shared/api/api-error'

export function errorMessage(error: unknown): string {
  if (isAppApiError(error)) return error.errors?.[0]?.message ?? error.message
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'
}
export function errorCode(error: unknown): string | undefined { return isAppApiError(error) ? error.code : undefined }

// Loads data with loading/error/retry state; `deps` re-run the loader.
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = [], enabled = true) {
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
    running.current = true; setBusy(true); setError(null); setCode(undefined); setDetails(undefined)
    try { return await work() }
    catch (e) { setError(errorMessage(e)); setCode(errorCode(e)); setDetails((e as { details?: unknown })?.details); return undefined }
    finally { running.current = false; setBusy(false) }
  }, [])
  return { busy, error, code, details, run, clear: () => { setError(null); setCode(undefined) } }
}
