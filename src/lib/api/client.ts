import axios from 'axios'
import { getGuestCartId, sessionEvents, sessionStore } from '@/features/auth/session-store'
import { API_BASE_URL } from './contracts'
import { whenApiReady } from './ready'
import { toApiError } from './errors'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  await whenApiReady()
  const session = sessionStore.get()
  if (session) config.headers.set('Authorization', `Bearer ${session.token}`)
  config.headers.set('X-Cart-Id', getGuestCartId())
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const sentToken = axios.isAxiosError(error) && Boolean(error.config?.headers?.Authorization)
    if (sentToken && apiError.status === 401 && (apiError.code === 'SESSION_EXPIRED' || apiError.code === 'UNAUTHORIZED')) {
      sessionEvents.emitExpired()
    }
    return Promise.reject(apiError)
  },
)
