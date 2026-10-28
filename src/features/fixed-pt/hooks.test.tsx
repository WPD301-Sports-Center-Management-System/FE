import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLoad } from './hooks'

describe('changing the selected Member/package', () => {
  it('does not show an older response after a newer selection has loaded', async () => {
    let resolveOld!: (value: string) => void
    const old = new Promise<string>(resolve => { resolveOld = resolve })
    const { result, rerender } = renderHook(({ id }) => useLoad(() => id === 'old' ? old : Promise.resolve('new Member'), [id]), { initialProps: { id: 'old' } })
    rerender({ id: 'new' })
    await waitFor(() => expect(result.current.data).toBe('new Member'))
    await act(async () => { resolveOld('old Member'); await old })
    expect(result.current.data).toBe('new Member')
    expect(result.current.loading).toBe(false)
  })
})
