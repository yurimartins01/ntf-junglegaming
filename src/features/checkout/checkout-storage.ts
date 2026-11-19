import { useSyncExternalStore } from 'react'
import type { CreateOrderRequest, WalletProvider } from '@/lib/api/contracts'
import { STORAGE_KEYS, readStorage, removeStorage, writeStorage } from '@/lib/storage'
import { fnv1a } from '@/lib/hash'

interface PendingOrderRecord {
  userId: string
  orderId: string
}

interface AttemptRecord {
  userId: string
  key: string
  fingerprint: string
  payload: CreateOrderRequest
}

export const pendingOrderStore = {
  get(userId: string): string | null {
    const record = readStorage<PendingOrderRecord>('local', STORAGE_KEYS.pendingOrder)
    return record && record.userId === userId ? record.orderId : null
  },
  set(userId: string, orderId: string) {
    writeStorage('local', STORAGE_KEYS.pendingOrder, { userId, orderId } satisfies PendingOrderRecord)
  },
  clear() {
    removeStorage('local', STORAGE_KEYS.pendingOrder)
  },
}

export function fingerprintOf(payload: CreateOrderRequest): string {
  return fnv1a(JSON.stringify([payload.quoteId, payload.network, payload.walletSlot, payload.provider, payload.collector.walletAddress]))
}

export const attemptStore = {
  get(userId: string): AttemptRecord | null {
    const record = readStorage<AttemptRecord>('session', STORAGE_KEYS.checkoutAttempt)
    return record && record.userId === userId ? record : null
  },
  begin(userId: string, payload: CreateOrderRequest): AttemptRecord {
    const fingerprint = fingerprintOf(payload)
    const existing = attemptStore.get(userId)
    if (existing && existing.fingerprint === fingerprint) return existing
    const record: AttemptRecord = { userId, key: `ik_${crypto.randomUUID()}`, fingerprint, payload }
    writeStorage('session', STORAGE_KEYS.checkoutAttempt, record)
    return record
  },
  clear() {
    removeStorage('session', STORAGE_KEYS.checkoutAttempt)
  },
}

export type ConnectionStatus = 'disconnected' | 'connected'

interface ConnectionRecord {
  userId: string
  provider: WalletProvider
  address: string
}

type Listener = () => void
const listeners = new Set<Listener>()
let cache: ConnectionRecord | null | undefined

function readConnection(): ConnectionRecord | null {
  if (cache === undefined) cache = readStorage<ConnectionRecord>('session', STORAGE_KEYS.walletConnection)
  return cache
}

function emit() {
  for (const listener of listeners) listener()
}

export const walletConnection = {
  get: readConnection,
  connect(record: ConnectionRecord) {
    cache = record
    writeStorage('session', STORAGE_KEYS.walletConnection, record)
    emit()
  },
  disconnect() {
    cache = null
    removeStorage('session', STORAGE_KEYS.walletConnection)
    emit()
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useWalletConnection(userId: string): ConnectionRecord | null {
  const record = useSyncExternalStore(walletConnection.subscribe, walletConnection.get, walletConnection.get)
  return record && record.userId === userId ? record : null
}
