import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/lib/api/contracts'
import { NftImage } from './NftImage'
import { PriceTag } from './PriceTag'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function NftCarousel({ items, loading, label }: { items: NftSummary[] | undefined; loading: boolean; label: string }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setPages(Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth - 0.05)))
    setPage(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)))
  }, [])

  useEffect(() => {
    measure()
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [measure, items])

  return (
    <div>
      <ul
        ref={trackRef}
        onScroll={measure}
        aria-label={label}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-[26px] overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading || !items
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="w-[calc((100%-4*26px)/5)] min-w-[170px] shrink-0">
                <Skeleton className="aspect-[219/255] w-full" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-5 w-1/3" />
              </li>
            ))
          : items.map((nft) => (
              <li key={nft.id} className="w-[calc((100%-4*26px)/5)] min-w-[170px] shrink-0 snap-start max-md:w-[46%]">
                <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block">
                  <div className="flex aspect-[219/255] items-center justify-center bg-surface-card px-[6px]">
                    <NftImage artworkKey={nft.artworkKey} alt="" className="aspect-square w-full rounded-[16px]" />
                  </div>
                  <h3 className="mt-3 font-body-large16-regular--lh-20 text-fg group-hover:text-accent">{nft.name}</h3>
                  <PriceTag price={nft.price} className="mt-1 !font-body-large16-bold--lh-20" />
                </Link>
              </li>
            ))}
      </ul>
      {pages > 1 && (
        <div role="group" aria-label="Páginas do carrossel" className="mt-6 flex justify-center gap-1">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o grupo ${i + 1}`}
              aria-pressed={i === page}
              onClick={() => trackRef.current?.scrollTo({ left: i * trackRef.current.clientWidth, behavior: 'smooth' })}
              className="flex size-6 items-center justify-center"
            >
              <span className={cn('size-[10px] rounded-full border border-primary', i === page ? 'bg-primary' : 'bg-transparent')} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
