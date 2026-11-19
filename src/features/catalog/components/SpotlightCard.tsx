import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/shared/NftImage'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeatured } from '../api'

export function SpotlightCard() {
  const { data } = useFeatured()
  const nft = data?.spotlight
  return (
    <section aria-labelledby="spotlight-title" className="bg-[linear-gradient(180deg,var(--color-surface-dark)_0%,var(--color-ink)_100%)]">
      <h2 id="spotlight-title" className="px-5 pt-6 font-heading24-bold text-accent uppercase">
        NFT em destaque
      </h2>
      <p className="mt-3 text-center font-body-large19-bold text-fg uppercase">Oferta limitada</p>
      <div className="mt-2 aspect-[310/366] overflow-hidden rounded-[24px]">
        {nft ? (
          <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver ${nft.name}`}>
            <NftImage artworkKey={nft.artworkKey} variant="portrait" alt={nft.name} className="size-full" />
          </Link>
        ) : (
          <Skeleton className="size-full" />
        )}
      </div>
    </section>
  )
}
