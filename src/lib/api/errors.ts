import { isAxiosError, isCancel } from 'axios'
import type { ApiErrorBody, ApiErrorCode } from './contracts'

export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELED' | 'UNKNOWN'

export class ApiError extends Error {
  constructor(
    readonly code: ClientErrorCode,
    message: string,
    readonly status: number | null = null,
    readonly fieldErrors: Record<string, string> = {},
    readonly details: unknown = undefined,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isTransient(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT' || (this.status !== null && this.status >= 500)
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isCancel(error)) return new ApiError('CANCELED', 'Requisição cancelada.')
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('TIMEOUT', 'O servidor demorou para responder. Tente novamente.')
    }
    const response = error.response
    if (!response) return new ApiError('NETWORK_ERROR', 'Sem conexão com o servidor. Verifique sua rede e tente novamente.')
    const body = response.data as Partial<ApiErrorBody> | undefined
    if (body?.error?.code) {
      return new ApiError(body.error.code, body.error.message, response.status, body.error.fieldErrors ?? {}, body.error.details)
    }
    return new ApiError('UNKNOWN', 'Algo deu errado. Tente novamente.', response.status)
  }
  return new ApiError('UNKNOWN', error instanceof Error ? error.message : 'Algo deu errado.')
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message
}
