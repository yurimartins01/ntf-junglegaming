import type { ReactNode } from 'react'
import { Controller, type FieldErrors, type Path, type UseFormReturn } from 'react-hook-form'
import { EnsField } from '@/components/shared/EnsField'
import { SelectField } from '@/components/shared/SelectField'
import { TextField } from '@/components/shared/FormField'
import { NETWORK_LABELS, NETWORK_ORDER, WALLET_PROVIDER_LABELS } from '@/lib/domain'
import type { WalletFieldValues } from '@/lib/validation/schemas'

const NETWORK_OPTIONS = NETWORK_ORDER.map((id) => ({ value: id, label: NETWORK_LABELS[id] }))
const PROVIDER_OPTIONS = [
  { value: 'metamask', label: WALLET_PROVIDER_LABELS.metamask },
  { value: 'walletconnect', label: WALLET_PROVIDER_LABELS.walletconnect },
  { value: 'coinbase', label: WALLET_PROVIDER_LABELS.coinbase },
]

interface WalletFieldsGridProps<T extends WalletFieldValues> {
  form: UseFormReturn<T>
  slot: ReactNode
  onProviderChange?: (value: string) => void
  onNetworkChange?: (value: string) => void
}

export function WalletFieldsGrid<T extends WalletFieldValues>({ form, slot, onProviderChange, onNetworkChange }: WalletFieldsGridProps<T>) {
  const errors = form.formState.errors as FieldErrors<WalletFieldValues>
  const reg = (name: keyof WalletFieldValues) => form.register(name as Path<T>)
  const control = form.control

  return (
    <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
      <TextField label="Nome de exibição" required error={errors.displayName?.message} registration={reg('displayName')} inputProps={{ autoComplete: 'name' }} />
      {slot}
      <Controller
        control={control}
        name={'network' as Path<T>}
        render={({ field }) => (
          <SelectField
            label="Rede"
            required
            error={errors.network?.message}
            value={field.value as string | undefined}
            onValueChange={(value) => {
              field.onChange(value)
              onNetworkChange?.(value)
            }}
            onBlur={field.onBlur}
            options={NETWORK_OPTIONS}
            placeholder="Selecione uma rede"
          />
        )}
      />
      <TextField label="Nome do perfil" required error={errors.profileName?.message} registration={reg('profileName')} />
      <TextField label="Endereço da carteira" required error={errors.address?.message} registration={reg('address')} inputProps={{ placeholder: 'Endereço 0x da carteira', autoComplete: 'off', spellCheck: false }} />
      <TextField
        label="Carteira secundária (opcional)"
        hideLabel
        error={errors.secondaryAddress?.message}
        registration={reg('secondaryAddress')}
        inputProps={{ placeholder: 'ENS ou carteira secundária (opcional)', autoComplete: 'off', spellCheck: false }}
        className="md:mt-[34px]"
      />
      <Controller
        control={control}
        name={'provider' as Path<T>}
        render={({ field }) => (
          <SelectField
            label="Tipo de carteira"
            required
            error={errors.provider?.message}
            value={field.value as string | undefined}
            onValueChange={(value) => {
              field.onChange(value)
              onProviderChange?.(value)
            }}
            onBlur={field.onBlur}
            options={PROVIDER_OPTIONS}
            placeholder="Selecione uma carteira"
          />
        )}
      />
      <TextField label="Código de indicação" required error={errors.referralCode?.message} registration={reg('referralCode')} />
      <TextField label="E-mail" required error={errors.email?.message} registration={reg('email')} inputProps={{ type: 'email', autoComplete: 'email' }} />
      <EnsField label="Nome ENS" required error={errors.ensName?.message} registration={reg('ensName')} />
    </div>
  )
}
