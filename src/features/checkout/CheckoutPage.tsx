import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Icon } from '@/components/shared/Icon'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { SummaryRows } from '@/components/shared/OrderSummary'
import { TextField } from '@/components/shared/FormField'
import { WalletFieldsGrid } from '@/components/shared/WalletFieldsGrid'
import { EmptyState, ErrorState } from '@/components/shared/StateViews'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsTabletUp } from '@/hooks/use-media-query'
import { Textarea } from '@/components/ui/textarea'
import { useWallets } from '@/features/account/api'
import { useSession } from '@/features/auth/session-store'
import { useCart, useQuote } from '@/features/cart/api'
import type { CreateOrderRequest, NetworkId, Quote, Wallet, WalletProvider, WalletSlot } from '@/lib/api/contracts'
import type { ApiError } from '@/lib/api/errors'
import { toApiError } from '@/lib/api/errors'
import { applyApiErrors } from '@/lib/form-errors'
import { readStorage, STORAGE_KEYS, writeStorage } from '@/lib/storage'
import { checkoutSchema, type CheckoutForm } from '@/lib/validation/schemas'
import { attemptStore, pendingOrderStore, useWalletConnection, walletConnection } from './checkout-storage'
import { useSendOrder } from './use-send-order'
import { CheckoutItems, ProviderList, SavedWalletCards } from './components/CheckoutParts'
import { ReviewDialog } from './components/ReviewDialog'
import { WalletConnectDialog } from './components/WalletConnectDialog'

type WalletChoice = WalletSlot | 'custom'

interface Draft {
  userId: string
  choice: WalletChoice
  values: Partial<CheckoutForm>
}

const EMPTY_WALLET_FIELDS = { network: undefined, provider: undefined, address: '', secondaryAddress: '', referralCode: '' }

function walletToValues(wallet: Wallet) {
  return {
    displayName: wallet.displayName,
    profileName: wallet.profileName,
    network: wallet.network,
    address: wallet.address,
    secondaryAddress: wallet.secondaryAddress,
    provider: wallet.provider,
    referralCode: wallet.referralCode,
    email: wallet.email,
    ensName: wallet.ensName,
  }
}

function buildDefaults(userId: string, username: string, displayName: string, email: string, ensName: string, wallets: { primary: Wallet | null; secondary: Wallet | null }): { choice: WalletChoice; values: CheckoutForm } {
  const draft = readStorage<Draft>('session', STORAGE_KEYS.checkoutDraft)
  const base: CheckoutForm = {
    displayName,
    username,
    profileName: displayName,
    email,
    ensName,
    network: undefined as unknown as NetworkId,
    provider: undefined as unknown as WalletProvider,
    address: '',
    secondaryAddress: '',
    referralCode: '',
    note: '',
  }
  if (draft && draft.userId === userId) return { choice: draft.choice, values: { ...base, ...draft.values } }
  const preferred = wallets.primary ?? wallets.secondary
  if (preferred) return { choice: preferred.slot, values: { ...base, ...walletToValues(preferred) } }
  return { choice: 'custom', values: base }
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-12 md:grid-cols-[minmax(0,763px)_405px] md:justify-between" aria-busy="true" aria-label="Carregando pagamento" data-testid="checkout-skeleton">
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-[66px]" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[70px]" />
        <Skeleton className="h-[70px]" />
        <Skeleton className="h-[70px]" />
        <Skeleton className="h-24" />
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const session = useSession()!
  const cart = useCart()
  const wallets = useWallets()
  const navigate = useNavigate()
  const pendingId = pendingOrderStore.get(session.user.id)

  useEffect(() => {
    if (pendingId) void navigate({ to: '/orders/$orderId', params: { orderId: pendingId }, replace: true })
  }, [pendingId, navigate])

  const lines = cart.data?.lines ?? []
  const loading = cart.isPending || wallets.isPending
  const failed = cart.isError || wallets.isError
  const hasAttempt = attemptStore.get(session.user.id) !== null

  return (
    <AppShell mobileTopBar={<MobileTopBar title="Pagamento com carteira" />} showTabBar={false} mainClassName="max-md:pb-[200px]">
      <div className="container-content">
        <div className="md:mt-8">
          <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/', hash: 'catalogo' }, { label: 'Pagamento' }]} />
        </div>
        <h1 className="sr-only">Pagamento</h1>
        <div className="mt-4 md:mt-6">
          {loading ? (
            <CheckoutSkeleton />
          ) : failed ? (
            <ErrorState
              message={toApiError(cart.error ?? wallets.error).message}
              onRetry={() => {
                void cart.refetch()
                void wallets.refetch()
              }}
            />
          ) : lines.length === 0 && hasAttempt ? (
            <RecoveryCard userId={session.user.id} />
          ) : lines.length === 0 ? (
            <EmptyState
              title="Seu carrinho está vazio"
              message="Adicione NFTs ao carrinho para finalizar uma compra."
              action={
                <Link to="/" hash="catalogo" className={buttonVariants()}>
                  Explorar NFTs
                </Link>
              }
            />
          ) : (
            <CheckoutBody wallets={wallets.data!} />
          )}
        </div>
      </div>
    </AppShell>
  )
}

