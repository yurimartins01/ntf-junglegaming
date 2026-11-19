import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { TextField } from '@/components/shared/FormField'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { WalletFieldsGrid } from '@/components/shared/WalletFieldsGrid'
import { ErrorState } from '@/components/shared/StateViews'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SaveWalletRequest, Wallet, WalletSlot } from '@/lib/api/contracts'
import { toApiError } from '@/lib/api/errors'
import { applyApiErrors } from '@/lib/form-errors'
import { walletSchema, type WalletForm } from '@/lib/validation/schemas'
import { useSession } from '@/features/auth/session-store'
import { ProfileLayout } from './ProfileLayout'
import { useSaveWallet, useWallets } from './api'

const FIELDS = ['displayName', 'nickname', 'network', 'profileName', 'address', 'secondaryAddress', 'provider', 'referralCode', 'email', 'ensName'] as const

function toForm(wallet: Wallet | null, fallback: { displayName: string; email: string; nickname: string }): WalletForm {
  return {
    displayName: wallet?.displayName ?? fallback.displayName,
    nickname: wallet?.nickname ?? fallback.nickname,
    network: wallet?.network as WalletForm['network'],
    profileName: wallet?.profileName ?? fallback.displayName,
    address: wallet?.address ?? '',
    secondaryAddress: wallet?.secondaryAddress ?? '',
    provider: wallet?.provider as WalletForm['provider'],
    referralCode: wallet?.referralCode ?? '',
    email: wallet?.email ?? fallback.email,
    ensName: wallet?.ensName ?? '',
  }
}

function WalletForm({ slot, wallet }: { slot: WalletSlot; wallet: Wallet | null }) {
  const user = useSession()!.user
  const save = useSaveWallet()
  const announce = useAnnouncer()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: toForm(wallet, { displayName: user.displayName, email: user.email, nickname: slot === 'primary' ? 'Principal' : 'Reserva' }),
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    const body: SaveWalletRequest = { ...values }
    save.mutate(
      { slot, body },
      {
        onSuccess: () => {
          const message = `Carteira ${slot === 'primary' ? 'principal' : 'secundária'} salva.`
          toast.success(message)
          announce(message)
        },
        onError: (error) => {
          const message = applyApiErrors(error, form.setError, FIELDS)
          if (message) setFormError(message)
        },
      },
    )
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-label={`Carteira ${slot === 'primary' ? 'principal' : 'secundária'}`}>
      <WalletFieldsGrid
        form={form}
        slot={<TextField label="Apelido da carteira" required error={errors.nickname?.message} registration={form.register('nickname')} />}
      />
      {formError && (
        <p role="alert" className="font-body14-regular--lh-20 text-coral">
          {formError}
        </p>
      )}
      <div>
        <Button type="submit" size="none" disabled={save.isPending} className="h-10 rounded-[2px] px-3 font-body14-bold--lh-20">
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
      </div>
    </form>
  )
}

function SecondaryWallet({ wallet, sameAsPrimary, hasPrimary }: { wallet: Wallet | null; sameAsPrimary: boolean; hasPrimary: boolean }) {
  const [adding, setAdding] = useState(false)
  const save = useSaveWallet()
  const announce = useAnnouncer()
  const showForm = (wallet && !sameAsPrimary) || adding

  function toggleSame(checked: boolean) {
    if (!checked) return
    save.mutate(
      { slot: 'secondary', body: { sameAsPrimary: true } as SaveWalletRequest },
      {
        onSuccess: () => {
          setAdding(false)
          announce('Carteira secundária igual à principal.')
        },
        onError: (error) => toast.error(toApiError(error).fieldErrors.sameAsPrimary ?? toApiError(error).message),
      },
    )
  }

  return (
    <section aria-labelledby="secondary-title" className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="secondary-title" className="font-body-large18-bold--lh-24 text-fg">
          Carteira secundária
        </h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 font-body14-regular--lh-20 text-fg">
            <input
              type="checkbox"
              checked={sameAsPrimary}
              disabled={!hasPrimary || save.isPending}
              onChange={(e) => toggleSame(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            Igual à carteira principal
          </label>
          {!showForm && (
            <button type="button" onClick={() => setAdding(true)} className="font-body-large16-bold--lh-20 text-accent hover:underline">
              Adicionar
            </button>
          )}
        </div>
      </div>
      {sameAsPrimary ? (
        <p className="mt-2 font-body14-regular--lh-22 text-fg-muted">A carteira secundária usa os mesmos dados da carteira principal.</p>
      ) : showForm ? (
        <div className="mt-4">
          <WalletForm slot="secondary" wallet={wallet} />
        </div>
      ) : (
        <p className="mt-2 font-body14-regular--lh-22 text-fg-muted">Você ainda não adicionou uma carteira secundária.</p>
      )}
    </section>
  )
}

export function WalletsPage() {
  const wallets = useWallets()
  return (
    <ProfileLayout title="Carteira principal">
      <p className="-mt-4 mb-6 font-body14-regular--lh-22 text-fg-muted">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
      {wallets.isPending ? (
        <div className="grid gap-5 md:grid-cols-2" aria-busy="true" aria-label="Carregando carteiras">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[66px]" />
          ))}
        </div>
      ) : wallets.isError ? (
        <ErrorState message={toApiError(wallets.error).message} onRetry={() => void wallets.refetch()} retrying={wallets.isFetching} />
      ) : (
        <>
          <WalletForm slot="primary" wallet={wallets.data.primary} />
          <SecondaryWallet wallet={wallets.data.secondary} sameAsPrimary={wallets.data.secondarySameAsPrimary} hasPrimary={Boolean(wallets.data.primary)} />
        </>
      )}
    </ProfileLayout>
  )
}
