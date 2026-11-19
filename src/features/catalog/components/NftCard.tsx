import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/lib/api/contracts'
import { Icon } from '@/components/shared/Icon'
import { NftImage } from '@/components/shared/NftImage'
import { PriceTag } from '@/components/shared/PriceTag'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useNftActions } from '../use-nft-actions'

const actionButton =
  'flex size-[34px] items-center justify-center rounded-[4px] bg-ink/85 text-fg transition-colors hover:text-accent disabled:opacity-60'

export function NftCard({ nft, priority = false, className }: { nft: NftSummary; priority?: boolean; className?: string }) {
  const { isFavorite, onToggleFavorite, onQuickAdd, adding, favoritePending } = useNftActions(nft)
  const soldOut = nft.totalAvailable === 0

  return (
    <article className={cn('group flex flex-col', className)} data-testid="nft-card">
      <div className="relative aspect-[258/300] overflow-hidden rounded-[24px] bg-surface-card p-1 md:rounded-none md:p-0">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          tabIndex={-1}
          aria-hidden="true"
          className="flex size-full items-start justify-center md:items-center md:px-1"
        >
          <NftImage
            artworkKey={nft.artworkKey}
            alt=""
            priority={priority}
            sizes="(min-width: 1024px) 258px, 45vw"
            className="aspect-square w-full rounded-[16px] md:w-[97%]"
          />
        </Link>
        {nft.badge === 'rare' ? (
          <span className="absolute top-4 left-0 bg-primary px-3 py-1 font-body14-medium--lh-16--ls-0 text-ink md:top-0 md:left-1">RARO</span>
        ) : null}
        {soldOut ? (
          <span className="absolute top-4 right-4 rounded-[4px] bg-ink/85 px-2 py-1 font-caption12-bold text-coral">Esgotado</span>
        ) : null}

        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoritePending}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-ink/70 text-fg md:hidden"
        >
          <Icon name="heart" size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-primary' : undefined} />
        </button>

        <div className="absolute inset-x-0 bottom-3 hidden justify-center gap-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
          <button
            type="button"
            className={actionButton}
            onClick={onQuickAdd}
            disabled={adding || soldOut}
            aria-label={`Adicionar ${nft.name} ao carrinho`}
          >
            <Icon name="cartOutline" size={18} />
          </button>
          <button
            type="button"
            className={actionButton}
            onClick={onToggleFavorite}
            disabled={favoritePending}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
          >
            <Icon name="heart" size={18} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-primary' : undefined} />
          </button>
          <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={actionButton} aria-label={`Ver detalhes de ${nft.name}`}>
            <Icon name="search" size={18} />
          </Link>
        </div>
      </div>
      <h3 className="mt-3 font-body-large16-regular--lh-20 text-fg md:mt-5">
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="hover:text-accent focus-visible:text-accent">
          {nft.name}
        </Link>
      </h3>
      <PriceTag price={nft.price} previousPrice={nft.previousPrice} className="mt-1" />
    </article>
  )
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)} data-testid="nft-card-skeleton">
      <Skeleton className="aspect-[258/300] w-full rounded-[24px] md:rounded-none" />
      <Skeleton className="mt-3 h-5 w-3/4 md:mt-5" />
      <Skeleton className="mt-2 h-6 w-1/3" />
    </div>
  )
}
