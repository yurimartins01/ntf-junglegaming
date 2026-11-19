import type { CatalogSort, CatalogTab } from '@/lib/api/contracts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SORT_LABELS, TAB_LABELS } from '@/lib/domain'
import { cn } from '@/lib/utils'
import { withFilters, type CatalogSearch } from '../search'

const TABS = Object.keys(TAB_LABELS) as CatalogTab[]
const SORTS = Object.keys(SORT_LABELS) as CatalogSort[]

export function CatalogTabs({
  search,
  onChange,
  className,
}: {
  search: CatalogSearch
  onChange: (next: CatalogSearch) => void
  className?: string
}) {
  const active = search.tab ?? 'all'
  return (
    <div role="group" aria-label="Filtrar lista" className={cn('flex items-center gap-3 md:gap-5', className)}>
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          aria-pressed={active === tab}
          onClick={() => onChange(withFilters(search, { tab }))}
          className={cn(
            'relative py-1 whitespace-nowrap transition-colors hover:text-accent',
            'text-[14px] leading-5 md:type-15-medium',
            active === tab
              ? "font-bold text-accent after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:bg-primary after:content-['']"
              : 'text-fg',
          )}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  )
}

export function SortSelect({ search, onChange }: { search: CatalogSearch; onChange: (next: CatalogSearch) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span id="sort-label" className="font-body15-regular--lh-16 text-fg">
        Ordenar por:
      </span>
      <Select value={search.sort ?? 'recent'} onValueChange={(value) => onChange(withFilters(search, { sort: value as CatalogSort }))}>
        <SelectTrigger aria-labelledby="sort-label" className="h-8 border-0 px-1 font-body15-regular--lh-16">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
