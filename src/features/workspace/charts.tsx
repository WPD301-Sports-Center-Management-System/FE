import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'

// Charts for the staff dashboards. The SVG is drawn at the container's real pixel width (no viewBox
// scaling), so text stays a crisp 12px at any card size. One y-axis, recessive grid, hover/keyboard
// tooltip, and a data table for screen readers. Series colors are validated with the dataviz script
// for light and dark surfaces: #EA580C / #0284C7.
export const SERIES_COLORS = ['#EA580C', '#0284C7'] as const

export interface ChartSeries { key: string; label: string; values: (number | null)[]; color?: string }
const colorOf = (s: ChartSeries, i: number) => s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]!

/** Width of an element, kept up to date with ResizeObserver. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current; if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e!.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** Smallest round step (1, 2, 2.5, 5 × 10^n) that covers `v`. */
function niceStep(v: number) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 2.5, 5, 10].map(m => m * p).find(m => m >= v) ?? v
}
function scaleY(max: number) { const step = niceStep(max / 4); return { step, top: step * 4, ticks: [0, 1, 2, 3, 4].map(k => k * step) } }

/** Monotone cubic path (Fritsch–Carlson): smooth, never overshoots the data. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length
  if (n < 2) return ''
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i]![0])
  const m = pts.slice(1).map((p, i) => (p[1] - pts[i]![1]) / dx[i]!)
  const t = pts.map((_, i) => i === 0 ? m[0]! : i === n - 1 ? m[n - 2]! : m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2)
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = t[i]! / m[i]!, b = t[i + 1]! / m[i]!, s = a * a + b * b
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]!; t[i + 1] = k * b * m[i]! }
  }
  let d = `M${pts[0]![0]},${pts[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]!, [x1, y1] = pts[i + 1]!, h = dx[i]! / 3
    d += ` C${x0 + h},${y0 + t[i]! * h} ${x1 - h},${y1 - t[i + 1]! * h} ${x1},${y1}`
  }
  return d
}

function Frame({ title, height, width, children, tooltip, onMove, onLeave, onKey, wrapRef }: { title: string; height: number; width: number; children: ReactNode; tooltip: ReactNode; onMove: (x: number) => void; onLeave: () => void; onKey: (k: string) => void; wrapRef: RefObject<HTMLDivElement | null> }) {
  const id = useId()
  return <div ref={wrapRef} className="relative w-full" style={{ height }}>
    {width > 0 && <svg width={width} height={height} role="img" aria-labelledby={id} tabIndex={0} className="block touch-none select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50"
      onPointerMove={e => onMove(e.clientX - e.currentTarget.getBoundingClientRect().left)} onPointerLeave={onLeave} onBlur={onLeave}
      onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) { e.preventDefault(); onKey(e.key) } }}>
      <title id={id}>{title}</title>
      {children}
    </svg>}
    {tooltip}
  </div>
}

function Tooltip({ x, width, title, rows, footer }: { x: number; width: number; title: string; rows: { label: string; color: string; value: string }[]; footer?: ReactNode }) {
  const right = x > width / 2
  return <div role="status" className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-xl border border-border-subtle bg-bg-surface/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur"
    style={right ? { right: width - x + 14 } : { left: x + 14 }}>
    <p className="mb-1.5 font-semibold text-text-primary">{title}</p>
    {rows.map(r => <p key={r.label} className="flex items-center justify-between gap-4 py-0.5 text-text-muted">
      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />{r.label}</span>
      <span className="font-semibold tabular-nums text-text-primary">{r.value}</span>
    </p>)}
    {footer && <div className="mt-1.5 border-t border-border-subtle pt-1.5">{footer}</div>}
  </div>
}

function SrTable({ title, labels, series, format }: { title: string; labels: string[]; series: ChartSeries[]; format: (v: number) => string }) {
  return <div className="sr-only"><table><caption>{title}</caption><thead><tr><th>Mốc</th>{series.map(s => <th key={s.key}>{s.label}</th>)}</tr></thead>
    <tbody>{labels.map((lb, i) => <tr key={i}><td>{lb}</td>{series.map(s => <td key={s.key}>{s.values[i] === null ? '—' : format(s.values[i]!)}</td>)}</tr>)}</tbody></table></div>
}

/** Legend chips: color + label + an optional headline value per series. */
export function ChartLegend({ items }: { items: { label: string; color: string; value?: string; note?: string }[] }) {
  return <ul className="mb-3 flex flex-wrap gap-2">{items.map(i => <li key={i.label} className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface-muted/50 px-2.5 py-1.5 text-xs">
    <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
    <span className="text-text-muted">{i.label}</span>
    {i.value && <span className="font-semibold tabular-nums text-text-primary">{i.value}</span>}
    {i.note && <span className="text-text-muted">{i.note}</span>}
  </li>)}</ul>
}

