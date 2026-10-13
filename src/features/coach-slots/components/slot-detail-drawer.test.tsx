import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SlotDetailDrawer } from './slot-detail-drawer'

describe('SlotDetailDrawer', () => {
  afterEach(() => vi.restoreAllMocks())

  it('cancels a blocked slot through the supported delete action', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onDeleteSlot = vi.fn()
    render(
      <SlotDetailDrawer
        isOpen
        onClose={vi.fn()}
        slot={{ id: 'slot-1', status: 'BLOCKED', startsAt: '2026-10-20T09:00:00Z', endsAt: '2026-10-20T10:00:00Z' } as never}
        onDeleteSlot={onDeleteSlot}
      />
    )
    expect(screen.queryByText('Mở lại khung giờ')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy khung giờ' }))
    expect(onDeleteSlot).toHaveBeenCalledWith('slot-1')
  })
})
