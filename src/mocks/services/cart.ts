import type { Cart, CartLine, EditionId, NetworkId, Quote, QuoteLine } from '@/lib/api/contracts'
import { EDITION_LABELS } from '@/lib/domain'
import { addEth, mulEth, percentOf, subEth } from '@/lib/money'
import { db, randomId, type StoredCart } from '../db/db'
import { MAX_PER_ORDER } from '../fixtures/nfts'
import { COUPON_SEEDS, NETWORK_FEES } from '../fixtures/users'
import { fnv1a } from '../fixtures/random'
import { MockHttpError } from '../http'
import { getFixture } from './catalog'

export type CartKey = `user:${string}` | `guest:${string}`

export function cartKeyFor(userId: string | null, guestId: string | null): CartKey {
  if (userId) return `user:${userId}`
  if (!guestId || !/^[a-zA-Z0-9_-]{8,64}$/.test(guestId)) {
    throw new MockHttpError(400, 'VALIDATION_ERROR', 'Identificador de carrinho ausente.')
  }
  return `guest:${guestId}`
}

export function getStoredCart(key: CartKey): StoredCart {
  const carts = db().carts
  carts[key] ??= { id: key.startsWith('guest:') ? key.slice(6) : randomId('cart'), lines: [], couponCode: null, version: 1 }
  return carts[key]
}

function availableFor(nftId: string, editionId: EditionId): number {
  return db().nfts[nftId]?.available[editionId] ?? 0
}

function lineLimit(nftId: string, editionId: EditionId): number {
  return Math.min(availableFor(nftId, editionId), MAX_PER_ORDER)
}

export function toCartDto(key: CartKey): Cart {
  const cart = getStoredCart(key)
  const lines: CartLine[] = cart.lines.map((line) => {
    const fixture = getFixture(line.nftId)
    const state = db().nfts[line.nftId]!
    return {
      id: line.id,
      nftId: line.nftId,
      editionId: line.editionId,
      editionLabel: EDITION_LABELS[line.editionId],
      quantity: line.quantity,
      name: fixture.name,
      tokenId: fixture.tokenId,
      artworkKey: fixture.artworkKey,
      unitPrice: state.price,
      lineTotal: mulEth(state.price, line.quantity),
      available: state.available[line.editionId] ?? 0,
      maxPerOrder: MAX_PER_ORDER,
      nftVersion: state.version,
    }
  })
  return {
    id: cart.id,
    owner: key.startsWith('user:') ? 'user' : 'guest',
    lines,
    couponCode: cart.couponCode,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    version: cart.version,
  }
}

function assertQuantity(quantity: unknown): asserts quantity is number {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
    throw new MockHttpError(422, 'VALIDATION_ERROR', 'A quantidade deve ser um número inteiro maior que zero.', {
      quantity: 'Quantidade inválida.',
    })
  }
}

function availabilityError(nftId: string, editionId: EditionId) {
  const available = availableFor(nftId, editionId)
  return new MockHttpError(
    409,
    available === 0 ? 'EDITION_UNAVAILABLE' : 'AVAILABILITY_CONFLICT',
    available === 0
      ? 'Esta edição está esgotada.'
      : `Quantidade indisponível. Máximo permitido: ${Math.min(available, MAX_PER_ORDER)}.`,
    undefined,
    { available, maxPerOrder: MAX_PER_ORDER },
  )
}

export function addItem(key: CartKey, nftId: string, editionId: EditionId, quantity: number) {
  assertQuantity(quantity)
  const fixture = getFixture(nftId)
  if (!fixture.editions.some((e) => e.id === editionId)) {
    throw new MockHttpError(422, 'VALIDATION_ERROR', 'Edição inválida.', { editionId: 'Edição inválida.' })
  }
  const cart = getStoredCart(key)
  const existing = cart.lines.find((l) => l.nftId === nftId && l.editionId === editionId)
  const nextQuantity = (existing?.quantity ?? 0) + quantity
  if (nextQuantity > lineLimit(nftId, editionId)) throw availabilityError(nftId, editionId)
  if (existing) existing.quantity = nextQuantity
  else cart.lines.push({ id: randomId('line'), nftId, editionId, quantity })
  cart.version += 1
}

