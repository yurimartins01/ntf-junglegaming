import { expect, test } from '@playwright/test'
import { loginViaUi, open, USERS } from './helpers'

test.describe('4. Favoritos, incluindo falha de mutation e recuperação do estado', () => {
  test('visitante é enviado ao login e retorna ao NFT', async ({ page }) => {
    await open(page, '/nft/sage-nomad-009')
    await page.getByRole('button', { name: 'Favoritar' }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fsage-nomad-009/)
  })

  test('favoritar persiste após refresh e aparece na lista de interesse', async ({ page }) => {
    await loginViaUi(page, USERS.nova, '/nft/sage-nomad-009')
    const heart = page.getByRole('button', { name: /Favoritar|Favoritado|Remover dos favoritos/ }).filter({ visible: true }).first()
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('live-region')).toHaveText('Sage Nomad #009 adicionado aos favoritos.')
    await page.reload()
    await expect(page.getByRole('button', { name: /Favoritado|Remover dos favoritos/ }).filter({ visible: true }).first()).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/profile/favorites')
    const grid = page.getByTestId('favorites-grid')
    await expect(grid.getByText('Sage Nomad #009')).toBeVisible()
    await expect(grid.getByText('Emerald Ape #042')).toBeVisible()
  })

  test('falha na mutation faz rollback otimista e permite nova tentativa', async ({ page }) => {
    await loginViaUi(page, USERS.nova)
    await open(page, '/nft/sage-nomad-009', 'favorite-failure')
    const heart = page.getByRole('button', { name: /Favoritar|Favoritado|Remover dos favoritos/ }).filter({ visible: true }).first()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
    await heart.click()
    await expect(page.getByText(/Não foi possível atualizar os favoritos/).first()).toBeVisible()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')

    await page.evaluate(() => window.__kurioMocks?.setScenario('default'))
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
  })
})
