import { expect, test } from '@playwright/test'
import { addToCartFromDetail, catalogCards, loginViaUi, mocks, open, USERS } from './helpers'

test.describe('12. Skeletons, falhas de rede e recuperação com nova tentativa', () => {
  test('skeletons com shimmer aparecem em carregamento lento do catálogo e do detalhe', async ({ page }) => {
    await open(page, '/', 'slow')
    await expect(page.getByTestId('nft-card-skeleton')).toHaveCount(9)
    const animation = await page.getByTestId('nft-card-skeleton').first().locator('[data-slot="skeleton"]').first().evaluate((el) => getComputedStyle(el).animationName)
    expect(animation).not.toBe('none')
    await expect(catalogCards(page).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('nft-card-skeleton')).toHaveCount(0)

    await page.getByRole('link', { name: 'Sage Nomad #009' }).first().click()
    await expect(page.getByTestId('detail-skeleton')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' })).toBeVisible({ timeout: 15_000 })
  })

  test('skeleton do resumo do carrinho com layout reservado', async ({ page }) => {
    await loginViaUi(page, USERS.nova)
    await addToCartFromDetail(page, 'emerald-ape-042')
    await open(page, '/cart', 'slow')
    await expect(page.getByTestId('cart-skeleton')).toBeVisible()
    await expect(page.getByTestId('cart-line')).toBeVisible({ timeout: 15_000 })
  })

  test('respeita prefers-reduced-motion nos skeletons', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/', 'slow')
    const duration = await page.getByTestId('nft-card-skeleton').first().locator('[data-slot="skeleton"]').first().evaluate((el) => getComputedStyle(el).animationDuration)
    expect(Number.parseFloat(duration)).toBeLessThan(0.01)
  })

  test('erro HTTP 503: feedback acessível e recuperação pelo botão de nova tentativa', async ({ page }) => {
    await open(page, '/', 'server-error')
    const alert = page.getByRole('alert').filter({ hasText: 'Serviço temporariamente indisponível.' })
    await expect(alert).toBeVisible({ timeout: 15_000 })
    await mocks(page, (m) => m.setScenario('default'))
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(catalogCards(page).first()).toBeVisible()
    await expect(alert).toHaveCount(0)
  })

  test('falhas transitórias esgotam os retries e a nova tentativa manual recupera', async ({ page }) => {
    await open(page, '/', 'flaky')
    const alert = page.getByRole('alert').filter({ hasText: 'Tentar novamente' })
    await expect(alert).toBeVisible({ timeout: 20_000 })
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(catalogCards(page).first()).toBeVisible()
  })

  test('sem conexão: mensagem de rede e recuperação ao voltar', async ({ page }) => {
    await open(page, '/', 'offline')
    const alert = page.getByRole('alert').filter({ hasText: 'Sem conexão com o servidor' })
    await expect(alert).toBeVisible({ timeout: 20_000 })
    await mocks(page, (m) => m.setScenario('default'))
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(catalogCards(page).first()).toBeVisible()
  })

  test('respostas fora de ordem: prevalece a resposta da última consulta', async ({ page }) => {
    await open(page, '/', 'out-of-order')
    await expect(catalogCards(page).first()).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Novos lançamentos' }).click()
    await page.getByRole('button', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/tab=trending/)
    await page.waitForTimeout(2200)
    const expected = await page.evaluate(async () => {
      const response = await fetch('/api/nfts?tab=trending&sort=recent&page=1&pageSize=9')
      const body = (await response.json()) as { items: { name: string }[] }
      return body.items.map((item) => item.name)
    })
    const shown = await catalogCards(page).getByRole('heading').allTextContents()
    expect(shown).toEqual(expected)
  })

  test('resultado vazio do catálogo (cenário empty)', async ({ page }) => {
    await open(page, '/', 'empty')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  })
})
