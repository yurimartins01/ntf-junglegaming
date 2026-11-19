import type { EthAmount } from '@/lib/api/contracts'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

export function PriceTag({
  price,
  previousPrice,
  className,
}: {
  price: EthAmount
  previousPrice?: EthAmount | null
  className?: string
}) {
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2 font-body-large18-bold--lh-24 text-accent', className)}>
      <span>{formatEth(price)}</span>
      {previousPrice ? (
        <s className="font-body-large18-regular leading-6 text-fg-muted">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(previousPrice)}
        </s>
      ) : null}
    </p>
  )
}
