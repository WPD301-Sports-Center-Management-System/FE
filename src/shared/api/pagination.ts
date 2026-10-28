// Setup and approval screens need the full catalog, not just the first page.
export async function fetchAllPages<T>(
  fetchPage: (params: { page: number; limit: number }) => Promise<{
    data: T[]
    meta?: { totalPages: number }
  }>,
): Promise<T[]> {
  const rows: T[] = []
  let page = 1
  while (true) {
    const result = await fetchPage({ page, limit: 100 })
    rows.push(...result.data)
    if (page >= (result.meta?.totalPages ?? 1)) return rows
    page++
  }
}
