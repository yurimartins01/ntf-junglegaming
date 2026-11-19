import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/lib/api/contracts'
import { MockHttpError, route } from '../http'
import { countFailure, getScenario } from '../scenarios/scenarios'
import { featured, getFixture, queryCatalog, related, toDetail } from '../services/catalog'

const FLAKY_FAILURES = 3

function injectReadFailures(key: string) {
  const scenario = getScenario()
  if (scenario === 'server-error') {
    throw new MockHttpError(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.')
  }
  if (scenario === 'flaky' && countFailure(key) <= FLAKY_FAILURES) {
    throw new MockHttpError(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.')
  }
}

export const catalogHandlers = [
  http.get(
    `${API_BASE_URL}/nfts`,
    route(
      ({ request }) => {
        injectReadFailures('catalog')
        return HttpResponse.json(queryCatalog(new URL(request.url), getScenario() === 'empty'))
      },
      { kind: 'catalog' },
    ),
  ),

  http.get(
    `${API_BASE_URL}/nfts/featured`,
    route(() => HttpResponse.json(featured()), { kind: 'catalog' }),
  ),

  http.get<{ id: string }>(
    `${API_BASE_URL}/nfts/:id`,
    route(
      ({ params }) => {
        injectReadFailures(`detail:${params.id}`)
        return HttpResponse.json(toDetail(getFixture(params.id)))
      },
      { kind: 'detail' },
    ),
  ),

  http.get<{ id: string }>(
    `${API_BASE_URL}/nfts/:id/related`,
    route(({ params }) => HttpResponse.json(related(params.id)), { kind: 'detail' }),
  ),
]
