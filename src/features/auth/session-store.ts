import { useSyncExternalStore } from 'react'
import type { SessionResponse, User } from '@/lib/api/contracts'
import { STORAGE_KEYS, readStorage, removeStorage, writeStorage } from '@/lib/storage'

export type Session = SessionResponse

type Listener = () => void
const listeners = new Set<Listener>()
let current: Session | null = readStorage<Session>('local', STORAGE_KEYS.session)

function emit() {
  for (const listener of listeners) listener()
}

export const sessionStore = {
  get: (): Session | null => current,
  set(session: Session) {
    current = session
    writeStorage('local', STORAGE_KEYS.session, session)
    emit()
  },
  updateUser(user: User) {
    if (!current) return
    current = { ...current, user }
    writeStorage('local', STORAGE_KEYS.session, current)
    emit()
  },
  clear() {
    current = null
    removeStorage('local', STORAGE_KEYS.session)
    emit()
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useSession(): Session | null {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.get)
}

export function getGuestCartId(): string {
  let id = readStorage<string>('local', STORAGE_KEYS.guestCartId)
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '')
    writeStorage('local', STORAGE_KEYS.guestCartId, id)
  }
  return id
}

export function rotateGuestCartId() {
  removeStorage('local', STORAGE_KEYS.guestCartId)
}

const expiryListeners = new Set<() => void>()
export const sessionEvents = {
  onExpired(listener: () => void) {
    expiryListeners.add(listener)
    return () => {
      expiryListeners.delete(listener)
    }
  },
  emitExpired() {
    for (const listener of expiryListeners) listener()
  },
}
