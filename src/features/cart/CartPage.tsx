import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { Icon } from '@/components/shared/Icon'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { NftCarousel } from '@/components/shared/NftCarousel'
import { NftImage } from '@/components/shared/NftImage'
import { SummaryRows } from '@/components/shared/OrderSummary'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { EmptyState, ErrorState, RefreshingIndicator } from '@/components/shared/StateViews'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRelated } from '@/features/catalog/api'
import { useIsTabletUp } from '@/hooks/use-media-query'
import { useSession } from '@/features/auth/session-store'
import type { CartLine, Quote } from '@/lib/api/contracts'
import { errorMessage } from '@/lib/api/errors'
import { formatEthValue } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useCart, useQuote, useRemoveCartLine, useUpdateCartLine } from './api'
import { CouponForm } from './components/CouponForm'

function lineProblem(line: CartLine): string | null {
  if (line.available === 0) return 'Edição esgotada. Remova o item para continuar.'
  if (line.quantity > line.available) return `Restam apenas ${line.available} unidades. Ajuste a quantidade.`
  return null
}

function useLineActions(line: CartLine) {
  const update = useUpdateCartLine()
  const remove = useRemoveCartLine()
  const announce = useAnnouncer()
  const max = Math.max(1, Math.min(line.available, line.maxPerOrder))
  return {
    max,
    pending: update.isPending || remove.isPending,
    setQuantity: (quantity: number) =>
      update.mutate(
        { lineId: line.id, quantity },
        {
          onSuccess: () => announce(`${line.name}: quantidade ${quantity}.`),
          onError: (e) => toast.error(errorMessage(e)),
        },
      ),
    remove: () =>
      remove.mutate(line.id, {
        onSuccess: () => announce(`${line.name} removido do carrinho.`),
        onError: (e) => toast.error(errorMessage(e)),
      }),
  }
}

function CartRow({ line }: { line: CartLine }) {
  const { max, pending, setQuantity, remove } = useLineActions(line)
  const problem = lineProblem(line)
  return (
    <li className="bg-surface-card" data-testid="cart-line">
      <div className="grid grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_40px] items-center gap-2 py-[10px] pr-4 pl-0">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/nft/$nftId" params={{ nftId: line.nftId }} aria-label={`Ver ${line.name}`} className="shrink-0">
            <NftImage artworkKey={line.artworkKey} alt="" variant="thumb" className="size-[70px] rounded-[4px]" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-body14-bold--lh-20 text-fg md:text-[15px]">{line.name}</p>
            <p className="truncate font-body14-regular--lh-20 text-fg-subtle">ID do token: {line.tokenId}</p>
            <p className="truncate font-caption12-regular--lh-16 text-fg-subtle">Edição {line.editionLabel}</p>
          </div>
        </div>
        <p className="font-body-large16-regular--lh-10 text-fg-muted">{formatEthValue(line.unitPrice)} ETH</p>
        <QuantityStepper value={line.quantity} max={max} onChange={setQuantity} label={line.name} size="sm" disabled={pending} />
        <p className="font-body-large16-bold--lh-20 text-accent" data-testid="line-total">
          {formatEthValue(line.lineTotal)} ETH
        </p>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Remover ${line.name} do carrinho`}
          className="flex size-8 items-center justify-center justify-self-end text-primary hover:text-primary-light disabled:opacity-50"
        >
          <Icon name="trash" size={20} />
        </button>
      </div>
      {problem && (
        <p role="alert" className="px-4 pb-3 font-caption12-regular--lh-16 text-coral">
          {problem}
        </p>
      )}
    </li>
  )
}

function MobileCartCard({ line }: { line: CartLine }) {
  const { max, pending, setQuantity, remove } = useLineActions(line)
  const problem = lineProblem(line)
  return (
    <li className="overflow-hidden rounded-[16px] bg-surface-card" data-testid="cart-line">
      <div className="flex">
        <NftImage artworkKey={line.artworkKey} alt="" variant="thumb" className="size-[100px] shrink-0 rounded-none" />
        <div className="relative flex min-w-0 flex-1 flex-col justify-center py-2 pr-24 pl-3">
          <p className="truncate font-body-large16-bold--lh-20 text-fg">{line.name}</p>
          <p className="font-body14-regular--lh-20 text-fg-muted">Edição: {line.editionLabel}</p>
          <p className="mt-1 font-title22-bold !leading-7 text-accent" data-testid="line-total">
            {formatEthValue(line.lineTotal)} ETH
          </p>
          <div className="absolute top-3 right-3">
            <QuantityStepper value={line.quantity} max={max} onChange={setQuantity} label={line.name} size="sm" disabled={pending} />
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Remover ${line.name} do carrinho`}
            className="absolute right-3 bottom-2 flex size-8 items-center justify-center text-primary disabled:opacity-50"
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      </div>
      {problem && (
        <p role="alert" className="px-3 pb-3 font-caption12-regular--lh-16 text-coral">
          {problem}
        </p>
      )}
    </li>
  )
}

