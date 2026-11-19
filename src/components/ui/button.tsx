import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-ink hover:bg-primary-light active:bg-primary-dark',
        gradient:
          'bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-primary-dark)_100%)] text-ink hover:brightness-110',
        outline: 'border border-primary text-primary bg-transparent hover:bg-primary/10',
        ghost: 'text-fg hover:bg-surface-raised',
        link: 'text-accent underline-offset-4 hover:underline',
        destructive: 'bg-error text-white hover:bg-error/90',
      },
      size: {
        default: 'h-10 rounded-[4px] px-5 font-body14-bold--lh-20',
        sm: 'h-[34px] rounded-[4px] px-3 font-body14-bold--lh-20',
        lg: 'h-[44px] rounded-[4px] px-6 font-body-large16-bold--lh-20',
        pill: 'h-[60px] rounded-[16px] px-8 font-body-large16-bold--lh-20',
        icon: 'size-10 rounded-[4px]',
        none: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
