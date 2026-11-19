import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { AnnouncerProvider } from '@/components/shared/LiveRegion'
import { RouteError } from '@/components/shared/RouteError'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { RealtimeProvider } from '@/features/realtime/RealtimeProvider'
import { refreshSession } from '@/features/auth/api'
import { routeTree } from '@/routeTree.gen'
import { createQueryClient } from './query-client'
import { parseSearch, stringifySearch } from './search-params'

const queryClient = createQueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient },
  parseSearch,
  stringifySearch,
  defaultPreload: 'intent',
  defaultErrorComponent: RouteError,
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

void refreshSession()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnnouncerProvider>
        <RealtimeProvider>
          <TooltipProvider delayDuration={200}>
            <RouterProvider router={router} />
            <Toaster position="bottom-center" offset={24} mobileOffset={{ bottom: 150, left: 16, right: 16 }} visibleToasts={2} />
          </TooltipProvider>
        </RealtimeProvider>
      </AnnouncerProvider>
    </QueryClientProvider>
  )
}
