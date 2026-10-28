import { describe, expect, it, vi } from 'vitest'
import { fetchAllPages } from '../pagination'

describe('Full setup and approval lists', () => {
  it('includes requests beyond the first page', async () => {
    const fetchPage = vi.fn(
      async ({ page }: { page: number; limit: number }) => ({
        data: [page],
        meta: { totalPages: 3 },
      }),
    )
    expect(await fetchAllPages(fetchPage)).toEqual([1, 2, 3])
    expect(fetchPage).toHaveBeenLastCalledWith({ page: 3, limit: 100 })
  })
  it('does not present partial results as a complete approval queue on failure', async () => {
    const fetchPage = vi.fn(
      async ({ page }: { page: number; limit: number }) => {
        if (page === 2) throw new Error('Tải trang thất bại')
        return { data: [page], meta: { totalPages: 2 } }
      },
    )
    await expect(fetchAllPages(fetchPage)).rejects.toThrow('Tải trang thất bại')
  })
})
