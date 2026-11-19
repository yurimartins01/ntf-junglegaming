import { useMutation, type QueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Cart, LoginRequest, RegisterRequest, SessionResponse } from '@/lib/api/contracts'
import { queryKeys } from '@/lib/api/query-keys'
import { STORAGE_KEYS, readStorage, removeStorage } from '@/lib/storage'
import { getGuestCartId, rotateGuestCartId, sessionStore } from './session-store'

export function clearPrivateCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: queryKeys.userAll })
  queryClient.removeQueries({ queryKey: queryKeys.cartAll })
}

export async function establishSession(queryClient: QueryClient, session: SessionResponse) {
  clearPrivateCache(queryClient)
  const owned: [storage: 'local' | 'session', key: string][] = [
    ['local', STORAGE_KEYS.pendingOrder],
    ['session', STORAGE_KEYS.checkoutDraft],
    ['session', STORAGE_KEYS.checkoutAttempt],
    ['session', STORAGE_KEYS.walletConnection],
  ]
  for (const [storage, key] of owned) {
    const record = readStorage<{ userId?: string }>(storage, key)
    if (record && record.userId !== session.user.id) removeStorage(storage, key)
  }
  sessionStore.set(session)
  try {
    const { data } = await api.post<Cart>('/cart/merge', { guestCartId: getGuestCartId() })
    rotateGuestCartId()
    queryClient.setQueryData(queryKeys.cart(`user:${session.user.id}`), data)
  } catch {
  }
}

export function useLogin(queryClient: QueryClient) {
  return useMutation({
    mutationFn: async (body: LoginRequest) => (await api.post<SessionResponse>('/auth/login', body)).data,
    onSuccess: (session) => establishSession(queryClient, session),
  })
}

export function useRegister(queryClient: QueryClient) {
  return useMutation({
    mutationFn: async (body: RegisterRequest) => (await api.post<SessionResponse>('/auth/register', body)).data,
    onSuccess: (session) => establishSession(queryClient, session),
  })
}

export async function signOut(queryClient: QueryClient) {
  try {
    await api.post('/auth/logout')
  } catch {
  }
  endSession(queryClient)
}

export function endSession(queryClient: QueryClient, options: { preserveContext?: boolean } = {}) {
  sessionStore.clear()
  clearPrivateCache(queryClient)
  if (!options.preserveContext) {
    removeStorage('local', STORAGE_KEYS.pendingOrder)
    removeStorage('session', STORAGE_KEYS.checkoutDraft)
    removeStorage('session', STORAGE_KEYS.checkoutAttempt)
    removeStorage('session', STORAGE_KEYS.walletConnection)
  }
}

export async function refreshSession() {
  const session = sessionStore.get()
  if (!session) return
  try {
    const { data } = await api.get<SessionResponse>('/session')
    if (sessionStore.get()?.token === data.token) sessionStore.set(data)
  } catch {
  }
}
