import { useCallback, useState } from 'react'
import { PersonSearch } from '@/features/workspace/person-search'
import { deskApi } from '@/features/reception-workspace/api'
import { useLoad } from '../hooks'
import { Async, inputCls } from '@/features/workspace/ui'

export function PurchasePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [memberId, setMember] = useState('')
  const find = useCallback(async (search: string) => (await deskApi.members({ search, limit: 10 })).items.map(m => ({ id: m.id, name: m.user.fullName, sub: [m.memberCode, m.user.phone].filter(Boolean).join(' · ') })), [])
  const list = useLoad(() => deskApi.purchases({ memberId }), [memberId], !!memberId)
  return <div className="space-y-2"><PersonSearch label="Tìm học viên theo tên hoặc số điện thoại" placeholder="Nhập tên hoặc số điện thoại…" find={find} onPick={m => { setMember(m.id); onChange('') }} />{memberId && <Async state={list} rows={1}>{rows => <select aria-label="Gói của học viên" className={inputCls} value={value} onChange={e => onChange(e.target.value)}><option value="">Chọn mã gói</option>{rows.map(p => <option key={p.id} value={p.id}>{p.purchaseCode} · {p.packageNameSnapshot} · {p.coachNameSnapshot}</option>)}</select>}</Async>}</div>
}
