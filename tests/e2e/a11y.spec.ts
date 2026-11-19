import { expect, test, type Page } from '@playwright/test'
import { authScope, isTabletUp, loginViaUi, open, USERS } from './helpers'

async function activeIsInside(page: Page, selector: string) {
  return page.evaluate((sel) => Boolean(document.activeElement?.closest(sel)), selector)
}

test.describe('11. Navegação por teclado, foco de diálogos e validação de formulários', () => {
  test('link "Pular para o conteúdo" é o primeiro foco e leva ao conteúdo principal', async ({ page }) => {
    await open(page, '/')
    await expect(page.locator('main#conteudo')).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#conteudo')).toBeFocused()
  })

  test('foco visível em controles interativos', async ({ page }) => {
    await open(page, '/')
    const link = page.getByRole('link', { name: 'Emerald Ape #042' }).first()
    await link.focus()
    const outline = await link.evaluate((el) => {
      const style = getComputedStyle(el)
      return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), color: style.color }
    })
    expect(outline.style).not.toBe('none')
    expect(outline.width).toBeGreaterThan(0)
  })

  test('diálogo de busca: foco entra, Escape fecha e devolve o foco ao gatilho', async ({ page }) => {
    test.skip(!isTabletUp(page), 'A busca em diálogo existe em tablet/desktop; no mobile há campo inline.')
    await open(page, '/')
    const trigger = page.getByRole('button', { name: 'Buscar NFTs' })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('searchbox')).toBeFocused()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      expect(await activeIsInside(page, '[role="dialog"]')).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('drawer de filtros: foco preso no drawer, Escape fecha', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 })
    await open(page, '/')
    const trigger = page.getByRole('button', { name: /^Filtros/ }).filter({ visible: true }).first()
    await trigger.click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      expect(await activeIsInside(page, '[role="dialog"]')).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('formulário de login: erros associados aos campos e anunciados', async ({ page }) => {
    await open(page, '/login')
    const form = authScope(page)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()

    const email = form.getByLabel('E-mail')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const message = page.locator(`[id="${describedBy}"]`)
    await expect(message).toHaveText('Campo obrigatório.')
    await expect(message).toHaveAttribute('role', 'alert')

    await email.focus()
    await page.keyboard.type(USERS.nova.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(USERS.nova.password)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/$/)
  })

  test('mutações e mudanças em tempo real são anunciadas em região live', async ({ page }) => {
    await loginViaUi(page, USERS.nova, '/nft/sage-nomad-009')
    await page.getByRole('button', { name: /^Favoritar$|^Favoritar / }).filter({ visible: true }).first().click()
    await expect(page.getByTestId('live-region')).toHaveText('Sage Nomad #009 adicionado aos favoritos.')
  })

  test('sem overflow horizontal nas telas principais', async ({ page }) => {
    await loginViaUi(page, USERS.nova)
    for (const path of ['/', '/nft/emerald-ape-042', '/cart', '/checkout', '/profile', '/profile/wallets', '/profile/favorites']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `overflow em ${path}`).toBeLessThanOrEqual(0)
    }
  })
})
