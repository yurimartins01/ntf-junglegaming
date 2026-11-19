import { Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage({
  title = 'Página não encontrada',
  message = 'O endereço acessado não existe ou foi removido.',
}: {
  title?: string
  message?: string
}) {
  return (
    <AppShell mobileTopBar={<MobileTopBar />}>
      <section className="container-content flex flex-col items-center py-24 text-center">
        <p className="font-display32-bold text-primary">404</p>
        <h1 className="mt-4 font-heading24-bold text-fg">{title}</h1>
        <p className="mt-3 max-w-md font-body14-regular--lh-22 text-fg-muted">{message}</p>
        <Link to="/" className={buttonVariants({ className: 'mt-8' })}>
          Voltar ao início
        </Link>
      </section>
    </AppShell>
  )
}
