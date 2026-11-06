import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import { TabbedPage } from './tabbed-page'
function Editor() { const [value,setValue]=useState(''); return <input aria-label="Draft" value={value} onChange={e=>setValue(e.target.value)} /> }
afterEach(cleanup)
it('keeps the unfinished editor when switching away and back using keyboard tabs',()=>{
  render(<MemoryRouter><TabbedPage title="Tools" tabs={[{key:'editor',label:'Editor',render:()=> <Editor/>},{key:'library',label:'Library',render:()=> <p>Library content</p>}]} /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Draft'),{target:{value:'Unfinished plan'}})
  fireEvent.keyDown(screen.getByRole('tab',{name:'Editor'}),{key:'ArrowRight'})
  expect(screen.getByRole('tab',{name:'Library'})).toHaveAttribute('aria-selected','true')
  expect(screen.getByLabelText('Draft')).not.toBeVisible()
  fireEvent.keyDown(screen.getByRole('tab',{name:'Library'}),{key:'Home'})
  expect(screen.getByLabelText('Draft')).toBeVisible()
  expect(screen.getByLabelText('Draft')).toHaveValue('Unfinished plan')
})
