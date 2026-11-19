import { Link, useRouterState } from '@tanstack/react-router'
import { Icon, type IconName } from '@/components/shared/Icon'
import { UnavailableAction } from '@/components/shared/UnavailableAction'
import { useCart } from '@/features/cart/api'
import { useSession } from '@/features/auth/session-store'
import { cn } from '@/lib/utils'

function TabLink({ to, icon, label, active, badge }: { to: string; icon: IconName; label: string; active: boolean; badge?: number }) {
  return (
    <Link
      to={to}
      aria-label={badge ? `${label}, ${badge} itens` : label}
      aria-current={active ? 'page' : undefined}
      className={cn('relative flex size-12 items-center justify-center', active ? 'text-primary' : 'text-fg')}
    >
      <Icon name={icon} size={22} fill={icon === 'heart' || icon === 'home' || icon === 'user' ? 'currentColor' : undefined} />
      {badge ? (
        <span aria-hidden="true" className="absolute top-2 right-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-primary px-[3px] text-[9px] font-bold text-ink">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const session = useSession()
  const count = useCart().data?.itemCount ?? 0

  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="relative mx-auto flex h-[72px] max-w-[480px] items-center justify-around rounded-t-[32px] bg-surface-card px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.35)]">
        <TabLink to="/" icon="home" label="Início" active={pathname === '/'} />
        <TabLink to="/profile/favorites" icon="heart" label="Lista de interesse" active={pathname === '/profile/favorites'} />
        <div className="w-16" aria-hidden="true" />
        <TabLink to="/cart" icon="cartOutline" label="Carrinho" active={pathname === '/cart'} badge={count || undefined} />
        <TabLink
          to={session ? '/profile' : '/login'}
          icon="user"
          label={session ? 'Perfil' : 'Entrar'}
          active={pathname === '/profile' || pathname === '/profile/wallets' || pathname === '/login'}
        />
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-ink p-2">
          <UnavailableAction
            label="Escanear"
            className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-dark)_100%)] text-fg"
          >
            <Icon name="scan" size={26} />
          </UnavailableAction>
        </div>
      </div>
    </nav>
  )
}
