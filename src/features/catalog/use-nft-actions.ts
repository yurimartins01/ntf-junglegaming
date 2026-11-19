import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { useSession } from '@/features/auth/session-store'
import { useAddToCart } from '@/features/cart/api'
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/api'
import type { NftSummary } from '@/lib/api/contracts'
import { errorMessage } from '@/lib/api/errors'
import { nftQueryOptions } from './api'

export function useNftActions(nft: Pick<NftSummary, 'id' | 'name'>) {
  const session = useSession()
  const navigate = useNavigate()
  const href = useRouterState({ select: (s) => s.location.href })
  const queryClient = useQueryClient()
  const announce = useAnnouncer()
  const isFavorite = useIsFavorite(nft.id)
  const toggleFavorite = useToggleFavorite()
  const addToCart = useAddToCart()

  function requireLogin(): boolean {
    if (session) return false
    void navigate({ to: '/login', search: { redirect: href } })
    return true
  }

  function onToggleFavorite() {
    if (requireLogin()) return
    const favorite = !isFavorite
    toggleFavorite.mutate(
      { nftId: nft.id, favorite },
      {
        onSuccess: () => announce(favorite ? `${nft.name} adicionado aos favoritos.` : `${nft.name} removido dos favoritos.`),
        onError: (error) => {
          const message = `Não foi possível atualizar os favoritos. ${errorMessage(error)}`
          toast.error(message)
          announce(message)
        },
      },
    )
  }

  async function onQuickAdd() {
    try {
      const detail = await queryClient.fetchQuery(nftQueryOptions(nft.id))
      const edition = detail.editions.find((e) => e.available > 0)
      if (!edition) {
        toast.error(`${nft.name} está esgotado.`)
        return
      }
      await addToCart.mutateAsync({ nftId: nft.id, editionId: edition.id, quantity: 1 })
      const message = `${nft.name} (edição ${edition.label}) adicionado ao carrinho.`
      toast.success(message)
      announce(message)
    } catch (error) {
      const message = errorMessage(error)
      toast.error(message)
      announce(message)
    }
  }

  return { isFavorite, onToggleFavorite, onQuickAdd, adding: addToCart.isPending, favoritePending: toggleFavorite.isPending }
}
