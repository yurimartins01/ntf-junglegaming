import { useId, useState, type FormEvent } from 'react'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { Icon } from '@/components/shared/Icon'
import { Button } from '@/components/ui/button'
import { toApiError } from '@/lib/api/errors'
import { useApplyCoupon, useRemoveCoupon } from '../api'

export function CouponForm({ appliedCode, disabled }: { appliedCode: string | null; disabled?: boolean }) {
  const id = useId()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const announce = useAnnouncer()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!code.trim()) {
      setError('Digite o código promocional.')
      return
    }
    setError(null)
    apply.mutate(code, {
      onSuccess: (cart) => {
        setCode('')
        announce(`Cupom ${cart.couponCode} aplicado.`)
      },
      onError: (e) => {
        const message = toApiError(e).message
        setError(message)
        announce(message)
      },
    })
  }

  return (
    <div>
      <label htmlFor={id} className="font-body14-bold--lh-20 text-fg">
        Código promocional
      </label>
      {appliedCode ? (
        <div className="mt-3 flex h-10 items-center justify-between rounded-[2px] border border-primary px-3">
          <span className="font-body14-regular--lh-20 text-fg" data-testid="applied-coupon">
            Cupom aplicado: <strong className="text-accent">{appliedCode}</strong>
          </span>
          <button
            type="button"
            disabled={remove.isPending || disabled}
            onClick={() => remove.mutate(undefined, { onSuccess: () => announce('Cupom removido.') })}
            className="flex items-center gap-1 font-body14-bold--lh-20 text-accent hover:underline disabled:opacity-60"
          >
            <Icon name="close" size={14} />
            Remover
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 flex h-10" noValidate>
          <input
            id={id}
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Digite o código promocional..."
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="min-w-0 flex-1 rounded-l-[2px] border border-r-0 border-primary bg-transparent px-3 font-caption12-regular--lh-16 text-fg placeholder:text-fg-subtle aria-invalid:border-coral"
          />
          <Button type="submit" size="none" disabled={apply.isPending || disabled} className="w-[102px] rounded-l-none rounded-r-[2px] font-body14-bold--lh-20">
            {apply.isPending ? 'Aplicando…' : 'Aplicar'}
          </Button>
        </form>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 font-caption12-regular--lh-16 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
