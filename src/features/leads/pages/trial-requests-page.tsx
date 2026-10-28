import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Phone, RefreshCw, AlertTriangle, PencilLine } from 'lucide-react'
import { apiClient } from '@/shared/api/client'
import { isAppApiError } from '@/shared/api/api-error'
import type { ApiSuccess } from '@/shared/types/api'
import { formatDateTime } from '@/shared/utils/date'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge, statusLabel } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Select, Textarea } from '@/shared/components/ui/input'

type TrialStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED'
interface TrialRequest extends Record<string, unknown> {
  id: string
  fullName: string
  phone: string
  goal?: string | null
  preferredTime?: string | null
  interest?: string | null
  note?: string | null
  coachName?: string | null
  status: TrialStatus
  staffNote?: string | null
  handledAt?: string | null
  createdAt: string
}

const STATUSES: TrialStatus[] = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']

const trialApi = {
  list: async (status?: TrialStatus) =>
    ((await apiClient.get('/trial-requests', { params: { status, limit: 100 } })) as ApiSuccess<TrialRequest[]>).data,
  update: async ({ id, ...body }: { id: string; status: TrialStatus; staffNote?: string }) =>
    ((await apiClient.patch(`/trial-requests/${id}`, body)) as ApiSuccess<TrialRequest>).data,
}

// Front-desk inbox for the website's "đăng ký tập thử" form: call each visitor back and record the outcome.
export function TrialRequestsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<TrialStatus | 'ALL'>('NEW')
  const [editing, setEditing] = useState<TrialRequest | null>(null)
  const [nextStatus, setNextStatus] = useState<TrialStatus>('CONTACTED')
  const [staffNote, setStaffNote] = useState('')

  const requests = useQuery({ queryKey: ['trial-requests', filter], queryFn: () => trialApi.list(filter === 'ALL' ? undefined : filter) })
  const update = useMutation({
    mutationFn: trialApi.update,
    onSuccess: () => {
      setEditing(null)
      void queryClient.invalidateQueries({ queryKey: ['trial-requests'] })
    },
  })

  const openEditor = (row: TrialRequest) => {
    setEditing(row)
    setNextStatus(row.status === 'NEW' ? 'CONTACTED' : row.status)
    setStaffNote(row.staffNote ?? '')
    update.reset()
  }

  const columns: Column<TrialRequest>[] = [
    { header: 'Gửi lúc', accessor: (row) => <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span> },
    {
      header: 'Khách',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-text-primary">{row.fullName}</p>
          <a href={`tel:${row.phone}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <Phone className="h-3.5 w-3.5" />
            {row.phone}
          </a>
        </div>
      ),
    },
    {
      header: 'Nhu cầu',
      accessor: (row) => (
        <div className="space-y-0.5 text-sm">
          {row.interest && <p className="font-medium text-text-primary">{row.interest}</p>}
          <p className="text-text-muted">{[row.goal, row.preferredTime].filter(Boolean).join(' · ') || '—'}</p>
          {row.coachName && <p className="text-text-muted">Muốn tập với: {row.coachName}</p>}
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} context="trial" />
          {row.staffNote && <p className="max-w-56 truncate text-sm text-text-muted" title={row.staffNote}>{row.staffNote}</p>}
        </div>
      ),
    },
  ]

  const errorText = (error: unknown, fallback: string) => (isAppApiError(error) ? error.message : fallback)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Đăng ký tập thử</h1>
          <p className="mt-1 text-sm text-text-muted">Khách để lại thông tin trên website. Gọi lại, ghi chú kết quả và cập nhật trạng thái.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => requests.refetch()} disabled={requests.isFetching} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${requests.isFetching ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc theo trạng thái">
        {(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={filter === s}
            onClick={() => setFilter(s)}
            className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
              filter === s ? 'border-primary bg-primary text-white' : 'border-border-subtle bg-bg-surface text-text-secondary hover:bg-bg-surface-muted'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : statusLabel(s, 'trial')}
          </button>
        ))}
      </div>

      {requests.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorText(requests.error, 'Không tải được danh sách đăng ký.')}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={requests.data ?? []}
        isLoading={requests.isLoading}
        searchPlaceholder="Tìm theo tên hoặc số điện thoại…"
        searchFn={(row, term) => row.fullName.toLowerCase().includes(term.toLowerCase()) || row.phone.includes(term.replace(/\D/g, ''))}
        actions={(row) => (
          <Button size="sm" variant="outline" onClick={() => openEditor(row)} className="gap-1">
            <PencilLine className="h-3.5 w-3.5" />
            Cập nhật
          </Button>
        )}
      />

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Cập nhật: ${editing?.fullName ?? ''}`} description={editing ? `SĐT ${editing.phone} · gửi ${formatDateTime(editing.createdAt)}` : undefined}>
        {editing && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              update.mutate({ id: editing.id, status: nextStatus, staffNote: staffNote.trim() || undefined })
            }}
          >
            {editing.note && <p className="rounded-xl border border-border-subtle bg-bg-surface-muted p-3 text-sm text-text-secondary">Khách ghi chú: {editing.note}</p>}
            <Select label="Trạng thái" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as TrialStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s, 'trial')}</option>
              ))}
            </Select>
            <Textarea label="Ghi chú của lễ tân" value={staffNote} onChange={(e) => setStaffNote(e.target.value)} placeholder="VD: Đã gọi, hẹn 18:00 thứ 5 đến tập thử" />
            {update.isError && (
              <p role="alert" className="text-sm text-danger">{errorText(update.error, 'Không lưu được. Vui lòng thử lại.')}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
              <Button type="submit" isLoading={update.isPending}>Lưu</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
