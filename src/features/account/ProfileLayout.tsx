import type { ReactNode } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { Icon, type IconName } from '@/components/shared/Icon'
import { UnavailableAction } from '@/components/shared/UnavailableAction'
import { signOut } from '@/features/auth/api'
import { cn } from '@/lib/utils'

type NavItem =
  | { label: string; icon: IconName; to: '/profile' | '/profile/wallets' | '/profile/favorites' }
  | { label: string; icon: IconName; to?: undefined }

const ITEMS: NavItem[] = [
  { label: 'Dados do perfil', icon: 'user', to: '/profile' },
  { label: 'Carteiras', icon: 'mapPin', to: '/profile/wallets' },
  { label: 'Atividade', icon: 'cartOutline' },
  { label: 'Lista de interesse', icon: 'heart', to: '/profile/favorites' },
  { label: 'Ofertas', icon: 'trending' },
  { label: 'Arquivos baixados', icon: 'download' },
  { label: 'Suporte', icon: 'warning' },
]

function SidebarContent({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return (
    <>
      <h2 className="px-[10px] pt-5 pb-1 font-body-large18-bold--lh-24 text-fg">Meu perfil</h2>
      <ul>
        {ITEMS.map((item) => {
          const active = item.to ? (item.to === '/profile' ? pathname === '/profile' : pathname.startsWith(item.to)) : false
          const row = cn(
            'flex h-[45px] w-full items-center gap-3 border-l-[6px] pr-3 pl-[10px] text-left font-body14-regular--lh-20 text-accent transition-colors',
            active ? 'border-primary bg-surface-raised/60' : 'border-transparent hover:bg-surface-raised/40',
          )
          return (
            <li key={item.label}>
              {item.to ? (
                <Link to={item.to} aria-current={active ? 'page' : undefined} className={row}>
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </Link>
              ) : (
                <UnavailableAction className={row}>
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </UnavailableAction>
              )}
            </li>
          )
        })}
      </ul>
      <div className="mt-1 border-t border-divider">
        <button type="button" onClick={onLogout} className="flex h-[48px] w-full items-center gap-3 pl-4 font-body14-bold--lh-20 text-accent hover:bg-surface-raised/40">
          <Icon name="login" size={18} className="rotate-180" />
          Sair
        </button>
      </div>
    </>
  )
}

export function ProfileLayout({ children, title }: { children: ReactNode; title: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  async function logout() {
    await signOut(queryClient)
    void navigate({ to: '/' })
  }

  return (
    <AppShell headerBorder mobileTopBar={<MobileTopBar title="Meu perfil" />}>
      <div className="container-content grid gap-6 pt-6 md:pt-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7">
        <nav aria-label="Meu perfil" className="hidden h-fit bg-surface-card lg:block">
          <SidebarContent pathname={pathname} onLogout={() => void logout()} />
        </nav>
        <nav aria-label="Meu perfil" className="-mx-4 overflow-x-auto px-4 lg:hidden">
          <ul className="flex gap-2 pb-1">
            {ITEMS.filter((item) => item.to).map((item) => {
              const active = item.to === '/profile' ? pathname === '/profile' : pathname.startsWith(item.to!)
              return (
                <li key={item.label}>
                  <Link
                    to={item.to!}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 font-body14-regular--lh-20 transition-colors',
                      active ? 'bg-primary text-ink' : 'bg-surface-card text-accent',
                    )}
                  >
                    <Icon name={item.icon} size={16} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button type="button" onClick={() => void logout()} className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-surface-card px-4 font-body14-bold--lh-20 text-accent">
                Sair
              </button>
            </li>
          </ul>
        </nav>
        <section aria-labelledby="profile-section-title" className="min-w-0">
          <h1 id="profile-section-title" className="mb-5 font-body-large18-bold--lh-24 text-fg md:mb-6 md:text-[16px] md:leading-6">
            {title}
          </h1>
          {children}
        </section>
      </div>
    </AppShell>
  )
}
