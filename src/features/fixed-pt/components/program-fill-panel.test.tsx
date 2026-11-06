import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixedPtApi } from '../api'
import { useSubmit } from '../hooks'
import { previewProgram } from '../program-preview'
import type { ProgramTemplate, SessionWithContent } from '../types'
import { ProgramFillPanel } from './program-fill-panel'

vi.mock('../api', () => ({ fixedPtApi: { programTemplates: vi.fn(), applyProgram: vi.fn() } }))
const program: ProgramTemplate = { id: 'p', name: 'Toàn thân', version: 1, slots: ['Thân trên', 'Thân dưới'].map((name, i) => ({ label: i === 0 ? 'A' : 'B', sessionTemplateId: `t${i}`, sessionTemplate: { id: `t${i}`, name } })) }
const session = (id: string, status: SessionWithContent['status'], contentStatus?: 'ASSIGNED' | 'DRAFT'): SessionWithContent => ({ id, creditId: id, status, startsAt: `2026-11-${id}T02:00:00Z`, endsAt: `2026-11-${id}T03:00:00Z`, credit: { creditIndex: Number(id), status: 'SCHEDULED' }, content: contentStatus ? { status: contentStatus, title: 'Nội dung cũ' } : null } as SessionWithContent)
const rows = () => [session('08', 'COMPLETED'), session('09', 'CONFIRMED', 'ASSIGNED'), session('10', 'CONFIRMED', 'DRAFT'), session('11', 'ARRIVED')]
const reload = vi.fn(async () => {})
const onApplied = vi.fn()
function TestPanel({ error = null }: { error?: string | null }) {
  const submit = useSubmit()
  return <MemoryRouter><ProgramFillPanel purchaseId="purchase" sessions={{ data: rows(), loading: false, error, reload }} submit={submit} onApplied={onApplied} /></MemoryRouter>
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fixedPtApi.programTemplates).mockResolvedValue([program])
  vi.mocked(fixedPtApi.applyProgram).mockResolvedValue({ applied: ['10', '11'], skipped: ['09'] })
})
afterEach(cleanup)
async function choose() {
  render(<TestPanel />)
  await screen.findByRole('option', { name: 'Toàn thân' })
  fireEvent.change(screen.getByLabelText('Chọn chu kỳ giáo án'), { target: { value: 'p' } })
}
describe('program preview and coach workflow', () => {
  it('matches chronological backend rotation and keeps assigned slots in the cycle', () => {
    const data = [...rows().reverse(), { ...session('12', 'CONFIRMED'), creditId: null }, session('13', 'CANCELLED_EARLY')]
    expect(previewProgram(data, program, false).map(p => [p.session.id, p.slot.label, p.skip])).toEqual([['09', 'A', true], ['10', 'B', false], ['11', 'A', false]])
    expect(previewProgram(data, program, true).every(p => !p.skip)).toBe(true)
    expect(previewProgram(data, { ...program, slots: [] }, false)).toEqual([])
  })
  it('explains drafts and submits only the selected cycle without publishing', async () => {
    await choose()
    expect(screen.getByText('2 buổi sẽ được điền nháp')).toBeInTheDocument()
    expect(screen.getByText('Giữ nguyên')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Điền nháp cho 2 buổi' }))
    await waitFor(() => expect(fixedPtApi.applyProgram).toHaveBeenCalledExactlyOnceWith('purchase', { programTemplateId: 'p', overwrite: false, level: undefined }))
    expect(onApplied).toHaveBeenCalledWith(expect.stringContaining('giáo án nháp cho 2 buổi'))
    expect(reload).toHaveBeenCalledOnce()
  })
  it('shows the effect and requires confirmation when replacing assigned lessons', async () => {
    await choose()
    fireEvent.click(screen.getByText('Thông số & buổi đã giao'))
    fireEvent.click(screen.getByLabelText('Thay cả giáo án của các buổi đã giao cho học viên'))
    fireEvent.change(screen.getByLabelText(/Trình độ để điền thông số/), { target: { value: 'BEGINNER' } })
    fireEvent.click(screen.getByRole('button', { name: 'Điền nháp cho 3 buổi' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Thay giáo án của 1 buổi đã giao?')
    expect(fixedPtApi.applyProgram).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Thay và lưu bản nháp' }))
    await waitFor(() => expect(fixedPtApi.applyProgram).toHaveBeenCalledWith('purchase', { programTemplateId: 'p', overwrite: true, level: 'BEGINNER' }))
  })
  it('blocks applying when the session preview cannot load', async () => {
    render(<TestPanel error="Không tải được lịch" />)
    await screen.findByRole('option', { name: 'Toàn thân' })
    fireEvent.change(screen.getByLabelText('Chọn chu kỳ giáo án'), { target: { value: 'p' } })
    expect(screen.getByRole('button', { name: 'Điền nháp cho 2 buổi' })).toBeDisabled()
    expect(screen.getByText('Không tải được lịch')).toBeInTheDocument()
  })
})
