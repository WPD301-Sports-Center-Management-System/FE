import { useEffect, useId, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Person } from './ui'

export interface PersonHit { id: string; name: string; sub?: string; avatarUrl?: string | null }

/** Combobox that looks people up (debounced) and hands the chosen one to `onPick`. */
export function PersonSearch({ find, onPick, label, placeholder, className = 'max-w-md', autoFocus }: { find: (term: string) => Promise<PersonHit[]>; onPick: (hit: PersonHit) => void; label: string; placeholder: string; className?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<PersonHit[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const term = q.trim()
  const showResults = open && term.length >= 2
  useEffect(() => {
    if (term.length < 2) { setItems(null); setBusy(false); setError(false); return }
    let alive = true
    setItems(null); setBusy(true); setError(false)
    const t = setTimeout(() => { find(term).then(r => { if (alive) { setItems(r.slice(0, 8)); setActive(0) } }).catch(() => { if (alive) { setItems([]); setError(true) } }).finally(() => alive && setBusy(false)) }, 250)
    return () => { alive = false; clearTimeout(t) }
  }, [term, find])
  const go = (hit: PersonHit) => { setOpen(false); setQ(''); setItems(null); onPick(hit) }
  return <div className={`relative w-full ${className}`}>
    {busy ? <Loader2 aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" /> : <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />}
    <input type="search" value={q} role="combobox" aria-expanded={showResults} aria-controls={showResults ? listId : undefined} aria-activedescendant={showResults && items?.[active] ? `${listId}-${active}` : undefined} aria-autocomplete="list" aria-label={label} autoFocus={autoFocus}
      placeholder={placeholder} onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
      onKeyDown={e => {
        if (e.key === 'Escape') { setOpen(false); return }
        if (!open || busy || !items?.length) return
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)) }
        if (e.key === 'Enter') { e.preventDefault(); go(items[active]!) }
      }}
      className="h-11 w-full rounded-lg border border-border-strong bg-bg-input pl-9 pr-3 text-base placeholder:text-text-muted focus:border-primary focus:bg-bg-surface focus:outline-none focus:ring-2 focus:ring-focus-ring/30 sm:text-sm" />
    {open && term.length < 2 && <p role="status" className="absolute left-0 right-0 top-full z-40 mt-1 rounded-lg border border-border-subtle bg-bg-surface px-3 py-3 text-sm text-text-muted shadow-lg">Nhập ít nhất 2 ký tự để tìm kiếm.</p>}
    {showResults && <ul id={listId} role="listbox" aria-busy={busy || undefined} className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border-subtle bg-bg-surface p-1 shadow-xl">
      {busy && <li role="presentation" className="px-3 py-3 text-sm text-text-muted"><span role="status">Đang tìm kiếm…</span></li>}
      {!busy && items?.length === 0 && <li role="presentation" className="px-3 py-3 text-sm text-text-muted"><span role={error ? 'alert' : 'status'}>{error ? 'Chưa tìm kiếm được. Kiểm tra kết nối rồi nhập lại tên hoặc số điện thoại.' : 'Không tìm thấy. Thử tên khác hoặc số điện thoại.'}</span></li>}
      {items?.map((m, i) => <li id={`${listId}-${i}`} key={m.id} role="option" aria-selected={i === active} onMouseDown={e => e.preventDefault()} onClick={() => go(m)} onMouseEnter={() => setActive(i)}
        className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${i === active ? 'bg-bg-surface-muted' : ''}`}>
        <Person name={m.name} src={m.avatarUrl} size={30} />
        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{m.name}</span>{m.sub && <span className="block text-xs text-text-muted">{m.sub}</span>}</span>
      </li>)}
    </ul>}
  </div>
}
