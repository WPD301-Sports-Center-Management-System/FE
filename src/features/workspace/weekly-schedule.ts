export interface WeeklySlot { weekday: number; startTime: string }
export interface WeeklyInterval extends WeeklySlot { endTime: string }
export interface AvailableSlot extends WeeklySlot { available: boolean }
export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7]
export const DAY_LABELS = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
export const clockMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h! * 60 + m! }
export const minuteClock = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
export const sameSlot = (a: WeeklySlot, b: WeeklySlot) => a.weekday === b.weekday && a.startTime === b.startTime
export const sortSlots = <T extends WeeklySlot>(slots: T[]) => [...slots].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))

export function selectSlot(value: WeeklySlot[], slot: WeeklySlot, maxDays: number, remove = true): WeeklySlot[] {
  if (remove && value.some(v => sameSlot(v, slot))) return value.filter(v => !sameSlot(v, slot))
  if (!value.some(v => v.weekday === slot.weekday) && value.length >= maxDays) return value
  return sortSlots([...value.filter(v => v.weekday !== slot.weekday), slot])
}

/** Copy only into unselected days with the same free time, never over another selection. */
export function copyPatternDay(value: WeeklySlot[], source: number, targets: number[], free: AvailableSlot[], maxDays: number) {
  const slot = value.find(v => v.weekday === source)
  if (!slot) return value
  let result = value
  for (const weekday of targets) {
    if (result.some(v => v.weekday === weekday) || !free.some(s => s.available && s.weekday === weekday && s.startTime === slot.startTime)) continue
    result = selectSlot(result, { weekday, startTime: slot.startTime }, maxDays, false)
  }
  return result
}

/** Heuristic suggestions only; the server's full-series preview remains the authority. */
export function recommendPatterns(slots: AvailableSlot[], count: number, preference: 'any' | 'morning' | 'evening' = 'any') {
  const free = slots.filter(s => s.available)
  const target = preference === 'morning' ? 8 * 60 : preference === 'evening' ? 18 * 60 : 12 * 60
  const penalty = (time: string) => preference === 'any' ? 0 : Math.abs(clockMinutes(time) - target)
  const byDay = WEEK_DAYS.map(weekday => ({ weekday, slots: free.filter(s => s.weekday === weekday).sort((a, b) => penalty(a.startTime) - penalty(b.startTime) || a.startTime.localeCompare(b.startTime)) })).filter(d => d.slots.length)
  if (count < 1 || byDay.length < count) return []
  const candidates: { pattern: WeeklySlot[]; score: number }[] = []
  const combinations = (start: number, days: typeof byDay) => {
    if (days.length === count) {
      const commonTimes = [...new Set(days[0]!.slots.map(s => s.startTime))].filter(t => days.every(d => d.slots.some(s => s.startTime === t)))
      const variants = [days.map(d => ({ weekday: d.weekday, startTime: d.slots[0]!.startTime })), ...commonTimes.map(t => days.map(d => ({ weekday: d.weekday, startTime: t })))]
      for (const pattern of variants) {
        const gaps = days.map((d, i) => (days[(i + 1) % days.length]!.weekday + (i === days.length - 1 ? 7 : 0)) - d.weekday)
        const score = Math.min(...gaps) * 100 + (new Set(pattern.map(s => s.startTime)).size === 1 ? 20 : 0) - pattern.reduce((sum, s) => sum + penalty(s.startTime), 0) / 30
        candidates.push({ pattern, score })
      }
      return
    }
    for (let i = start; i < byDay.length; i++) combinations(i + 1, [...days, byDay[i]!])
  }
  combinations(0, [])
  const seen = new Set<string>()
  return candidates.sort((a, b) => b.score - a.score).filter(c => { const key = JSON.stringify(c.pattern); if (seen.has(key)) return false; seen.add(key); return true }).slice(0, 3).map(c => c.pattern)
}

/** Union overlapping/adjacent ranges; keep exact minute boundaries from existing rules. */
export function mergeIntervals(rows: WeeklyInterval[]): WeeklyInterval[] {
  const result: WeeklyInterval[] = []
  for (const row of sortSlots(rows)) {
    if (row.startTime >= row.endTime) continue
    const last = result.at(-1)
    if (last && last.weekday === row.weekday && row.startTime <= last.endTime) last.endTime = last.endTime > row.endTime ? last.endTime : row.endTime
    else result.push({ ...row })
  }
  return result
}

export function paintHours(rows: WeeklyInterval[], days: number[], start: string, end: string, erase: boolean) {
  if (!erase) return mergeIntervals([...rows, ...days.map(weekday => ({ weekday, startTime: start, endTime: end }))])
  return rows.flatMap(row => {
    if (!days.includes(row.weekday) || row.endTime <= start || row.startTime >= end) return [row]
    return [row.startTime < start ? { ...row, endTime: start } : null, row.endTime > end ? { ...row, startTime: end } : null].filter((v): v is WeeklyInterval => v !== null)
  })
}

export function copyHoursDay(rows: WeeklyInterval[], source: number, targets: number[]) {
  const sourceRows = rows.filter(r => r.weekday === source)
  return mergeIntervals([...rows.filter(r => !targets.includes(r.weekday) || r.weekday === source), ...targets.filter(d => d !== source).flatMap(weekday => sourceRows.map(r => ({ ...r, weekday })))])
}
