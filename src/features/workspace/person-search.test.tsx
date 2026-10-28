import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersonSearch } from './person-search'
import { num } from './utils'
describe('Person lookup and measurement values',()=>{
  afterEach(()=>vi.useRealTimers())
  it('does not retain a spinner or select old results after clearing the search',async()=>{
    vi.useFakeTimers()
    const find=vi.fn().mockResolvedValue([{id:'a',name:'An'}]),pick=vi.fn()
    render(<PersonSearch label="Find" placeholder="Find" find={find} onPick={pick}/>)
    fireEvent.change(screen.getByRole('combobox'),{target:{value:'An'}})
    await act(async()=>{await vi.advanceTimersByTimeAsync(250)})
    expect(screen.getByRole('option')).toHaveTextContent('An')
    fireEvent.change(screen.getByRole('combobox'),{target:{value:'Binh'}})
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox'),{target:{value:''}})
    fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'})
    expect(pick).not.toHaveBeenCalled()
    expect(document.querySelector('.animate-spin')).toBeNull()
  })
  it('Escape dismisses the combobox and Enter cannot pick a hidden option',async()=>{
    const pick=vi.fn(),find=vi.fn().mockResolvedValue([{id:'a',name:'An'}])
    render(<PersonSearch label="Find" placeholder="Find" find={find} onPick={pick}/>)
    fireEvent.change(screen.getByRole('combobox'),{target:{value:'An'}})
    await waitFor(()=>expect(screen.getByRole('option')).toBeInTheDocument())
    fireEvent.keyDown(screen.getByRole('combobox'),{key:'Escape'})
    fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'})
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();expect(pick).not.toHaveBeenCalled()
  })
  it('keeps missing health measurements distinct from a real zero',()=>{
    expect([null,undefined,'','  '].map(num)).toEqual([null,null,null,null])
    expect(num('0')).toBe(0);expect(num('72.5')).toBe(72.5)
  })
})
