import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { WalletProvider } from '@/lib/api/contracts'
import { WALLET_PROVIDER_LABELS } from '@/lib/domain'
import { shortenAddress } from '@/lib/validation/rules'

type Phase = 'requesting' | 'refused'

const CONNECT_DELAY_MS = 900

export function WalletConnectDialog({
  open,
  provider,
  address,
  onConnected,
  onCancel,
}: {
  open: boolean
  provider: WalletProvider
  address: string
  onConnected: () => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<Phase>('requesting')
  const [connecting, setConnecting] = useState(false)
  const name = WALLET_PROVIDER_LABELS[provider]

  useEffect(() => {
    if (!connecting) return
    const timer = setTimeout(() => {
      setConnecting(false)
      onConnected()
    }, CONNECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [connecting, onConnected])

  function handleOpenChange(next: boolean) {
    if (!next && !connecting) {
      setPhase('requesting')
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[420px] border-b-[6px] border-primary sm:max-w-[420px]" data-testid="wallet-connect-dialog">
        <DialogTitle>{phase === 'refused' ? 'Conexão recusada' : `Conectar ${name}`}</DialogTitle>
        <DialogDescription>
          {phase === 'refused'
            ? `A conexão com a ${name} foi recusada. Nenhum pedido foi criado e seu carrinho foi preservado.`
            : `A ${name} solicita acesso à carteira ${shortenAddress(address)} para concluir esta compra. Esta é uma conexão simulada.`}
        </DialogDescription>
        {phase === 'requesting' ? (
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" disabled={connecting} onClick={() => setPhase('refused')}>
              Recusar
            </Button>
            <Button disabled={connecting} onClick={() => setConnecting(true)} autoFocus>
              {connecting ? 'Conectando…' : 'Conectar'}
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Fechar
            </Button>
            <Button onClick={() => setPhase('requesting')}>Tentar novamente</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
