import { expect, test } from '@playwright/test'
import { loginViaUi, USERS } from './helpers'

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('8. Edição de perfil, avatar, senha e carteiras, com erros de validação', () => {
  test('edita dados do perfil com validação e persiste após refresh', async ({ page }) => {
    await loginViaUi(page, USERS.nova, '/profile')
    const main = page.locator('main')
    await expect(main.getByLabel('Nome de usuário')).toHaveValue('nova')

    await main.getByLabel('Nome de exibição').fill('')
    await main.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(main.getByText('Campo obrigatório.').first()).toBeVisible()
    await expect(main.getByLabel('Nome de exibição')).toHaveAttribute('aria-invalid', 'true')

    await main.getByLabel('Nome de exibição').fill('Nova S.')
    await main.getByLabel('Nome de usuário').fill('theo')
    await main.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(main.getByText('Este nome de usuário já está em uso.')).toBeVisible()

    await main.getByLabel('Nome de usuário').fill('nova.sato')
    await main.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Perfil atualizado.').first()).toBeVisible()
    await page.reload()
    await expect(main.getByLabel('Nome de exibição')).toHaveValue('Nova S.')
    await expect(main.getByLabel('Nome de usuário')).toHaveValue('nova.sato')
  })

  test('avatar: valida tipo, altera, persiste e remove', async ({ page }) => {
    await loginViaUi(page, USERS.nova, '/profile')
    const input = page.getByTestId('avatar-input')

    await input.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('nao e imagem') })
    await expect(page.getByTestId('avatar-error')).toHaveText('Envie uma imagem PNG, JPG ou WEBP.')

    await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1X1 })
    await expect(page.locator('main').getByRole('img', { name: /Avatar de/ })).toBeVisible()
    await page.reload()
    await expect(page.locator('main').getByRole('img', { name: /Avatar de/ })).toBeVisible()

    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await expect(page.locator('main').getByRole('img', { name: /Avatar de/ })).toHaveCount(0)
  })

  test('alteração de senha valida regras e erros da API, e a nova senha passa a valer', async ({ page }) => {
    await loginViaUi(page, USERS.nova, '/profile')
    const main = page.locator('main')
    const save = main.getByRole('button', { name: 'Salvar', exact: true })

    await main.getByLabel('Senha atual', { exact: true }).fill(USERS.nova.password)
    await main.getByLabel('Nova senha', { exact: true }).fill('curta')
    await main.getByLabel('Confirmar nova senha', { exact: true }).fill('diferente')
    await save.click()
    await expect(main.getByText('A senha precisa de 8 caracteres ou mais, com letras e números.')).toBeVisible()
    await expect(main.getByText('As senhas não coincidem.')).toBeVisible()

    await main.getByLabel('Senha atual', { exact: true }).fill('SenhaErrada9')
    await main.getByLabel('Nova senha', { exact: true }).fill('NovaSenha2026')
    await main.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha2026')
    await save.click()
    await expect(main.getByText('Senha atual incorreta.')).toBeVisible()

    await main.getByLabel('Senha atual', { exact: true }).fill(USERS.nova.password)
    await save.click()
    await expect(page.getByText('Perfil e senha atualizados.').first()).toBeVisible()

    await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).first().click()
    await loginViaUi(page, { email: USERS.nova.email, password: 'NovaSenha2026' }, '/profile')
    await expect(main.getByLabel('Nome de usuário')).toHaveValue('nova')
  })

  test('carteiras: validação, edição da principal e carteira secundária', async ({ page }) => {
    await loginViaUi(page, USERS.nova, '/profile/wallets')
    const primary = page.getByRole('form', { name: 'Carteira principal' })
    await expect(primary.getByLabel('Endereço da carteira')).toHaveValue(/^0xA91F/)

    await primary.getByLabel('Endereço da carteira').fill('0x123')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(primary.getByText('Informe um endereço 0x com 40 caracteres hexadecimais ou um nome .eth.')).toBeVisible()

    await primary.getByLabel('Endereço da carteira').fill('0xB91F3b2C7d4E5f60718293a4B5c6D7e8F9a0E82D')
    await primary.getByLabel('Apelido da carteira').fill('Cofre')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva.').first()).toBeVisible()
    await page.reload()
    await expect(page.getByRole('form', { name: 'Carteira principal' }).getByLabel('Apelido da carteira')).toHaveValue('Cofre')

    await page.getByLabel('Igual à carteira principal').click()
    await expect(page.getByText('A carteira secundária usa os mesmos dados da carteira principal.')).toBeVisible()
    await page.reload()
    await expect(page.getByText('A carteira secundária usa os mesmos dados da carteira principal.')).toBeVisible()
  })

  test('novo usuário cadastra a carteira principal', async ({ page }) => {
    await loginViaUi(page, USERS.theo, '/profile/wallets')
    const primary = page.getByRole('form', { name: 'Carteira principal' })
    await primary.getByLabel('Rede').click()
    await page.getByRole('option', { name: 'Polygon' }).click()
    await primary.getByLabel('Endereço da carteira').fill('theo.eth')
    await primary.getByLabel('Tipo de carteira').click()
    await page.getByRole('option', { name: 'Coinbase Wallet' }).click()
    await primary.getByLabel('Código de indicação').fill('KURIO-THEO')
    await primary.getByLabel('Nome ENS').fill('theo')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva.').first()).toBeVisible()
    await page.reload()
    await expect(page.getByRole('form', { name: 'Carteira principal' }).getByLabel('Rede')).toContainText('Polygon')
  })
})
