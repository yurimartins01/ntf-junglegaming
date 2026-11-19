import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from './Icon'
import { cn } from '@/lib/utils'

export function ErrorState({
  title = 'Não foi possível carregar',
  message,
  onRetry,
  retrying = false,
  className,
}: {
  title?: string
  message: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 rounded-[4px] bg-surface-card px-6 py-10 text-center', className)}>
      <Icon name="warning" size={28} className="text-coral" />
      <h2 className="font-body-large16-bold--lh-20 text-fg">{title}</h2>
      <p className="max-w-md font-body14-regular--lh-22 text-fg-muted">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} disabled={retrying} className="mt-2">
          {retrying ? 'Tentando novamente…' : 'Tentar novamente'}
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, message, action, className }: { title: string; message?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-[4px] bg-surface-card px-6 py-12 text-center', className)}>
      <h2 className="font-body-large16-bold--lh-20 text-fg">{title}</h2>
      {message ? <p className="max-w-md font-body14-regular--lh-22 text-fg-muted">{message}</p> : null}
      {action}
    </div>
  )
}

export function RefreshingIndicator({ active, label = 'Atualizando…' }: { active: boolean; label?: string }) {
  if (!active) return null
  return (
    <span role="status" className="inline-flex items-center gap-2 font-caption12-regular--lh-16 text-fg-subtle">
      <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
      {label}
    </span>
  )
}
