import type { CreateOrderRequest, Order } from '@/lib/api/contracts'
import { NETWORK_LABELS, WALLET_PROVIDER_LABELS } from '@/lib/domain'
import { EMAIL_PATTERN, MESSAGES, isWalletAddress } from '@/lib/validation/rules'
import { db, persist, randomId, type StoredOrder } from '../db/db'
import { fnv1a } from '../fixtures/random'
import { MockHttpError, validationError } from '../http'
import { getScenario } from '../scenarios/scenarios'
import { publishOrderUpdated } from '../socket/server'
import { computeQuote, getStoredCart } from './cart'
import { updateNft } from './inventory'

const DEFAULT_SETTLE_MS = 2500
const SLOW_SETTLE_MS = 8000
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function toPublicOrder(order: StoredOrder): Order {
  const { userId: _u, quoteId: _q, idempotencyKey: _k, settleAt: _s, outcome: _o, walletSlot: _w, ...publicOrder } = order
  return publicOrder
}

function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length)
}

function validateRequest(body: CreateOrderRequest) {
  const errors: Record<string, string> = {}
  const c = body.collector
  if (!body.quoteId) errors.quoteId = MESSAGES.required
  if (!(body.network in NETWORK_LABELS)) errors.network = 'Selecione uma rede.'
  if (!(body.provider in WALLET_PROVIDER_LABELS)) errors.provider = 'Selecione uma carteira.'
  if (!c) {
    errors.collector = MESSAGES.required
  } else {
    if (!c.displayName?.trim()) errors.displayName = MESSAGES.required
    if (!c.username?.trim()) errors.username = MESSAGES.required
    if (!c.profileName?.trim()) errors.profileName = MESSAGES.required
    if (!EMAIL_PATTERN.test(c.email ?? '')) errors.email = MESSAGES.email
    if (!c.referralCode?.trim()) errors.referralCode = MESSAGES.required
    if (!c.ensName?.trim()) errors.ensName = MESSAGES.required
    if (!isWalletAddress(c.walletAddress ?? '')) errors.walletAddress = MESSAGES.walletAddress
    if (c.secondaryWallet && !isWalletAddress(c.secondaryWallet)) errors.secondaryWallet = MESSAGES.walletAddress
  }
  if (Object.keys(errors).length) throw validationError(errors)
}

export interface CreateOrderResult {
  order: Order
  replayed: boolean
}

export function createOrder(userId: string, idempotencyKey: string | null, body: CreateOrderRequest): CreateOrderResult {
  if (!idempotencyKey || idempotencyKey.length < 8) {
    throw new MockHttpError(400, 'VALIDATION_ERROR', 'Cabeçalho Idempotency-Key obrigatório.')
  }
  validateRequest(body)

  const fingerprint = fnv1a(
    JSON.stringify([body.quoteId, body.network, body.walletSlot, body.provider, body.collector.walletAddress]),
  )
  const recordKey = `${userId}:${idempotencyKey}`
  const record = db().idempotency[recordKey]
  if (record) {
    if (record.fingerprint !== fingerprint) {
      throw new MockHttpError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outro conteúdo.')
    }
    const existing = db().orders[record.orderId]
    if (existing) {
      settleIfDue(existing)
      return { order: toPublicOrder(existing), replayed: true }
    }
  }

  const cartKey = `user:${userId}` as const
  const cart = getStoredCart(cartKey)
  if (cart.lines.length === 0) throw new MockHttpError(409, 'CART_EMPTY', 'Seu carrinho está vazio.')
  const quote = computeQuote(cartKey, body.network)
  if (quote.id !== body.quoteId) {
    throw new MockHttpError(
      409,
      'QUOTE_OUTDATED',
      'Os valores do pedido mudaram. Revise e confirme novamente.',
      undefined,
      { quote },
    )
  }
  if (!quote.valid) {
    throw new MockHttpError(409, 'AVAILABILITY_CONFLICT', 'Alguns itens não estão mais disponíveis.', undefined, { quote })
  }

  const now = Date.now()
  const order: StoredOrder = {
    id: randomId('ord'),
    status: 'pending',
    version: 1,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    network: body.network,
    provider: body.provider,
    walletAddress: body.collector.walletAddress,
    lines: quote.lines.map((l) => ({
      nftId: l.nftId,
      editionId: l.editionId,
      editionLabel: l.editionLabel,
      name: l.name,
      tokenId: l.tokenId,
      artworkKey: l.artworkKey,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
    couponCode: quote.coupon?.code ?? null,
    transactionHash: null,
    explorerUrl: null,
    declineReason: null,
    userId,
    quoteId: quote.id,
    idempotencyKey,
    settleAt: now + (getScenario() === 'payment-slow' ? SLOW_SETTLE_MS : DEFAULT_SETTLE_MS),
    outcome: getScenario() === 'payment-declined' ? 'declined' : 'confirmed',
    walletSlot: body.walletSlot,
  }
  db().orders[order.id] = order
  db().idempotency[recordKey] = { orderId: order.id, fingerprint }
  scheduleSettlement(order)
  return { order: toPublicOrder(order), replayed: false }
}

export function getOrder(userId: string, orderId: string): Order {
  const order = db().orders[orderId]
  if (!order || order.userId !== userId) throw new MockHttpError(404, 'NOT_FOUND', 'Pedido não encontrado.')
  settleIfDue(order)
  return toPublicOrder(order)
}

function scheduleSettlement(order: StoredOrder) {
  clearTimeout(timers.get(order.id))
  const wait = Math.max(0, order.settleAt - Date.now())
  timers.set(
    order.id,
    setTimeout(() => {
      timers.delete(order.id)
      settleIfDue(order.id)
      persist()
    }, wait),
  )
}

export function resumePendingOrders() {
  for (const order of Object.values(db().orders)) {
    if (order.status === 'pending') scheduleSettlement(order)
  }
}

function settleIfDue(orderOrId: StoredOrder | string) {
  const order = typeof orderOrId === 'string' ? db().orders[orderOrId] : db().orders[orderOrId.id]
  if (!order || order.status !== 'pending' || Date.now() < order.settleAt) return

  let outcome = order.outcome
  let declineReason: string | null = outcome === 'declined' ? 'Pagamento recusado pela carteira.' : null
  if (outcome === 'confirmed') {
    const shortage = order.lines.find((l) => (db().nfts[l.nftId]?.available[l.editionId] ?? 0) < l.quantity)
    if (shortage) {
      outcome = 'declined'
      declineReason = `A edição ${shortage.editionLabel} de ${shortage.name} esgotou durante o processamento.`
    }
  }

  if (outcome === 'confirmed') {
    for (const line of order.lines) {
      const available = db().nfts[line.nftId]?.available[line.editionId] ?? 0
      updateNft(line.nftId, { available: { [line.editionId]: available - line.quantity } })
    }
    const cart = getStoredCart(`user:${order.userId}`)
    for (const purchased of order.lines) {
      const line = cart.lines.find((l) => l.nftId === purchased.nftId && l.editionId === purchased.editionId)
      if (line) line.quantity -= purchased.quantity
    }
    cart.lines = cart.lines.filter((l) => l.quantity > 0)
    if (order.couponCode && cart.couponCode === order.couponCode) cart.couponCode = null
    cart.version += 1
    const hash = `0x${randomHex(64)}`
    order.transactionHash = hash
    order.explorerUrl = `https://etherscan.io/tx/${hash}`
  }

  order.status = outcome
  order.declineReason = declineReason
  order.version += 1
  order.updatedAt = new Date().toISOString()
  publishOrderUpdated(toPublicOrder(order), order.userId)
}