export function updateItem(key: CartKey, lineId: string, quantity: number) {
  assertQuantity(quantity)
  const cart = getStoredCart(key)
  const line = cart.lines.find((l) => l.id === lineId)
  if (!line) throw new MockHttpError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
  if (quantity > line.quantity && quantity > lineLimit(line.nftId, line.editionId)) {
    throw availabilityError(line.nftId, line.editionId)
  }
  line.quantity = quantity
  cart.version += 1
}

export function removeItem(key: CartKey, lineId: string) {
  const cart = getStoredCart(key)
  const before = cart.lines.length
  cart.lines = cart.lines.filter((l) => l.id !== lineId)
  if (cart.lines.length === before) throw new MockHttpError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
  if (cart.lines.length === 0) cart.couponCode = null
  cart.version += 1
}

export function validateCoupon(code: string) {
  const normalized = code.trim().toUpperCase()
  const coupon = COUPON_SEEDS.find((c) => c.code === normalized)
  if (!coupon) throw new MockHttpError(422, 'INVALID_COUPON', 'Código promocional inválido.', { code: 'Código promocional inválido.' })
  if (Date.parse(coupon.expiresAt) <= Date.now()) {
    throw new MockHttpError(422, 'COUPON_EXPIRED', 'Este código promocional expirou.', { code: 'Este código promocional expirou.' })
  }
  return coupon
}

export function applyCoupon(key: CartKey, code: string) {
  const cart = getStoredCart(key)
  if (cart.lines.length === 0) throw new MockHttpError(409, 'CART_EMPTY', 'Adicione itens antes de aplicar um cupom.')
  cart.couponCode = validateCoupon(code).code
  cart.version += 1
}

export function removeCoupon(key: CartKey) {
  const cart = getStoredCart(key)
  cart.couponCode = null
  cart.version += 1
}

export function mergeGuestCart(userId: string, guestId: string) {
  const guestKey: CartKey = `guest:${guestId}`
  const guest = db().carts[guestKey]
  if (!guest) return
  const userCart = getStoredCart(`user:${userId}`)
  for (const line of guest.lines) {
    const existing = userCart.lines.find((l) => l.nftId === line.nftId && l.editionId === line.editionId)
    const limit = lineLimit(line.nftId, line.editionId)
    const merged = Math.min((existing?.quantity ?? 0) + line.quantity, limit)
    if (merged <= 0) continue
    if (existing) existing.quantity = merged
    else userCart.lines.push({ id: randomId('line'), nftId: line.nftId, editionId: line.editionId, quantity: merged })
  }
  if (!userCart.couponCode && guest.couponCode) userCart.couponCode = guest.couponCode
  userCart.version += 1
  delete db().carts[guestKey]
}

export function computeQuote(key: CartKey, network: NetworkId): Quote {
  const cart = getStoredCart(key)
  const lines: QuoteLine[] = cart.lines.map((line) => {
    const fixture = getFixture(line.nftId)
    const state = db().nfts[line.nftId]!
    const available = state.available[line.editionId] ?? 0
    return {
      lineId: line.id,
      nftId: line.nftId,
      editionId: line.editionId,
      editionLabel: EDITION_LABELS[line.editionId],
      name: fixture.name,
      tokenId: fixture.tokenId,
      artworkKey: fixture.artworkKey,
      quantity: line.quantity,
      unitPrice: state.price,
      lineTotal: mulEth(state.price, line.quantity),
      available,
      status: available === 0 ? 'unavailable' : line.quantity > available ? 'insufficient' : 'ok',
    }
  })

  let coupon: Quote['coupon'] = null
  if (cart.couponCode) {
    try {
      const seed = validateCoupon(cart.couponCode)
      coupon = { code: seed.code, percentOff: seed.percentOff }
    } catch {
      coupon = null
    }
  }

  const subtotal = addEth('0', ...lines.map((l) => l.lineTotal))
  const discount = coupon ? percentOf(subtotal, coupon.percentOff) : '0'
  const networkFee = lines.length ? NETWORK_FEES[network] : '0'
  const total = addEth(subEth(subtotal, discount), networkFee)
  const fingerprint = JSON.stringify({
    lines: lines.map((l) => [l.nftId, l.editionId, l.quantity, l.unitPrice, l.status]),
    coupon: coupon?.code ?? null,
    network,
    networkFee,
  })

  return {
    id: `qt_${fnv1a(fingerprint)}`,
    network,
    lines,
    subtotal,
    discount,
    networkFee,
    total,
    coupon,
    valid: lines.length > 0 && lines.every((l) => l.status === 'ok'),
    issuedAt: new Date().toISOString(),
  }
}
