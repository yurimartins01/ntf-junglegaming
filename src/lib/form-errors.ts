import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toApiError } from './api/errors'

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
  fieldAliases: Record<string, string> = {},
): string | null {
  const apiError = toApiError(error)
  let mapped = false
  for (const [field, message] of Object.entries(apiError.fieldErrors)) {
    const target = fieldAliases[field] ?? field
    if (knownFields.includes(target)) {
      setError(target as Path<T>, { type: 'server', message })
      mapped = true
    }
  }
  return mapped ? null : apiError.message
}

export function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return '/'
  if (target.startsWith('/login') || target.startsWith('/register')) return '/'
  return target
}
