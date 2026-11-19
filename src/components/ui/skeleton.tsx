import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn('skeleton-shimmer rounded-[4px]', className)} {...props} />
}

export { Skeleton }
