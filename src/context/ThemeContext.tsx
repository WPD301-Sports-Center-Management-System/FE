import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'theme'

function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isValidTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function getSystemResolvedTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

function resolveVisualTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemResolvedTheme()
  }
  return theme
}

function applyThemeToDocument(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (resolved === 'dark') {
    if (!root.classList.contains('dark')) {
      root.classList.add('dark')
    }
    root.style.colorScheme = 'dark'
  } else {
    if (root.classList.contains('dark')) {
      root.classList.remove('dark')
    }
    root.style.colorScheme = 'light'
  }
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export interface ThemeProviderProps {
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: PropsWithChildren<ThemeProviderProps>) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme()
    return stored || defaultTheme
  })

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    // If inline script has already run on the client, preserve root DOM theme
    if (typeof document !== 'undefined') {
      const isDarkDom = document.documentElement.classList.contains('dark')
      return isDarkDom ? 'dark' : 'light'
    }
    return resolveVisualTheme(theme)
  })

  // Synchronize DOM whenever theme changes
  useEffect(() => {
    const resolved = resolveVisualTheme(theme)
    setResolvedTheme(resolved)
    applyThemeToDocument(resolved)
  }, [theme])

  // Listen for OS system theme changes when user chooses 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleMediaChange = (e?: MediaQueryListEvent | { matches: boolean }) => {
      if (theme === 'system') {
        const isDark = typeof e?.matches === 'boolean' ? e.matches : mediaQuery.matches
        const nextResolved: ResolvedTheme = isDark ? 'dark' : 'light'
        setResolvedTheme(nextResolved)
        applyThemeToDocument(nextResolved)
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange)
    } else if ('addListener' in mediaQuery) {
      // Legacy compatibility for older browsers
      ;(mediaQuery as { addListener: (cb: () => void) => void }).addListener(handleMediaChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange)
      } else if ('removeListener' in mediaQuery) {
        ;(mediaQuery as { removeListener: (cb: () => void) => void }).removeListener(handleMediaChange)
      }
    }
  }, [theme])

  // Cross-tab synchronization via storage event
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return

      const nextTheme = isValidTheme(e.newValue) ? e.newValue : 'system'
      setThemeState(nextTheme)
      const nextResolved = resolveVisualTheme(nextTheme)
      setResolvedTheme(nextResolved)
      applyThemeToDocument(nextResolved)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newTheme)
      }
    } catch {
      // Safe fallback if localStorage is disabled or throws
    }
    const resolved = resolveVisualTheme(newTheme)
    setResolvedTheme(resolved)
    applyThemeToDocument(resolved)
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [resolvedTheme, setTheme])

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
