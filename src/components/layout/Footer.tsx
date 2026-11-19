import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { CategoryId } from '@/lib/api/contracts'
import { Icon, type IconName } from '@/components/shared/Icon'
import { UnavailableAction } from '@/components/shared/UnavailableAction'
import { WalletBadge } from '@/components/shared/WalletBadge'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const COLLECTION_LINKS: { label: string; category: CategoryId }[] = [
  { label: 'Arte digital', category: 'digital-art' },
  { label: 'Fotografia', category: 'photography' },
  { label: 'Música', category: 'music' },
  { label: 'Arte 3D', category: '3d-art' },
  { label: 'Utilidade', category: 'utility' },
]

const SOCIALS: { icon: IconName; label: string }[] = [
  { icon: 'facebook', label: 'Facebook' },
  { icon: 'instagram', label: 'Instagram' },
  { icon: 'twitter', label: 'Twitter' },
  { icon: 'linkedin', label: 'LinkedIn' },
  { icon: 'youtube', label: 'YouTube' },
]

const linkClass = 'font-body14-regular--lh-30 text-fg hover:text-accent'

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-1 font-body-large18-bold--lh-24 text-fg">{title}</h2>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="mt-20 hidden md:mt-[100px] md:block">
      <div className="container-content">
        <div className="bg-surface-card">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-2 md:px-12 lg:grid-cols-[1fr_1fr_1fr_1.3fr] lg:gap-0 lg:py-8">
            {FEATURES.map((feature, index) => (
              <section
                key={feature.letter}
                className={index > 0 ? 'lg:border-l lg:border-primary lg:pl-4' : 'lg:pr-4'}
                aria-labelledby={`feature-${feature.letter}`}
              >
                <div
                  aria-hidden="true"
                  className="flex size-[74px] items-center justify-center rounded-full bg-primary font-heading24-bold text-ink"
                >
                  {feature.letter}
                </div>
                <h2 id={`feature-${feature.letter}`} className="mt-[10px] font-body-large16-bold--lh-20 text-fg">
                  {feature.title}
                </h2>
                <p className="mt-2 max-w-[190px] font-body14-regular--lh-22 text-fg-muted">{feature.text}</p>
              </section>
            ))}
            <section className="lg:border-l lg:border-primary lg:pl-4" aria-labelledby="newsletter-title">
              <h2 id="newsletter-title" className="font-body-large16-bold--lh-16 text-fg">
                Antecipe-se ao próximo lançamento
              </h2>
              <form className="mt-4 flex h-10" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="newsletter-email" className="sr-only">
                  E-mail para novidades
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="digite seu e-mail..."
                  className="min-w-0 flex-1 rounded-l-[4px] bg-surface-dark px-3 font-body14-regular--lh-20 text-fg placeholder:text-fg-subtle"
                />
                <UnavailableAction className="rounded-r-[4px] bg-primary px-4 font-body-large18-bold--lh-24 text-ink">
                  Enviar
                </UnavailableAction>
              </form>
              <p className="mt-4 font-caption13-regular--lh-22 text-fg-muted">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            </section>
          </div>

          <div className="grid gap-4 bg-surface-dark px-8 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:py-0 lg:h-[88px]">
            <span className="font-body14-bold--lh-auto uppercase text-fg">Kurio</span>
            <p className="max-w-[230px] font-body14-regular--lh-22 text-fg">Feito para colecionadores, criadores e cultura</p>
            <a href="mailto:contato@email.com" className="font-body14-regular--lh-22 text-fg hover:text-accent">
              contato@email.com
            </a>
            <a href="tel:+551140028922" className="font-body14-regular--lh-22 text-fg hover:text-accent">
              +55 11 4002 8922
            </a>
          </div>

          <div className="grid gap-8 px-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
            <Column title="Meu perfil">
              <li>
                <Link to="/profile" className={linkClass}>
                  Meu perfil
                </Link>
              </li>
              <li>
                <UnavailableAction className={linkClass}>Minha coleção</UnavailableAction>
              </li>
              <li>
                <UnavailableAction className={linkClass}>Atividade</UnavailableAction>
              </li>
              <li>
                <UnavailableAction className={linkClass}>Estúdio do criador</UnavailableAction>
              </li>
              <li>
                <Link to="/profile/favorites" className={linkClass}>
                  Lista de interesse
                </Link>
              </li>
            </Column>
            <Column title="Central de ajuda">
              {['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'].map((label) => (
                <li key={label}>
                  <UnavailableAction className={linkClass}>{label}</UnavailableAction>
                </li>
              ))}
            </Column>
            <Column title="Coleções">
              {COLLECTION_LINKS.map(({ label, category }) => (
                <li key={category}>
                  <Link to="/" search={{ category: [category] }} hash="catalogo" className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </Column>
            <div>
              <h2 className="mb-3 font-body-large18-bold--lh-24 text-fg">Redes sociais</h2>
              <ul className="flex gap-2">
                {SOCIALS.map((social) => (
                  <li key={social.icon}>
                    <UnavailableAction
                      label={social.label}
                      className="flex size-8 items-center justify-center rounded-[4px] border border-primary text-primary"
                    >
                      <Icon name={social.icon} size={16} />
                    </UnavailableAction>
                  </li>
                ))}
              </ul>
              <h2 className="mt-8 mb-2 font-body-large18-bold--lh-24 text-fg">Carteiras compatíveis</h2>
              <WalletBadge />
            </div>
          </div>
        </div>
      </div>
      <p className="py-4 text-center font-body14-regular--lh-22 text-fg">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
