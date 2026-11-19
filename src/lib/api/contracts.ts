
export type EthAmount = string
export type IsoDate = string

export type NetworkId = 'ethereum' | 'polygon' | 'solana'
export type CategoryId =
  | 'digital-art'
  | 'photography'
  | 'music'
  | '3d-art'
  | 'collectibles'
  | 'generative'
  | 'games'
  | 'subscriptions'
  | 'utility'
export type EditionId = '1/1' | '1/10' | '1/50' | 'open'
export type ArtworkKey = 'emerald-ape' | 'sage-nomad' | 'neon-vessel' | 'golden-beat'
export type CatalogTab = 'all' | 'new' | 'trending'
export type CatalogSort = 'recent' | 'price-asc' | 'price-desc' | 'popular'
export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'
export type WalletSlot = 'primary' | 'secondary'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'AVAILABILITY_CONFLICT'
  | 'EDITION_UNAVAILABLE'
  | 'INVALID_COUPON'
  | 'COUPON_EXPIRED'
  | 'QUOTE_OUTDATED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'CART_EMPTY'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    fieldErrors?: Record<string, string>
    details?: unknown
  }
}

export interface NftSummary {
  id: string
  name: string
  tokenId: string
  collection: string
  artworkKey: ArtworkKey
  price: EthAmount
  previousPrice: EthAmount | null
  network: NetworkId
  category: CategoryId | null
  badge: 'rare' | null
  createdAt: IsoDate
  popularity: number
  totalAvailable: number
  version: number
}

export interface NftEdition {
  id: EditionId
  label: string
  supply: number | null
  available: number
}

export interface NftDetail extends NftSummary {
  summary: string
  description: string[]
  attributes: string[]
  rating: number
  reviewCount: number
  editions: NftEdition[]
  gallery: ArtworkKey[]
  networkInfo: string
  contractInfo: string
  royaltiesInfo: string
  maxPerOrder: number
}

export interface FacetOption<T extends string> {
  id: T
  label: string
  count: number
}

export interface CatalogQuery {
  q?: string
  category?: CategoryId[]
  network?: NetworkId[]
  minPrice?: string
  maxPrice?: string
  tab?: CatalogTab
  sort?: CatalogSort
  page?: number
  pageSize?: number
}

export interface CatalogResponse {
  items: NftSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: {
    categories: FacetOption<CategoryId>[]
    networks: FacetOption<NetworkId>[]
    priceRange: { min: EthAmount; max: EthAmount }
  }
}

export interface FeaturedResponse {
  hero: NftSummary[]
  spotlight: NftSummary
}

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
}

export interface SessionResponse {
  token: string
  expiresAt: IsoDate
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface FavoritesResponse {
  nftIds: string[]
  items: NftSummary[]
}

export interface CartLine {
  id: string
  nftId: string
  editionId: EditionId
  editionLabel: string
  quantity: number
  name: string
  tokenId: string
  artworkKey: ArtworkKey
  unitPrice: EthAmount
  lineTotal: EthAmount
  available: number
  maxPerOrder: number
  nftVersion: number
}

export interface Cart {
  id: string
  owner: 'guest' | 'user'
  lines: CartLine[]
  couponCode: string | null
  itemCount: number
  version: number
}

export interface AddCartItemRequest {
  nftId: string
  editionId: EditionId
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface ApplyCouponRequest {
  code: string
}

export interface MergeCartRequest {
  guestCartId: string
}

export type QuoteLineStatus = 'ok' | 'insufficient' | 'unavailable'

export interface QuoteLine {
  lineId: string
  nftId: string
  editionId: EditionId
  editionLabel: string
  name: string
  tokenId: string
  artworkKey: ArtworkKey
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
  available: number
  status: QuoteLineStatus
}

export interface QuoteRequest {
  network?: NetworkId
}

export interface Quote {
  id: string
  network: NetworkId
  lines: QuoteLine[]
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  coupon: { code: string; percentOff: number } | null
  valid: boolean
  issuedAt: IsoDate
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export interface CollectorDetails {
  displayName: string
  username: string
  profileName: string
  email: string
  ensName: string
  referralCode: string
  walletAddress: string
  secondaryWallet: string
  note: string
}

export interface CreateOrderRequest {
  quoteId: string
  network: NetworkId
  walletSlot: WalletSlot | 'custom'
  provider: WalletProvider
  collector: CollectorDetails
}

export interface OrderLine {
  nftId: string
  editionId: EditionId
  editionLabel: string
  name: string
  tokenId: string
  artworkKey: ArtworkKey
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
}

export interface Order {
  id: string
  status: OrderStatus
  version: number
  createdAt: IsoDate
  updatedAt: IsoDate
  network: NetworkId
  provider: WalletProvider
  walletAddress: string
  lines: OrderLine[]
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  couponCode: string | null
  transactionHash: string | null
  explorerUrl: string | null
  declineReason: string | null
}

export interface UpdateProfileRequest {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
}

export interface UpdateAvatarRequest {
  dataUrl: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface Wallet {
  slot: WalletSlot
  displayName: string
  nickname: string
  network: NetworkId
  profileName: string
  address: string
  secondaryAddress: string
  provider: WalletProvider
  referralCode: string
  email: string
  ensName: string
  updatedAt: IsoDate
}

export type WalletInput = Omit<Wallet, 'slot' | 'updatedAt'>

export interface WalletsResponse {
  primary: Wallet | null
  secondary: Wallet | null
  secondarySameAsPrimary: boolean
}

export interface SaveWalletRequest extends WalletInput {
  sameAsPrimary?: boolean
}

export interface RealtimeEnvelope<TType extends string, TResource extends string, TPayload> {
  eventId: string
  type: TType
  resource: { type: TResource; id: string }
  version: number
  userId?: string
  emittedAt: IsoDate
  payload: TPayload
}

export type NftUpdatedEvent = RealtimeEnvelope<
  'nft.updated',
  'nft',
  {
    price: EthAmount
    previousPrice: EthAmount | null
    editions: Pick<NftEdition, 'id' | 'available'>[]
    totalAvailable: number
  }
>

export type OrderUpdatedEvent = RealtimeEnvelope<
  'order.updated',
  'order',
  { status: OrderStatus; order: Order }
>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export const REALTIME_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

export const API_BASE_URL = '/api'
