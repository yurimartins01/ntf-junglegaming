import { Link } from '@tanstack/react-router'
import type { ArtworkKey } from '@/lib/api/contracts'
import { NftImage } from '@/components/shared/NftImage'
import { Icon } from '@/components/shared/Icon'
import { UnavailableAction } from '@/components/shared/UnavailableAction'
import { buttonVariants } from '@/components/ui/button'

export function PromoBanners() {
  const banners = [
    {
      artworkKey: 'emerald-ape' as ArtworkKey,
      title: 'Lançamentos gênesis de edição limitada',
      text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
      search: { tab: 'new' as const },
    },
    {
      artworkKey: 'neon-vessel' as ArtworkKey,
      title: 'Arte digital selecionada e muito mais',
      text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura da internet.',
      search: { category: ['digital-art' as const] },
    },
  ]
  return (
    <section aria-label="Coleções em destaque" className="grid gap-7 lg:grid-cols-2">
      {banners.map((banner) => (
        <article key={banner.title} className="grid grid-cols-[minmax(0,287fr)_minmax(0,299fr)] overflow-hidden rounded-[8px] bg-surface-card md:h-[250px]">
          <NftImage artworkKey={banner.artworkKey} alt="" className="size-full rounded-[16px]" />
          <div className="flex flex-col items-end justify-center gap-3 p-4 text-right md:pr-8">
            <h2 className="font-body-large18-bold--lh-24 text-fg">{banner.title}</h2>
            <p className="line-clamp-3 font-body14-regular--lh-24 text-fg-muted">{banner.text}</p>
            <Link to="/" search={banner.search} hash="catalogo" className={buttonVariants({ className: 'w-[140px] font-body14-medium--lh-20' })}>
              Explorar <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}

const POSTS: { date: string; read: string; title: string; text: string; artworkKey: ArtworkKey }[] = [
  { date: '12 de setembro', read: 'Leitura de 6 min', title: 'Como funciona a propriedade de NFTs', text: 'Aprenda a colecionar, negociar e verificar ativos digitais.', artworkKey: 'neon-vessel' },
  { date: '13 de setembro', read: 'Leitura de 2 min', title: '10 artistas digitais para acompanhar', text: 'Conheça criadores que moldam a cultura digital.', artworkKey: 'emerald-ape' },
  { date: '15 de setembro', read: 'Leitura de 3 min', title: 'Raridade, atributos e procedência', text: 'Entenda raridade, procedência, direitos autorais e utilidade.', artworkKey: 'sage-nomad' },
  { date: '15 de setembro', read: 'Leitura de 2 min', title: 'Como proteger sua carteira', text: 'Proteja sua carteira, seus ativos e sua identidade.', artworkKey: 'golden-beat' },
]

export function MintJournal() {
  return (
    <section aria-labelledby="journal-title">
      <h2 id="journal-title" className="text-center type-section text-fg">
        Diário da Cunhagem
      </h2>
      <p className="mt-3 text-center font-body14-regular--lh-22 text-fg-muted">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(4,268px)]">
        {POSTS.map((post) => (
          <li key={post.title} className="flex flex-col overflow-hidden rounded-[8px] bg-surface-card">
            <NftImage artworkKey={post.artworkKey} alt="" className="h-[195px] w-full rounded-t-[8px]" />
            <div className="flex flex-1 flex-col p-4">
              <p className="font-caption12-regular--lh-16 text-fg-muted">
                {post.date} <span aria-hidden="true">&nbsp;|&nbsp;</span> {post.read}
              </p>
              <h3 className="mt-3 font-body-large16-bold--lh-20 text-fg">{post.title}</h3>
              <p className="mt-2 font-caption12-regular--lh-16 text-fg-muted">{post.text}</p>
              <UnavailableAction className="mt-3 self-start font-caption12-bold leading-4 text-accent">Ler mais →</UnavailableAction>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
