import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-[2px] border border-border bg-transparent px-3 font-body14-regular--lh-20 text-fg outline-none transition-colors',
        'placeholder:text-fg-subtle placeholder:opacity-100',
        'hover:border-border-soft focus-visible:border-primary focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-coral',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