const M = { l: 48, r: 12, t: 12, b: 28 }
const gridCls = 'stroke-border-subtle'
const tickCls = 'fill-text-muted text-[12px] tabular-nums'

/** Stacked monthly bars (e.g. revenue by channel). `partial` marks a period that is still running. */
export function StackedBarChart({ labels, series, format, title, height = 260, partial }: { labels: string[]; series: ChartSeries[]; format: (v: number) => string; title: string; height?: number; partial?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const hatch = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const totals = labels.map((_, i) => series.reduce((n, s) => n + (s.values[i] ?? 0), 0))
  const { top, ticks } = scaleY(Math.max(1, ...totals))
  const plotW = Math.max(1, width - M.l - M.r), plotH = height - M.t - M.b
  const band = plotW / labels.length
  const barW = Math.min(30, Math.max(8, band * 0.56))
  const y = (v: number) => M.t + plotH - (v / top) * plotH
  const cx = (i: number) => M.l + band * i + band / 2
  const every = Math.max(1, Math.ceil(30 / band))
  const rounded = (x: number, yy: number, w: number, h: number, r: number) => { r = Math.min(r, h, w / 2); return `M${x},${yy + h} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + w - r} Q${x + w},${yy} ${x + w},${yy + r} V${yy + h} Z` }
  return <>
    <Frame wrapRef={ref} title={title} height={height} width={width}
      onMove={px => setHover(Math.max(0, Math.min(labels.length - 1, Math.floor((px - M.l) / band))))} onLeave={() => setHover(null)}
      onKey={k => setHover(h => k === 'Escape' ? null : k === 'ArrowRight' ? Math.min(labels.length - 1, (h ?? -1) + 1) : Math.max(0, (h ?? labels.length) - 1))}
      tooltip={hover !== null && <Tooltip x={cx(hover)} width={width} title={`${labels[hover]}${hover === partial ? ' · tới hôm nay' : ''}`}
        rows={[...series].reverse().map((s, k) => ({ label: s.label, color: colorOf(s, series.length - 1 - k), value: s.values[hover] === null ? '—' : format(s.values[hover]!) }))}
        footer={<p className="flex justify-between gap-4 text-text-muted"><span>Tổng</span><span className="font-semibold tabular-nums text-text-primary">{format(totals[hover]!)}</span></p>} />}>
      <defs><pattern id={hatch} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1={0} y1={0} x2={0} y2={6} stroke="#fff" strokeWidth={2} strokeOpacity={0.45} /></pattern></defs>
      {ticks.map(t => <g key={t}><line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} className={gridCls} strokeDasharray={t === 0 ? undefined : '3 4'} /><text x={M.l - 10} y={y(t) + 4} textAnchor="end" className={tickCls}>{format(t)}</text></g>)}
      {hover !== null && <rect x={M.l + band * hover + 2} y={M.t} width={band - 4} height={plotH} rx={6} className="fill-bg-surface-muted" />}
      {labels.map((lb, i) => {
        let base = 0
        const x = cx(i) - barW / 2
        const parts = series.map((s, si) => { const v = s.values[i] ?? 0; const from = base; base += v; return { v, from, to: base, color: colorOf(s, si) } }).filter(p => p.v > 0)
        return <g key={i}>
          {parts.map((p, k) => { const y1 = y(p.to), h = Math.max(0, y(p.from) - y1 - (k > 0 ? 2 : 0)); const d = k === parts.length - 1 ? rounded(x, y1, barW, h, 4) : `M${x},${y1} h${barW} v${h} h${-barW} Z`
            return <g key={k}><path d={d} fill={p.color} />{i === partial && <path d={d} fill={`url(#${hatch})`} />}</g> })}
          {(i % every === 0 || i === labels.length - 1) && <text x={cx(i)} y={height - 8} textAnchor="middle" className={`text-[12px] ${i === partial ? 'fill-text-primary font-semibold' : 'fill-text-muted'}`}>{lb}</text>}
        </g>
      })}
    </Frame>
    <SrTable title={title} labels={labels} series={series} format={format} />
  </>
}

