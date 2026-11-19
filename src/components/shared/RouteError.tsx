import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function RouteError({ reset }: ErrorComponentProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <h1 className="font-heading24-bold text-fg">Algo deu errado</h1>
      <p className="font-body14-regular--lh-22 text-fg-muted">
        Não foi possível exibir esta tela. Tente novamente; se o problema continuar, recarregue a página.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    </main>
  )
}
