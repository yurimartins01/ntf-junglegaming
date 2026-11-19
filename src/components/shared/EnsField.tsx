import { FieldShell, type TextFieldProps } from './FormField'
import { Icon } from './Icon'
import { cn } from '@/lib/utils'

export function EnsField({ registration, inputProps, ...shell }: Omit<TextFieldProps, 'inputRef' | 'inputClassName'>) {
  return (
    <FieldShell {...shell}>
      {({ id, describedBy, invalid }) => (
        <div className="flex gap-3">
          <div className="relative w-[78px] shrink-0">
            <select
              aria-label="Domínio ENS"
              defaultValue=".eth"
              className="h-10 w-full appearance-none rounded-[2px] border border-border bg-transparent pr-6 pl-3 font-body14-regular--lh-20 text-fg"
            >
              <option value=".eth">.eth</option>
            </select>
            <Icon name="chevronDown" size={14} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-fg" />
          </div>
          <input
            id={id}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            aria-required={shell.required}
            autoComplete="off"
            autoCapitalize="none"
            className={cn(
              'h-10 min-w-0 flex-1 rounded-[2px] border border-border bg-transparent px-3 font-body14-regular--lh-20 text-fg outline-none transition-colors hover:border-border-soft focus-visible:border-primary aria-invalid:border-coral',
            )}
            {...inputProps}
            {...registration}
          />
        </div>
      )}
    </FieldShell>
  )
}
