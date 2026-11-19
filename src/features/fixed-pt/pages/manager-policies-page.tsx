import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { PolicyRow } from '../types'
import { ErrorBanner, inputCls, Loadable, Notice, Page, Panel, Table, td } from '../components/ui'

const GROUPS = ['Đặt lịch tập', 'Hủy và đổi lịch', 'Thanh toán', 'Điểm danh', 'Bảo lưu gói tập', 'Phân chia doanh thu']

// Manager maintains the PT operating rules. Each order keeps the values it was sold under.
export function ManagerPoliciesPage() {
  const policies = useLoad(() => fixedPtApi.policies(), [])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState('')
  const save = useSubmit()
  const reset = useSubmit()
  const dirty = Object.keys(draft)
  const valueOf = (p: PolicyRow) => draft[p.key] ?? (p.value === null || p.value === undefined ? '' : String(p.value))
  return (
    <Page title="Chính sách vận hành" subtitle="Quy định áp dụng cho việc đặt lịch, hủy và đổi lịch, thanh toán, điểm danh và phân chia doanh thu gói tập cá nhân.">
      {success && <Notice tone="success">{success}</Notice>}
      <form onSubmit={e => {
        e.preventDefault()
        void save.run(async () => {
          await fixedPtApi.setPolicies(dirty.map(k => ({ key: k, value: Number(draft[k]), note: note.trim() || undefined })))
          setDraft({}); setSuccess('Cập nhật chính sách thành công.'); await policies.reload()
        })
      }}>
      <fieldset disabled={save.busy || reset.busy} className="min-w-0 space-y-4">
        <Loadable state={policies}>{items => (
          <>
            {GROUPS.map(group => {
              const rows = items.filter(p => p.group === group)
              if (!rows.length) return null
              return (
                <Panel key={group} title={group}>
                  <Table head={['Chính sách', 'Giá trị', 'Đơn vị']}>
                    {rows.map(p => <tr key={p.key}>
                      <td className={td}>{p.label}<div className="text-xs text-text-muted">{p.hint}</div></td>
                      <td className={td}><input aria-label={p.label} type="number" required={p.key in draft} step={1} min={p.key === 'PT_BUFFER_MINUTES' || p.key === 'GYM_SHARE_PERCENT' || p.key === 'AUTO_RESCHEDULE_LIMIT' ? 0 : 1} className={`${inputCls} max-w-32`} value={valueOf(p)} placeholder={p.value === null ? 'Không giới hạn' : undefined} onChange={e => setDraft({ ...draft, [p.key]: e.target.value })} /></td>
                      <td className={td}>{p.unit}</td>
                    </tr>)}
                  </Table>
                </Panel>
              )
            })}
          </>
        )}</Loadable>
        <Panel>
          <div className="flex flex-wrap items-end gap-2">
            <input aria-label="Lý do điều chỉnh" placeholder="Lý do điều chỉnh (không bắt buộc)" className={`${inputCls} max-w-md`} value={note} onChange={e => setNote(e.target.value)} />
            <Button type="submit" isLoading={save.busy} disabled={!dirty.length || dirty.some(k => !draft[k]?.trim())}>Lưu thay đổi{dirty.length ? ` (${dirty.length})` : ''}</Button>
            <Button type="button" variant="outline" isLoading={reset.busy} onClick={() => {
              if (!window.confirm('Xác nhận khôi phục toàn bộ chính sách về giá trị mặc định?')) return
              void reset.run(async () => { await fixedPtApi.resetPolicies(); setDraft({}); setSuccess('Đã khôi phục chính sách về giá trị mặc định.'); await policies.reload() })
            }}>Khôi phục mặc định</Button>
          </div>
          <ErrorBanner message={save.error ?? reset.error} />
        </Panel>
      </fieldset>
      </form>
    </Page>
  )
}
