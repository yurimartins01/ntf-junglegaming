import { useId, useState, type ComponentProps, type ReactNode, type Ref } from 'react'
import { Icon } from './Icon'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  label: ReactNode
  required?: boolean
  error?: string
  hint?: string
  hideLabel?: boolean
  className?: string
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
}

export function FieldShell({ label, required, error, hint, hideLabel, className, children }: FieldShellProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className={cn('font-body-large16-regular--lh-auto text-fg', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-coral">
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="font-caption12-regular--lh-16 text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="font-caption12-regular--lh-16 text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

type InputProps = Omit<ComponentProps<typeof Input>, 'id' | 'ref'>

export interface TextFieldProps extends Omit<FieldShellProps, 'children'> {
  inputProps?: InputProps
  inputRef?: Ref<HTMLInputElement>
  registration?: Record<string, unknown>
  inputClassName?: string
}

export function TextField({ inputProps, inputRef, registration, inputClassName, ...shell }: TextFieldProps) {
  return (
    <FieldShell {...shell}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          ref={inputRef}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          aria-required={shell.required}
          className={inputClassName}
          {...inputProps}
          {...registration}
        />
      )}
    </FieldShell>
  )
}

export function PasswordField({ inputProps, registration, inputClassName, ...shell }: TextFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <FieldShell {...shell}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <Input
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            aria-required={shell.required}
            className={cn('pr-11', inputClassName)}
            {...inputProps}
            {...registration}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center text-fg-subtle hover:text-accent"
          >
            <Icon name={visible ? 'eye' : 'eyeOff'} size={18} />
          </button>
        </div>
      )}
    </FieldShell>
  )
}
