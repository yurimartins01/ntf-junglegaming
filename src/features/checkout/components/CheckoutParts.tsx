import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/shared/Icon'
import { NftImage } from '@/components/shared/NftImage'
import { WalletBadge } from '@/components/shared/WalletBadge'
import type { Quote, Wallet, WalletProvider, WalletSlot } from '@/lib/api/contracts'
import { NETWORK_WALLET_LABELS, WALLET_PROVIDER_LABELS, WALLET_PROVIDER_ORDER } from '@/lib/domain'
import { formatEthValue } from '@/lib/money'
import { shortenAddress } from '@/lib/validation/rules'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary">
      {checked && <span className="size-2 rounded-full bg-primary" />}
    </span>
  )
}

export function SavedWalletCards({
  wallets,
  value,
  onChange,
}: {
  wallets: Partial<Record<WalletSlot, Wallet | null>>
  value: WalletSlot | 'custom'
  onChange: (slot: WalletSlot) => void
}) {
  const slots = (['secondary', 'primary'] as const).filter((slot) => wallets[slot])
  if (slots.length === 0) return null
  return (
    <div role="radiogroup" aria-label="Carteiras cadastradas" className="flex flex-col gap-3">
      {slots.map((slot) => {
        const wallet = wallets[slot]!
        const selected = value === slot
        return (
          <button
            key={slot}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(slot)}
            className={cn(
              'flex items-center gap-4 rounded-[12px] bg-surface-card px-5 py-4 text-left transition-colors md:rounded-[4px] md:border',
              selected ? 'md:border-primary' : 'md:border-border hover:md:border-border-soft',
            )}
          >
            <RadioDot checked={selected} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-body-large18-bold--lh-24 text-fg">{slot === 'primary' ? 'Principal' : wallet.nickname || 'Reserva'}</span>
              <span className="truncate font-body14-regular--lh-22 text-fg-muted">{shortenAddress(wallet.address)}</span>
              <span className="font-body14-regular--lh-22 text-fg-muted">{NETWORK_WALLET_LABELS[wallet.network]}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

const PROVIDER_ICON: Record<WalletProvider, { icon?: IconName; letter?: string }> = {
  walletconnect: { letter: 'W' },
  metamask: { letter: 'M' },
  coinbase: { icon: 'wallet' },
}

export function ProviderList({ value, onChange }: { value: WalletProvider | undefined; onChange: (provider: WalletProvider) => void }) {
  return (
    <div role="radiogroup" aria-label="Carteira e rede" className="flex flex-col gap-3 md:gap-4">
      <div className="hidden md:block" aria-hidden="true">
        <WalletBadge />
      </div>
      {WALLET_PROVIDER_ORDER.map((provider) => {
        const selected = value === provider
        const art = PROVIDER_ICON[provider]
        return (
          <button
            key={provider}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(provider)}
            className={cn(
              'flex h-[60px] items-center gap-4 rounded-[12px] bg-surface-card px-3 text-left transition-colors md:h-11 md:rounded-[2px] md:border md:px-3',
              selected ? 'md:border-fg' : 'md:border-border hover:md:border-border-soft',
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised font-body14-bold--lh-16 text-primary md:hidden"
            >
              {art.icon ? <Icon name={art.icon} size={20} /> : art.letter}
            </span>
            <span className="hidden md:block">
              <RadioDot checked={selected} />
            </span>
            <span className="flex-1 font-body-large16-regular--lh-auto text-fg">{WALLET_PROVIDER_LABELS[provider]}</span>
            <span className="md:hidden">
              <RadioDot checked={selected} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function CheckoutItems({ quote, footer }: { quote: Quote | undefined; footer?: ReactNode }) {
  return (
    <section aria-labelledby="checkout-items-title" className="hidden md:block">
      <h2 id="checkout-items-title" className="font-body-large16-bold--lh-20 text-fg">
        Seus NFTs
      </h2>
      <div className="mt-2 flex items-center justify-between font-body14-bold--lh-20 text-fg">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul className="mt-2 flex flex-col gap-3">
        {quote
          ? quote.lines.map((line) => (
              <li key={line.lineId} className="flex items-center gap-3 bg-surface-card pr-3" data-testid="checkout-line">
                <NftImage artworkKey={line.artworkKey} alt="" variant="thumb" className="size-[70px] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body14-bold--lh-20 text-fg">{line.name}</p>
                  <p className="truncate font-caption12-regular--lh-16 text-fg-subtle">ID do token: {line.tokenId}</p>
                  <p className="truncate font-caption12-regular--lh-16 text-fg-subtle">Edição {line.editionLabel}</p>
                  {line.status !== 'ok' && (
                    <p role="alert" className="font-caption12-regular--lh-16 text-coral">
                      {line.status === 'unavailable' ? 'Edição esgotada.' : `Restam apenas ${line.available}.`}
                    </p>
                  )}
                </div>
                <span className="font-body14-regular--lh-20 text-fg-muted">(x {line.quantity})</span>
                <span className="font-body-large16-bold--lh-20 text-accent">{formatEthValue(line.lineTotal)} ETH</span>
              </li>
            ))
          : Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[70px]" />)}
      </ul>
      {footer}
    </section>
  )
}
