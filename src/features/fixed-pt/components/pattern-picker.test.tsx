import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PatternPicker } from './pattern-picker'
import type { PatternSlot } from '../series-api'

function Selection() {
  const [value, setValue] = useState<PatternSlot[]>([])
  return <PatternPicker data={{ sessionsPerWeek: 3, slots: [], suggestions: [] }} value={value} onChange={setValue} />
}
describe('Member weekly limit', () => {
  it('allows six days regardless of package cadence, disables a seventh, and allows swapping days', () => {
    render(<Selection />)
    for (const day of ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']) fireEvent.click(screen.getByRole('button', { name: day }))
    expect(screen.getByRole('status')).toHaveTextContent('6/6 ngày đã chọn')
    const sunday = screen.getByRole('button', { name: 'Chủ nhật' })
    expect(sunday).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Cả tuần' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thứ 2' }))
    expect(sunday).toBeEnabled()
    fireEvent.click(sunday)
    expect(sunday).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Thứ 2' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('6/6 ngày đã chọn')
  })
})
