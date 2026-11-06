import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import { UnsavedChanges } from './unsaved-changes'
function Editor() { const [text,setText]=useState('');return <><UnsavedChanges dirty={!!text}/><input aria-label="Note" value={text} onChange={e=>setText(e.target.value)}/><Link to="/next">Next</Link></> }
afterEach(cleanup)
it('keeps the unfinished sheet until the user chooses to discard it',async()=>{
  const router=createMemoryRouter([{path:'/',element:<Editor/>},{path:'/next',element:<h1>Next page</h1>}])
  render(<RouterProvider router={router}/> )
  fireEvent.change(screen.getByLabelText('Note'),{target:{value:'Unfinished result'}})
  fireEvent.click(screen.getByRole('link',{name:'Next'}))
  await screen.findByRole('dialog')
  fireEvent.click(screen.getByRole('button',{name:'Ở lại để lưu'}))
  expect(screen.getByLabelText('Note')).toHaveValue('Unfinished result')
  fireEvent.click(screen.getByRole('link',{name:'Next'}))
  fireEvent.click(await screen.findByRole('button',{name:'Rời trang, bỏ phần chưa lưu'}))
  await screen.findByRole('heading',{name:'Next page'})
})
