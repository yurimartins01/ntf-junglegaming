import type { CatalogQuery, NetworkId } from './contracts'

export type CartOwner = `user:${string}` | `guest:${string}`

export const queryKeys = {
  catalog: (params: CatalogQuery) => ['catalog', params] as const,
  catalogAll: ['catalog'] as const,
  featured: ['featured'] as const,
  nft: (id: string) => ['nft', id] as const,
  nftAll: ['nft'] as const,
  related: (id: string) => ['nft', id, 'related'] as const,
  user: (userId: string) => ['user', userId] as const,
  userAll: ['user'] as const,
  favorites: (userId: string) => ['user', userId, 'favorites'] as const,
  profile: (userId: string) => ['user', userId, 'profile'] as const,
  wallets: (userId: string) => ['user', userId, 'wallets'] as const,
  order: (userId: string, orderId: string) => ['user', userId, 'order', orderId] as const,
  cart: (owner: CartOwner) => ['cart', owner] as const,
  cartAll: ['cart'] as const,
  quote: (owner: CartOwner, network: NetworkId, context: 'cart' | 'checkout') =>
    ['cart', owner, 'quote', network, context] as const,
}
