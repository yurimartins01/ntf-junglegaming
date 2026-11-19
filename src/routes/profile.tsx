import { Outlet, createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'

export const Route = createFileRoute('/profile')({ beforeLoad: requireAuth, component: Outlet })
