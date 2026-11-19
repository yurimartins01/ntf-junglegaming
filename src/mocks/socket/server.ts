import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdatedEvent, Order, OrderUpdatedEvent, RealtimeEvent } from '@/lib/api/contracts'
import { SOCKET_URL } from '@/lib/realtime-config'
import { db, randomId } from '../db/db'
import { getScenario } from '../scenarios/scenarios'
import { resolveToken } from '../services/auth'


type SocketIo = ReturnType<typeof toSocketIo>

interface MockConnection {
  id: string
  userId: string | null
  io: SocketIo
  close: () => void
  pingTimer: ReturnType<typeof setInterval>
}

const connections = new Map<string, MockConnection>()
const lastEventByResource = new Map<string, RealtimeEvent>()
const previousEventByResource = new Map<string, RealtimeEvent>()
let blockedUntil = 0

const PING_INTERVAL_MS = 20_000

const realtime = ws.link(`${SOCKET_URL}/*`)

export const socketHandler = realtime.addEventListener('connection', (connection) => {
  const { client } = connection

  if (getScenario() === 'offline' || Date.now() < blockedUntil) {
    queueMicrotask(() => client.close(1011, 'Mock realtime unavailable'))
    return
  }

  const io = toSocketIo(connection)
  const entry: MockConnection = {
    id: randomId('sock'),
    userId: null,
    io,
    close: () => client.close(),
    pingTimer: setInterval(() => client.send('2'), PING_INTERVAL_MS),
  }
  connections.set(entry.id, entry)

  client.addEventListener('message', (event) => {
    if (typeof event.data === 'string' && event.data.startsWith('40')) {
      try {
        const auth = JSON.parse(event.data.slice(2) || '{}') as { token?: string | null }
        entry.userId = resolveToken(auth.token ?? null)?.id ?? null
      } catch {
        entry.userId = null
      }
    }
  })

  client.addEventListener('close', () => {
    clearInterval(entry.pingTimer)
    connections.delete(entry.id)
  })
})

function deliver(event: RealtimeEvent) {
  for (const conn of connections.values()) {
    if (event.userId && conn.userId !== event.userId) continue
    conn.io.client.emit(event.type, event)
  }
}

export function broadcast(event: RealtimeEvent) {
  const key = `${event.resource.type}:${event.resource.id}`
  const previous = lastEventByResource.get(key)
  if (previous) previousEventByResource.set(key, previous)
  lastEventByResource.set(key, event)

  deliver(event)
  if (getScenario() === 'duplicate-events') {
    deliver(event)
    if (previous) deliver(previous)
  }
}

export function emitRaw(event: RealtimeEvent) {
  deliver(event)
}

export function replayPrevious(resourceType: 'nft' | 'order', id: string): boolean {
  const event = previousEventByResource.get(`${resourceType}:${id}`)
  if (!event) return false
  deliver(event)
  return true
}

export function replayLast(resourceType: 'nft' | 'order', id: string): boolean {
  const event = lastEventByResource.get(`${resourceType}:${id}`)
  if (!event) return false
  deliver(event)
  return true
}

export function dropConnections(blockMs: number, userId?: string) {
  blockedUntil = Date.now() + blockMs
  for (const conn of [...connections.values()]) {
    if (userId && conn.userId !== userId) continue
    conn.close()
  }
}

export function connectionCount(): number {
  return connections.size
}

export function publishNftUpdated(nftId: string) {
  const state = db().nfts[nftId]
  if (!state) return
  const event: NftUpdatedEvent = {
    eventId: randomId('evt'),
    type: 'nft.updated',
    resource: { type: 'nft', id: nftId },
    version: state.version,
    emittedAt: new Date().toISOString(),
    payload: {
      price: state.price,
      previousPrice: state.previousPrice,
      editions: Object.entries(state.available).map(([id, available]) => ({
        id: id as NftUpdatedEvent['payload']['editions'][number]['id'],
        available,
      })),
      totalAvailable: Object.values(state.available).reduce((a, b) => a + b, 0),
    },
  }
  broadcast(event)
}

export function publishOrderUpdated(order: Order, userId: string) {
  const event: OrderUpdatedEvent = {
    eventId: randomId('evt'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    userId,
    emittedAt: new Date().toISOString(),
    payload: { status: order.status, order },
  }
  broadcast(event)
}
