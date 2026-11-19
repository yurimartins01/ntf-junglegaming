import { expect, test } from '@playwright/test'
import { open } from './helpers'

test.describe('2. Acesso direto ao detalhe e recurso inexistente', () => {
  test('acesso direto exibe o NFT, edições e limite de quantidade', async ({ page }) => {
    await open(page, '/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('ID do token: #0042')).toBeVisible()

    const soldOut = page.getByRole('radio', { name: '1/1 (esgotada)' })
    await expect(soldOut).toBeDisabled()

    await page.getByRole('radio', { name: '1/10' }).click()
    const plus = page.getByRole('button', { name: /Aumentar quantidade/ })
    for (let i = 0; i < 6; i++) if (await plus.isEnabled()) await plus.click()
    await expect(page.getByLabel('Quantidade: 4').filter({ visible: true })).toBeVisible()
    await expect(plus).toBeDisabled()
    await expect(page.getByText('Limite de 4 por pedido nesta edição.').filter({ visible: true })).toBeVisible()
  })

  test('NFT inexistente mostra página de recurso não encontrado', async ({ page }) => {
    await open(page, '/nft/nao-existe-000')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao início' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('rota inexistente mostra 404', async ({ page }) => {
    await open(page, '/rota-que-nao-existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })
})
