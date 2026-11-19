import { expect, type Page } from '@playwright/test'

export const USERS = {
  nova: { email: 'nova@kurio.test', password: 'Kurio@2026', username: 'nova' },
  theo: { email: 'theo@kurio.test', password: 'Kurio@2026', username: 'theo' },
} as const

export type ScenarioName =
  | 'default' | 'empty' | 'slow' | 'variable-latency' | 'out-of-order' | 'offline' | 'server-error' | 'flaky'
  | 'favorite-failure' | 'session-expired' | 'forbidden' | 'price-change' | 'sold-out' | 'order-timeout'
  | 'payment-declined' | 'payment-slow' | 'socket-drop' | 'duplicate-events'

export async function open(page: Page, path = '/', scenario: ScenarioName = 'default') {
  page.on('pageerror', (error) => console.log('[pageerror]', error.message))
  const url = new URL(path, 'http://x')
  if (scenario !== 'default') url.searchParams.set('scenario', scenario)
  await page.goto(url.pathname + url.search + url.hash)
  await page.waitForFunction(() => Boolean(window.__kurioMocks))
}

export async function mocks<T>(page: Page, fn: (controls: MockControls) => T | Promise<T>): Promise<T> {
  return page.evaluate(`(${fn.toString()})(window.__kurioMocks)`) as Promise<T>
}

export async function loginViaUi(page: Page, user: { email: string; password: string } = USERS.nova, redirect = '/') {
  await open(page, `/login?redirect=${encodeURIComponent(redirect)}`)
  const isModal = (page.viewportSize()?.width ?? 0) >= 768
  const scope = isModal ? page.getByRole('dialog') : page.locator('main')
  await scope.getByLabel('E-mail').fill(user.email)
  await scope.getByLabel('Senha', { exact: true }).fill(user.password)
  await scope.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

export async function addToCartFromDetail(page: Page, nftId: string, quantity = 1) {
  await page.goto(`/nft/${nftId}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const plus = page.getByRole('button', { name: /Aumentar quantidade/ }).first()
  for (let i = 1; i < quantity; i++) await plus.click()
  await page.getByRole('button', { name: /^Comprar/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByTestId('cart-line').first()).toBeVisible()
}

export interface MockControls {
  getScenario: () => string
  setScenario: (name: ScenarioName) => void
  reset: () => Promise<void>
  updateNft: (nftId: string, patch: { price?: string; available?: Record<string, number> }) => void
  emitRaw: (event: unknown) => void
  replayLast: (resource: 'nft' | 'order', id: string) => boolean
  replayPrevious: (resource: 'nft' | 'order', id: string) => boolean
  expireSessions: () => void
  dropSocket: (blockMs?: number) => void
  socketConnections: () => number
  setLatency: (ms: number | null) => void
}

declare global {
  interface Window {
    __kurioMocks?: MockControls
  }
}

export const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024
export const isTabletUp = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768

export async function searchCatalog(page: Page, term: string) {
  if (isTabletUp(page)) {
    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('searchbox').fill(term)
    await dialog.getByRole('button', { name: 'Buscar' }).click()
  } else {
    await page.getByRole('searchbox', { name: 'Explorar coleções' }).fill(term)
    await page.getByRole('searchbox', { name: 'Explorar coleções' }).press('Enter')
  }
}

export async function openFilters(page: Page) {
  if (isDesktop(page)) return page.locator('aside').getByTestId('catalog-filters')
  await page.getByRole('button', { name: /^Filtros/ }).filter({ visible: true }).first().click()
  return page.getByRole('dialog').getByTestId('catalog-filters')
}

export async function closeDrawer(page: Page) {
  if (!isDesktop(page)) await page.keyboard.press('Escape')
}

export const catalogCards = (page: Page) => page.getByTestId('catalog-grid').getByTestId('nft-card')

export const authScope = (page: Page) => (isTabletUp(page) ? page.getByRole('dialog') : page.locator('main'))

export async function logoutViaUi(page: Page) {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/$/)
}

export async function prepareCheckout(page: Page, scenario: ScenarioName = 'default', nftId = 'emerald-ape-042') {
  await loginViaUi(page, USERS.nova)
  await addToCartFromDetail(page, nftId)
  await open(page, '/checkout', scenario)
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
}

export async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const connect = page.getByTestId('wallet-connect-dialog')
  const reviewDialog = page.getByTestId('review-dialog')
  await connect.or(reviewDialog).waitFor()
  if (await connect.isVisible()) await connect.getByRole('button', { name: 'Conectar', exact: true }).click()
  await expect(reviewDialog).toBeVisible()
  return page.getByTestId('review-dialog')
}

export async function mockOrderCount(page: Page): Promise<number> {
  return page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('kurio:mock-db') ?? '{"orders":{}}').orders).length)
}
