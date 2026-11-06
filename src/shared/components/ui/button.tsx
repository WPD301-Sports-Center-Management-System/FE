import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'

    const sizeStyles = {
      sm: 'min-h-11 sm:min-h-8 px-3 py-1.5 text-sm sm:text-xs gap-1.5',
      md: 'min-h-11 px-4 py-2 text-sm gap-2',
      lg: 'min-h-12 px-5 py-2.5 text-base gap-2.5',
    }[size]

    const variantStyles = {
      primary:
        'bg-primary hover:bg-primary-hover text-primary-foreground focus:ring-focus-ring',
      secondary:
        'bg-bg-surface-muted hover:bg-border-subtle text-text-primary border border-border-subtle focus:ring-focus-ring',
      outline:
        'bg-transparent hover:bg-bg-surface-muted text-text-primary border border-border-strong focus:ring-focus-ring',
      ghost: 'bg-transparent hover:bg-bg-surface-muted text-text-muted hover:text-text-primary focus:ring-focus-ring',
      danger: 'bg-danger hover:bg-red-500 text-white shadow-lg shadow-danger/30 focus:ring-danger',
    }[variant]

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
