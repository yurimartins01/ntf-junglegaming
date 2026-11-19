export const SCENARIOS = {
  default: 'Normal behavior with short fixed latency.',
  empty: 'Catalog searches return no results.',
  slow: 'Every request takes 2.5s (skeletons stay visible).',
  'variable-latency': 'Latency follows a fixed sequence between 100ms and 1.8s.',
  'out-of-order': 'Catalog responses alternate 1.4s / 150ms so older requests resolve last.',
  offline: 'Every REST request fails with a network error and the socket refuses connections.',
  'server-error': 'Catalog and detail requests answer HTTP 503.',
  flaky: 'The first 3 attempts of each catalog/detail request fail with 503, then succeed (manual retry recovers).',
  'favorite-failure': 'Favorite add/remove mutations answer HTTP 500 (optimistic rollback).',
  'session-expired': 'New sessions expire 20 seconds after login.',
  forbidden: 'Profile, wallet and order endpoints answer HTTP 403.',
  'price-change': 'The first checkout quote is followed by a price increase of the first cart item via nft.updated.',
  'sold-out': 'The first checkout quote is followed by the first cart item edition selling out via nft.updated.',
  'order-timeout': 'The first order request is created but its response never arrives (client timeout); retry recovers it.',
  'payment-declined': 'Orders settle as declined.',
  'payment-slow': 'Orders stay pending for 8 seconds before confirming.',
  'socket-drop': 'The socket drops right after an order is created and stays offline for 5s; order recovery via REST.',
  'duplicate-events': 'Every realtime event is delivered twice followed by a stale replay.',
} as const

export type ScenarioName = keyof typeof SCENARIOS

const STORAGE_KEY = 'kurio:mock-scenario'

export function isScenarioName(value: unknown): value is ScenarioName {
  return typeof value === 'string' && value in SCENARIOS
}

let current: ScenarioName = 'default'

export function loadScenario(): ScenarioName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    current = isScenarioName(stored) ? stored : 'default'
  } catch {
    current = 'default'
  }
  return current
}

export function getScenario(): ScenarioName {
  return current
}

export function setScenario(name: ScenarioName) {
  current = name
  resetScenarioCounters()
  try {
    if (name === 'default') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, name)
  } catch {
  }
}

let requestCounter = 0
let catalogCounter = 0
const failureCounters = new Map<string, number>()
const oneShotFlags = new Set<string>()

export function resetScenarioCounters() {
  requestCounter = 0
  catalogCounter = 0
  failureCounters.clear()
  oneShotFlags.clear()
}

export function consumeOnce(key: string): boolean {
  if (oneShotFlags.has(key)) return false
  oneShotFlags.add(key)
  return true
}

export function countFailure(key: string): number {
  const next = (failureCounters.get(key) ?? 0) + 1
  failureCounters.set(key, next)
  return next
}

const VARIABLE_SEQUENCE = [120, 900, 300, 1800, 200, 650, 1200, 100]
let latencyOverride: number | null = null

export function setLatencyOverride(ms: number | null) {
  latencyOverride = ms
}

export type RequestKind = 'catalog' | 'detail' | 'default'

export function latencyFor(kind: RequestKind): number {
  if (latencyOverride !== null) return latencyOverride
  requestCounter += 1
  switch (current) {
    case 'slow':
      return 2500
    case 'variable-latency':
      return VARIABLE_SEQUENCE[requestCounter % VARIABLE_SEQUENCE.length] ?? 300
    case 'out-of-order':
      if (kind === 'catalog') {
        catalogCounter += 1
        return catalogCounter % 2 === 1 ? 1400 : 150
      }
      return 150
    default:
      return 120
  }
}
