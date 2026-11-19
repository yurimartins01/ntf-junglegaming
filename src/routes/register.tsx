import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/features/auth/AuthPage'
import { parseAuthSearch } from '@/features/auth/search'

export const Route = createFileRoute('/register')({
  validateSearch: parseAuthSearch,
  component: RegisterRoute,
})

function RegisterRoute() {
  const { redirect } = Route.useSearch()
  return <AuthPage mode="register" redirect={redirect} />
}
