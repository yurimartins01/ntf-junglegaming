import { isScenarioName, setScenario } from './scenarios/scenarios'

const SCENARIO_PARAM = 'scenario'
const RESET_PARAM = 'mock-reset'
const KEEP_KEYS = new Set(['kurio:mock-db', 'kurio:mock-scenario'])

export function consumeUrlControls(): boolean {
  const url = new URL(window.location.href)
  let changed = false

  const scenario = url.searchParams.get(SCENARIO_PARAM)
  if (scenario !== null) {
    if (isScenarioName(scenario)) setScenario(scenario)
    url.searchParams.delete(SCENARIO_PARAM)
    changed = true
  }

  const reset = url.searchParams.has(RESET_PARAM)
  if (reset) {
    url.searchParams.delete(RESET_PARAM)
    changed = true
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('kurio:') && !KEEP_KEYS.has(key)) localStorage.removeItem(key)
    }
    sessionStorage.clear()
  }

  if (changed) window.history.replaceState(window.history.state, '', url)
  return reset
}
