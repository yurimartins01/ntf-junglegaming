import type { CatalogQuery, CatalogSort, CatalogTab, CategoryId, NetworkId } from '@/lib/api/contracts'
import { CATEGORY_ORDER, NETWORK_ORDER } from '@/lib/domain'

const PRICE = /^\d+(\.\d{1,18})?$/
const TABS: readonly CatalogTab[] = ['all', 'new', 'trending']
const SORTS: readonly CatalogSort[] = ['recent', 'price-asc', 'price-desc', 'popular']
const MAX_QUERY_LENGTH = 80

export interface CatalogSearch {
  q?: string
  category?: CategoryId[]
  network?: NetworkId[]
  minPrice?: string
  maxPrice?: string
  tab?: CatalogTab
  sort?: CatalogSort
  page?: number
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

function listOf<T extends string>(value: unknown, allowed: readonly T[]): T[] | undefined {
  const items = value === undefined ? [] : Array.isArray(value) ? value : [value]
  const valid = [...new Set(items.map((item) => oneOf(item, allowed)).filter((item): item is T => item !== undefined))]
  return valid.length ? valid : undefined
}

function priceOf(value: unknown): string | undefined {
  return typeof value === 'string' && PRICE.test(value) ? value : undefined
}

export function parseCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, MAX_QUERY_LENGTH) : ''
  const page = Number(raw.page)
  return {
    ...(q ? { q } : {}),
    ...(listOf(raw.category, CATEGORY_ORDER) ? { category: listOf(raw.category, CATEGORY_ORDER) } : {}),
    ...(listOf(raw.network, NETWORK_ORDER) ? { network: listOf(raw.network, NETWORK_ORDER) } : {}),
    ...(priceOf(raw.minPrice) ? { minPrice: priceOf(raw.minPrice) } : {}),
    ...(priceOf(raw.maxPrice) ? { maxPrice: priceOf(raw.maxPrice) } : {}),
    ...(oneOf(raw.tab, TABS) ? { tab: oneOf(raw.tab, TABS) } : {}),
    ...(oneOf(raw.sort, SORTS) ? { sort: oneOf(raw.sort, SORTS) } : {}),
    ...(Number.isInteger(page) && page >= 1 ? { page } : {}),
  }
}

export function toCatalogQuery(search: CatalogSearch): CatalogQuery {
  return {
    q: search.q || undefined,
    category: search.category?.length ? [...search.category].sort() : undefined,
    network: search.network?.length ? [...search.network].sort() : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
  }
}

export function withFilters(current: CatalogSearch, patch: Partial<Omit<CatalogSearch, 'page'>>): CatalogSearch {
  const next: CatalogSearch = { ...current, ...patch, page: undefined }
  if (!next.q) delete next.q
  if (!next.category?.length) delete next.category
  if (!next.network?.length) delete next.network
  if (next.tab === 'all') delete next.tab
  if (next.sort === 'recent') delete next.sort
  if (!next.minPrice) delete next.minPrice
  if (!next.maxPrice) delete next.maxPrice
  delete next.page
  return next
}
