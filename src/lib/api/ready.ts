let ready: Promise<void> = Promise.resolve()

export function setApiReady(promise: Promise<void>) {
  ready = promise
}

export function whenApiReady(): Promise<void> {
  return ready
}
