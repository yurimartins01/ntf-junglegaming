import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guards'
import { OrderPage } from '@/features/orders/OrderPage'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: requireAuth,
  component: OrderRoute,
})

function OrderRoute() {
  const { orderId } = Route.useParams()
  return <OrderPage orderId={orderId} />
}
