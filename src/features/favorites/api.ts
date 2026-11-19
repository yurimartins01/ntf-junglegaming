import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session-store'
import { api } from '@/lib/api/client'
import type { FavoritesResponse } from '@/lib/api/contracts'
import { queryKeys } from '@/lib/api/query-keys'

export function useFavorites() {
  const session = useSession()
  return useQuery({
    queryKey: queryKeys.favorites(session?.user.id ?? 'anonymous'),
    queryFn: async ({ signal }) => (await api.get<FavoritesResponse>('/favorites', { signal })).data,
    enabled: Boolean(session),
    staleTime: 30_000,
  })
}

export function useIsFavorite(nftId: string): boolean {
  return useFavorites().data?.nftIds.includes(nftId) ?? false
}

export function useToggleFavorite() {
  const session = useSession()
  const queryClient = useQueryClient()
  const key = queryKeys.favorites(session?.user.id ?? 'anonymous')

  return useMutation({
    mutationFn: async ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favorite
        ? (await api.put<FavoritesResponse>(`/favorites/${nftId}`)).data
        : (await api.delete<FavoritesResponse>(`/favorites/${nftId}`)).data,
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        const base = current ?? { nftIds: [], items: [] }
        return favorite
          ? { ...base, nftIds: [nftId, ...base.nftIds.filter((id) => id !== nftId)] }
          : { nftIds: base.nftIds.filter((id) => id !== nftId), items: base.items.filter((i) => i.id !== nftId) }
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      else queryClient.removeQueries({ queryKey: key })
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data)
    },
  })
}
