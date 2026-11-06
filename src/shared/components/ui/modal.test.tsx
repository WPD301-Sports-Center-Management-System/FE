import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './modal'
describe('Modal keyboard and scroll containment',()=>{
  it('traps focus on initial Tab, restores scrolling, and only closes the top dialog',()=>{
    const first=vi.fn(),last=vi.fn()
    const view=render(<><Modal isOpen title="First" onClose={first}><input aria-label="One"/></Modal><Modal isOpen title="Last" onClose={last}><input aria-label="Two"/></Modal></>)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(window,{key:'Tab'})
    expect(screen.getAllByRole('button',{name:'Đóng'})[1]).toHaveFocus()
    fireEvent.keyDown(window,{key:'Escape'})
    expect(last).toHaveBeenCalledTimes(1);expect(first).not.toHaveBeenCalled()
    view.unmount();expect(document.body.style.overflow).toBe('')
  })
})
