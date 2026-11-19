import { expect, test } from '@playwright/test'
import { addToCartFromDetail, loginViaUi, mockOrderCount, mocks, open, openReview, prepareCheckout, USERS } from './helpers'

test.describe('9. Preço/disponibilidade via Socket.IO durante o checkout', () => {
  test('mudança de preço no carrinho informa o usuário e atualiza o resumo', async ({ page }) => {
    await loginViaUi(page, USERS.nova)
    await addToCartFromDetail(page, 'emerald-ape-042')
    await expect(page.getByTestId('summary-total')).toHaveText('1.206 ETH')

    await mocks(page, (m) => m.updateNft('emerald-ape-042', { price: '1.40' }))
    await expect(page.getByText('O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.40 ETH.').first()).toBeVisible()
    await expect(page.getByTestId('line-total')).toHaveText('1.40 ETH')
    await expect(page.getByTestId('summary-total')).toHaveText('1.416 ETH')
  })

  test('cenário price-change: o checkout informa a mudança e atualiza os valores', async ({ page }) => {
    await prepareCheckout(page, 'price-change')
    await expect(page.getByText('O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.29 ETH.').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('summary-total')).toHaveText('1.306 ETH')

    const review = await openReview(page)
    await review.getByTestId('confirm-order').click()
    const receipt = page.getByTestId('receipt')
    await expect(receipt).toBeVisible({ timeout: 10_000 })
    await expect(receipt.getByTestId('receipt-total')).toHaveText('1.306 ETH')
  })

  test('cotação desatualizada durante a revisão bloqueia o pagamento até nova confirmação', async ({ page }) => {
    await prepareCheckout(page)
    const review = await openReview(page)
    await expect(review.getByTestId('confirm-order')).toBeEnabled()

    await mocks(page, (m) => m.updateNft('emerald-ape-042', { price: '1.30' }))
    await expect(review.getByTestId('quote-changed')).toContainText('preço de 1.19 ETH para 1.30 ETH', { timeout: 10_000 })
    await expect(review.getByTestId('confirm-order')).toHaveCount(0)

    await review.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await expect(review.getByTestId('quote-changed')).toHaveCount(0)
    await review.getByTestId('confirm-order').click()

    const receipt = page.getByTestId('receipt')
    await expect(receipt).toBeVisible({ timeout: 10_000 })
    await expect(receipt.getByTestId('receipt-total')).toHaveText('1.316 ETH')
  })

  test('edição esgotada durante a revisão impede a compra', async ({ page }) => {
    await prepareCheckout(page)
    const review = await openReview(page)
    await mocks(page, (m) => m.updateNft('emerald-ape-042', { available: { '1/10': 0, '1/50': 0, open: 0 } }))
    await expect(review.getByTestId('quote-changed')).toContainText('esgotou', { timeout: 10_000 })
    await review.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await expect(review.getByText('Alguns itens estão indisponíveis')).toBeVisible()
    await expect(review.getByTestId('confirm-order')).toBeDisabled()
    expect(await mockOrderCount(page)).toBe(0)
  })
})

test.describe('10. Eventos duplicados/antigos, desconexão e retomada de pedido pendente', () => {
  test('eventos duplicados e antigos não regridem o estado nem reaplicam efeitos', async ({ page }) => {
    await open(page, '/nft/sage-nomad-009')
    await expect(page.getByTestId('detail-price')).toHaveText('1.69 ETH')

    await mocks(page, (m) => m.updateNft('sage-nomad-009', { price: '1.75' }))
    await expect(page.getByTestId('detail-price')).toHaveText('1.75 ETH')
    await mocks(page, (m) => m.updateNft('sage-nomad-009', { price: '1.80' }))
    await expect(page.getByTestId('detail-price')).toHaveText('1.80 ETH')

    expect(await mocks(page, (m) => m.replayPrevious('nft', 'sage-nomad-009'))).toBe(true)
    expect(await mocks(page, (m) => m.replayLast('nft', 'sage-nomad-009'))).toBe(true)
    await page.waitForTimeout(500)
    await expect(page.getByTestId('detail-price')).toHaveText('1.80 ETH')
  })

  test('cenário duplicate-events entrega cada evento mais de uma vez sem efeitos repetidos', async ({ page }) => {
    await loginViaUi(page, USERS.nova)
    await addToCartFromDetail(page, 'emerald-ape-042')
    await open(page, '/cart', 'duplicate-events')
    await expect(page.getByTestId('cart-line')).toHaveCount(1)
    await mocks(page, (m) => m.updateNft('emerald-ape-042', { price: '1.50' }))
    await expect(page.getByTestId('line-total')).toHaveText('1.50 ETH')
    await mocks(page, (m) => m.updateNft('emerald-ape-042', { price: '1.60' }))
    await expect(page.getByTestId('line-total')).toHaveText('1.60 ETH')
    expect(await mocks(page, (m) => m.replayPrevious('nft', 'emerald-ape-042'))).toBe(true)
    await page.waitForTimeout(500)
    await expect(page.getByTestId('line-total')).toHaveText('1.60 ETH')
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: 'mudou de 1.50 ETH para 1.60 ETH' })).toHaveCount(1)
  })

  test('desconexão do socket: reconexão reconcilia o catálogo com a API REST', async ({ page }) => {
    await open(page, '/nft/sage-nomad-009')
    await expect(page.getByTestId('detail-price')).toHaveText('1.69 ETH')
    await mocks(page, (m) => m.dropSocket(2500))
    await page.waitForTimeout(300)
    await mocks(page, (m) => m.updateNft('sage-nomad-009', { price: '1.95' }))
    await expect(page.getByTestId('detail-price')).toHaveText('1.95 ETH', { timeout: 15_000 })
  })

  test('pedido pendente sobrevive a refresh e é recuperado sem criar outra compra', async ({ page }) => {
    await prepareCheckout(page, 'payment-slow')
    const review = await openReview(page)
    await review.getByTestId('confirm-order').click()
    await expect(page.getByTestId('order-status')).toContainText('Aguardando confirmação')
    const url = page.url()

    await page.reload()
    await expect(page).toHaveURL(url)
    await expect(page.getByTestId('order-status')).toContainText('Aguardando confirmação')
    await page.goto('/checkout')
    await expect(page).toHaveURL(url)
    await expect(page.getByTestId('receipt')).toBeVisible({ timeout: 20_000 })
    expect(await mockOrderCount(page)).toBe(1)
  })

  test('socket cai com pedido pendente: o estado final chega após reconectar', async ({ page }) => {
    test.setTimeout(60_000)
    await prepareCheckout(page, 'socket-drop')
    const review = await openReview(page)
    await review.getByTestId('confirm-order').click()
    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(page.getByTestId('receipt')).toBeVisible({ timeout: 30_000 })
    expect(await mockOrderCount(page)).toBe(1)
  })
})
