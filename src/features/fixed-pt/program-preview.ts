import type { ProgramTemplate, SessionWithContent } from './types'

/** Match applyProgram: a skipped assigned session still occupies its rotation slot. */
export function previewProgram(sessions: SessionWithContent[], program: ProgramTemplate, overwrite: boolean) {
  if (!program.slots.length) return []
  return sessions.filter(s => ['CONFIRMED', 'ARRIVED'].includes(s.status) && s.creditId)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((session, i) => ({ session, slot: program.slots[i % program.slots.length], skip: session.content?.status === 'ASSIGNED' && !overwrite }))
}
