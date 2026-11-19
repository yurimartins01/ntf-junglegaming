import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Icon } from '@/components/shared/Icon'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState, ErrorState, RefreshingIndicator } from '@/components/shared/StateViews'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/api/errors'
import { CATALOG_PAGE_SIZE } from '@/lib/domain'
import { useCatalog } from '../api'
import { toCatalogQuery, withFilters, type CatalogSearch } from '../search'
import { CatalogFilters } from './CatalogFilters'
import { CatalogTabs, SortSelect } from './CatalogToolbar'
import { NftCard, NftCardSkeleton } from './NftCard'
import { SpotlightCard } from './SpotlightCard'

interface CatalogSectionProps {
  search: CatalogSearch
  onSearchChange: (next: CatalogSearch) => void
  pageLink: (page: number, props: { className: string; children: ReactNode; 'aria-label': string }) => ReactNode
}

export function MobileCatalogSearch({ search, onSearchChange }: { search: CatalogSearch; onSearchChange: (next: CatalogSearch) => void }) {
  const [term, setTerm] = useState(search.q ?? '')
  const [syncedQ, setSyncedQ] = useState(search.q)
  if (syncedQ !== search.q) {
    setSyncedQ(search.q)
    setTerm(search.q ?? '')
  }
  return (
    <div className="flex gap-2 md:hidden">
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault()
          onSearchChange(withFilters(search, { q: term.trim() || undefined }))
        }}
      >
        <label htmlFor="mobile-search" className="sr-only">
          Explorar coleções
        </label>
        <Icon name="search" size={20} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted" />
        <input
          id="mobile-search"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Explorar coleções"
          className="h-[46px] w-full rounded-[12px] bg-surface-card pr-3 pl-11 font-body-large16-bold--lh-auto text-fg placeholder:text-fg-muted"
        />
      </form>
      <CatalogFilterSheet search={search} onSearchChange={onSearchChange} />
    </div>
  )
}

export function CatalogFilterSheet({ search, onSearchChange }: { search: CatalogSearch; onSearchChange: (next: CatalogSearch) => void }) {
  const { data } = useCatalog(toCatalogQuery(search))
  const activeFilters = (search.category?.length ?? 0) + (search.network?.length ?? 0) + (search.minPrice || search.maxPrice ? 1 : 0)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative flex size-[46px] shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-dark)_100%)] text-ink md:h-10 md:w-auto md:gap-2 md:rounded-[4px] md:px-4 md:font-body14-bold--lh-20 lg:hidden"
          aria-label={`Filtros${activeFilters ? `, ${activeFilters} ativos` : ''}`}
        >
          <Icon name="filters" size={20} />
          <span className="hidden md:inline">Filtros</span>
          {activeFilters ? (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-fg text-[10px] font-bold text-ink">
              {activeFilters}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] max-w-[90vw] overflow-y-auto border-r-0 p-0">
        <SheetTitle className="sr-only">Filtros</SheetTitle>
        <SheetDescription className="sr-only">Refine o catálogo por coleção, preço e rede.</SheetDescription>
        <CatalogFilters facets={data?.facets} search={search} onChange={onSearchChange} className="min-h-full pt-12" />
      </SheetContent>
    </Sheet>
  )
}

export function CatalogSection({ search, onSearchChange, pageLink }: CatalogSectionProps) {
  const query = toCatalogQuery(search)
  const catalog = useCatalog(query)
  const data = catalog.data
  const isInitialLoading = catalog.isPending
  const showSkeleton = isInitialLoading || (catalog.isPlaceholderData && catalog.isFetching && !data)
  return (
    <section id="catalogo" aria-labelledby="catalog-title" className="scroll-mt-6">
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>
      <div className="grid gap-12 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-6 lg:flex" aria-label="Filtros do catálogo">
          <CatalogFilters facets={data?.facets} search={search} onChange={onSearchChange} />
          <SpotlightCard />
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <CatalogTabs search={search} onChange={onSearchChange} className="max-md:w-full max-md:overflow-x-auto" />
            <div className="flex items-center gap-4">
              <RefreshingIndicator active={catalog.isFetching && !isInitialLoading} />
              <div className="hidden md:block">
                <CatalogFilterSheet search={search} onSearchChange={onSearchChange} />
              </div>
              <div className="hidden md:block">
                <SortSelect search={search} onChange={onSearchChange} />
              </div>
            </div>
          </div>
          <div className="mt-3 md:hidden">
            <SortSelect search={search} onChange={onSearchChange} />
          </div>

          {search.q ? (
            <p className="mt-4 font-body14-regular--lh-20 text-fg-muted">
              Resultados para “<span className="text-fg">{search.q}</span>”
              {data ? ` — ${data.total} ${data.total === 1 ? 'NFT' : 'NFTs'}` : ''}{' '}
              <Link to="/" search={withFilters(search, { q: undefined })} className="ml-2 text-accent underline-offset-4 hover:underline">
                Limpar busca
              </Link>
            </p>
          ) : null}

          <div aria-live="polite" aria-busy={catalog.isFetching} className="mt-6 md:mt-5">
            {catalog.isError && !data ? (
              <ErrorState message={errorMessage(catalog.error)} onRetry={() => void catalog.refetch()} retrying={catalog.isFetching} />
            ) : showSkeleton ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-[34px] md:gap-y-[60px] lg:grid-cols-3" aria-label="Carregando NFTs">
                {Array.from({ length: CATALOG_PAGE_SIZE }, (_, i) => (
                  <li key={i} className="max-md:even:mt-8">
                    <NftCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : data && data.items.length === 0 ? (
              <EmptyState
                title="Nenhum NFT encontrado"
                message="Ajuste a busca ou os filtros para ver outros resultados."
                action={
                  <Button variant="outline" onClick={() => onSearchChange({})}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : data ? (
              <>
                {catalog.isError ? (
                  <p role="alert" className="mb-4 font-body14-regular--lh-20 text-coral">
                    Não foi possível atualizar a lista. Exibindo os últimos resultados.{' '}
                    <button type="button" className="underline" onClick={() => void catalog.refetch()}>
                      Tentar novamente
                    </button>
                  </p>
                ) : null}
                <ul
                  className={`grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-[34px] md:gap-y-[60px] lg:grid-cols-3 ${catalog.isPlaceholderData ? 'opacity-70 transition-opacity' : ''}`}
                  data-testid="catalog-grid"
                >
                  {data.items.map((nft, index) => (
                    <li key={nft.id} className="max-md:even:mt-8">
                      <NftCard nft={nft} priority={index < 2} />
                    </li>
                  ))}
                </ul>
                <div className="mt-12 flex items-center justify-between gap-4">
                  <p className="font-body14-regular--lh-20 text-fg-subtle">
                    Página {data.page} de {data.totalPages}
                  </p>
                  <Pagination page={data.page} totalPages={data.totalPages} renderLink={pageLink} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