function Summary({ quote, hasProblem, hasLines, compact }: { quote: Quote | undefined; hasProblem: boolean; hasLines: boolean; compact?: boolean }) {
  const session = useSession()
  const navigate = useNavigate()
  const cart = useCart()
  const blocked = !hasLines || hasProblem || (quote ? !quote.valid : false)

  function checkout() {
    if (!session) void navigate({ to: '/login', search: { redirect: '/checkout' } })
    else void navigate({ to: '/checkout' })
  }

  return (
    <div className={cn('flex flex-col', compact ? 'gap-3' : 'gap-6')}>
      <CouponForm appliedCode={cart.data?.couponCode ?? null} disabled={!hasLines} />
      <SummaryRows quote={quote} />
      <div className="flex flex-col gap-4">
        {compact ? (
          <Button variant="gradient" size="pill" className="rounded-full" disabled={blocked} onClick={checkout}>
            Conectar e finalizar
          </Button>
        ) : (
          <Button variant="default" size="none" className="h-10 rounded-[2px] font-body-large16-bold--lh-20" disabled={blocked} onClick={checkout}>
            Conectar e finalizar
          </Button>
        )}
        {hasProblem && (
          <p role="alert" className="font-caption12-regular--lh-16 text-coral">
            Corrija os itens indisponíveis para continuar.
          </p>
        )}
        {!compact && (
          <Link to="/" hash="catalogo" className="text-center font-body-large16-regular--lh-auto text-accent hover:underline">
            Continuar explorando
          </Link>
        )}
      </div>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className="grid gap-12 md:grid-cols-[minmax(0,782px)_332px] md:justify-between" aria-busy="true" aria-label="Carregando carrinho" data-testid="cart-skeleton">
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[70px] w-full md:h-[70px]" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function CartPage() {
  const cart = useCart()
  const quote = useQuote('ethereum', 'cart')
  const lines = cart.data?.lines ?? []
  const related = useRelated(lines[0]?.nftId ?? 'emerald-ape-042')
  const hasProblem = lines.some((line) => lineProblem(line) !== null)
  const isTabletUp = useIsTabletUp()

  return (
    <AppShell mobileTopBar={<MobileTopBar title="Carrinho de NFTs" />} showTabBar={false} mainClassName="max-md:pb-[360px]">
      <div className="container-content">
        <div className="md:mt-8">
          <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/', hash: 'catalogo' }, { label: 'Carrinho' }]} />
        </div>

        <div className="mt-1 flex items-center gap-4">
          <h1 className="sr-only">Carrinho de NFTs</h1>
          <RefreshingIndicator active={(cart.isFetching || quote.isFetching) && !cart.isPending} label="Atualizando carrinho…" />
        </div>

        {cart.isPending ? (
          <div className="mt-4">
            <CartSkeleton />
          </div>
        ) : cart.isError ? (
          <ErrorState className="mt-6" message={errorMessage(cart.error)} onRetry={() => void cart.refetch()} retrying={cart.isFetching} />
        ) : lines.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Seu carrinho está vazio"
            message="Explore o catálogo e adicione NFTs para continuar."
            action={
              <Link to="/" hash="catalogo" className={buttonVariants()}>
                Explorar NFTs
              </Link>
            }
          />
        ) : (
          <div className="grid gap-12 md:grid-cols-[minmax(0,782px)_332px] md:justify-between">
            <section aria-labelledby="cart-items-title" className="min-w-0">
              {isTabletUp ? (
                <div>
                  <div className="grid grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_40px] items-center gap-2 border-b border-divider pb-[10px] font-body14-bold--lh-20 text-fg">
                    <h2 id="cart-items-title">NFTs</h2>
                    <span>Preço</span>
                    <span>Edições</span>
                    <span>Total</span>
                    <span className="sr-only">Remover</span>
                  </div>
                  <ul className="mt-3 flex flex-col gap-3">
                    {lines.map((line) => (
                      <CartRow key={line.id} line={line} />
                    ))}
                  </ul>
                </div>
              ) : (
                <ul className="flex flex-col gap-4" aria-label="Itens do carrinho">
                  {lines.map((line) => (
                    <MobileCartCard key={line.id} line={line} />
                  ))}
                </ul>
              )}
            </section>

            {isTabletUp && (
              <aside aria-labelledby="summary-title">
                <h2 id="summary-title" className="border-b border-divider pb-[10px] font-body-large16-bold--lh-20 text-fg">
                  Resumo da carteira
                </h2>
                <div className="mt-6">
                  <Summary quote={quote.data} hasProblem={hasProblem} hasLines />
                </div>
              </aside>
            )}
          </div>
        )}

        {lines.length > 0 && isTabletUp && (
          <section className="mt-20 md:mt-[104px]" aria-labelledby="also-viewed">
            <h2 id="also-viewed" className="border-b border-divider pb-2 font-body-large18-bold--lh-24 text-accent">
              Colecionadores também viram
            </h2>
            <div className="mt-8">
              <NftCarousel items={related.data} loading={related.isPending} label="Colecionadores também viram" />
            </div>
          </section>
        )}
      </div>

      {lines.length > 0 && !isTabletUp && (
        <aside aria-label="Resumo do pedido" className="fixed inset-x-0 bottom-0 z-40 max-h-[70dvh] overflow-y-auto rounded-t-[32px] bg-surface-card px-6 pt-5 pb-6 shadow-[0_-8px_24px_rgb(0_0_0/0.35)]">
          <Summary quote={quote.data} hasProblem={hasProblem} hasLines compact />
        </aside>
      )}
    </AppShell>
  )
}
