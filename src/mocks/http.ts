import { delay, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/lib/api/contracts'
import { persist } from './db/db'
import { getScenario, latencyFor, type RequestKind } from './scenarios/scenarios'

export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fieldErrors?: Record<string, string>,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

export function errorResponse(error: MockHttpError) {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  }
  return HttpResponse.json(body, { status: error.status })
}

interface RouteOptions {
  kind?: RequestKind
  mutates?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResponseBody = any

export function route<Params extends PathParams = PathParams>(
  resolver: HttpResponseResolver<Params, DefaultBodyType, AnyResponseBody>,
  options: RouteOptions = {},
): HttpResponseResolver<Params, DefaultBodyType, AnyResponseBody> {
  return async (info) => {
    if (getScenario() === 'offline') return HttpResponse.error()
    await delay(latencyFor(options.kind ?? 'default'))
    try {
      const response = await resolver(info)
      if (options.mutates) persist()
      return response
    } catch (error) {
      if (options.mutates) persist()
      if (error instanceof MockHttpError) return errorResponse(error)
      console.error('[mocks] unhandled resolver error', error)
      return errorResponse(new MockHttpError(500, 'INTERNAL_ERROR', 'Erro inesperado no servidor simulado.'))
    }
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new MockHttpError(400, 'VALIDATION_ERROR', 'Corpo da requisição inválido.')
  }
}

export function validationError(fieldErrors: Record<string, string>): MockHttpError {
  return new MockHttpError(422, 'VALIDATION_ERROR', 'Verifique os campos destacados.', fieldErrors)
}
