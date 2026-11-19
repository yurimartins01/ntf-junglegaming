import Big from 'big.js'
import type {
  CatalogResponse,
  CatalogSort,
  CatalogTab,
  CategoryId,
  FeaturedResponse,
  NetworkId,
  NftDetail,
  NftSummary,
} from '@/lib/api/contracts'
import { CATEGORY_LABELS, CATEGORY_ORDER, NETWORK_LABELS, NETWORK_ORDER, PRICE_RANGE, CATALOG_PAGE_SIZE } from '@/lib/domain'
import { isValidEthInput } from '@/lib/money'
import { db, type NftState } from '../db/db'
import {
  CATALOG_REFERENCE_DATE,
  NEW_RELEASE_WINDOW_MS,
  NFT_FIXTURES,
  NFT_FIXTURES_BY_ID,
  TRENDING_THRESHOLD,
  type NftFixture,
} from '../fixtures/nfts'
import { MockHttpError, validationError } from '../http'

function stateOf(id: string): NftState {
  const state = db().nfts[id]
  if (!state) throw new MockHttpError(404, 'NOT_FOUND', 'NFT não encontrado.')
  return state
}

function totalAvailable(state: NftState): number {
  return Object.values(state.available).reduce((sum, n) => sum + n, 0)
}

export function toSummary(fixture: NftFixture): NftSummary {
  const state = stateOf(fixture.id)
  return {
    id: fixture.id,
    name: fixture.name,
    tokenId: fixture.tokenId,
    collection: fixture.collection,
    artworkKey: fixture.artworkKey,
    price: state.price,
    previousPrice: state.previousPrice,
    network: fixture.network,
    category: fixture.category,
    badge: fixture.badge,
    createdAt: fixture.createdAt,
    popularity: fixture.popularity,
    totalAvailable: totalAvailable(state),
    version: state.version,
  }
}

export function toDetail(fixture: NftFixture): NftDetail {
  const state = stateOf(fixture.id)
  return {
    ...fixture,
    ...toSummary(fixture),
    editions: fixture.editions.map((edition) => ({ ...edition, available: state.available[edition.id] ?? 0 })),
  }
}

export function getFixture(id: string): NftFixture {
  const fixture = NFT_FIXTURES_BY_ID.get(id)
  if (!fixture) throw new MockHttpError(404, 'NOT_FOUND', 'NFT não encontrado.')
  return fixture
}

const SORTS: CatalogSort[] = ['recent', 'price-asc', 'price-desc', 'popular']
const TABS: CatalogTab[] = ['all', 'new', 'trending']

function facets(): CatalogResponse['facets'] {
  const categoryCounts = new Map<CategoryId, number>()
  const networkCounts = new Map<NetworkId, number>()
  for (const nft of NFT_FIXTURES) {
    if (nft.category) categoryCounts.set(nft.category, (categoryCounts.get(nft.category) ?? 0) + 1)
    networkCounts.set(nft.network, (networkCounts.get(nft.network) ?? 0) + 1)
  }
  return {
    categories: CATEGORY_ORDER.map((id) => ({ id, label: CATEGORY_LABELS[id], count: categoryCounts.get(id) ?? 0 })),
    networks: NETWORK_ORDER.map((id) => ({ id, label: NETWORK_LABELS[id], count: networkCounts.get(id) ?? 0 })),
    priceRange: { ...PRICE_RANGE },
  }
}

export function queryCatalog(url: URL, forceEmpty: boolean): CatalogResponse {
  const params = url.searchParams
  const q = (params.get('q') ?? '').trim().toLowerCase()
  const categories = params.getAll('category').filter((c): c is CategoryId => c in CATEGORY_LABELS)
  const networks = params.getAll('network').filter((n): n is NetworkId => n in NETWORK_LABELS)
  const minPrice = params.get('minPrice')
  const maxPrice = params.get('maxPrice')
  const tab = (params.get('tab') ?? 'all') as CatalogTab
  const sort = (params.get('sort') ?? 'recent') as CatalogSort
  const page = Number(params.get('page') ?? '1')
  const pageSize = Number(params.get('pageSize') ?? String(CATALOG_PAGE_SIZE))

  const errors: Record<string, string> = {}
  if (minPrice && !isValidEthInput(minPrice)) errors.minPrice = 'Preço mínimo inválido.'
  if (maxPrice && !isValidEthInput(maxPrice)) errors.maxPrice = 'Preço máximo inválido.'
  if (minPrice && maxPrice && !errors.minPrice && !errors.maxPrice && new Big(minPrice).gt(maxPrice))
    errors.minPrice = 'O preço mínimo deve ser menor que o máximo.'
  if (!TABS.includes(tab)) errors.tab = 'Aba inválida.'
  if (!SORTS.includes(sort)) errors.sort = 'Ordenação inválida.'
  if (!Number.isInteger(page) || page < 1) errors.page = 'Página inválida.'
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 48) errors.pageSize = 'Tamanho de página inválido.'
  if (Object.keys(errors).length) throw validationError(errors)

  let results = forceEmpty
    ? []
    : NFT_FIXTURES.filter((nft) => {
        if (q && !nft.name.toLowerCase().includes(q)) return false
        if (categories.length && (!nft.category || !categories.includes(nft.category))) return false
        if (networks.length && !networks.includes(nft.network)) return false
        const price = stateOf(nft.id).price
        if (minPrice && new Big(price).lt(minPrice)) return false
        if (maxPrice && new Big(price).gt(maxPrice)) return false
        if (tab === 'new' && Date.parse(nft.createdAt) < CATALOG_REFERENCE_DATE - NEW_RELEASE_WINDOW_MS) return false
        if (tab === 'trending' && nft.popularity < TRENDING_THRESHOLD) return false
        return true
      })

  results = [...results].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return new Big(stateOf(a.id).price).cmp(stateOf(b.id).price) || a.id.localeCompare(b.id)
      case 'price-desc':
        return new Big(stateOf(b.id).price).cmp(stateOf(a.id).price) || a.id.localeCompare(b.id)
      case 'popular':
        return b.popularity - a.popularity || a.id.localeCompare(b.id)
      default:
        return Date.parse(b.createdAt) - Date.parse(a.createdAt)
    }
  })

  const total = results.length
  const start = (page - 1) * pageSize
  return {
    items: results.slice(start, start + pageSize).map(toSummary),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    facets: facets(),
  }
}

export function featured(): FeaturedResponse {
  const pick = (id: string) => toSummary(getFixture(id))
  return {
    hero: ['emerald-ape-042', 'sage-nomad-009', 'neon-vessel-552'].map(pick),
    spotlight: pick('violet-nomad-314'),
  }
}

export function related(id: string): NftSummary[] {
  const fixture = getFixture(id)
  const sameCollection = NFT_FIXTURES.filter((n) => n.id !== id && n.collection === fixture.collection)
  const others = NFT_FIXTURES.filter((n) => n.id !== id && n.collection !== fixture.collection)
  return [...NFT_FIXTURES.slice(0, 10).filter((n) => n.id !== id), ...sameCollection, ...others]
    .filter((n, index, list) => list.findIndex((m) => m.id === n.id) === index)
    .slice(2, 17)
    .map(toSummary)
}
