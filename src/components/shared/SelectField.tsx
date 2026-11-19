import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldShell, type TextFieldProps } from './FormField'
import { cn } from '@/lib/utils'

interface SelectFieldProps extends Omit<TextFieldProps, 'inputProps' | 'registration' | 'inputRef'> {
  value: string | undefined
  onValueChange: (value: string) => void
  onBlur?: () => void
  options: { value: string; label: string }[]
  placeholder: string
  name?: string
}

export function SelectField({ value, onValueChange, onBlur, options, placeholder, name, inputClassName, ...shell }: SelectFieldProps) {
  return (
    <FieldShell {...shell}>
      {({ id, describedBy, invalid }) => (
        <Select name={name} value={value ?? ''} onValueChange={onValueChange}>
          <SelectTrigger
            id={id}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            aria-required={shell.required}
            onBlur={onBlur}
            className={cn('w-full', inputClassName)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  )
}
