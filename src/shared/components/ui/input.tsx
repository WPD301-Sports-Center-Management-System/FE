import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useId } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const description = [props['aria-describedby'], (error || helperText) && `${inputId}-hint`].filter(Boolean).join(' ') || undefined
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`min-h-11 w-full rounded-lg border bg-bg-input px-3.5 py-2.5 text-base sm:text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring/40 ${
            error ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-primary'
          } ${className}`}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={description}
        />
        {error ? (
          <p id={`${inputId}-hint`} role="alert" className="text-sm text-danger">{error}</p>
        ) : helperText ? (
          <p id={`${inputId}-hint`} className="text-sm text-text-muted">{helperText}</p>
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
    const generatedId = useId()
    const selectId = id || generatedId
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`min-h-11 w-full rounded-lg border bg-bg-input px-3.5 py-2.5 text-base sm:text-sm text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring/40 ${
            error ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-primary'
          } ${className}`}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={[props['aria-describedby'], error && `${selectId}-hint`].filter(Boolean).join(' ') || undefined}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-primary">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p id={`${selectId}-hint`} role="alert" className="text-sm text-danger">{error}</p>}
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
    const generatedId = useId()
    const textId = id || generatedId
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          id={textId}
          ref={ref}
          className={`w-full rounded-lg border bg-bg-input px-3.5 py-2.5 text-base sm:text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring/40 ${
            error ? 'border-danger focus:border-danger' : 'border-border-subtle focus:border-primary'
          } ${className}`}
          rows={3}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={[props['aria-describedby'], error && `${textId}-hint`].filter(Boolean).join(' ') || undefined}
        />
        {error && <p id={`${textId}-hint`} role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
