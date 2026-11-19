import type {
  CatalogSort,
  CatalogTab,
  CategoryId,
  EditionId,
  NetworkId,
  WalletProvider,
} from '@/lib/api/contracts'

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  games: 'Jogos',
  subscriptions: 'Assinaturas',
  utility: 'Utilidade',
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as CategoryId[]

export const NETWORK_LABELS: Record<NetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const NETWORK_ORDER = Object.keys(NETWORK_LABELS) as NetworkId[]

export const NETWORK_WALLET_LABELS: Record<NetworkId, string> = {
  ethereum: 'Rede principal Ethereum',
  polygon: 'Rede Polygon',
  solana: 'Rede Solana',
}

export const EDITION_LABELS: Record<EditionId, string> = {
  '1/1': '1/1',
  '1/10': '1/10',
  '1/50': '1/50',
  open: 'ABERTA',
}

export const TAB_LABELS: Record<CatalogTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

export const SORT_LABELS: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  popular: 'Mais populares',
}

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}

export const WALLET_PROVIDER_ORDER: WalletProvider[] = ['walletconnect', 'metamask', 'coinbase']

export const CATALOG_PAGE_SIZE = 9
export const PRICE_RANGE = { min: '0.02', max: '12.30' } as const
