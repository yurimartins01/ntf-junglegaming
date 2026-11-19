import { expect, test } from '@playwright/test'
import { loginViaUi, open } from './helpers'

test.describe('6. Compra completa, do catálogo ao recibo confirmado', () => {
  test('catálogo → detalhe → carrinho → pagamento → recibo', async ({ page }) => {
    await loginViaUi(page)
    await open(page, '/')

    await page.getByRole('link', { name: 'Emerald Ape #042' }).first().click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

    await page.getByRole('button', { name: /^Comprar/ }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByTestId('cart-line')).toHaveCount(1)
    await expect(page.getByTestId('summary-total').first()).toHaveText('1.206 ETH')

    await page.getByRole('button', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(/^0xA91F/)

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await page.getByRole('dialog', { name: /Conectar/ }).getByRole('button', { name: 'Conectar' }).click()
    const review = page.getByTestId('review-dialog')
    await expect(review).toBeVisible()
    await review.getByTestId('confirm-order').click()

    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(page.getByTestId('order-status')).toContainText('Aguardando confirmação')
    const receipt = page.getByTestId('receipt')
    await expect(receipt).toBeVisible({ timeout: 10_000 })
    await expect(receipt.getByTestId('receipt-line')).toHaveCount(1)
    await expect(receipt.getByTestId('receipt-total')).toHaveText('1.206 ETH')
    await expect(receipt.getByTestId('receipt-fee')).toHaveText('0.016 ETH')

    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})
