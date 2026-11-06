import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { membersService } from '@/features/memberships/services/members.service'
import { Avatar } from '@/shared/components/ui/avatar'

/** Staff-wide quick search: find a member by name, code or phone from any page and open their profile. */
export function MemberSearch() {
  const navigate = useNavigate()
  const listId = useId()
  const box = useRef<HTMLDivElement>(null)
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250)
    return () => clearTimeout(t)
  }, [term])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const results = useQuery({
    queryKey: ['member-quick-search', debounced],
    queryFn: async () => (await membersService.getMembers({ search: debounced, limit: 6 })).data ?? [],
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  })
  const items = debounced.length >= 2 ? results.data ?? [] : []

  const go = (id: string) => {
    setOpen(false)
    setTerm('')
    navigate(`/receptionist/members?memberId=${id}`)
  }

  return (
    <div ref={box} className="relative hidden w-72 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={listId}
        aria-label="Tìm hội viên"
        placeholder="Tìm hội viên: tên, mã, SĐT…"
        value={term}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
          if (e.key === 'Enter' && items[active]) go(items[active].id)
          if (e.key === 'Escape') setOpen(false)
        }}
        className="w-full rounded-xl border border-border-subtle bg-bg-input py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
      />
      {results.isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
      {open && debounced.length >= 2 && !results.isFetching && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-xl border border-border-subtle bg-bg-surface p-1 shadow-xl">
          {results.isError ? (
            <li className="px-3 py-2 text-sm text-danger">Không tìm được, thử lại sau.</li>
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-muted">Không có hội viên khớp “{debounced}”.</li>
          ) : (
            items.map((m, i) => (
              <li key={m.id} role="option" aria-selected={i === active}>
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(m.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${i === active ? 'bg-bg-surface-muted' : ''}`}>
                  <Avatar src={m.avatarUrl} name={m.fullName} size={28} className="rounded-full" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">{m.fullName}</span>
                    <span className="block truncate text-xs text-text-muted">{m.memberCode}{m.phone ? ` · ${m.phone}` : ''}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
