import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'

const MAX_RETRIES = 2

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && error instanceof ApiError && error.isTransient,
        retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 2000),
        refetchOnWindowFocus: true,
        staleTime: 10_000,
      },
      mutations: { retry: false },
    },
  })
}
