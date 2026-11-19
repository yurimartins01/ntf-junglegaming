import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { CatalogQuery, CatalogResponse, FeaturedResponse, NftDetail, NftSummary } from '@/lib/api/contracts'
import { queryKeys } from '@/lib/api/query-keys'
import { CATALOG_PAGE_SIZE } from '@/lib/domain'

export function catalogQueryOptions(params: CatalogQuery) {
  return queryOptions({
    queryKey: queryKeys.catalog(params),
    queryFn: async ({ signal }) =>
      (
        await api.get<CatalogResponse>('/nfts', {
          params: { ...params, pageSize: params.pageSize ?? CATALOG_PAGE_SIZE },
          paramsSerializer: { indexes: null },
          signal,
        })
      ).data,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export const featuredQueryOptions = queryOptions({
  queryKey: queryKeys.featured,
  queryFn: async ({ signal }) => (await api.get<FeaturedResponse>('/nfts/featured', { signal })).data,
  staleTime: 60_000,
})

export function nftQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.nft(id),
    queryFn: async ({ signal }) => (await api.get<NftDetail>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
    staleTime: 30_000,
  })
}

export function relatedQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.related(id),
    queryFn: async ({ signal }) => (await api.get<NftSummary[]>(`/nfts/${encodeURIComponent(id)}/related`, { signal })).data,
    staleTime: 60_000,
  })
}

export const useCatalog = (params: CatalogQuery) => useQuery(catalogQueryOptions(params))
export const useFeatured = () => useQuery(featuredQueryOptions)
export const useNft = (id: string) => useQuery(nftQueryOptions(id))
export const useRelated = (id: string) => useQuery(relatedQueryOptions(id))
