import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setApiReady } from './lib/api/ready'
import { consumeUrlControls } from './mocks/controls'

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true'

async function bootstrap() {
  let markReady = () => {}
  let mocksStarted: Promise<unknown> = Promise.resolve()

  if (mocksEnabled) {
    setApiReady(new Promise<void>((resolve) => (markReady = resolve)))
    const reset = consumeUrlControls()
    mocksStarted = import('./mocks/browser')
      .then(({ startMockServer }) => startMockServer({ reset }))
      .catch((error: unknown) => console.error('[mocks] failed to start', error))
      .finally(markReady)
  }

  const [{ App }] = await Promise.all([import('./app/App'), mocksStarted])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
