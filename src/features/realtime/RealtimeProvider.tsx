import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { io as createSocket, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/session-store'
import { REALTIME_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent } from '@/lib/api/contracts'
import { whenApiReady } from '@/lib/api/ready'
import { SOCKET_URL } from '@/lib/realtime-config'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { applyNftUpdated, applyOrderUpdated, reconcileAfterReconnect } from './cache-sync'
import { EventGuard } from './event-guard'

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected'

const RealtimeContext = createContext<RealtimeStatus>('connecting')

export function useRealtimeStatus() {
  return useContext(RealtimeContext)
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const session = useSession()
  const announce = useAnnouncer()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const token = session?.token ?? null
  const userId = session?.user.id ?? null

  useEffect(() => {
    let cancelled = false
    let teardown = () => {}

    function connect(io: typeof createSocket) {
      const guard = new EventGuard()
      const socket: Socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
        timeout: 3000,
      })
      let hasConnected = false

      const onConnect = () => {
        setStatus('connected')
        if (hasConnected) reconcileAfterReconnect(queryClient)
        hasConnected = true
      }
      const onDisconnect = () => setStatus('disconnected')
      const onConnectError = () => setStatus('disconnected')

      const onNftUpdated = (event: NftUpdatedEvent) => {
        if (guard.check(event, userId) !== 'apply') return
        const notice = applyNftUpdated(queryClient, event)
        if (notice) {
          toast.warning(notice.message, { id: `nft-${notice.nftId}` })
          announce(notice.message)
        }
      }
      const onOrderUpdated = (event: OrderUpdatedEvent) => {
        if (!userId || guard.check(event, userId) !== 'apply') return
        applyOrderUpdated(queryClient, event, userId)
      }

      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)
      socket.on('connect_error', onConnectError)
      socket.on(REALTIME_EVENTS.nftUpdated, onNftUpdated)
      socket.on(REALTIME_EVENTS.orderUpdated, onOrderUpdated)

      return () => {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
        socket.off('connect_error', onConnectError)
        socket.off(REALTIME_EVENTS.nftUpdated, onNftUpdated)
        socket.off(REALTIME_EVENTS.orderUpdated, onOrderUpdated)
        socket.disconnect()
        guard.reset()
      }
    }

    void whenApiReady()
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        if (!cancelled) teardown = connect(io)
      })
    return () => {
      cancelled = true
      teardown()
    }
  }, [token, userId, queryClient, announce])

  return <RealtimeContext.Provider value={status}>{children}</RealtimeContext.Provider>
}
