import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/shared/NftImage'
import { Icon } from '@/components/shared/Icon'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { useIsTabletUp } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { useFeatured } from '../api'

function Dots({ count, active, onSelect, className }: { count: number; active: number; onSelect: (i: number) => void; className?: string }) {
  return (
    <div role="group" aria-label="Destaques" className={cn('flex gap-2', className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Destaque ${i + 1}`}
          aria-pressed={i === active}
          onClick={() => onSelect(i)}
          className="flex size-6 items-center justify-center"
        >
          <span className={cn('size-2 rounded-full transition-colors', i === active ? 'bg-primary' : 'bg-primary/45')} />
        </button>
      ))}
    </div>
  )
}

export function HomeHero() {
  const featured = useFeatured()
  const [active, setActive] = useState(0)
  const slides = featured.data?.hero ?? []
  const current = slides[active]
  const isTabletUp = useIsTabletUp()

  return (
    <section aria-labelledby="hero-title">
      {isTabletUp ? (
      <div className="grid grid-cols-[1fr_minmax(0,450px)] items-center gap-8 pt-8">
        <div className="relative flex h-full flex-col justify-center pl-0 lg:pl-10">
          <p className="font-body14-medium--lh-16 text-fg">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="mt-3 max-w-[520px] type-hero text-fg uppercase max-lg:text-[34px] max-lg:leading-[52px]">
            Seja dono do futuro da arte digital
          </h1>
          <p className="mt-1 max-w-[560px] font-body14-regular--lh-24 text-fg-muted">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma
            parte da cultura da internet.
          </p>
          <Link to="/" hash="catalogo" className={buttonVariants({ className: 'mt-8 w-[140px] font-body-large16-bold--lh-20 uppercase' })}>
            Explorar
          </Link>
          {slides.length > 1 && <Dots count={slides.length} active={active} onSelect={setActive} className="mt-10 self-end lg:absolute lg:right-0 lg:bottom-8" />}
        </div>
        <div className="aspect-square w-full overflow-hidden rounded-[24px]">
          {current ? (
            <Link to="/nft/$nftId" params={{ nftId: current.id }} aria-label={`Ver ${current.name}`}>
              <NftImage artworkKey={current.artworkKey} variant="large" alt={current.name} priority sizes="(min-width: 1024px) 450px, 40vw" className="size-full" />
            </Link>
          ) : (
            <Skeleton className="size-full rounded-[24px]" />
          )}
        </div>
      </div>

      ) : (
      <div className="relative overflow-hidden rounded-[24px] bg-surface-raised p-4">
        <span aria-hidden="true" className="absolute -top-16 left-24 size-64 rounded-full bg-surface-dark/80" />
        <div className="relative grid grid-cols-[1fr_auto] gap-2">
          <div className="min-w-0">
            <p className="font-body14-bold--lh-16 text-fg">Bem-vindo à Kurio</p>
            <h1 className="mt-3 font-heading24-bold !text-[18px] !leading-6 tracking-[0.06em] text-fg uppercase">Seja dono da cultura digital</h1>
            <p className="mt-2 font-body14-regular--lh-20 text-fg-muted">Descubra NFTs selecionados de criadores do mundo todo.</p>
            <Link to="/" hash="catalogo" className="mt-1 inline-flex items-center gap-2 font-body14-bold--lh-24 text-accent uppercase">
              Explorar <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <div className="relative w-[138px] self-center">
            {current ? (
              <NftImage artworkKey={current.artworkKey} alt={current.name} priority className="aspect-square w-full rounded-[16px]" />
            ) : (
              <Skeleton className="aspect-square w-full rounded-[16px]" />
            )}
            {slides[1] ? (
              <NftImage
                artworkKey={slides[(active + 1) % slides.length]!.artworkKey}
                alt=""
                className="absolute -bottom-3 -left-4 aspect-square w-[58px] rounded-[12px] border-2 border-surface-raised"
              />
            ) : null}
          </div>
        </div>
        {slides.length > 1 && <Dots count={slides.length} active={active} onSelect={setActive} className="relative mt-1 justify-center" />}
      </div>
      )}
    </section>
  )
}
