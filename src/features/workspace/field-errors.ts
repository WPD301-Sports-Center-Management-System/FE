import { isAppApiError } from '@/shared/api/api-error'

/**
 * The server names every invalid field with the same label the form shows (e.g. "Số điện thoại"). A failed submit publishes those
 * labels here and each <Field> with a matching label turns red and shows its own message. Cleared on the next submit or edit.
 */
export const FIELD_ERRORS_EVENT = 'app:field-errors'
export type FieldErrorMap = Record<string, string>
export const normalizeLabel = (s: string) => s.replace(/\*/g, '').trim().toLowerCase()

export function publishFieldErrors(error: unknown) {
  const map: FieldErrorMap = {}
  if (isAppApiError(error)) for (const e of error.errors ?? []) if (e.label) map[normalizeLabel(e.label)] ??= e.message
  window.dispatchEvent(new CustomEvent<FieldErrorMap>(FIELD_ERRORS_EVENT, { detail: map }))
}
