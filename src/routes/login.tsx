import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/features/auth/AuthPage'
import { parseAuthSearch } from '@/features/auth/search'

export const Route = createFileRoute('/login')({
  validateSearch: parseAuthSearch,
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect, reason } = Route.useSearch()
  return <AuthPage mode="login" redirect={redirect} reason={reason} />
}
