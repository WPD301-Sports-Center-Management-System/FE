import type { ReactNode } from 'react'
import { Card, Btn as WorkspaceButton, inputCls, ErrorBox, Skeleton } from '@/features/workspace/ui'

export const Box = ({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) => (
  <Card title={title} actions={right}><div className="space-y-3">{children}</div></Card>
)
export const Btn = ({ children, onClick, disabled, tone = 'primary' }: { children: ReactNode; onClick: () => void; disabled?: boolean; tone?: 'primary' | 'ghost' | 'danger' }) => (
  <WorkspaceButton variant={tone === 'ghost' ? 'outline' : tone} disabled={disabled} onClick={onClick}>{children}</WorkspaceButton>
)
export const Input = ({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-text-primary">{label}
    <input className={inputCls} type={type} step={type === 'number' ? 'any' : undefined} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
  </label>
)
export const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-text-primary">{label}
    <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
)
export const Err = ({ error }: { error?: string | null }) => (error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p> : null)
export function LoadState({ state, children, empty }: { state: { loading: boolean; error: string | null; data: unknown; reload: () => void }; children: ReactNode; empty?: boolean }) {
  if (state.error) return <ErrorBox message={state.error} onRetry={() => void state.reload()} />
  if (state.loading && !state.data) return <Skeleton rows={3} />
  if (empty) return <p className="py-4 text-sm text-text-muted">Chưa có dữ liệu ở mục này.</p>
  return <>{children}</>
}

