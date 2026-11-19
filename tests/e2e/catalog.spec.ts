import { expect, test } from '@playwright/test'
import { catalogCards, closeDrawer, isDesktop, open, openFilters, searchCatalog } from './helpers'

test.describe('1. Busca, filtros combinados, ordenação, paginação e histórico', () => {
  test('busca atualiza a URL e filtra o catálogo', async ({ page }) => {
    await open(page, '/')
    await searchCatalog(page, 'golden')
    await expect(page).toHaveURL(/[?&]q=golden/)
    await expect
      .poll(async () => {
        const names = await catalogCards(page).getByRole('heading').allTextContents()
        return names.length > 0 && names.every((name) => name.toLowerCase().includes('golden'))
      })
      .toBe(true)
  })

  test('busca sem resultados mostra estado vazio', async ({ page }) => {
    await open(page, '/')
    await searchCatalog(page, 'zzzz-inexistente')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(catalogCards(page).first()).toBeVisible()
  })

  test('filtros combinados, ordenação, paginação e restauração pelo histórico', async ({ page }) => {
    await open(page, '/')
    await expect(catalogCards(page)).toHaveCount(9)

    let filters = await openFilters(page)
    await filters.getByRole('checkbox', { name: /Arte digital/ }).click()
    await filters.getByRole('checkbox', { name: /Ethereum/ }).click()
    await closeDrawer(page)
    await expect(page).toHaveURL(/category=digital-art/)
    await expect(page).toHaveURL(/network=ethereum/)
    await expect(page.getByText(/Página 1 de/)).toBeVisible()

    filters = await openFilters(page)
    await filters.getByRole('checkbox', { name: /Ethereum/ }).click()
    await closeDrawer(page)
    await expect(page).not.toHaveURL(/network=/)
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText(/Página 2 de/)).toBeVisible()

    await page.getByRole('combobox', { name: /Ordenar por/ }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(page).not.toHaveURL(/page=/)
    await expect(page.getByText(/Página 1 de/)).toBeVisible()

    const prices = (await catalogCards(page).locator('p').allTextContents()).map((t) => Number.parseFloat(t.replace(' ETH', '')))
    expect(prices).toEqual([...prices].sort((a, b) => a - b))

    await page.goBack()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText(/Página 2 de/)).toBeVisible()
    await page.reload()
    await expect(page.getByText(/Página 2 de/)).toBeVisible()
    await expect(page).toHaveURL(/category=digital-art/)
    if (isDesktop(page)) {
      await expect(page.locator('aside').getByRole('checkbox', { name: /Arte digital/ })).toHaveAttribute('aria-checked', 'true')
    }
  })

  test('filtro de preço aplica faixa na URL', async ({ page }) => {
    await open(page, '/?minPrice=1.00&maxPrice=1.50')
    await expect(catalogCards(page).first()).toBeVisible()
    const prices = (await catalogCards(page).locator('p').allTextContents()).map((t) => Number.parseFloat(t.replace(' ETH', '')))
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(1)
      expect(price).toBeLessThanOrEqual(1.5)
    }
  })
})
