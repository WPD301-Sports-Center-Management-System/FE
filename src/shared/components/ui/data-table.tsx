import { type ReactNode, useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from './empty-state'

export interface Column<T> {
  header: string
  accessor?: keyof T | ((row: T) => ReactNode)
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  searchPlaceholder?: string
  searchKey?: keyof T
  actions?: (row: T) => ReactNode
  itemsPerPage?: number
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchKey,
  actions,
  itemsPerPage = 10,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = data.filter((item) => {
    if (!searchTerm || !searchKey) return true
    const val = item[searchKey]
    if (typeof val === 'string') {
      return val.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="w-full space-y-4">
      {searchKey && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <span className="text-xs text-slate-400">Tổng cộng: {filteredData.length} mục</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3.5 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-4 rounded bg-slate-800" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4">
                      <div className="h-4 rounded bg-slate-800" />
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="p-8">
                  <EmptyState title="Không tìm thấy kết quả" description="Không có bản ghi nào khớp với điều kiện lọc." />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={rIdx} className="transition-colors hover:bg-slate-800/40">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-4 py-3.5 text-xs text-slate-200 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                        ? (row[col.accessor] as ReactNode)
                        : null}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3.5 text-right text-xs">{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
