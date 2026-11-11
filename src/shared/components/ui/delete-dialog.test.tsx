import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppApiError } from '@/shared/api/api-error'
import { DeleteDialog } from './delete-dialog'

const setup = (onConfirm: () => Promise<void>, name: string | null = 'Gói 10 buổi') => {
  const onClose = vi.fn()
  render(<DeleteDialog name={name} noun="gói PT" impact="Đơn đã bán giữ nguyên." onConfirm={onConfirm} onClose={onClose} />)
  return { onClose }
}

describe('DeleteDialog', () => {
  it('stays closed without a record', () => {
    setup(vi.fn(), null)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('names the record and its effect, deletes once on confirm and closes', async () => {
    let finish!: () => void
    const onConfirm = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    const { onClose } = setup(onConfirm)
    expect(screen.getByText('Xóa gói PT')).toBeInTheDocument()
    expect(screen.getByText('“Gói 10 buổi”')).toBeInTheDocument()
    expect(screen.getByText('Đơn đã bán giữ nguyên.')).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: 'Xóa' })
    fireEvent.click(confirm)
    fireEvent.click(confirm) // double click while the request runs
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled()
    finish()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('keeps the dialog open and shows the Vietnamese BE refusal, then allows a retry', async () => {
    const refusal = new AppApiError(409, { code: 'IN_USE', message: 'Gói đang có 2 đơn chưa kết thúc. Hãy ngừng bán gói thay vì xóa.' } as never)
    const onConfirm = vi.fn().mockRejectedValueOnce(refusal).mockResolvedValueOnce(undefined)
    const { onClose } = setup(onConfirm)
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Hãy ngừng bán gói thay vì xóa.')
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('falls back to a Vietnamese message for a network failure and cancels without deleting', async () => {
    const onConfirm = vi.fn().mockRejectedValue({})
    const { onClose } = setup(onConfirm)
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa. Vui lòng thử lại.')
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
