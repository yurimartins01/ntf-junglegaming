const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function formatReceiptDate(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

export function shortHash(value: string): string {
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value
}
