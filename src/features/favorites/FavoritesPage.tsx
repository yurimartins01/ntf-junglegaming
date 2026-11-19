import { Link } from '@tanstack/react-router'
import { EmptyState, ErrorState } from '@/components/shared/StateViews'
import { buttonVariants } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/NftCard'
import { ProfileLayout } from '@/features/account/ProfileLayout'
import { toApiError } from '@/lib/api/errors'
import { useFavorites } from './api'

export function FavoritesPage() {
  const favorites = useFavorites()
  return (
    <ProfileLayout title="Lista de interesse">
      {favorites.isPending ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[34px]" aria-busy="true" aria-label="Carregando favoritos">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : favorites.isError ? (
        <ErrorState message={toApiError(favorites.error).message} onRetry={() => void favorites.refetch()} retrying={favorites.isFetching} />
      ) : favorites.data.items.length === 0 ? (
        <EmptyState
          title="Sua lista de interesse está vazia"
          message="Toque no coração de um NFT para guardá-lo aqui."
          action={
            <Link to="/" hash="catalogo" className={buttonVariants()}>
              Explorar NFTs
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[60px]" data-testid="favorites-grid">
          {favorites.data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </ProfileLayout>
  )
}
