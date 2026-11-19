import { redirect } from '@tanstack/react-router'
import { sessionStore } from './session-store'

export function requireAuth({ location }: { location: { href: string } }) {
  if (!sessionStore.get()) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}
