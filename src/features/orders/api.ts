import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session-store'
import { api } from '@/lib/api/client'
import type { CreateOrderRequest, Order } from '@/lib/api/contracts'
import { queryKeys } from '@/lib/api/query-keys'

export const ORDER_REQUEST_TIMEOUT_MS = 6000
const PENDING_REFETCH_MS = 15_000

export function useOrder(orderId: string | null) {
  const userId = useSession()?.user.id ?? 'anonymous'
  return useQuery({
    queryKey: queryKeys.order(userId, orderId ?? 'none'),
    queryFn: async ({ signal }) => (await api.get<Order>(`/orders/${orderId}`, { signal })).data,
    enabled: Boolean(orderId) && userId !== 'anonymous',
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_REFETCH_MS : false),
  })
}

export function useCreateOrder() {
  return useMutation({
    retry: false,
    mutationFn: async ({ body, idempotencyKey }: { body: CreateOrderRequest; idempotencyKey: string }) =>
      (
        await api.post<Order>('/orders', body, {
          headers: { 'Idempotency-Key': idempotencyKey },
          timeout: ORDER_REQUEST_TIMEOUT_MS,
        })
      ).data,
  })
}
