import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export interface ThemeSelectorProps {
  className?: string
  showLabels?: boolean
  size?: 'sm' | 'md'
}

/**
 * Nút chuyển đổi giao diện đơn: Sáng / Tối
 */
export function ThemeSelector({
  className = '',
  showLabels = false,
  size = 'sm',
}: ThemeSelectorProps) {
  const { resolvedTheme, toggleTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const handleToggle = () => {
    if (toggleTheme) {
      toggleTheme()
    } else {
      setTheme(isDark ? 'light' : 'dark')
    }
  }

  const padding =
    size === 'sm'
      ? showLabels
        ? 'px-2.5 py-1.5'
        : 'p-2'
      : showLabels
        ? 'px-3 py-2'
        : 'p-2.5'

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5'

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-surface text-text-muted hover:text-text-primary hover:bg-bg-surface-muted transition-all duration-200 cursor-pointer shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${padding} ${className}`}
    >
      {isDark ? (
        <Sun className={`${iconSize} text-amber-400 transition-transform duration-200 hover:rotate-45 shrink-0`} />
      ) : (
        <Moon className={`${iconSize} text-text-primary transition-transform duration-200 hover:-rotate-12 shrink-0`} />
      )}
      {showLabels && (
        <span className="text-xs font-semibold select-none">
          {isDark ? 'Sáng' : 'Tối'}
        </span>
      )}
    </button>
  )
}

export const ThemeToggle = ThemeSelector
