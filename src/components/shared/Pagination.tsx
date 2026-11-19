import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  renderLink,
}: {
  page: number
  totalPages: number
  renderLink: (page: number, props: { className: string; children: ReactNode; 'aria-label': string; 'aria-current'?: 'page' }) => ReactNode
}) {
  if (totalPages <= 1) return null
  const windowSize = 4
  const start = Math.max(1, Math.min(page - 1, totalPages - windowSize + 1))
  const pages = Array.from({ length: Math.min(windowSize, totalPages) }, (_, i) => start + i)
  const base = 'flex size-[34px] items-center justify-center rounded-[4px] border font-body14-regular--lh-20 transition-colors'

  return (
    <nav aria-label="Paginação" className="flex justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            {renderLink(page - 1, {
              className: cn(base, 'border-border-soft text-fg hover:border-primary'),
              'aria-label': 'Página anterior',
              children: <Icon name="chevronLeft" size={16} />,
            })}
          </li>
        )}
        {pages.map((p) => (
          <li key={p}>
            {renderLink(p, {
              className: cn(base, p === page ? 'border-primary bg-primary font-bold text-ink' : 'border-border-soft text-fg hover:border-primary'),
              'aria-label': `Página ${p}`,
              'aria-current': p === page ? 'page' : undefined,
              children: p,
            })}
          </li>
        ))}
        {page < totalPages && (
          <li>
            {renderLink(page + 1, {
              className: cn(base, 'border-border-soft text-fg hover:border-primary'),
              'aria-label': 'Próxima página',
              children: <Icon name="chevronRight" size={16} />,
            })}
          </li>
        )}
      </ul>
    </nav>
  )
}
