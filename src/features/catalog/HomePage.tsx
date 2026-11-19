import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { CatalogSection, MobileCatalogSearch } from './components/CatalogSection'
import { HomeHero } from './components/HomeHero'
import { MintJournal, PromoBanners } from './components/HomeEditorial'
import type { CatalogSearch } from './search'

export interface HomePageProps {
  search: CatalogSearch
  onSearchChange: (next: CatalogSearch) => void
  pageLink: (page: number, props: { className: string; children: ReactNode; 'aria-label': string }) => ReactNode
}

export function HomePage({ search, onSearchChange, pageLink }: HomePageProps) {
  return (
    <AppShell headerBorder>
      <div className="container-content flex flex-col gap-6 pt-6 md:gap-16 md:pt-0 lg:gap-[82px]">
        <div className="flex flex-col gap-4">
          <MobileCatalogSearch search={search} onSearchChange={onSearchChange} />
          <HomeHero />
        </div>
        <CatalogSection search={search} onSearchChange={onSearchChange} pageLink={pageLink} />
        <div className="mt-10 flex flex-col gap-20 md:mt-0 lg:gap-[100px]">
          <PromoBanners />
          <MintJournal />
        </div>
      </div>
    </AppShell>
  )
}
