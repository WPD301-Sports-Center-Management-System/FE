import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

function TestConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="resolved-val">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}

describe('ThemeContext & ThemeProvider', () => {
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = []
  let matchesDark = false

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
    mediaQueryListeners = []
    matchesDark = false

    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: matchesDark,
      media: query,
      onchange: null,
      addListener: vi.fn((cb) => mediaQueryListeners.push(cb)),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') mediaQueryListeners.push(cb)
      }),
      removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
        mediaQueryListeners = mediaQueryListeners.filter((listener) => listener !== cb)
      }),
      dispatchEvent: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws an error if useTheme is used outside ThemeProvider', () => {
    // Suppress console.error in React during intentional throw test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within a ThemeProvider')
    consoleSpy.mockRestore()
  })

  it('initializes to "system" by default and applies OS scheme (light)', () => {
    matchesDark = false
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('initializes to "system" and applies OS scheme (dark)', () => {
    matchesDark = true
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('reads and applies stored theme "dark" from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('reads and applies stored theme "light" from localStorage', () => {
    localStorage.setItem('theme', 'light')
    matchesDark = true // even if OS is dark, stored light takes precedence
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('light')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('falls back to "system" when localStorage contains invalid data', () => {
    localStorage.setItem('theme', 'unknown-invalid-theme')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('system')
  })

  it('updates theme to dark and light on manual selection, updating DOM and localStorage', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Switch to dark
    act(() => {
      screen.getByText('Set Dark').click()
    })

    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    // Switch to light
    act(() => {
      screen.getByText('Set Light').click()
    })

    expect(screen.getByTestId('theme-val')).toHaveTextContent('light')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('toggles theme back and forth between light and dark when toggleTheme is called', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('resolved-val')).toHaveTextContent('light')

    // 1st toggle: light -> dark
    act(() => {
      screen.getByText('Toggle Theme').click()
    })
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // 2nd toggle: dark -> light
    act(() => {
      screen.getByText('Toggle Theme').click()
    })
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('updates resolvedTheme when system preference changes while in system mode', () => {
    matchesDark = false
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('light')

    // Simulate OS switching to dark
    matchesDark = true
    act(() => {
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent)
      })
    })

    expect(screen.getByTestId('theme-val')).toHaveTextContent('system') // user preference unchanged
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('synchronizes theme when another tab writes to localStorage via storage event', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Simulate cross-tab event
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: 'dark',
        })
      )
    })

    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved-val')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('handles localStorage throwing exceptions safely without crashing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded or SecurityError')
    })

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(() => {
      act(() => {
        screen.getByText('Set Dark').click()
      })
    }).not.toThrow()

    expect(screen.getByTestId('theme-val')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
