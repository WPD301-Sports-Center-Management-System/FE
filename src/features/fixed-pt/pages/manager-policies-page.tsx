import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { PolicyRow } from '../types'
import { ErrorBanner, inputCls, Loadable, Notice, Page, Panel, Table, td } from '../components/ui'

const OPTIONS: Record<string, [string, string][]> = {
  LATE_OUTCOME_EARNING: [['MANAGER_CONFIRM', 'Chờ Manager xác nhận'], ['AUTO', 'Tự động đủ điều kiện']],
}
const SOURCE = { APPROVED: 'Đã phê duyệt', INTERIM: 'Tạm thời (an toàn) – chưa phê duyệt', MISSING: 'Chưa có – chức năng liên quan bị chặn' }

// Manager records the product owner's decisions (D-xx). Missing values block the dependent action
// instead of the system inventing a number.
export function ManagerPoliciesPage() {
  const policies = useLoad(() => fixedPtApi.policies(), [])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState('')
  const save = useSubmit()
  const dirty = Object.keys(draft)
  const valueOf = (p: PolicyRow) => draft[p.key] ?? (p.value === null || p.value === undefined ? '' : String(p.value))
  return (
    <Page title="Chính sách vận hành PT">
      <Notice tone="warning">Chỉ nhập giá trị đã được chủ sản phẩm phê duyệt. Không để trống giá trị đang sửa; chính sách chỉ có thể cập nhật, không thể xóa. Đơn đã mua giữ chính sách được lưu tại thời điểm mua.</Notice>
      {success && <Notice tone="success">{success}</Notice>}
      <form onSubmit={e => {
        e.preventDefault()
        void save.run(async () => {
          await fixedPtApi.setPolicies(dirty.map(k => ({ key: k, value: OPTIONS[k] ? draft[k] : Number(draft[k]), note: note.trim() || undefined })))
          setDraft({}); setSuccess('Đã lưu chính sách vận hành PT.'); await policies.reload()
        })
      }}>
      <fieldset disabled={save.busy}>
      <Panel title="Giá trị hiện hành">
        <Loadable state={policies}>{items => (
          <Table head={['Quyết định', 'Chính sách', 'Giá trị', 'Nguồn']}>
            {items.map(p => <tr key={p.key}>
              <td className={td}>{p.decision}</td>
              <td className={td}>{p.label}<div className="text-xs text-text-muted">{p.key}</div></td>
              <td className={td}>{OPTIONS[p.key]
                ? <select aria-label={p.label} className={inputCls} value={valueOf(p)} onChange={e => setDraft({ ...draft, [p.key]: e.target.value })}>{OPTIONS[p.key]!.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
                : <input aria-label={p.label} type="number" required={p.key in draft} step={1} min={p.key === 'PT_BUFFER_MINUTES' ? 0 : 1} className={inputCls} value={valueOf(p)} onChange={e => setDraft({ ...draft, [p.key]: e.target.value })} />}</td>
              <td className={td}><span className={p.source === 'MISSING' ? 'text-danger' : p.source === 'INTERIM' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}>{SOURCE[p.source]}</span></td>
            </tr>)}
          </Table>
        )}</Loadable>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <input aria-label="Ghi chú phê duyệt" placeholder="Ghi chú/biên bản phê duyệt" className={`${inputCls} max-w-md`} value={note} onChange={e => setNote(e.target.value)} />
          <Button type="submit" isLoading={save.busy} disabled={!dirty.length || dirty.some(k => !draft[k]?.trim())}>Lưu {dirty.length || ''} thay đổi</Button>
        </div>
        <ErrorBanner message={save.error} />
      </Panel>
      </fieldset>
      </form>

    </Page>
  )
}
