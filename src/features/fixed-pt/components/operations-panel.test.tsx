import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { OperationsPanel } from './operations-panel'
vi.mock('../hybrid-api', () => ({ hybridGet: async () => ({ longPaused: [], pendingSchedule: [{ id: 'p', purchaseCode: 'PT-1', packageNameSnapshot: 'PT 12 buổi', coachNameSnapshot: 'Coach An', availableCredits: 2 }] }) }))
it('renders the current operations contract without an absence review queue', async () => {
  render(<MemoryRouter><OperationsPanel /></MemoryRouter>)
  expect(await screen.findByText('PT 12 buổi · PT-1')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Tiếp tục xử lý' })).toHaveAttribute('href', '/manager/pt-purchases/p')
  expect(screen.queryByText('Duyệt bảo lưu')).not.toBeInTheDocument()
})
