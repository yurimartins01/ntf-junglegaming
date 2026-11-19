import { Link, createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/HomePage'
import { catalogQueryOptions, featuredQueryOptions } from '@/features/catalog/api'
import { parseCatalogSearch, toCatalogQuery } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: parseCatalogSearch,
  loaderDeps: ({ search }) => toCatalogQuery(search),
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(catalogQueryOptions(deps))
    void context.queryClient.prefetchQuery(featuredQueryOptions)
  },
  head: () => ({ meta: [{ title: 'Kurio — Marketplace de NFTs' }] }),
  component: HomeRoute,
})

function HomeRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <HomePage
      search={search}
      onSearchChange={(next) => void navigate({ search: next, resetScroll: false })}
      pageLink={(page, props) => (
        <Link
          to="/"
          search={(prev) => ({ ...prev, page: page === 1 ? undefined : page })}
          hash="catalogo"
          resetScroll={false}
          {...props}
        />
      )}
    />
  )
}
