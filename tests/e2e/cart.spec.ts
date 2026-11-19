import { expect, test, type Page } from '@playwright/test'
import { loginViaUi, open } from './helpers'

async function addEmeraldApe(page: Page) {
  await open(page, '/nft/emerald-ape-042')
  await page.getByRole('button', { name: /^Comprar/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByTestId('cart-line')).toHaveCount(1)
}

test.describe('5. Carrinho, quantidades, remoção, cupom e persistência', () => {
  test('quantidades, limite de disponibilidade e remoção', async ({ page }) => {
    await addEmeraldApe(page)
    await expect(page.getByTestId('line-total')).toHaveText('1.19 ETH')

    await page.getByRole('button', { name: /Aumentar quantidade — Emerald Ape/ }).click()
    await expect(page.getByTestId('line-total')).toHaveText('2.38 ETH')
    await expect(page.getByTestId('summary-subtotal')).toHaveText('2.38 ETH')
    await expect(page.getByTestId('summary-total')).toHaveText('2.396 ETH')

    const plus = page.getByRole('button', { name: /Aumentar quantidade — Emerald Ape/ })
    await plus.click()
    await plus.click()
    await expect(page.getByLabel('Quantidade: 4')).toBeVisible()
    await expect(plus).toBeDisabled()

    await page.getByRole('button', { name: /Diminuir quantidade — Emerald Ape/ }).click()
    await expect(page.getByLabel('Quantidade: 3')).toBeVisible()

    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('cupom válido, inválido e expirado; remoção do cupom', async ({ page }) => {
    await addEmeraldApe(page)
    await page.getByRole('button', { name: /Aumentar quantidade — Emerald Ape/ }).click()
    const coupon = page.getByLabel('Digite o código promocional...').or(page.getByRole('textbox', { name: 'Código promocional' }))

    await coupon.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Código promocional inválido.' })).toBeVisible()

    await coupon.fill('EXPIRADO20')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Este código promocional expirou.' })).toBeVisible()

    await coupon.fill('kurio10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByTestId('applied-coupon')).toContainText('KURIO10')
    await expect(page.getByTestId('summary-discount')).toHaveText('(-) 0.238 ETH')
    await expect(page.getByTestId('summary-total')).toHaveText('2.158 ETH')

    await page.reload()
    await expect(page.getByTestId('applied-coupon')).toContainText('KURIO10')

    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await expect(page.getByTestId('summary-discount')).toHaveText('(-) 00.00')
    await expect(page.getByTestId('summary-total')).toHaveText('2.396 ETH')
  })

  test('carrinho persiste após refresh e itens do visitante são preservados no login', async ({ page }) => {
    await addEmeraldApe(page)
    await page.reload()
    await expect(page.getByTestId('cart-line')).toHaveCount(1)

    await loginViaUi(page, undefined, '/cart')
    await expect(page.getByTestId('cart-line')).toHaveCount(1)
    await expect(page.getByTestId('cart-line')).toContainText('Emerald Ape #042')
    await page.reload()
    await expect(page.getByTestId('cart-line')).toHaveCount(1)
  })
})
