import { expect, test } from '@playwright/test'
import { mockOrderCount, openReview, prepareCheckout } from './helpers'

test.describe('7. Falha de pagamento, clique repetido e timeout com recuperação do mesmo pedido', () => {
  test('pagamento recusado preserva o carrinho e permite nova tentativa', async ({ page }) => {
    await prepareCheckout(page, 'payment-declined')
    const review = await openReview(page)
    await review.getByTestId('confirm-order').click()

    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(page.getByTestId('order-status').getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('receipt')).toHaveCount(0)

    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.getByTestId('cart-line')).toHaveCount(1)
  })

  test('recusa na conexão da carteira não cria pedido', async ({ page }) => {
    await prepareCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await page.getByTestId('wallet-connect-dialog').getByRole('button', { name: 'Recusar' }).click()
    await expect(page.getByRole('heading', { name: 'Conexão recusada' })).toBeVisible()
    await page.getByTestId('wallet-connect-dialog').getByRole('button', { name: 'Fechar' }).first().click()
    expect(await mockOrderCount(page)).toBe(0)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  })

  test('clique repetido não cria pedidos duplicados', async ({ page }) => {
    await prepareCheckout(page, 'payment-slow')
    const review = await openReview(page)
    const confirm = review.getByTestId('confirm-order')
    await confirm.dblclick()
    await expect(page).toHaveURL(/\/orders\/ord_/)
    expect(await mockOrderCount(page)).toBe(1)
  })

  test('timeout após criar o pedido é recuperado pela mesma chave de idempotência', async ({ page }) => {
    test.setTimeout(60_000)
    await prepareCheckout(page, 'order-timeout')
    const review = await openReview(page)
    await review.getByTestId('confirm-order').click()

    const recovery = page.getByTestId('recovery-banner')
    await expect(recovery).toBeVisible({ timeout: 15_000 })
    expect(await mockOrderCount(page)).toBe(1)

    await page.reload()
    await expect(recovery).toBeVisible()

    await recovery.getByRole('button', { name: 'Verificar pedido' }).click()
    await expect(page).toHaveURL(/\/orders\/ord_/)
    expect(await mockOrderCount(page)).toBe(1)
    await expect(page.getByTestId('receipt')).toBeVisible({ timeout: 10_000 })
  })
})
