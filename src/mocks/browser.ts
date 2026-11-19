import { setupWorker } from 'msw/browser'
import type { EditionId, RealtimeEvent } from '@/lib/api/contracts'
import { initDb, persist, resetDb } from './db/db'
import { authHandlers } from './handlers/auth'
import { catalogHandlers } from './handlers/catalog'
import { commerceHandlers } from './handlers/commerce'
import { walletHandlers } from './handlers/wallets'
import {
  SCENARIOS,
  getScenario,
  loadScenario,
  setLatencyOverride,
  setScenario,
  type ScenarioName,
} from './scenarios/scenarios'
import { expireAllSessions } from './services/auth'
import { updateNft } from './services/inventory'
import { resumePendingOrders } from './services/orders'
import { connectionCount, dropConnections, emitRaw, replayLast, replayPrevious, socketHandler } from './socket/server'

export const handlers = [...catalogHandlers, ...authHandlers, ...commerceHandlers, ...walletHandlers, socketHandler]

export interface KurioMockControls {
  scenarios: typeof SCENARIOS
  getScenario: () => ScenarioName
  setScenario: (name: ScenarioName) => void
  reset: () => Promise<void>
  updateNft: (nftId: string, patch: { price?: string; available?: Partial<Record<EditionId, number>> }) => void
  emitRaw: (event: RealtimeEvent) => void
  replayLast: (resource: 'nft' | 'order', id: string) => boolean
  replayPrevious: (resource: 'nft' | 'order', id: string) => boolean
  expireSessions: () => void
  dropSocket: (blockMs?: number) => void
  socketConnections: () => number
  setLatency: (ms: number | null) => void
}

declare global {
  interface Window {
    __kurioMocks?: KurioMockControls
  }
}

export async function startMockServer({ reset = false }: { reset?: boolean } = {}) {
  loadScenario()
  if (reset) await resetDb()
  else await initDb()
  resumePendingOrders()

  window.__kurioMocks = {
    scenarios: SCENARIOS,
    getScenario,
    setScenario,
    reset: async () => {
      await resetDb()
    },
    updateNft: (nftId, patch) => {
      updateNft(nftId, patch)
      persist()
    },
    emitRaw,
    replayLast,
    replayPrevious,
    expireSessions: () => {
      expireAllSessions()
      persist()
    },
    dropSocket: (blockMs = 3000) => dropConnections(blockMs),
    socketConnections: connectionCount,
    setLatency: setLatencyOverride,
  }

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
