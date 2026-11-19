import { delay, http, HttpResponse } from 'msw'
import {
  API_BASE_URL,
  type AddCartItemRequest,
  type ApplyCouponRequest,
  type CreateOrderRequest,
  type FavoritesResponse,
  type MergeCartRequest,
  type NetworkId,
  type QuoteRequest,
  type UpdateCartItemRequest,
} from '@/lib/api/contracts'
import { NETWORK_LABELS } from '@/lib/domain'
import { addEth } from '@/lib/money'
import { db, persist } from '../db/db'
import { getFixture, toSummary } from '../services/catalog'
import { MockHttpError, readJson, route } from '../http'
import { consumeOnce, getScenario } from '../scenarios/scenarios'
import { optionalUser, requirePrivateAccess, requireUser } from '../services/auth'
import {
  addItem,
  applyCoupon,
  cartKeyFor,
  computeQuote,
  getStoredCart,
  mergeGuestCart,
  removeCoupon,
  removeItem,
  toCartDto,
  updateItem,
} from '../services/cart'
import { updateNft } from '../services/inventory'
import { createOrder, getOrder } from '../services/orders'
import { dropConnections } from '../socket/server'

function cartKey(request: Request) {
  const user = optionalUser(request)
  return cartKeyFor(user?.id ?? null, request.headers.get('x-cart-id'))
}

function favoritesOf(userId: string): FavoritesResponse {
  const ids = db().favorites[userId] ?? []
  return { nftIds: ids, items: ids.map((id) => toSummary(getFixture(id))) }
}

function scheduleCheckoutScenario(key: ReturnType<typeof cartKeyFor>) {
  const scenario = getScenario()
  if (scenario !== 'price-change' && scenario !== 'sold-out') return
  if (!consumeOnce(`checkout:${scenario}`)) return
  const line = getStoredCart(key).lines[0]
  if (!line) return
  setTimeout(() => {
    const state = db().nfts[line.nftId]
    if (!state) return
    if (scenario === 'price-change') updateNft(line.nftId, { price: addEth(state.price, '0.10') })
    else updateNft(line.nftId, { available: { [line.editionId]: 0 } })
  }, 1500)
}

export const commerceHandlers = [
  http.get(
    `${API_BASE_URL}/favorites`,
    route(({ request }) => HttpResponse.json(favoritesOf(requirePrivateAccess(request).id))),
  ),

  http.put<{ nftId: string }>(
    `${API_BASE_URL}/favorites/:nftId`,
    route(
      ({ request, params }) => {
        const user = requirePrivateAccess(request)
        getFixture(params.nftId)
        if (getScenario() === 'favorite-failure') {
          throw new MockHttpError(500, 'INTERNAL_ERROR', 'Não foi possível salvar o favorito.')
        }
        const list = (db().favorites[user.id] ??= [])
        if (!list.includes(params.nftId)) list.unshift(params.nftId)
        return HttpResponse.json(favoritesOf(user.id))
      },
      { mutates: true },
    ),
  ),

  http.delete<{ nftId: string }>(
    `${API_BASE_URL}/favorites/:nftId`,
    route(
      ({ request, params }) => {
        const user = requirePrivateAccess(request)
        if (getScenario() === 'favorite-failure') {
          throw new MockHttpError(500, 'INTERNAL_ERROR', 'Não foi possível remover o favorito.')
        }
        db().favorites[user.id] = (db().favorites[user.id] ?? []).filter((id) => id !== params.nftId)
        return HttpResponse.json(favoritesOf(user.id))
      },
      { mutates: true },
    ),
  ),

  http.get(
    `${API_BASE_URL}/cart`,
    route(({ request }) => HttpResponse.json(toCartDto(cartKey(request)))),
  ),

  http.post(
    `${API_BASE_URL}/cart/items`,
    route(
      async ({ request }) => {
        const key = cartKey(request)
        const body = await readJson<AddCartItemRequest>(request)
        addItem(key, body.nftId, body.editionId, body.quantity)
        return HttpResponse.json(toCartDto(key), { status: 201 })
      },
      { mutates: true },
    ),
  ),

  http.patch<{ lineId: string }>(
    `${API_BASE_URL}/cart/items/:lineId`,
    route(
      async ({ request, params }) => {
        const key = cartKey(request)
        const body = await readJson<UpdateCartItemRequest>(request)
        updateItem(key, params.lineId, body.quantity)
        return HttpResponse.json(toCartDto(key))
      },
      { mutates: true },
    ),
  ),

  http.delete<{ lineId: string }>(
    `${API_BASE_URL}/cart/items/:lineId`,
    route(
      ({ request, params }) => {
        const key = cartKey(request)
        removeItem(key, params.lineId)
        return HttpResponse.json(toCartDto(key))
      },
      { mutates: true },
    ),
  ),

  http.put(
    `${API_BASE_URL}/cart/coupon`,
    route(
      async ({ request }) => {
        const key = cartKey(request)
        const body = await readJson<ApplyCouponRequest>(request)
        applyCoupon(key, body.code ?? '')
        return HttpResponse.json(toCartDto(key))
      },
      { mutates: true },
    ),
  ),

  http.delete(
    `${API_BASE_URL}/cart/coupon`,
    route(
      ({ request }) => {
        const key = cartKey(request)
        removeCoupon(key)
        return HttpResponse.json(toCartDto(key))
      },
      { mutates: true },
    ),
  ),

  http.post(
    `${API_BASE_URL}/cart/merge`,
    route(
      async ({ request }) => {
        const user = requireUser(request)
        const body = await readJson<MergeCartRequest>(request)
        if (body.guestCartId) mergeGuestCart(user.id, body.guestCartId)
        return HttpResponse.json(toCartDto(`user:${user.id}`))
      },
      { mutates: true },
    ),
  ),

  http.post(
    `${API_BASE_URL}/quote`,
    route(
      async ({ request }) => {
        const key = cartKey(request)
        const body = await readJson<QuoteRequest & { context?: 'cart' | 'checkout' }>(request)
        const network: NetworkId = body.network && body.network in NETWORK_LABELS ? body.network : 'ethereum'
        const quote = computeQuote(key, network)
        if (body.context === 'checkout') scheduleCheckoutScenario(key)
        return HttpResponse.json(quote)
      },
      { mutates: true },
    ),
  ),

  http.post(
    `${API_BASE_URL}/orders`,
    route(
      async ({ request }) => {
        const user = requirePrivateAccess(request)
        const body = await readJson<CreateOrderRequest>(request)
        const result = createOrder(user.id, request.headers.get('idempotency-key'), body)
        if (!result.replayed) {
          if (getScenario() === 'socket-drop') dropConnections(5000, user.id)
          if (getScenario() === 'order-timeout' && consumeOnce('order-timeout')) {
            persist()
            await delay('infinite')
          }
        }
        return HttpResponse.json(result.order, { status: result.replayed ? 200 : 201 })
      },
      { mutates: true },
    ),
  ),

  http.get<{ orderId: string }>(
    `${API_BASE_URL}/orders/:orderId`,
    route(
      ({ request, params }) => HttpResponse.json(getOrder(requirePrivateAccess(request).id, params.orderId)),
      { mutates: true },
    ),
  ),
]
