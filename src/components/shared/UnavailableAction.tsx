import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const UNAVAILABLE_MESSAGE = 'Indisponível nesta demonstração'

export function UnavailableAction({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled="true"
          aria-label={label ? `${label} (${UNAVAILABLE_MESSAGE.toLowerCase()})` : undefined}
          aria-description={label ? undefined : UNAVAILABLE_MESSAGE}
          className={cn('cursor-not-allowed text-left', className)}
          onClick={() => toast.info(UNAVAILABLE_MESSAGE, { id: 'unavailable-action' })}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{UNAVAILABLE_MESSAGE}</TooltipContent>
    </Tooltip>
  )
}
