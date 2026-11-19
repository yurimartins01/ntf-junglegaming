import type { RealtimeEvent } from '@/lib/api/contracts'

export type GuardVerdict = 'apply' | 'duplicate' | 'stale' | 'foreign'

export class EventGuard {
  private readonly seen = new Set<string>()
  private readonly order: string[] = []
  private readonly versions = new Map<string, number>()

  constructor(private readonly capacity = 500) {}

  check(event: RealtimeEvent, currentUserId: string | null): GuardVerdict {
    if (event.userId && event.userId !== currentUserId) return 'foreign'
    if (this.seen.has(event.eventId)) return 'duplicate'
    this.remember(event.eventId)
    const key = `${event.resource.type}:${event.resource.id}`
    const known = this.versions.get(key) ?? 0
    if (event.version <= known) return 'stale'
    this.versions.set(key, event.version)
    return 'apply'
  }

  observe(resourceType: string, id: string, version: number) {
    const key = `${resourceType}:${id}`
    if (version > (this.versions.get(key) ?? 0)) this.versions.set(key, version)
  }

  reset() {
    this.seen.clear()
    this.order.length = 0
    this.versions.clear()
  }

  private remember(eventId: string) {
    this.seen.add(eventId)
    this.order.push(eventId)
    if (this.order.length > this.capacity) this.seen.delete(this.order.shift()!)
  }
}
