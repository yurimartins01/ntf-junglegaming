import type { ReactNode } from 'react'
import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { Icon } from '@/components/shared/Icon'
import { cn } from '@/lib/utils'

export function MobileTopBar({ title, action, className }: { title?: string; action?: ReactNode; className?: string }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <div className={cn('flex h-[72px] items-center gap-2 px-4 md:hidden', className)}>
      <button
        type="button"
        onClick={() => (canGoBack ? router.history.back() : void router.navigate({ to: '/' }))}
        className="flex size-9 items-center justify-center rounded-full bg-surface-raised text-fg"
        aria-label="Voltar"
      >
        <Icon name="chevronLeft" size={18} />
      </button>
      {title ? <h1 className="min-w-0 flex-1 text-center font-title22-bold !text-[19px] !leading-6 text-fg">{title}</h1> : <span className="flex-1" />}
      {action ?? <span className="size-9" aria-hidden="true" />}
    </div>
  )
}
