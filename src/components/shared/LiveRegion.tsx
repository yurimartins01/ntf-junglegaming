import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Announce = (message: string) => void

const AnnouncerContext = createContext<Announce>(() => {})

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const announce = useCallback<Announce>((next) => {
    setMessage('')
    requestAnimationFrame(() => setMessage(next))
  }, [])

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-region">
        {message}
      </div>
    </AnnouncerContext.Provider>
  )
}

export function useAnnouncer(): Announce {
  return useContext(AnnouncerContext)
}