/** Smooth lines with a soft area fill (e.g. visits per hour). `mark` highlights one x (a peak). */
export function AreaChart({ labels, series, format, title, height = 260, mark }: { labels: string[]; series: ChartSeries[]; format: (v: number) => string; title: string; height?: number; mark?: { index: number; label: string } }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')
  const all = series.flatMap(s => s.values.filter((v): v is number => v !== null))
  const { top, ticks } = scaleY(Math.max(1, ...all))
  const plotW = Math.max(1, width - M.l - M.r), plotH = height - M.t - M.b
  const x = (i: number) => M.l + (labels.length < 2 ? plotW / 2 : (i / (labels.length - 1)) * plotW)
  const y = (v: number) => M.t + plotH - (v / top) * plotH
  const every = Math.max(1, Math.ceil(44 / (plotW / Math.max(1, labels.length - 1))))
  return <>
    <Frame wrapRef={ref} title={title} height={height} width={width}
      onMove={px => setHover(Math.max(0, Math.min(labels.length - 1, Math.round(((px - M.l) / plotW) * (labels.length - 1)))))} onLeave={() => setHover(null)}
      onKey={k => setHover(h => k === 'Escape' ? null : k === 'ArrowRight' ? Math.min(labels.length - 1, (h ?? -1) + 1) : Math.max(0, (h ?? labels.length) - 1))}
      tooltip={hover !== null && <Tooltip x={x(hover)} width={width} title={labels[hover]!} rows={series.map((s, si) => ({ label: s.label, color: colorOf(s, si), value: s.values[hover] === null ? '—' : format(s.values[hover]!) }))} />}>
      <defs>{series.map((s, si) => <linearGradient key={s.key} id={`${gid}-${si}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={colorOf(s, si)} stopOpacity={0.22} /><stop offset="100%" stopColor={colorOf(s, si)} stopOpacity={0} /></linearGradient>)}</defs>
      {ticks.map(t => <g key={t}><line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} className={gridCls} strokeDasharray={t === 0 ? undefined : '3 4'} /><text x={M.l - 10} y={y(t) + 4} textAnchor="end" className={tickCls}>{format(t)}</text></g>)}
      {labels.map((lb, i) => (i % every === 0 && labels.length - 1 - i >= every || i === labels.length - 1) && <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-text-muted text-[12px]">{lb}</text>)}
      {mark && <g><line x1={x(mark.index)} x2={x(mark.index)} y1={M.t + 18} y2={M.t + plotH} className="stroke-border-strong" strokeDasharray="2 3" />
        <g transform={`translate(${Math.min(width - M.r - 56, Math.max(M.l + 56, x(mark.index)))},${M.t + 6})`}><rect x={-56} y={-6} width={112} height={20} rx={10} className="fill-bg-surface stroke-border-subtle" /><text y={8} textAnchor="middle" className="fill-text-primary text-[11px] font-semibold">{mark.label}</text></g></g>}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => v === null ? null : [x(i), y(v)] as [number, number]).filter((p): p is [number, number] => !!p)
        const line = smoothPath(pts)
        return <g key={s.key}>
          {pts.length > 1 && <path d={`${line} L${pts.at(-1)![0]},${M.t + plotH} L${pts[0]![0]},${M.t + plotH} Z`} fill={`url(#${gid}-${si})`} />}
          <path d={line} fill="none" stroke={colorOf(s, si)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      })}
      {hover !== null && <g>
        <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={M.t + plotH} className="stroke-border-strong" />
        {series.map((s, si) => s.values[hover] !== null && <circle key={s.key} cx={x(hover)} cy={y(s.values[hover]!)} r={5} fill={colorOf(s, si)} className="stroke-bg-surface" strokeWidth={2.5} />)}
      </g>}
    </Frame>
    <SrTable title={title} labels={labels} series={series} format={format} />
  </>
}
