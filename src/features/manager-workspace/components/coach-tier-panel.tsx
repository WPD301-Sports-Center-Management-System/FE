import { useState } from 'react'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Async, Btn, Card, EmptyBox, Field, InlineError, Table, td, inputCls } from '@/features/workspace/ui'
import { coachTiers, tierLabels, tierLabel, type CoachTier } from '@/shared/utils/coach-tier'
import { mgrApi, type CoachTierProfile } from '../api'

export function CoachTierPanel() {
  const coaches = useLoad(() => mgrApi.coachApplications())
  const [selectedId, setSelectedId] = useState('')
  const selected = coaches.data?.find(c => c.id === selectedId)
  return <Card title="Bậc Coach" subtitle="Bậc quyết định gói được bán và giá của đơn mới. Đơn đã mua tiếp tục theo giá và bậc đã lưu.">
    <Async state={coaches} rows={3} empty={rows => !rows.some(c => c.applicationStatus === 'APPROVED') && <EmptyBox title="Chưa có Coach đã duyệt" />}>
      {rows => <div className="space-y-4"><Field label="Coach"><select aria-label="Coach cần đổi bậc" className={inputCls} value={selectedId} onChange={e => setSelectedId(e.target.value)}><option value="">Chọn Coach đã duyệt</option>{rows.filter(c => c.applicationStatus === 'APPROVED').map(c => <option key={c.id} value={c.id}>{c.user.fullName} · {tierLabel(c.tier)}</option>)}</select></Field>
        {selected && <TierEditor key={selected.id} coach={selected} onSaved={coaches.reload} />}
      </div>}
    </Async>
  </Card>
}
function TierEditor({ coach, onSaved }: { coach: CoachTierProfile; onSaved: () => Promise<void> }) {
  const [tier, setTier] = useState<CoachTier>(coach.tier)
  const [reason, setReason] = useState('')
  const [saved, setSaved] = useState('')
  const submit = useSubmit()
  const history = useLoad(() => mgrApi.tierHistory(coach.id), [coach.id])
  const valid = tier !== coach.tier && !!reason.trim()
  return <div className="space-y-5">
    <dl className="grid grid-cols-2 gap-4 bg-bg-surface-muted p-4 sm:grid-cols-4">
      <div><dt className="text-sm text-text-muted">Kinh nghiệm</dt><dd>{coach.yearsOfExperience == null ? '—' : coach.yearsOfExperience + ' năm'}</dd></div>
      <div><dt className="text-sm text-text-muted">Buổi đã dạy xong</dt><dd>{coach.completedSessions}</dd></div>
      <div><dt className="text-sm text-text-muted">Đánh giá</dt><dd>{coach.averageRating ?? '—'}/5 · {coach.reviewCount} lượt</dd></div>
      <div><dt className="text-sm text-text-muted">Chứng chỉ</dt><dd className="flex flex-wrap gap-2">{coach.certificateUrls?.length ? coach.certificateUrls.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-primary underline">Chứng chỉ {i + 1}</a>) : '—'}</dd></div>
    </dl>
    <form className="space-y-3" onSubmit={async e => {
      e.preventDefault(); if (!valid) return
      const result = await submit.run(() => mgrApi.setCoachTier(coach.id, tier, reason.trim()))
      if (result) { setSaved('Đã lưu bậc ' + tierLabels[tier] + ' cho ' + coach.user.fullName + '.'); setReason(''); await Promise.all([onSaved(), history.reload()]) }
    }}>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Bậc Coach"><select aria-label="Bậc giá Coach" className={inputCls} value={tier} disabled={submit.busy} onChange={e => { setTier(e.target.value as CoachTier); setSaved('') }}>{coachTiers.map(t => <option key={t} value={t}>{tierLabels[t]}</option>)}</select></Field><Field label="Lý do" required><input aria-label="Lý do đổi bậc" required maxLength={5000} className={inputCls} value={reason} onChange={e => setReason(e.target.value)} disabled={submit.busy} /></Field></div>
      <InlineError message={submit.error} />{saved && <p role="status" className="text-sm">{saved}</p>}<Btn type="submit" busy={submit.busy} disabled={!valid}>Lưu bậc Coach</Btn>
    </form>
    <section aria-label="Lịch sử bậc"><h3 className="mb-3 font-semibold">Lịch sử bậc</h3><Async state={history} rows={2} empty={rows => !rows.length && <EmptyBox title="Chưa có lịch sử bậc" />}>
      {rows => <><ul className="space-y-4 sm:hidden">{rows.map((row, i) => <li key={row.changedAt + i} className="space-y-2 rounded-lg bg-bg-surface-muted p-3"><p className="font-medium">{row.source === 'APPROVAL' ? 'Duyệt hồ sơ' : tierLabel(row.fromTier)} → {tierLabel(row.toTier)}</p><p className="text-sm text-text-muted">{row.changedBy?.fullName ?? '—'} · {new Date(row.changedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</p><p className="whitespace-pre-wrap break-words text-sm">{row.reason ?? '—'}</p></li>)}</ul><div className="hidden sm:block"><Table alignLast={false} head={['Thời điểm', 'Thay đổi', 'Người thực hiện', 'Lý do']} minWidth={640}>{rows.map((row, i) => <tr key={row.changedAt + i}><td className={td}>{new Date(row.changedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}</td><td className={td}>{row.source === 'APPROVAL' ? 'Duyệt hồ sơ' : tierLabel(row.fromTier)} → {tierLabel(row.toTier)}</td><td className={td}>{row.changedBy?.fullName ?? '—'}</td><td className={td + ' whitespace-pre-wrap break-words'}>{row.reason ?? '—'}</td></tr>)}</Table></div></>}
    </Async></section>
  </div>
}
