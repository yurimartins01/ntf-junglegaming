import { cn } from '@/lib/utils'

export function WalletBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center gap-2 rounded-[4px] border border-border-soft bg-surface-dark px-2 text-[9px] leading-none font-bold tracking-wide whitespace-nowrap text-primary uppercase',
        className,
      )}
    >
      MetaMask <span aria-hidden="true">•</span> WalletConnect <span aria-hidden="true">•</span> Coinbase
    </span>
  )
}
