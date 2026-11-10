import { useState } from 'react'
import { hybridGet, hybridSend } from '@/features/fixed-pt/hybrid-api'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Async, Btn, EmptyBox, Field, InlineError, inputCls, useFlash } from '@/features/workspace/ui'
import { FlowSteps } from '@/features/workspace/flow-steps'
type Request = { id: string; fullName: string; phone: string; note?: string | null; coachDecision?: string | null }
export function CoachTrialRequests({ compact = false, waiting = false }: { compact?: boolean; waiting?: boolean }) {
  const state = useLoad(() => hybridGet<Request[]>('/coaches/me/trial-sessions', { status: 'REQUESTED', limit: 100 }), [], !waiting)
  const [declining, setDeclining] = useState<string | null>(null), [response, setResponse] = useState('')
  const act = useSubmit(), { flash, node } = useFlash()
  const decide = (id: string, decision: 'ACCEPTED' | 'DECLINED') => void act.run(async () => { await hybridSend('post', `/coaches/me/trial-sessions/${id}/decision`, { decision, ...(decision === 'DECLINED' && response.trim() ? { response: response.trim() } : {}) }); setDeclining(null); setResponse(''); flash(decision === 'ACCEPTED' ? 'Đã nhận khách. Lễ tân sẽ chốt giờ và buổi thử sẽ xuất hiện trong lịch dạy.' : 'Đã báo lễ tân để khách chọn PT phù hợp.'); await state.reload() })
  // REQUESTED only returns undecided trials. Accepted/unscheduled trials have no Coach read model yet.
  if (waiting) return <section className="rounded-lg bg-bg-surface-muted p-3 text-sm" role="status"><h3 className="mb-2 font-semibold">Tập thử chờ lễ tân</h3><p>Danh sách khách đã nhận nhưng chưa chốt giờ chưa được hỗ trợ tại đây. Trao đổi với lễ tân để theo dõi lịch hẹn.</p></section>
  const visible = state.data?.filter(r => !['ACCEPTED','DECLINED'].includes(r.coachDecision ?? ''))
  if (compact && visible?.length === 0) return null
  return <section className="rounded-lg bg-bg-surface-muted p-3"><h3 className="mb-2 font-semibold">Khách tập thử chờ bạn</h3>{node}<Async state={state} rows={2}>{() => !visible?.length ? <EmptyBox title="Không có khách chờ phản hồi" /> : <>{!compact && <FlowSteps steps={['Bạn nhận khách', 'Lễ tân chốt giờ', 'Buổi thử vào lịch']} current={0} />}<ul className="mt-4 divide-y divide-border-subtle">{visible.map(r => <li key={r.id} className="space-y-3 py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{r.fullName}</p><p className="text-sm text-text-primary">{r.phone}</p>{r.note && <p className="mt-1 text-sm">{r.note}</p>}</div><div className="flex gap-2"><><Btn size="sm" variant="primary" busy={act.busy} onClick={() => decide(r.id, 'ACCEPTED')}>Nhận khách</Btn><Btn size="sm" disabled={act.busy} onClick={() => { setDeclining(r.id); setResponse(''); act.clear() }}>Chưa thể nhận</Btn></></div></div>{declining === r.id && <form className="space-y-2" onSubmit={e => { e.preventDefault(); if (response.trim()) decide(r.id, 'DECLINED') }}><Field label="Lý do chưa nhận khách"><input required maxLength={180} className={inputCls} value={response} onChange={e => setResponse(e.target.value)} /></Field><Btn type="submit" size="sm" busy={act.busy} disabled={!response.trim()}>Gửi phản hồi cho lễ tân</Btn></form>}</li>)}</ul></>}</Async><InlineError message={act.error} /></section>
}
