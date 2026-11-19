import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { SummaryRows } from '@/components/shared/OrderSummary'
import type { NetworkId, Quote, WalletProvider } from '@/lib/api/contracts'
import { NETWORK_LABELS, WALLET_PROVIDER_LABELS } from '@/lib/domain'
import { compareEth, formatEth, formatEthValue } from '@/lib/money'
import { shortenAddress } from '@/lib/validation/rules'

export function describeQuoteChanges(reviewed: Quote, live: Quote): string[] {
  const changes: string[] = []
  for (const line of live.lines) {
    const before = reviewed.lines.find((l) => l.lineId === line.lineId)
    if (!before) {
      changes.push(`${line.name} foi adicionado ao pedido.`)
      continue
    }
    if (compareEth(before.unitPrice, line.unitPrice) !== 0) {
      changes.push(`${line.name}: preço de ${formatEth(before.unitPrice)} para ${formatEth(line.unitPrice)}.`)
    }
    if (line.status === 'unavailable') changes.push(`${line.name}: a edição ${line.editionLabel} esgotou.`)
    else if (line.status === 'insufficient') changes.push(`${line.name}: restam apenas ${line.available} unidades.`)
  }
  for (const line of reviewed.lines) {
    if (!live.lines.some((l) => l.lineId === line.lineId)) changes.push(`${line.name} não está mais no pedido.`)
  }
  if (reviewed.coupon?.code !== live.coupon?.code) changes.push('O cupom aplicado mudou.')
  if (compareEth(reviewed.networkFee, live.networkFee) !== 0) changes.push(`A taxa de rede mudou para ${formatEth(live.networkFee)}.`)
  if (changes.length === 0 && compareEth(reviewed.total, live.total) !== 0) changes.push(`O total mudou para ${formatEth(live.total)}.`)
  return changes
}

export interface ReviewState {
  reviewed: Quote
}

interface ReviewDialogProps {
  open: boolean
  reviewed: Quote
  live: Quote | undefined
  network: NetworkId
  provider: WalletProvider
  address: string
  submitting: boolean
  error: string | null
  needsRecovery: boolean
  onAcknowledge: () => void
  onConfirm: () => void
  onClose: () => void
}

export function ReviewDialog({
  open,
  reviewed,
  live,
  network,
  provider,
  address,
  submitting,
  error,
  needsRecovery,
  onAcknowledge,
  onConfirm,
  onClose,
}: ReviewDialogProps) {
  const current = live ?? reviewed
  const stale = current.id !== reviewed.id
  const changes = stale ? describeQuoteChanges(reviewed, current) : []
  const blocked = !reviewed.valid

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-[560px] overflow-y-auto border-b-[6px] border-primary sm:max-w-[560px]" data-testid="review-dialog">
        <DialogTitle>Revisar compra</DialogTitle>
        <DialogDescription>
          Confira os valores antes de enviar. A cotação do servidor é a referência para finalizar o pedido.
        </DialogDescription>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-body14-regular--lh-20">
          <dt className="text-fg-muted">Carteira</dt>
          <dd className="text-fg">
            {WALLET_PROVIDER_LABELS[provider]} · {shortenAddress(address)}
          </dd>
          <dt className="text-fg-muted">Rede</dt>
          <dd className="text-fg">{NETWORK_LABELS[network]}</dd>
        </dl>

        <ul className="flex flex-col gap-2 border-y border-divider py-3" aria-label="Itens do pedido">
          {reviewed.lines.map((line) => (
            <li key={line.lineId} className="flex items-baseline justify-between gap-3 font-body14-regular--lh-20">
              <span className="text-fg">
                {line.name} <span className="text-fg-subtle">· {line.editionLabel} · (x {line.quantity})</span>
              </span>
              <span className="shrink-0 font-bold text-accent">{formatEthValue(line.lineTotal)} ETH</span>
            </li>
          ))}
        </ul>

        <SummaryRows quote={stale ? current : reviewed} />

        {stale && (
          <div role="alert" className="rounded-[4px] border border-amber p-3" data-testid="quote-changed">
            <p className="font-body14-bold--lh-20 text-amber">Os valores do pedido mudaram</p>
            <ul className="mt-1 list-disc pl-5 font-caption12-regular--lh-16 text-fg">
              {changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>
        )}
        {!stale && blocked && (
          <p role="alert" className="font-body14-regular--lh-20 text-coral">
            Alguns itens estão indisponíveis. Volte ao carrinho para ajustar o pedido.
          </p>
        )}
        {error && (
          <p role="alert" className="font-body14-regular--lh-20 text-coral" data-testid="review-error">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            Voltar
          </Button>
          {stale ? (
            <Button onClick={onAcknowledge} disabled={current.lines.length === 0}>
              Aceitar novos valores
            </Button>
          ) : (
            <Button onClick={onConfirm} disabled={submitting || blocked} data-testid="confirm-order">
              {submitting ? 'Enviando pedido…' : needsRecovery ? 'Verificar pedido' : 'Confirmar e pagar'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
