import { expect, test, type Page } from '@playwright/test'
import { loginViaUi, open, prepareCheckout } from './helpers'

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = [...document.images]
    for (const img of images) img.loading = 'eager'
    const decoded = Promise.all(images.map((img) => img.decode().catch(() => undefined)))
    await Promise.race([decoded, new Promise((resolve) => setTimeout(resolve, 8000))])
  })
  await page.waitForTimeout(300)
  await expect(page.getByText('Algo deu errado')).toHaveCount(0)
  await expect(page.getByText('Something went wrong')).toHaveCount(0)
}

test.describe('Regressão visual: início, detalhe, carrinho e pagamento', () => {
  test('início', async ({ page }) => {
    await open(page, '/')
    await expect(page.getByTestId('catalog-grid')).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detail.png', { fullPage: true })
  })

  test('carrinho', async ({ page }) => {
    await loginViaUi(page)
    await open(page, '/nft/emerald-ape-042')
    await page.getByRole('button', { name: /^Comprar/ }).click()
    await expect(page.getByTestId('cart-line')).toHaveCount(1)
    await expect(page.getByTestId('summary-total')).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('cart.png', { fullPage: true })
  })

  test('pagamento', async ({ page }) => {
    await prepareCheckout(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
    await settle(page)
    await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
  })
})
