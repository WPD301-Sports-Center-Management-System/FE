import { useState } from 'react'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, LinkBtn, Segmented, inputCls } from '@/features/workspace/ui'
type Purchase = { id: string; purchaseCode: string; packageNameSnapshot: string; pauseNote?: string | null; coachNameSnapshot?: string; availableCredits?: number }
type Ops = { longPaused: Purchase[]; pendingSchedule: Purchase[] }
export function OperationsPanel() {
  const state = useLoad(() => hybridGet<Ops>('/pt-operations'))
  const [tab, setTab] = useState<'pending' | 'paused'>('pending')
  return <Card title="Tiếp tục phục vụ học viên" actions={<div className="[&_[role=tab]]:text-text-primary"><Segmented label="Việc cần làm" value={tab} onChange={setTab} items={[{ key: 'pending', label: 'Chờ xếp lịch', count: state.data?.pendingSchedule.length }, { key: 'paused', label: 'Bảo lưu cần xem lại', count: state.data?.longPaused.length }]} /></div>}>
    <Async state={state} rows={3}>{data => { const rows = tab === 'pending' ? data.pendingSchedule : data.longPaused; return !rows.length ? <EmptyBox title={tab === 'pending' ? 'Không có gói chờ xếp lịch' : 'Không có bảo lưu cần rà soát'} /> : <ul className="divide-y divide-border-subtle">{rows.map(p => <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="font-medium">{p.packageNameSnapshot} · {p.purchaseCode}</p><p className="mt-1 text-sm text-text-muted">{p.coachNameSnapshot}{tab === 'paused' ? ` · ${p.pauseNote ?? 'Đang bảo lưu'}` : ` · ${p.availableCredits ?? 0} buổi tập chờ Coach đề xuất`}</p></div><div className="flex items-center gap-3"><Badge tone={tab === 'paused' ? 'neutral' : 'warning'}>{tab === 'paused' ? 'Buổi tập được giữ lại' : 'Cần lịch mới'}</Badge><LinkBtn size="sm" to={`/manager/pt-purchases/${p.id}`}>Tiếp tục xử lý</LinkBtn></div></li>)}</ul> }}</Async>
  </Card>
}
/** Manager's lifecycle action lives on the purchase it changes. */
export function PurchaseLifecycle({ id, status, onChanged }: { id: string; status: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false), [note, setNote] = useState(''), [until, setUntil] = useState('')
  const act = useSubmit()
  if (!['ACTIVE', 'PAUSED'].includes(status)) return null
  const resume = status === 'PAUSED'
  return <Card title={resume ? 'Tiếp tục gói PT' : 'Bảo lưu gói'}>
    <p className="my-3 text-sm text-text-muted">{resume ? 'Mở lại sẽ báo Coach đề xuất lịch theo giờ trống hiện tại.' : 'Bảo lưu hủy các buổi tương lai, giữ lại buổi tập và không trừ lượt nghỉ của học viên.'}</p>
    {resume ? <Btn busy={act.busy} onClick={() => void act.run(async () => { await hybridSend('post', `/pt-package-purchases/${id}/resume`, {}); onChanged() })}>Mở lại và báo Coach xếp lịch</Btn> : !open ? <Btn onClick={() => setOpen(true)}>Bảo lưu gói này</Btn> : <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (note.trim()) void act.run(async () => { await hybridSend('post', `/pt-package-purchases/${id}/pause`, { note: note.trim(), ...(until ? { until } : {}) }); setOpen(false); onChanged() }) }}><Field label="Lý do bảo lưu"><textarea required maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className={inputCls} /></Field><Field label="Dự kiến đến ngày (không bắt buộc)"><input type="date" value={until} onChange={e => setUntil(e.target.value)} className={inputCls} /></Field><div className="flex gap-2"><Btn type="submit" busy={act.busy} disabled={!note.trim()}>Xác nhận bảo lưu</Btn><Btn disabled={act.busy} onClick={() => setOpen(false)}>Để sau</Btn></div></form>}
    <InlineError message={act.error} />
  </Card>
}
