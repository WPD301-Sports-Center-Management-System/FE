import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeSelector } from './ThemeSelector'
import * as themeContextModule from '@/context/ThemeContext'
import type { ResolvedTheme, Theme } from '@/context/ThemeContext'

describe('ThemeSelector (Single Light / Dark Toggle Button)', () => {
  const mockSetTheme = vi.fn()
  const mockToggleTheme = vi.fn()

  const renderSelector = (resolvedTheme: ResolvedTheme = 'light', showLabels = false) => {
    vi.spyOn(themeContextModule, 'useTheme').mockReturnValue({
      theme: resolvedTheme as Theme,
      resolvedTheme,
      setTheme: mockSetTheme,
      toggleTheme: mockToggleTheme,
    })

    return render(<ThemeSelector showLabels={showLabels} />)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a single toggle button with accessible label in light mode', () => {
    renderSelector('light')

    const button = screen.getByRole('button', { name: /Chuyển sang giao diện tối/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Chuyển sang giao diện tối')
  })

  it('renders a single toggle button with accessible label in dark mode', () => {
    renderSelector('dark')

    const button = screen.getByRole('button', { name: /Chuyển sang giao diện sáng/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Chuyển sang giao diện sáng')
  })

  it('calls toggleTheme when the button is clicked', () => {
    renderSelector('light')

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('displays text label when showLabels is enabled', () => {
    renderSelector('dark', true)

    expect(screen.getByText('Sáng')).toBeInTheDocument()
  })
})
