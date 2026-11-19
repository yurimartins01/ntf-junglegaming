import { useState } from 'react'
import type { CatalogResponse, CategoryId, NetworkId } from '@/lib/api/contracts'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { PRICE_RANGE } from '@/lib/domain'
import { formatEthComma } from '@/lib/money'
import { cn } from '@/lib/utils'
import { withFilters, type CatalogSearch } from '../search'

const toCents = (value: string) => Math.round(Number(value) * 100)
const fromCents = (cents: number) => (cents / 100).toFixed(2)
const MIN_CENTS = toCents(PRICE_RANGE.min)
const MAX_CENTS = toCents(PRICE_RANGE.max)

interface CatalogFiltersProps {
  facets: CatalogResponse['facets'] | undefined
  search: CatalogSearch
  onChange: (next: CatalogSearch) => void
  className?: string
}

function toggle<T>(list: T[] | undefined, value: T): T[] {
  const current = list ?? []
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
}

export function CatalogFilters({ facets, search, onChange, className }: CatalogFiltersProps) {
  const appliedMin = search.minPrice ? toCents(search.minPrice) : MIN_CENTS
  const appliedMax = search.maxPrice ? toCents(search.maxPrice) : MAX_CENTS
  const [range, setRange] = useState<[number, number]>([appliedMin, appliedMax])
  const [syncedFrom, setSyncedFrom] = useState(`${appliedMin}-${appliedMax}`)
  if (syncedFrom !== `${appliedMin}-${appliedMax}`) {
    setSyncedFrom(`${appliedMin}-${appliedMax}`)
    setRange([appliedMin, appliedMax])
  }

  const optionClass = (selected: boolean) =>
    cn(
      'flex w-full items-center justify-between rounded-[2px] pr-2 pl-3 text-left type-15-list transition-colors hover:text-accent',
      selected ? 'text-accent' : 'text-fg-muted',
    )

  return (
    <div className={cn('flex flex-col gap-10 bg-surface-card px-5 py-6', className)} data-testid="catalog-filters">
      <fieldset>
        <legend className="mb-2 font-body-large18-bold--lh-24 text-fg">Coleções</legend>
        {facets ? (
          <ul>
            {facets.categories.map((option) => {
              const selected = search.category?.includes(option.id) ?? false
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    className={optionClass(selected)}
                    onClick={() => onChange(withFilters(search, { category: toggle<CategoryId>(search.category, option.id) }))}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={cn('size-1.5 rounded-full', selected ? 'bg-accent' : 'bg-transparent')} />
                      {option.label}
                    </span>
                    <span className="font-bold">({option.count})</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <FacetSkeleton rows={9} />
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-body-large18-bold--lh-24 text-fg">Faixa de preço</legend>
        <Slider
          min={MIN_CENTS}
          max={MAX_CENTS}
          step={1}
          minStepsBetweenThumbs={1}
          value={range}
          onValueChange={(value) => setRange([value[0] ?? MIN_CENTS, value[1] ?? MAX_CENTS])}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          className="px-1"
        />
        <p className="mt-4 pl-3 font-body14-regular--lh-20 text-fg" aria-live="polite">
          Preço: {formatEthComma(fromCents(range[0]))} - {formatEthComma(fromCents(range[1]))} ETH
        </p>
        <Button
          size="none"
          className="mt-3 ml-3 h-9 rounded-[4px] px-3 font-body-large16-bold--lh-20"
          onClick={() =>
            onChange(
              withFilters(search, {
                minPrice: range[0] === MIN_CENTS ? undefined : fromCents(range[0]),
                maxPrice: range[1] === MAX_CENTS ? undefined : fromCents(range[1]),
              }),
            )
          }
        >
          Aplicar
        </Button>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-body-large18-bold--lh-24 text-fg">Rede</legend>
        {facets ? (
          <ul>
            {facets.networks.map((option) => {
              const selected = search.network?.includes(option.id) ?? false
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    className={optionClass(selected)}
                    onClick={() => onChange(withFilters(search, { network: toggle<NetworkId>(search.network, option.id) }))}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={cn('size-1.5 rounded-full', selected ? 'bg-accent' : 'bg-transparent')} />
                      {option.label}
                    </span>
                    <span>({option.count})</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <FacetSkeleton rows={3} />
        )}
      </fieldset>
    </div>
  )
}

function FacetSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-10 items-center justify-between pl-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  )
}
