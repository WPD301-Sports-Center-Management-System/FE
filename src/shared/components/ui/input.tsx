import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border bg-bg-input px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring/40 ${
            error ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-primary'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options = [], children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full rounded-xl border bg-bg-input px-3.5 py-2.5 text-sm text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring/40 ${
            error ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-primary'
          } ${className}`}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-primary">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const textId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textId} className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <textarea
          id={textId}
          ref={ref}
          className={`w-full rounded-xl border bg-bg-input px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring/40 ${
            error ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-primary'
          } ${className}`}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
