import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileTabBar } from './MobileTabBar'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  headerBorder?: boolean
  mobileTopBar?: ReactNode
  showTabBar?: boolean
  showFooter?: boolean
  mainClassName?: string
}

export function AppShell({
  children,
  headerBorder,
  mobileTopBar,
  showTabBar = true,
  showFooter = true,
  mainClassName,
}: AppShellProps) {
  return (
    <div className={cn('flex min-h-dvh flex-col', showTabBar && 'pb-[96px] md:pb-0')}>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded bg-primary px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <Header bordered={headerBorder} />
      {mobileTopBar}
      <main id="conteudo" tabIndex={-1} className={cn('flex-1 outline-none', mainClassName)}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showTabBar && <MobileTabBar />}
    </div>
  )
}
