export function readStorage<T>(storage: 'local' | 'session', key: string): T | null {
  try {
    const raw = (storage === 'local' ? localStorage : sessionStorage).getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeStorage(storage: 'local' | 'session', key: string, value: unknown) {
  try {
    ;(storage === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(value))
  } catch {
  }
}

export function removeStorage(storage: 'local' | 'session', key: string) {
  try {
    ;(storage === 'local' ? localStorage : sessionStorage).removeItem(key)
  } catch {
  }
}

export const STORAGE_KEYS = {
  session: 'kurio:session',
  guestCartId: 'kurio:guest-cart-id',
  pendingOrder: 'kurio:pending-order',
  checkoutDraft: 'kurio:checkout-draft',
  checkoutAttempt: 'kurio:checkout-attempt',
  walletConnection: 'kurio:wallet-connection',
} as const
