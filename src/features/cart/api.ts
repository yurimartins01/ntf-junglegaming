import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGuestCartId, useSession } from '@/features/auth/session-store'
import { api } from '@/lib/api/client'
import type { AddCartItemRequest, Cart, NetworkId, Quote } from '@/lib/api/contracts'
import { queryKeys, type CartOwner } from '@/lib/api/query-keys'

export function useCartOwner(): CartOwner {
  const session = useSession()
  return session ? `user:${session.user.id}` : `guest:${getGuestCartId()}`
}

export function cartQueryOptions(owner: CartOwner) {
  return queryOptions({
    queryKey: queryKeys.cart(owner),
    queryFn: async ({ signal }) => (await api.get<Cart>('/cart', { signal })).data,
    staleTime: 0,
  })
}

export function useCart() {
  return useQuery(cartQueryOptions(useCartOwner()))
}

export function quoteQueryOptions(owner: CartOwner, network: NetworkId, context: 'cart' | 'checkout', cartVersion: number | undefined) {
  return queryOptions({
    queryKey: [...queryKeys.quote(owner, network, context), cartVersion] as const,
    queryFn: async ({ signal }) => (await api.post<Quote>('/quote', { network, context }, { signal })).data,
    enabled: cartVersion !== undefined,
    staleTime: 0,
  })
}

export function useQuote(network: NetworkId, context: 'cart' | 'checkout') {
  const owner = useCartOwner()
  const cart = useCart()
  const hasLines = (cart.data?.lines.length ?? 0) > 0
  return useQuery({
    ...quoteQueryOptions(owner, network, context, hasLines ? cart.data?.version : undefined),
    placeholderData: (previous) => previous,
  })
}

function useCartMutation<TVariables>(request: (variables: TVariables) => Promise<Cart>) {
  const owner = useCartOwner()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(owner), cart)
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.cart(owner), 'quote'] })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart(owner) })
    },
  })
}

export function useAddToCart() {
  return useCartMutation(async (body: AddCartItemRequest) => (await api.post<Cart>('/cart/items', body)).data)
}

export function useUpdateCartLine() {
  return useCartMutation(
    async ({ lineId, quantity }: { lineId: string; quantity: number }) =>
      (await api.patch<Cart>(`/cart/items/${lineId}`, { quantity })).data,
  )
}

export function useRemoveCartLine() {
  return useCartMutation(async (lineId: string) => (await api.delete<Cart>(`/cart/items/${lineId}`)).data)
}

export function useApplyCoupon() {
  return useCartMutation(async (code: string) => (await api.put<Cart>('/cart/coupon', { code })).data)
}

export function useRemoveCoupon() {
  return useCartMutation(async () => (await api.delete<Cart>('/cart/coupon')).data)
}
