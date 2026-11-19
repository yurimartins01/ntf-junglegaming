import type { QueryClient } from '@tanstack/react-query'
import type {
  Cart,
  CatalogResponse,
  FavoritesResponse,
  NftDetail,
  NftSummary,
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
} from '@/lib/api/contracts'
import { queryKeys } from '@/lib/api/query-keys'
import { compareEth, formatEth } from '@/lib/money'

function patchSummary<T extends NftSummary>(nft: T, event: NftUpdatedEvent): T {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft
  return {
    ...nft,
    price: event.payload.price,
    previousPrice: event.payload.previousPrice,
    totalAvailable: event.payload.totalAvailable,
    version: event.version,
  }
}

export interface NftChangeNotice {
  nftId: string
  name: string
  message: string
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): NftChangeNotice | null {
  queryClient.setQueriesData<CatalogResponse>({ queryKey: queryKeys.catalogAll }, (data) =>
    data ? { ...data, items: data.items.map((item) => patchSummary(item, event)) } : data,
  )
  queryClient.setQueriesData<NftSummary[] | NftDetail>({ queryKey: queryKeys.nftAll }, (data) => {
    if (!data) return data
    if (Array.isArray(data)) return data.map((item) => patchSummary<NftSummary>(item, event))
    const detail: NftDetail = data
    if (detail.id !== event.resource.id || detail.version >= event.version) return detail
    const available = new Map(event.payload.editions.map((e) => [e.id, e.available]))
    return {
      ...patchSummary<NftDetail>(detail, event),
      editions: detail.editions.map((edition) => ({ ...edition, available: available.get(edition.id) ?? edition.available })),
    }
  })
  queryClient.setQueriesData<FavoritesResponse>({ queryKey: queryKeys.userAll }, (data) =>
    data && 'nftIds' in data ? { ...data, items: data.items.map((item) => patchSummary(item, event)) } : data,
  )

  let notice: NftChangeNotice | null = null
  for (const [, cart] of queryClient.getQueriesData<Cart>({ queryKey: queryKeys.cartAll })) {
    if (!cart || !('lines' in cart)) continue
    const line = cart.lines.find((l) => l.nftId === event.resource.id)
    if (!line || line.nftVersion >= event.version) continue
    const available = event.payload.editions.find((e) => e.id === line.editionId)?.available ?? 0
    if (compareEth(line.unitPrice, event.payload.price) !== 0) {
      notice = {
        nftId: line.nftId,
        name: line.name,
        message: `O preço de ${line.name} mudou de ${formatEth(line.unitPrice)} para ${formatEth(event.payload.price)}.`,
      }
    } else if (available < line.quantity) {
      notice = {
        nftId: line.nftId,
        name: line.name,
        message:
          available === 0
            ? `A edição ${line.editionLabel} de ${line.name} esgotou.`
            : `Restam apenas ${available} unidades da edição ${line.editionLabel} de ${line.name}.`,
      }
    }
  }
  void queryClient.invalidateQueries({ queryKey: queryKeys.cartAll })
  return notice
}

export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent, userId: string) {
  const key = queryKeys.order(userId, event.resource.id)
  queryClient.setQueryData<Order>(key, (current) =>
    current && current.version >= event.version ? current : event.payload.order,
  )
  if (event.payload.status === 'confirmed') {
    void queryClient.invalidateQueries({ queryKey: queryKeys.cartAll })
  }
}

export function reconcileAfterReconnect(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.catalogAll })
  void queryClient.invalidateQueries({ queryKey: queryKeys.nftAll })
  void queryClient.invalidateQueries({ queryKey: queryKeys.cartAll })
  void queryClient.invalidateQueries({ queryKey: queryKeys.userAll })
}
