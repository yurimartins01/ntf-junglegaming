import type { EditionId, Order, User, WalletsResponse } from '@/lib/api/contracts'
import { NFT_FIXTURES } from '../fixtures/nfts'
import { USER_SEEDS } from '../fixtures/users'

export interface NftState {
  price: string
  previousPrice: string | null
  available: Record<EditionId, number>
  version: number
}

export interface StoredUser extends User {
  passwordHash: string
  salt: string
}

export interface StoredSession {
  userId: string
  expiresAt: number
}

export interface StoredCartLine {
  id: string
  nftId: string
  editionId: EditionId
  quantity: number
}

export interface StoredCart {
  id: string
  lines: StoredCartLine[]
  couponCode: string | null
  version: number
}

export interface StoredOrder extends Order {
  userId: string
  quoteId: string
  idempotencyKey: string
  settleAt: number
  outcome: 'confirmed' | 'declined'
  walletSlot: string
}

export interface IdempotencyRecord {
  orderId: string
  fingerprint: string
}

export interface DbState {
  schemaVersion: number
  seq: number
  nfts: Record<string, NftState>
  users: Record<string, StoredUser>
  sessions: Record<string, StoredSession>
  favorites: Record<string, string[]>
  carts: Record<string, StoredCart>
  wallets: Record<string, WalletsResponse>
  orders: Record<string, StoredOrder>
  idempotency: Record<string, IdempotencyRecord>
}

const STORAGE_KEY = 'kurio:mock-db'
const SCHEMA_VERSION = 3

let state: DbState | null = null

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(`${salt}:${password}`)
}

export function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

async function createSeed(): Promise<DbState> {
  const nfts: Record<string, NftState> = {}
  for (const nft of NFT_FIXTURES) {
    nfts[nft.id] = {
      price: nft.price,
      previousPrice: nft.previousPrice,
      available: Object.fromEntries(nft.editions.map((e) => [e.id, e.available])) as Record<EditionId, number>,
      version: 1,
    }
  }

  const users: Record<string, StoredUser> = {}
  const favorites: Record<string, string[]> = {}
  const wallets: Record<string, WalletsResponse> = {}
  for (const seed of USER_SEEDS) {
    const salt = `seed-${seed.id}`
    users[seed.id] = {
      id: seed.id,
      username: seed.username,
      email: seed.email,
      displayName: seed.displayName,
      ensName: seed.ensName,
      walletNickname: seed.walletNickname,
      avatarUrl: null,
      salt,
      passwordHash: await hashPassword(seed.password, salt),
    }
    favorites[seed.id] = [...seed.favorites]
    wallets[seed.id] = structuredClone(seed.wallets)
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    seq: 1,
    nfts,
    users,
    sessions: {},
    favorites,
    carts: {},
    wallets,
    orders: {},
    idempotency: {},
  }
}

function readPersisted(): DbState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DbState
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

export async function initDb(): Promise<DbState> {
  state = readPersisted() ?? (await createSeed())
  persist()
  return state
}

export async function resetDb(): Promise<DbState> {
  state = await createSeed()
  persist()
  return state
}

export function db(): DbState {
  if (!state) throw new Error('Mock db not initialised')
  return state
}

export function persist() {
  if (!state) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
  }
}

export function nextSeq(): number {
  const current = db()
  current.seq += 1
  return current.seq
}

export function toPublicUser(user: StoredUser): User {
  const { passwordHash: _hash, salt: _salt, ...publicUser } = user
  return publicUser
}
