import { expect, test } from '@playwright/test'
import { authScope, loginViaUi, logoutViaUi, mocks, open, USERS } from './helpers'

test.describe('3. Cadastro, login, expiração de sessão, logout e troca de usuário', () => {
  test('cadastro valida campos, trata conflito de e-mail e cria a conta', async ({ page }) => {
    await open(page, '/register')
    const form = authScope(page)

    await form.getByRole('button', { name: 'Criar conta' }).click()
    await expect(form.getByText('Campo obrigatório.').first()).toBeVisible()
    await form.getByLabel('Nome de usuário').fill('maria')
    await form.getByLabel('E-mail').fill('maria@kurio.test')
    await form.getByLabel('Senha', { exact: true }).fill('curta')
    await form.getByLabel('Confirmar senha').fill('outra')
    await form.getByRole('button', { name: 'Criar conta' }).click()
    await expect(form.getByText('A senha precisa de 8 caracteres ou mais, com letras e números.')).toBeVisible()
    await expect(form.getByText('As senhas não coincidem.')).toBeVisible()

    await form.getByLabel('E-mail').fill(USERS.nova.email)
    await form.getByLabel('Senha', { exact: true }).fill('Senha1234')
    await form.getByLabel('Confirmar senha').fill('Senha1234')
    await form.getByRole('button', { name: 'Criar conta' }).click()
    await expect(form.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(form.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')

    await form.getByLabel('E-mail').fill('maria@kurio.test')
    await form.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/profile')
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('maria')
  })

  test('login rejeita credenciais inválidas e retorna ao fluxo anterior', async ({ page }) => {
    await open(page, '/checkout')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/)
    const form = authScope(page)
    await form.getByLabel('E-mail').fill(USERS.nova.email)
    await form.getByLabel('Senha', { exact: true }).fill('SenhaErrada1')
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(form.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()

    await form.getByLabel('Senha', { exact: true }).fill(USERS.nova.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout$/)
  })

  test('sessão sobrevive ao refresh e expira com contexto preservado', async ({ page }) => {
    await loginViaUi(page, USERS.nova, '/profile')
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('nova')
    await page.reload()
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('nova')

    await mocks(page, (m) => m.expireSessions())
    await page.reload()
    await expect(page).toHaveURL(/\/login\?.*reason=expired/)
    await expect(authScope(page).getByText('Sua sessão expirou. Entre novamente para continuar de onde parou.')).toBeVisible()

    const form = authScope(page)
    await form.getByLabel('E-mail').fill(USERS.nova.email)
    await form.getByLabel('Senha', { exact: true }).fill(USERS.nova.password)
    await form.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/profile$/)
  })

  test('logout encerra a sessão e troca de usuário não vaza dados privados', async ({ page }) => {
    await loginViaUi(page, USERS.nova)
    await page.goto('/profile/favorites')
    await expect(page.getByTestId('favorites-grid').getByText('Emerald Ape #042')).toBeVisible()

    await logoutViaUi(page)
    await page.goto('/profile/favorites')
    await expect(page).toHaveURL(/\/login/)

    await loginViaUi(page, USERS.theo, '/profile/favorites')
    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()
    await expect(page.getByText('Emerald Ape #042')).toHaveCount(0)
    const leaked = await page.evaluate(() => {
      const client = Object.entries({ ...localStorage, ...sessionStorage }).filter(([key]) => key !== 'kurio:mock-db')
      return JSON.stringify(client).includes('nova@kurio.test')
    })
    expect(leaked).toBe(false)
  })
})
