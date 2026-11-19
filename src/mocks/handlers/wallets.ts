import { http, HttpResponse } from 'msw'
import { API_BASE_URL, type SaveWalletRequest, type Wallet, type WalletSlot } from '@/lib/api/contracts'
import { NETWORK_LABELS, WALLET_PROVIDER_LABELS } from '@/lib/domain'
import { EMAIL_PATTERN, ENS_LABEL_PATTERN, MESSAGES, isWalletAddress } from '@/lib/validation/rules'
import { db } from '../db/db'
import { MockHttpError, readJson, route, validationError } from '../http'
import { requirePrivateAccess } from '../services/auth'

function walletsOf(userId: string) {
  return (db().wallets[userId] ??= { primary: null, secondary: null, secondarySameAsPrimary: false })
}

function validateWallet(body: SaveWalletRequest) {
  const errors: Record<string, string> = {}
  if (!body.displayName?.trim()) errors.displayName = MESSAGES.required
  if (!body.nickname?.trim()) errors.nickname = MESSAGES.required
  if (!(body.network in NETWORK_LABELS)) errors.network = 'Selecione uma rede.'
  if (!body.profileName?.trim()) errors.profileName = MESSAGES.required
  if (!isWalletAddress(body.address ?? '')) errors.address = MESSAGES.walletAddress
  if (body.secondaryAddress && !isWalletAddress(body.secondaryAddress)) errors.secondaryAddress = MESSAGES.walletAddress
  if (!(body.provider in WALLET_PROVIDER_LABELS)) errors.provider = 'Selecione uma carteira.'
  if (!body.referralCode?.trim()) errors.referralCode = MESSAGES.required
  if (!EMAIL_PATTERN.test(body.email ?? '')) errors.email = MESSAGES.email
  if (!body.ensName?.trim()) errors.ensName = MESSAGES.required
  else if (!ENS_LABEL_PATTERN.test(body.ensName.trim())) errors.ensName = MESSAGES.ens
  if (Object.keys(errors).length) throw validationError(errors)
}

export const walletHandlers = [
  http.get(
    `${API_BASE_URL}/wallets`,
    route(({ request }) => HttpResponse.json(walletsOf(requirePrivateAccess(request).id))),
  ),

  http.put<{ slot: string }>(
    `${API_BASE_URL}/wallets/:slot`,
    route(
      async ({ request, params }) => {
        const user = requirePrivateAccess(request)
        if (params.slot !== 'primary' && params.slot !== 'secondary') {
          throw new MockHttpError(404, 'NOT_FOUND', 'Carteira não encontrada.')
        }
        const slot = params.slot as WalletSlot
        const body = await readJson<SaveWalletRequest>(request)
        const wallets = walletsOf(user.id)

        if (slot === 'secondary' && body.sameAsPrimary) {
          if (!wallets.primary) throw validationError({ sameAsPrimary: 'Cadastre a carteira principal primeiro.' })
          wallets.secondary = { ...wallets.primary, slot: 'secondary', updatedAt: new Date().toISOString() }
          wallets.secondarySameAsPrimary = true
          return HttpResponse.json(wallets)
        }

        validateWallet(body)
        const wallet: Wallet = {
          slot,
          displayName: body.displayName.trim(),
          nickname: body.nickname.trim(),
          network: body.network,
          profileName: body.profileName.trim(),
          address: body.address.trim(),
          secondaryAddress: body.secondaryAddress?.trim() ?? '',
          provider: body.provider,
          referralCode: body.referralCode.trim(),
          email: body.email.trim().toLowerCase(),
          ensName: body.ensName.trim(),
          updatedAt: new Date().toISOString(),
        }
        wallets[slot] = wallet
        if (slot === 'secondary') wallets.secondarySameAsPrimary = false
        return HttpResponse.json(wallets)
      },
      { mutates: true },
    ),
  ),
]
