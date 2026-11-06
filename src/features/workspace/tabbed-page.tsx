import { useState, type ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { PageHeader, Segmented } from './ui'

export interface PageTab { key: string; label: string; hint?: ReactNode; render: () => ReactNode }

/**
 * One page, several related tools: the active tab lives in `?tab=` so links and reloads land on it.
 * `bare`: each tab keeps its own page header (when it carries live figures); only the tab strip is added.
 */
export function TabbedPage({ title, tabs, actions, bare = false }: { title: string; tabs: PageTab[]; actions?: ReactNode; bare?: boolean }) {
  const [params, setParams] = useSearchParams()
  const current = tabs.find(t => t.key === params.get('tab')) ?? tabs[0]!
  const [visited, setVisited] = useState(() => new Set([current.key]))
  // Remember a route-derived tab before committing the render, so Back also preserves drafts.
  if (!visited.has(current.key)) setVisited(new Set([...visited, current.key]))
  const select = (key: string) => { const next = new URLSearchParams(params); next.set('tab', key); setParams(next, { replace: true }) }
  return <div>
    {!bare && <PageHeader title={title} subtitle={current.hint} actions={actions} />}
    <div className="mb-5"><Segmented label={title} value={current.key} onChange={select} items={tabs.map(t => ({ key: t.key, label: t.label }))} /></div>
    {tabs.filter(t => t.key === current.key || visited.has(t.key)).map(t => <div key={t.key} hidden={t.key !== current.key} role="tabpanel" aria-label={t.label}>{t.render()}</div>)}
  </div>
}

/** Old URLs of merged pages: go to the new page and tab, keeping their query (purchaseId, bookingId…). */
export function TabRedirect({ to, tab }: { to: string; tab: string }) {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  params.set('tab', tab)
  return <Navigate to={`${to}?${params}`} replace />
}
