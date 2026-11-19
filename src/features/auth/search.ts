export interface AuthSearch {
  redirect?: string
  reason?: string
}

const str = (value: unknown) => (typeof value === 'string' && value ? value : undefined)

export function parseAuthSearch(raw: Record<string, unknown>): AuthSearch {
  const redirect = str(raw.redirect)
  const reason = str(raw.reason)
  return { ...(redirect ? { redirect } : {}), ...(reason ? { reason } : {}) }
}