function CheckoutBody({ wallets }: { wallets: { primary: Wallet | null; secondary: Wallet | null } }) {
  const session = useSession()!
  const user = session.user
  const announce = useAnnouncer()
  const sender = useSendOrder(user.id)
  const connection = useWalletConnection(user.id)

  const initial = useMemo(
    () => buildDefaults(user.id, user.username, user.displayName, user.email, user.ensName, wallets),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [choice, setChoice] = useState<WalletChoice>(initial.choice)
  const form = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema), defaultValues: initial.values, mode: 'onTouched' })
  const { errors } = form.formState

  const network = (useWatch({ control: form.control, name: 'network' }) as NetworkId | undefined) ?? 'ethereum'
  const provider = useWatch({ control: form.control, name: 'provider' }) as WalletProvider | undefined
  const address = useWatch({ control: form.control, name: 'address' })
  const watched = useWatch({ control: form.control })
  const quoteQuery = useQuote(network, 'checkout')
  const quote = quoteQuery.data

  const [connectOpen, setConnectOpen] = useState(false)
  const [reviewed, setReviewed] = useState<Quote | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [needsRecovery, setNeedsRecovery] = useState(() => attemptStore.get(user.id) !== null)
  const [formError, setFormError] = useState<string | null>(null)
  const [useOther, setUseOther] = useState(initial.choice === 'custom')
  const isTabletUp = useIsTabletUp()
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const hasSavedWallets = Boolean(wallets.primary || wallets.secondary)
  const detailsOpen = isTabletUp || detailsExpanded || useOther || !hasSavedWallets || Object.keys(errors).length > 0

  useEffect(() => {
    writeStorage('session', STORAGE_KEYS.checkoutDraft, { userId: user.id, choice, values: watched } satisfies Draft)
  }, [watched, choice, user.id])

  function selectSaved(slot: WalletSlot) {
    const wallet = wallets[slot]
    if (!wallet) return
    setChoice(slot)
    setUseOther(false)
    for (const [key, value] of Object.entries(walletToValues(wallet))) form.setValue(key as keyof CheckoutForm, value as never, { shouldValidate: true })
  }

  function toggleOther(checked: boolean) {
    setUseOther(checked)
    if (checked) {
      setChoice('custom')
      for (const [key, value] of Object.entries(EMPTY_WALLET_FIELDS)) form.setValue(key as keyof CheckoutForm, value as never)
      walletConnection.disconnect()
    } else {
      const fallback = wallets.primary ?? wallets.secondary
      if (fallback) selectSaved(fallback.slot)
    }
  }

  const openReview = useCallback(async () => {
    const result = await quoteQuery.refetch()
    if (!result.data) {
      toast.error('Não foi possível atualizar a cotação. Tente novamente.')
      return
    }
    setReviewError(null)
    setReviewed(result.data)
  }, [quoteQuery])

  const onValid = form.handleSubmit(
    (values) => {
      setFormError(null)
      if (connection && connection.provider === values.provider && connection.address === values.address) void openReview()
      else setConnectOpen(true)
    },
    () => {
      const message = 'Corrija os campos destacados para continuar.'
      setFormError(message)
      announce(message)
    },
  )

  function disconnect() {
    walletConnection.disconnect()
    announce('Carteira desconectada.')
  }

  function submitOrder(quoteToSend: Quote) {
    const values = form.getValues()
    const payload: CreateOrderRequest = {
      quoteId: quoteToSend.id,
      network: values.network,
      walletSlot: choice,
      provider: values.provider,
      collector: {
        displayName: values.displayName,
        username: values.username,
        profileName: values.profileName,
        email: values.email,
        ensName: values.ensName,
        referralCode: values.referralCode,
        walletAddress: values.address,
        secondaryWallet: values.secondaryAddress,
        note: values.note,
      },
    }
    const attempt = attemptStore.begin(user.id, payload)
    setReviewError(null)
    sender.send(attempt.payload, attempt.key, handleSendError)
  }

  function handleSendError(apiError: ApiError) {
    if (apiError.code === 'TIMEOUT' || apiError.code === 'NETWORK_ERROR') {
      setNeedsRecovery(true)
      setReviewError('Não recebemos a resposta do servidor. Seu pedido pode ter sido criado: use "Verificar pedido" para recuperá-lo sem criar outra compra.')
      return
    }
    if (apiError.code === 'QUOTE_OUTDATED' || apiError.code === 'AVAILABILITY_CONFLICT') {
      attemptStore.clear()
      void quoteQuery.refetch()
      setReviewError(apiError.message)
      return
    }
    if (apiError.code === 'VALIDATION_ERROR') {
      setReviewed(null)
      const message = applyApiErrors(apiError, form.setError, Object.keys(checkoutSchema.shape), { walletAddress: 'address', secondaryWallet: 'secondaryAddress' })
      if (message) setFormError(message)
      return
    }
    if (apiError.code === 'IDEMPOTENCY_CONFLICT') attemptStore.clear()
    setReviewError(apiError.message)
  }

  const stale = reviewed !== null && quote !== undefined && quote.id !== reviewed.id
  const submitting = sender.pending
  const summaryTotal = quote?.total

  const selectedProvider = provider

  return (
    <>
      {needsRecovery && !reviewed && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-amber p-4" data-testid="recovery-banner">
          <p className="font-body14-regular--lh-20 text-fg">Há uma tentativa de compra aguardando resposta do servidor. Verifique antes de tentar novamente.</p>
          <Button size="sm" disabled={submitting} onClick={() => sender.recover(handleSendError)}>
            Verificar pedido
          </Button>
        </div>
      )}

      <form onSubmit={onValid} noValidate className="grid gap-10 md:grid-cols-[minmax(0,763px)_405px] md:justify-between md:gap-12" aria-describedby={formError ? 'checkout-form-error' : undefined}>
        <section aria-labelledby="collector-title" className="min-w-0">
          <div className="md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-body-large18-bold--lh-24 text-fg">Carteira conectada</h2>
              {wallets.primary && wallets.secondary ? (
                <button type="button" className="font-body14-bold--lh-20 text-accent" onClick={() => selectSaved(choice === 'primary' ? 'secondary' : 'primary')}>
                  Trocar carteira
                </button>
              ) : null}
            </div>
          </div>
          {(wallets.primary || wallets.secondary) && (
            <div className="mb-6">
              <SavedWalletCards wallets={wallets} value={choice} onChange={selectSaved} />
            </div>
          )}

          <div>
            {!isTabletUp && hasSavedWallets && (
              <button
                type="button"
                aria-expanded={detailsOpen}
                aria-controls="collector-fields"
                onClick={() => setDetailsExpanded((v) => !v)}
                className="flex w-full items-center justify-between font-body-large16-bold--lh-20 text-fg"
              >
                Dados do colecionador
                <Icon name="chevronDown" size={18} className={detailsOpen ? 'rotate-180' : undefined} />
              </button>
            )}
            <h2 id="collector-title" className="mb-4 hidden font-body-large18-bold--lh-24 text-fg md:block">
              Perfil do colecionador
            </h2>
            <div id="collector-fields" hidden={!detailsOpen} className="mt-4 md:mt-0">
              <WalletFieldsGrid
                form={form}
                slot={<TextField label="Nome de usuário" required error={errors.username?.message} registration={form.register('username')} inputProps={{ autoComplete: 'username' }} />}
              />
            </div>
            <div className="mt-5 flex items-center gap-3" hidden={!detailsOpen}>
              <input
                id="use-other-wallet"
                type="checkbox"
                checked={useOther}
                onChange={(e) => toggleOther(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              <label htmlFor="use-other-wallet" className="font-body-large16-regular--lh-auto text-fg">
                Usar outra carteira?
              </label>
            </div>
            <div className="mt-6" hidden={!detailsOpen}>
              <label htmlFor="collector-note" className="font-body-large16-regular--lh-auto text-fg">
                Observação do colecionador (opcional)
              </label>
              <Textarea id="collector-note" {...form.register('note')} className="mt-3 h-[150px] max-w-[350px] resize-none" aria-invalid={Boolean(errors.note)} />
              {errors.note && (
                <p role="alert" className="mt-1 font-caption12-regular--lh-16 text-coral">
                  {errors.note.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <aside aria-label="Resumo do pedido" className="flex flex-col gap-6">
          <CheckoutItems
            quote={quote}
            footer={
              <p className="mt-4 text-center font-body14-regular--lh-20 text-fg">
                Tem um código promocional?{' '}
                <Link to="/cart" className="text-accent underline-offset-4 hover:underline">
                  Aplique aqui
                </Link>
              </p>
            }
          />
          <div className="hidden md:block">
            <SummaryRows quote={quote} />
          </div>

          <section aria-labelledby="provider-title" className="flex flex-col gap-4">
            <h2 id="provider-title" className="font-body-large18-bold--lh-24 text-fg md:text-center">
              Carteira e rede
            </h2>
            {errors.provider?.message && (
              <p role="alert" className="font-caption12-regular--lh-16 text-coral">
                {errors.provider.message}
              </p>
            )}
            <ProviderList value={selectedProvider} onChange={(p) => form.setValue('provider', p, { shouldValidate: true, shouldDirty: true })} />
          </section>

          {connection && (
            <p className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] bg-surface-card px-3 py-2 font-body14-regular--lh-20 text-fg" data-testid="connected-wallet" role="status">
              <span>Carteira conectada: {connection.provider}</span>
              <button type="button" onClick={disconnect} className="font-body14-bold--lh-20 text-accent hover:underline">
                Desconectar
              </button>
            </p>
          )}

          <div className="flex items-center justify-between md:hidden">
            <span className="font-body14-bold--lh-20 text-fg">Total:</span>
            <span className="font-body-large18-bold--lh-24 text-accent">{summaryTotal ? `${summaryTotal} ETH` : '—'}</span>
          </div>

          {formError && (
            <p id="checkout-form-error" role="alert" className="font-body14-regular--lh-20 text-coral">
              {formError}
            </p>
          )}

          <Button type="submit" size="none" className="h-[45px] rounded-[2px] font-body-large16-bold--lh-20 max-md:h-[60px] max-md:rounded-[16px] max-md:bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-primary-dark)_100%)]" disabled={submitting || !quote || quoteQuery.isError}>
            Confirmar compra
          </Button>
        </aside>
      </form>

      {connectOpen && selectedProvider && (
        <WalletConnectDialog
          open
          provider={selectedProvider}
          address={address}
          onCancel={() => setConnectOpen(false)}
          onConnected={() => {
            walletConnection.connect({ userId: user.id, provider: selectedProvider, address })
            setConnectOpen(false)
            announce('Carteira conectada.')
            void openReview()
          }}
        />
      )}

      {reviewed && selectedProvider && (
        <ReviewDialog
          open
          reviewed={reviewed}
          live={quote}
          network={network}
          provider={selectedProvider}
          address={address}
          submitting={submitting}
          error={reviewError}
          needsRecovery={needsRecovery}
          onAcknowledge={() => {
            if (quote) {
              setReviewed(quote)
              setReviewError(null)
              attemptStore.clear()
              setNeedsRecovery(false)
            }
          }}
          onConfirm={() => (needsRecovery ? sender.recover(handleSendError) : submitOrder(reviewed))}
          onClose={() => setReviewed(null)}
        />
      )}
      {stale ? <span className="sr-only" role="status">Os valores do pedido mudaram.</span> : null}
    </>
  )
}

function RecoveryCard({ userId }: { userId: string }) {
  const sender = useSendOrder(userId)
  const [error, setError] = useState<string | null>(null)
  return (
    <section role="alert" className="mx-auto flex max-w-[560px] flex-col items-center gap-3 rounded-[4px] border border-amber bg-surface-card p-8 text-center" data-testid="recovery-banner">
      <h2 className="font-body-large18-bold--lh-24 text-fg">Compra aguardando resposta do servidor</h2>
      <p className="font-body14-regular--lh-22 text-fg-muted">
        Não recebemos a resposta do seu último pedido. Verifique o resultado: o mesmo pedido será recuperado, sem criar outra compra.
      </p>
      {error && <p className="font-body14-regular--lh-20 text-coral">{error}</p>}
      <Button disabled={sender.pending} onClick={() => sender.recover((e) => setError(e.message))}>
        {sender.pending ? 'Verificando…' : 'Verificar pedido'}
      </Button>
    </section>
  )
}
