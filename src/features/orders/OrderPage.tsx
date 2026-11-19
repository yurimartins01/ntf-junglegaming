import { useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/shared/Icon'
import { NftImage } from '@/components/shared/NftImage'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { ErrorState } from '@/components/shared/StateViews'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { attemptStore, pendingOrderStore } from '@/features/checkout/checkout-storage'
import { useSession } from '@/features/auth/session-store'
import type { Order } from '@/lib/api/contracts'
import { toApiError } from '@/lib/api/errors'
import { WALLET_PROVIDER_LABELS } from '@/lib/domain'
import { formatReceiptDate, shortHash } from '@/lib/format'
import { formatEth, formatEthValue } from '@/lib/money'
import { useRealtimeStatus } from '@/features/realtime/RealtimeProvider'
import { useOrder } from './api'

function Shell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <main id="conteudo" className="flex min-h-dvh items-start justify-center px-4 py-12 md:py-[166px]">
      <h1 className="sr-only">{title}</h1>
      {children}
    </main>
  )
}

function Receipt({ order }: { order: Order }) {
  const navigate = useNavigate()
  return (
    <section
      aria-labelledby="receipt-title"
      className="relative w-full max-w-[578px] border-b-[10px] border-primary bg-surface-card"
      data-testid="receipt"
    >
      <button
        type="button"
        onClick={() => void navigate({ to: '/' })}
        className="absolute top-5 right-5 text-primary hover:opacity-80"
        aria-label="Fechar recibo"
      >
        <Icon name="close" size={16} />
      </button>
      <header className="flex flex-col items-center px-6 pt-[22px] pb-4 text-center">
        <Icon name="thankYou" size={80} className="h-20 w-[66px] text-primary" />
        <h2 id="receipt-title" className="mt-3 font-body-large16-bold--lh-20 text-fg-muted">
          Seus NFTs agora estão na sua carteira
        </h2>
      </header>

      <dl className="grid grid-cols-2 border-y border-primary font-body14-regular--lh-20 sm:grid-cols-4" data-testid="receipt-meta">
        {[
          ['ID da transação', order.transactionHash ? shortHash(order.transactionHash) : '—', true],
          ['Data', formatReceiptDate(order.createdAt), false],
          ['Total', formatEth(order.total), false],
          ['Carteira', WALLET_PROVIDER_LABELS[order.provider], true],
        ].map(([label, value, bold], index) => (
          <div key={label as string} className={`px-4 py-3 ${index > 0 ? 'sm:border-l sm:border-primary' : ''}`}>
            <dt className={bold ? 'font-bold text-fg-muted' : 'text-fg-muted'}>{label}</dt>
            <dd className="text-fg-muted" data-testid={`receipt-${index}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="px-6 pt-6 pb-6 sm:px-11">
        <h3 className="font-body14-bold--lh-20 text-fg">Detalhes da transação</h3>
        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-divider pb-2 font-body14-bold--lh-20 text-fg">
          <span>NFTs</span>
          <span>Edições</span>
          <span className="text-right">Subtotal</span>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {order.lines.map((line) => (
            <li key={`${line.nftId}-${line.editionId}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6" data-testid="receipt-line">
              <div className="flex items-center gap-3">
                <NftImage artworkKey={line.artworkKey} alt="" variant="thumb" className="size-[70px] shrink-0 rounded-[6px]" />
                <div className="min-w-0">
                  <p className="font-body14-bold--lh-20 text-fg">{line.name}</p>
                  <p className="font-caption12-regular--lh-16 text-fg-subtle">
                    ID do token: {line.tokenId} · Edição {line.editionLabel}
                  </p>
                </div>
              </div>
              <span className="font-body14-regular--lh-20 text-fg-muted">(x {line.quantity})</span>
              <span className="text-right font-body-large16-bold--lh-20 text-accent">{formatEthValue(line.lineTotal)} ETH</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex flex-col gap-1 border-b border-divider pb-3">
          {order.couponCode && (
            <div className="flex justify-between font-body14-regular--lh-20 text-fg">
              <dt>Desconto ({order.couponCode})</dt>
              <dd>(-) {formatEth(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between font-body-large16-regular--lh-10 text-fg">
            <dt>Taxa de rede</dt>
            <dd data-testid="receipt-fee">{formatEth(order.networkFee)}</dd>
          </div>
          <div className="flex justify-between font-body-large16-bold--lh-20 text-fg">
            <dt>Total</dt>
            <dd className="text-accent" data-testid="receipt-total">
              {formatEth(order.total)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-center font-body14-regular--lh-22 text-fg-muted">
          Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.
        </p>
        <div className="mt-5 flex justify-center">
          {order.explorerUrl ? (
            <a
              href={order.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: 'h-12 px-4 font-body-large16-bold--lh-20' })}
            >
              Ver no Etherscan<span className="sr-only"> (referência de transação simulada; abre em nova aba)</span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function StatusCard({ title, message, children, busy }: { title: string; message: string; children?: React.ReactNode; busy?: boolean }) {
  return (
    <section className="w-full max-w-[480px] border-b-[10px] border-primary bg-surface-card p-8 text-center" role={busy ? 'status' : 'alert'} aria-live="polite" data-testid="order-status">
      {busy && <span aria-hidden="true" className="mx-auto mb-4 block size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      <h2 className="font-body-large18-bold--lh-24 text-fg">{title}</h2>
      <p className="mt-2 font-body14-regular--lh-22 text-fg-muted">{message}</p>
      {children}
    </section>
  )
}

export function OrderPage({ orderId }: { orderId: string }) {
  const session = useSession()
  const order = useOrder(orderId)
  const realtime = useRealtimeStatus()
  const navigate = useNavigate()
  const status = order.data?.status

  useEffect(() => {
    if (status === 'confirmed' || status === 'declined') {
      pendingOrderStore.clear()
      attemptStore.clear()
    }
  }, [status])

  if (!session) return null
  if (order.isPending) {
    return (
      <Shell title="Carregando pedido">
        <Skeleton className="h-[480px] w-full max-w-[578px]" aria-label="Carregando pedido" />
      </Shell>
    )
  }
  if (order.isError) {
    const error = toApiError(order.error)
    if (error.code === 'NOT_FOUND') return <NotFoundPage title="Pedido não encontrado" message="Este pedido não existe ou não pertence à sua conta." />
    return (
      <Shell title="Pedido">
        <ErrorState className="w-full max-w-[480px]" message={error.message} onRetry={() => void order.refetch()} retrying={order.isFetching} />
      </Shell>
    )
  }

  const data = order.data
  if (data.status === 'confirmed') {
    return (
      <Shell title="Confirmação de pedido">
        <Receipt order={data} />
      </Shell>
    )
  }
  if (data.status === 'declined') {
    return (
      <Shell title="Pagamento recusado">
        <StatusCard title="Pagamento recusado" message={data.declineReason ?? 'O pagamento não foi aprovado. Nenhum valor foi cobrado e seus itens continuam no carrinho.'}>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/cart" className={buttonVariants({ variant: 'outline' })}>
              Voltar ao carrinho
            </Link>
            <Button onClick={() => void navigate({ to: '/checkout' })}>Tentar novamente</Button>
          </div>
        </StatusCard>
      </Shell>
    )
  }
  return (
    <Shell title="Pedido pendente">
      <StatusCard busy title="Aguardando confirmação" message="Seu pedido foi enviado e está sendo processado. Você pode atualizar a página: ele será recuperado sem criar outra compra.">
        {realtime === 'disconnected' && (
          <p className="mt-4 font-caption12-regular--lh-16 text-amber" role="status">
            Conexão em tempo real interrompida. Reconectando e consultando o servidor…
          </p>
        )}
        <Button variant="outline" size="sm" className="mt-6" onClick={() => void order.refetch()} disabled={order.isFetching}>
          Atualizar status
        </Button>
      </StatusCard>
    </Shell>
  )
}
