import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { useCreateOrder } from '@/features/orders/api'
import type { CreateOrderRequest } from '@/lib/api/contracts'
import { toApiError, type ApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/api/query-keys'
import { attemptStore, pendingOrderStore } from './checkout-storage'

export function useSendOrder(userId: string) {
  const createOrder = useCreateOrder()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const announce = useAnnouncer()

  function send(body: CreateOrderRequest, idempotencyKey: string, onError: (error: ApiError) => void) {
    createOrder.mutate(
      { body, idempotencyKey },
      {
        onSuccess: (order) => {
          pendingOrderStore.set(userId, order.id)
          attemptStore.clear()
          void queryClient.invalidateQueries({ queryKey: queryKeys.cartAll })
          announce('Pedido enviado. Aguardando confirmação.')
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
        },
        onError: (error) => onError(toApiError(error)),
      },
    )
  }

  function recover(onError: (error: ApiError) => void) {
    const attempt = attemptStore.get(userId)
    if (attempt) send(attempt.payload, attempt.key, onError)
  }

  return { send, recover, pending: createOrder.isPending }
}
