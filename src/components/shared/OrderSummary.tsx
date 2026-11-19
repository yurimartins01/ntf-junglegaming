import type { Quote } from '@/lib/api/contracts'
import { formatDiscount, formatEth, formatEthValue } from '@/lib/money'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function SummaryRows({ quote, className }: { quote: Quote | undefined; className?: string }) {
  if (!quote) return <SummarySkeleton className={className} />
  return (
    <dl className={cn('flex flex-col', className)} data-testid="summary-rows">
      <div className="flex items-center justify-between">
        <dt className="font-body14-regular--lh-24 text-fg md:font-body-large16-regular--lh-10">Subtotal</dt>
        <dd className="font-body-large16-regular--lh-10 text-fg md:type-22-bold md:font-normal" data-testid="summary-subtotal">
          {formatEthValue(quote.subtotal)} ETH
        </dd>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <dt className="font-body14-regular--lh-24 text-fg">{quote.coupon ? `Desconto (${quote.coupon.code})` : 'Desconto do lançamento'}</dt>
        <dd className="font-body14-regular--lh-24 text-fg" data-testid="summary-discount">
          {formatDiscount(quote.discount)}
        </dd>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <dt className="font-body14-regular--lh-24 text-fg md:font-body-large16-regular--lh-10">Taxa de rede</dt>
        <dd className="font-body-large16-regular--lh-10 text-fg" data-testid="summary-fee">
          {formatEth(quote.networkFee)}
        </dd>
      </div>
      <p className="text-right font-caption12-regular--lh-16 text-accent">Taxa estimada</p>
      <div className="mt-5 flex items-center justify-between">
        <dt className="font-body-large16-bold--lh-20 text-fg">Total</dt>
        <dd className="font-body-large18-bold--lh-24 text-accent md:text-[18px]" data-testid="summary-total">
          {formatEth(quote.total)}
        </dd>
      </div>
    </dl>
  )
}

export function SummarySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="Carregando resumo" data-testid="summary-skeleton">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="mt-3 h-7 w-full" />
    </div>
  )
}
