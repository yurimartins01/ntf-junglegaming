import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { Icon } from '@/components/shared/Icon'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { NftCarousel } from '@/components/shared/NftCarousel'
import { NftImage } from '@/components/shared/NftImage'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { ErrorState } from '@/components/shared/StateViews'
import { UnavailableAction } from '@/components/shared/UnavailableAction'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAddToCart } from '@/features/cart/api'
import { useNft, useRelated } from '@/features/catalog/api'
import { useNftActions } from '@/features/catalog/use-nft-actions'
import type { NftDetail, EditionId } from '@/lib/api/contracts'
import { ApiError, errorMessage, toApiError } from '@/lib/api/errors'
import { EDITION_LABELS } from '@/lib/domain'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-1 text-primary" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" size={14} fill={i < Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

function EditionPicker({
  nft,
  value,
  onChange,
}: {
  nft: NftDetail
  value: EditionId | null
  onChange: (edition: EditionId) => void
}) {
  return (
    <div role="radiogroup" aria-label="Edição" className="flex flex-wrap gap-2">
      {nft.editions.map((edition) => {
        const soldOut = edition.available === 0
        const selected = value === edition.id
        return (
          <button
            key={edition.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={soldOut}
            disabled={soldOut}
            title={soldOut ? 'Edição esgotada' : `${edition.available} disponíveis`}
            onClick={() => onChange(edition.id)}
            className={cn(
              'h-7 rounded-full border px-3 font-body14-regular--lh-16 transition-colors',
              selected ? 'border-primary bg-primary/10 text-fg' : 'border-border-soft text-fg-muted hover:border-primary',
              soldOut && 'cursor-not-allowed line-through opacity-50 hover:border-border-soft',
            )}
          >
            {EDITION_LABELS[edition.id]}
            {soldOut && <span className="sr-only"> (esgotada)</span>}
          </button>
        )
      })}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="container-content" aria-busy="true" aria-label="Carregando NFT" data-testid="detail-skeleton">
      <Skeleton className="mt-4 hidden h-5 w-40 md:block" />
      <div className="mt-4 grid gap-8 md:grid-cols-[90px_minmax(0,395px)_minmax(0,1fr)] md:gap-6">
        <div className="hidden gap-3 md:flex md:flex-col">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="size-[90px]" />
          ))}
        </div>
        <Skeleton className="aspect-square w-full md:aspect-[395/397]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

export function NftDetailPage({ nftId }: { nftId: string }) {
  const nftQuery = useNft(nftId)
  const related = useRelated(nftId)

  if (nftQuery.isPending) {
    return (
      <AppShell mobileTopBar={<MobileTopBar />}>
        <DetailSkeleton />
      </AppShell>
    )
  }
  if (nftQuery.isError) {
    const error = toApiError(nftQuery.error)
    if (error.code === 'NOT_FOUND') {
      return <NotFoundPage title="NFT não encontrado" message="Este NFT não existe ou foi removido do catálogo." />
    }
    return (
      <AppShell mobileTopBar={<MobileTopBar />}>
        <div className="container-content py-16">
          <ErrorState message={errorMessage(error)} onRetry={() => void nftQuery.refetch()} retrying={nftQuery.isFetching} />
        </div>
      </AppShell>
    )
  }
  return <NftDetailView nft={nftQuery.data} related={related} />
}

function NftDetailView({ nft, related }: { nft: NftDetail; related: ReturnType<typeof useRelated> }) {
  const navigate = useNavigate()
  const announce = useAnnouncer()
  const addToCart = useAddToCart()
  const { isFavorite, onToggleFavorite, favoritePending } = useNftActions(nft)
  const [pickedEdition, setPickedEdition] = useState<EditionId | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [tab, setTab] = useState<'details' | 'reviews'>('details')

  const firstAvailable = nft.editions.find((e) => e.available > 0)?.id ?? null
  const pickedStillAvailable = pickedEdition && (nft.editions.find((e) => e.id === pickedEdition)?.available ?? 0) > 0
  const editionId = pickedStillAvailable ? pickedEdition : firstAvailable
  const edition = nft.editions.find((e) => e.id === editionId)
  const max = edition ? Math.min(edition.available, nft.maxPerOrder) : 0
  const effectiveQuantity = Math.min(Math.max(quantity, 1), Math.max(max, 1))
  const soldOut = !edition

  async function buy(goToCart: boolean) {
    if (!editionId) return
    try {
      await addToCart.mutateAsync({ nftId: nft.id, editionId, quantity: effectiveQuantity })
      const message = `${effectiveQuantity}× ${nft.name} (edição ${EDITION_LABELS[editionId]}) adicionado ao carrinho.`
      announce(message)
      if (goToCart) void navigate({ to: '/cart' })
      else toast.success(message)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : toApiError(error)
      toast.error(apiError.message)
      announce(apiError.message)
    }
  }

  const detailBlocks = [
    { title: 'Rede:', text: nft.networkInfo },
    { title: 'Contrato:', text: nft.contractInfo },
    { title: 'Direitos autorais:', text: nft.royaltiesInfo },
  ]

  const purchaseControls = (
    <>
      <QuantityStepper value={effectiveQuantity} max={max} onChange={setQuantity} label={nft.name} disabled={soldOut} />
      {soldOut && (
        <p role="status" className="font-body14-medium--lh-20 text-coral">
          Todas as edições estão esgotadas.
        </p>
      )}
      {!soldOut && effectiveQuantity >= max && (
        <p className="font-caption12-regular--lh-16 text-fg-muted">Limite de {max} por pedido nesta edição.</p>
      )}
    </>
  )

  return (
    <AppShell
      mobileTopBar={
        <MobileTopBar
          action={
            <button
              type="button"
              onClick={onToggleFavorite}
              disabled={favoritePending}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              className="flex size-9 items-center justify-center rounded-full bg-surface-raised text-fg"
            >
              <Icon name="heart" size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-primary' : undefined} />
            </button>
          }
        />
      }
      showTabBar={false}
      mainClassName="max-md:pb-[150px]"
    >
      <div className="container-content">
        <div className="md:mt-8">
          <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/', hash: 'catalogo' }]} />
        </div>

        <div className="mt-2 grid gap-6 md:grid-cols-[90px_minmax(0,395px)_minmax(0,1fr)] md:gap-6 lg:gap-6">
          <ul className="hidden gap-[14px] md:flex md:flex-col" aria-label="Galeria">
            {nft.gallery.map((key, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Ver imagem ${index + 1} de ${nft.gallery.length}`}
                  aria-current={activeImage === index}
                  className={cn('block size-[90px] overflow-hidden rounded-[8px] border-2', activeImage === index ? 'border-primary' : 'border-transparent')}
                >
                  <NftImage artworkKey={key} alt="" variant="thumb" className="size-full" />
                </button>
              </li>
            ))}
          </ul>

          <div className="relative flex aspect-square items-center justify-center bg-surface-card max-md:-mx-4 max-md:rounded-b-[32px] max-md:bg-transparent md:aspect-[395/397] md:p-[18px]">
            <NftImage
              artworkKey={nft.gallery[activeImage] ?? nft.artworkKey}
              alt={`${nft.name} — arte do NFT`}
              variant="large"
              priority
              className="aspect-square w-full rounded-[24px] max-md:mx-4 max-md:w-[calc(100%-2rem)]"
            />
            <button
              type="button"
              onClick={() => setZoom(true)}
              aria-label="Ampliar imagem"
              className="absolute top-5 right-5 hidden size-8 items-center justify-center rounded-full bg-ink/80 text-fg hover:text-accent md:flex"
            >
              <Icon name="search" size={16} />
            </button>
          </div>

          <div className="max-md:-mt-8 max-md:rounded-t-[32px] max-md:bg-surface-card max-md:px-6 max-md:pt-6 max-md:pb-4">
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-3 md:block">
                <h1 className="font-heading24-bold text-fg md:font-heading28-bold">{nft.name}</h1>
                <p className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-1 font-body14-bold--lh-16 text-fg md:hidden">
                  <Icon name="star" size={13} fill="currentColor" className="text-primary" />
                  {nft.rating.toFixed(1)}
                  <span className="font-normal">({nft.reviewCount})</span>
                </p>
              </div>

              <div className="mt-1 hidden items-end justify-between border-b border-divider pb-2 md:flex">
                <p className="font-heading24-bold text-accent" data-testid="detail-price">
                  {formatEth(nft.price)}
                </p>
                <p className="flex items-center gap-2 font-body14-regular--lh-16 text-fg">
                  <Stars rating={nft.rating} />
                  <span>{nft.reviewCount} avaliações de colecionadores</span>
                </p>
              </div>

              <h2 className="mt-4 hidden font-body14-bold--lh-20 text-fg md:block">Sobre este NFT:</h2>
              <p className="mt-3 font-body14-regular--lh-22 text-fg-muted md:mt-1 md:max-w-[500px]">{nft.summary}</p>

              <h2 className="mt-3 font-body14-bold--lh-20 text-fg md:mt-2">Edição:</h2>
              <div className="mt-2">
                <EditionPicker nft={nft} value={editionId} onChange={setPickedEdition} />
              </div>

              <div className="mt-5 hidden items-start justify-between gap-4 md:flex">
                <div className="flex flex-col gap-2">{purchaseControls}</div>
                <div className="flex gap-3">
                  <Button
                    size="none"
                    className="h-9 w-[115px] rounded-[2px] font-body14-bold--lh-20 uppercase"
                    disabled={soldOut || addToCart.isPending}
                    onClick={() => void buy(true)}
                  >
                    Comprar
                  </Button>
                  <Button
                    variant="outline"
                    size="none"
                    className="h-9 gap-2 rounded-[2px] px-3 font-body14-regular--lh-20 text-fg"
                    onClick={onToggleFavorite}
                    disabled={favoritePending}
                    aria-pressed={isFavorite}
                  >
                    <Icon name="heart" size={18} fill={isFavorite ? 'currentColor' : 'none'} className="text-primary" />
                    {isFavorite ? 'Favoritado' : 'Favoritar'}
                  </Button>
                </div>
              </div>

              <dl className="mt-4 flex flex-col gap-3 font-body14-regular--lh-20 text-fg-muted md:mt-5 md:gap-2">
                <div>
                  <dt className="inline">ID do token: </dt>
                  <dd className="inline">{nft.tokenId}</dd>
                </div>
                <div>
                  <dt className="inline">Coleção: </dt>
                  <dd className="inline">{nft.collection}</dd>
                </div>
                <div>
                  <dt className="inline">Atributos: </dt>
                  <dd className="inline">{nft.attributes.join(', ')}</dd>
                </div>
              </dl>

              <div className="mt-3 hidden items-center gap-2 font-body14-bold--lh-20 text-fg md:flex">
                <span>Compartilhar este NFT:</span>
                <UnavailableAction label="Compartilhar no LinkedIn" className="text-fg">
                  <Icon name="linkedin" size={16} />
                </UnavailableAction>
                <UnavailableAction label="Compartilhar por e-mail" className="text-fg">
                  <Icon name="mail" size={16} />
                </UnavailableAction>
                <UnavailableAction label="Compartilhar no Twitter" className="text-fg">
                  <Icon name="twitter" size={16} />
                </UnavailableAction>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-16 hidden md:block" aria-label="Informações adicionais">
          <div role="tablist" aria-label="Seções do NFT" className="flex gap-9 border-b border-divider">
            {(
              [
                ['details', 'Detalhes do NFT'],
                ['reviews', `Avaliações de colecionadores (${nft.reviewCount})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  'relative pb-2 font-body-large16-regular--lh-auto transition-colors hover:text-accent',
                  tab === id ? "font-bold text-accent after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-primary after:content-['']" : 'text-fg',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={tab !== 'details'} className="mt-3 flex flex-col gap-4">
            {nft.description.map((paragraph) => (
              <p key={paragraph} className="font-body14-regular--lh-22 text-fg-muted">
                {paragraph}
              </p>
            ))}
            {detailBlocks.map((block) => (
              <div key={block.title}>
                <h3 className="font-body14-bold--lh-20 text-fg">{block.title}</h3>
                <p className="font-body14-regular--lh-22 text-fg-muted">{block.text}</p>
              </div>
            ))}
          </div>
          <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" hidden={tab !== 'reviews'} className="mt-6">
            <p className="font-body14-regular--lh-22 text-fg-muted">As avaliações de colecionadores não estão disponíveis nesta demonstração.</p>
          </div>
        </section>

        <section className="mt-12 md:mt-[84px]" aria-labelledby="related-title">
          <h2 id="related-title" className="border-b border-divider pb-2 font-body-large16-bold--lh-20 text-accent md:font-body-large18-bold--lh-24">
            Mais desta coleção
          </h2>
          <div className="mt-8">
            <NftCarousel items={related.data} loading={related.isPending} label="Mais desta coleção" />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[32px] bg-surface-card px-6 pt-5 pb-5 shadow-[0_-8px_24px_rgb(0_0_0/0.35)] md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-body14-regular--lh-20 font-bold text-fg-muted">Qtd.</span>
            <QuantityStepper value={effectiveQuantity} max={max} onChange={setQuantity} label={nft.name} size="sm" disabled={soldOut} />
          </div>
          <p className="font-title22-bold text-accent !leading-7">{formatEth(nft.price)}</p>
        </div>
        {soldOut && (
          <p role="status" className="mt-2 font-body14-medium--lh-20 text-coral">
            Todas as edições estão esgotadas.
          </p>
        )}
        {!soldOut && effectiveQuantity >= max && (
          <p className="mt-2 font-caption12-regular--lh-16 text-fg-muted">Limite de {max} por pedido nesta edição.</p>
        )}
        <div className="mt-4 flex gap-3">
          <Button
            variant="gradient"
            size="pill"
            className="h-[60px] flex-1 rounded-full"
            disabled={soldOut || addToCart.isPending}
            onClick={() => void buy(true)}
          >
            Comprar NFT
          </Button>
          <button
            type="button"
            onClick={() => void buy(false)}
            disabled={soldOut || addToCart.isPending}
            aria-label="Adicionar ao carrinho"
            className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-surface-raised text-primary disabled:opacity-50"
          >
            <Icon name="cartOutline" size={22} />
          </button>
        </div>
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-[min(90vw,640px)] p-3 sm:max-w-[min(90vw,640px)]">
          <DialogTitle className="sr-only">{nft.name}</DialogTitle>
          <DialogDescription className="sr-only">Imagem ampliada do NFT.</DialogDescription>
          <NftImage artworkKey={nft.gallery[activeImage] ?? nft.artworkKey} variant="large" alt={nft.name} className="aspect-square w-full rounded-[16px]" />
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
