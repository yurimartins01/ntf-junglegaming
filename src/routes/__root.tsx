import { useEffect } from 'react'
import { Outlet, createRootRouteWithContext, useRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { endSession } from '@/features/auth/api'
import { sessionEvents, sessionStore } from '@/features/auth/session-store'
import { NotFoundPage } from '@/components/shared/NotFoundPage'

export interface RouterContext {
  queryClient: QueryClient
}

function SessionExpiryWatcher() {
  const router = useRouter()
  useEffect(
    () =>
      sessionEvents.onExpired(() => {
        if (!sessionStore.get()) return
        endSession(router.options.context.queryClient, { preserveContext: true })
        toast.error('Sua sessão expirou. Entre novamente para continuar.', { id: 'session-expired' })
        const location = router.state.location
        void router.navigate({
          to: '/login',
          search: { redirect: location.href.startsWith('/login') ? undefined : location.href, reason: 'expired' },
        })
      }),
    [router],
  )
  return null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <SessionExpiryWatcher />
      <Outlet />
    </>
  ),
  notFoundComponent: () => <NotFoundPage />,
})
