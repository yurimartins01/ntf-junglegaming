import { Link, useRouterState } from '@tanstack/react-router'
import { Icon } from '@/components/shared/Icon'
import { UnavailableAction } from '@/components/shared/UnavailableAction'
import { Avatar } from '@/components/shared/Avatar'
import { useCart } from '@/features/cart/api'
import { useSession } from '@/features/auth/session-store'
import { SearchDialog } from './SearchDialog'
import { cn } from '@/lib/utils'

const MARKET_PATHS = ['/nft', '/cart', '/checkout']

export function Header({ bordered = false }: { bordered?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const session = useSession()
  const cart = useCart()
  const count = cart.data?.itemCount ?? 0
  const isMarket = MARKET_PATHS.some((p) => pathname.startsWith(p))
  const isHome = !isMarket

  const navLink = 'relative flex h-[68px] items-center font-body-large16-regular--lh-auto text-fg transition-colors hover:text-accent'
  const activeBar = "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-primary after:content-['']"

  return (
    <header className="hidden md:block">
      <div className={cn('container-content', bordered && 'border-b border-divider')}>
        <div className="grid h-[68px] grid-cols-[1fr_auto_1fr] items-center">
          <Link to="/" className="justify-self-start font-body14-bold--lh-auto uppercase text-fg" aria-label="Kurio — início">
            Kurio
          </Link>

          <nav aria-label="Principal">
            <ul className="flex items-center gap-6 lg:gap-10">
              <li>
                <Link
                  to="/"
                  className={cn(navLink, isHome && cn('font-bold text-accent', activeBar))}
                  aria-current={isHome ? 'page' : undefined}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  hash="catalogo"
                  className={cn(navLink, isMarket && cn('font-bold text-accent', activeBar))}
                  aria-current={isMarket ? 'page' : undefined}
                >
                  Mercado
                </Link>
              </li>
              <li>
                <UnavailableAction className={navLink}>Criadores</UnavailableAction>
              </li>
              <li>
                <UnavailableAction className={navLink}>Aprenda</UnavailableAction>
              </li>
            </ul>
          </nav>

          <div className="flex items-center justify-self-end gap-6 lg:gap-7">
            <SearchDialog />
            <Link
              to="/cart"
              className="relative flex size-10 items-center justify-center text-fg hover:text-accent"
              aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
            >
              <Icon name="cart" size={24} />
              {count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-[6px] right-[-2px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-primary px-[3px] text-[9px] leading-none font-bold text-ink"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
            {session ? (
              <Link
                to="/profile"
                className="flex h-[34px] items-center gap-2 rounded-[4px] border border-primary px-2 font-body-large16-regular--lh-auto text-fg hover:bg-primary/10"
                aria-label={`Perfil de ${session.user.displayName}`}
              >
                <Avatar user={session.user} size={24} />
                <span className="max-w-[9rem] truncate">{session.user.username}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ redirect: pathname === '/login' ? undefined : pathname }}
                className="flex h-[34px] w-[100px] items-center justify-center gap-1 rounded-[4px] bg-primary font-body-large16-regular--lh-auto text-ink hover:bg-primary-light"
              >
                <Icon name="login" size={20} />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
