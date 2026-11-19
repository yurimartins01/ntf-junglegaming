export function parseSearch(searchString: string): Record<string, unknown> {
  const params = new URLSearchParams(searchString.startsWith('?') ? searchString.slice(1) : searchString)
  const result: Record<string, unknown> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    result[key] = values.length > 1 ? values : values[0]
  }
  return result
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) for (const item of value) params.append(key, String(item))
    else params.append(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}
