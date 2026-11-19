import { Icon } from './Icon'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  label: string
  size?: 'md' | 'sm'
  disabled?: boolean
  className?: string
}

export function QuantityStepper({ value, min = 1, max, onChange, label, size = 'md', disabled, className }: QuantityStepperProps) {
  const button = cn(
    'flex shrink-0 items-center justify-center rounded-full bg-primary text-ink transition-colors hover:bg-primary-light disabled:bg-primary/35 disabled:text-ink/60',
    size === 'md' ? 'size-8' : 'size-5',
  )
  const iconSize = size === 'md' ? 18 : 12
  return (
    <div role="group" aria-label={label} className={cn('inline-flex items-center', size === 'md' ? 'gap-4' : 'gap-3', className)}>
      <button
        type="button"
        className={button}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={`Diminuir quantidade — ${label}`}
      >
        <Icon name="minus" size={iconSize} strokeWidth={3} />
      </button>
      <output aria-live="polite" aria-label={`Quantidade: ${value}`} className={cn('min-w-4 text-center text-fg', size === 'md' ? 'font-body-large18-regular leading-6' : 'font-body14-regular--lh-20')}>
        {value}
      </output>
      <button
        type="button"
        className={button}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={`Aumentar quantidade — ${label}`}
      >
        <Icon name="plus" size={iconSize} strokeWidth={3} />
      </button>
    </div>
  )
}
